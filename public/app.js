// GadgetGenie app — UI wiring: generate, tabs, downloads, mentor chat, photo check, stores.

let currentGadget = null;
let aiLive = false;
let filterCat = "all";   // all | practical | fun
let filterDiff = "any";  // any | Beginner | Intermediate | Advanced
let filterMat = "any";   // any | cardboard | plastic | wood | metal | electronics
let parentMode = localStorage.getItem("gg_parent") === "1";

// ---------------------------------------------------------------- accounts
let authToken = localStorage.getItem("gg_token") || "";
let currentUser = null; // { name, email, plan, buildCount }
let authMode = "signup";

async function api(route, body) {
  const res = await fetch(route, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, token: authToken }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function updateAuthUI() {
  const authBtn = document.getElementById("authBtn");
  const buildsBtn = document.getElementById("buildsBtn");
  if (currentUser) {
    authBtn.classList.add("hidden");
    buildsBtn.classList.remove("hidden");
    buildsBtn.textContent = `My builds (${currentUser.buildCount})`;
    if (currentUser.kind === "child" && !parentMode) { // parent-created account: parent tools on
      parentMode = true;
      localStorage.setItem("gg_parent", "1");
      refreshParentUI();
    }
  } else {
    authBtn.classList.remove("hidden");
    buildsBtn.classList.add("hidden");
  }
  updatePlanUI();
  if (typeof updateProgressUI === "function") updateProgressUI();
  if (typeof renderAds === "function") renderAds();
  if (typeof applySettings === "function") applySettings(false);
}

async function restoreSession() {
  if (!authToken) return;
  try {
    const data = await api("/api/me", {});
    currentUser = data.user;
  } catch {
    authToken = "";
    localStorage.removeItem("gg_token");
  }
  updateAuthUI();
}

function openAuth() {
  setAuthMode("signup");
  document.getElementById("authError").classList.add("hidden");
  document.getElementById("authModal").classList.remove("hidden");
  document.getElementById(authMode === "signup" ? "authName" : "authEmail").focus();
}
function closeAuth() { document.getElementById("authModal").classList.add("hidden"); }

function setAuthMode(mode) {
  authMode = mode;
  document.getElementById("authTabSignup").classList.toggle("active", mode === "signup");
  document.getElementById("authTabLogin").classList.toggle("active", mode === "login");
  document.getElementById("nameField").classList.toggle("hidden", mode === "login");
  document.getElementById("authHeading").textContent = mode === "signup" ? "Create your account" : "Welcome back";
  document.getElementById("authSubmit").textContent = mode === "signup" ? "Create account" : "Sign in";
  document.getElementById("authError").classList.add("hidden");
}

async function submitAuth(e) {
  e.preventDefault();
  const btn = document.getElementById("authSubmit");
  const err = document.getElementById("authError");
  err.classList.add("hidden");
  btn.classList.add("is-loading");
  try {
    const data = await api(authMode === "signup" ? "/api/signup" : "/api/login", {
      name: document.getElementById("authName").value,
      email: document.getElementById("authEmail").value,
      password: document.getElementById("authPassword").value,
      kind: document.querySelector('input[name="authKind"]:checked')?.value || "me",
      age: document.getElementById("authAge").value,
    });
    authToken = data.token;
    localStorage.setItem("gg_token", authToken);
    currentUser = data.user;
    document.getElementById("authPassword").value = "";
    closeAuth();
    updateAuthUI();
    // a plan chosen before signing up carries over to the account
    const local = getPlan();
    if (local.tier !== "free" && currentUser.plan.tier === "free") {
      try { currentUser = (await api("/api/plan", { tier: local.tier, until: local.until })).user; updateAuthUI(); } catch {}
    }
  } catch (ex) {
    err.textContent = ex.message;
    err.classList.remove("hidden");
  } finally {
    btn.classList.remove("is-loading");
  }
}

async function signOut() {
  try { await api("/api/logout", {}); } catch {}
  authToken = "";
  localStorage.removeItem("gg_token");
  currentUser = null;
  closeBuilds();
  updateAuthUI();
}

// ---------------------------------------------------------------- my builds

async function saveBuildToAccount(g) {
  if (!currentUser || !g) return;
  try {
    const data = await api("/api/builds/save", { gadget: g });
    currentUser.buildCount = data.buildCount;
    updateAuthUI();
  } catch {}
}

async function openBuilds() {
  const list = document.getElementById("buildsList");
  list.innerHTML = `<div class="builds-empty">Loading…</div>`;
  document.getElementById("buildsUser").textContent = currentUser ? `Signed in as ${currentUser.name} · ${currentUser.email}` : "";
  document.getElementById("buildsModal").classList.remove("hidden");
  try {
    const data = await api("/api/builds/list", {});
    if (!data.builds.length) {
      list.innerHTML = `<div class="builds-empty">No builds yet. Open a project or design something new — it saves here automatically.</div>`;
      return;
    }
    list.innerHTML = data.builds.map((b) => `
      <button class="build-row" onclick="openSavedBuild('${escapeHtml(b.id)}')">
        <div class="build-art">${GADGET_ART[b.id] || GADGET_ART.default}</div>
        <div class="build-meta">
          <b>${escapeHtml(b.name)}</b>
          <span>${escapeHtml(b.difficulty || "")} · saved ${new Date(b.savedAt).toLocaleDateString()}</span>
        </div>
        <span class="build-open">Open</span>
      </button>`).join("");
  } catch (ex) {
    list.innerHTML = `<div class="builds-empty">${escapeHtml(ex.message)}</div>`;
  }
}
function closeBuilds() { document.getElementById("buildsModal").classList.add("hidden"); }

async function openSavedBuild(id) {
  try {
    const data = await api("/api/builds/get", { id });
    closeBuilds();
    currentGadget = data.gadget;
    renderGadget(data.gadget, false, "");
  } catch (ex) { alert(ex.message); }
}

// ---------------------------------------------------------------- plans & monetization
// To turn on REAL payments: create Stripe Payment Links (a parent's Stripe account)
// and paste them here. Until then, upgrade buttons start a free 7-day trial.
const STRIPE_LINKS = { premium: "", mx: "" };
const TRIAL_DAYS = 7;
const FREE_LIMITS = { aiDesigns: 3, genieQuestions: 10 };
const PLAN_NAMES = { free: "Free", premium: "Premium", mx: "MX" };

function getPlan() {
  if (currentUser) { // signed in: the account's plan is the truth
    const p = currentUser.plan || { tier: "free" };
    if (p.tier !== "free" && p.until && Date.now() > p.until) return { tier: "free" };
    return p;
  }
  try {
    const p = JSON.parse(localStorage.getItem("gg_plan") || "null");
    if (p && p.tier !== "free" && p.until && Date.now() > p.until) return { tier: "free" }; // trial expired
    return p || { tier: "free" };
  } catch { return { tier: "free" }; }
}
function planTier() { return getPlan().tier; }
function isPaid() { return planTier() !== "free"; }

// daily usage counters for the free tier
function usage() {
  const today = new Date().toDateString();
  let u;
  try { u = JSON.parse(localStorage.getItem("gg_usage") || "null"); } catch {}
  if (!u || u.day !== today) u = { day: today, ai: 0, genie: 0 };
  return u;
}
function bumpUsage(key) {
  const u = usage();
  u[key] += 1;
  localStorage.setItem("gg_usage", JSON.stringify(u));
}

function updatePlanUI() {
  const btn = document.getElementById("planBtn");
  const tier = planTier();
  btn.textContent = tier === "free" ? "Upgrade" : PLAN_NAMES[tier] + " plan";
  btn.classList.toggle("plan-active", tier !== "free");
  const freeBtn = document.getElementById("freeBtn");
  freeBtn.textContent = tier === "free" ? "Current plan" : "Downgrade to Free";
  if (typeof renderAds === "function") renderAds();
}

function openPricing(reason) {
  const r = document.getElementById("pricingReason");
  if (reason) { r.textContent = reason; r.classList.remove("hidden"); }
  else r.classList.add("hidden");
  document.getElementById("pricingModal").classList.remove("hidden");
}
function closePricing() { document.getElementById("pricingModal").classList.add("hidden"); }

async function choosePlan(tier) {
  if (tier !== "free" && STRIPE_LINKS[tier]) {
    window.open(STRIPE_LINKS[tier], "_blank", "noopener"); // real checkout
    return;
  }
  if (currentUser) {
    try {
      currentUser = (await api("/api/plan", { tier })).user; // stored on the account
    } catch (ex) { alert(ex.message); return; }
  } else if (tier === "free") {
    localStorage.removeItem("gg_plan");
  } else {
    localStorage.setItem("gg_plan", JSON.stringify({ tier, until: Date.now() + TRIAL_DAYS * 864e5 }));
  }
  updatePlanUI();
  closePricing();
  if (tier !== "free") {
    alert(`${PLAN_NAMES[tier]} trial started — free for ${TRIAL_DAYS} days, no card needed.${currentUser ? "\nSaved to your account — it works on any computer you sign in to." : ""}\n(Real checkout opens here once Stripe links are added.)`);
  }
}

// ---------------------------------------------------------------- boot

fetch("/api/status").then((r) => r.json()).then((s) => {
  aiLive = s.ai;
  const pill = document.getElementById("aiStatus");
  pill.textContent = s.ai ? `AI online · ${s.model}` : "Demo mode";
  pill.classList.toggle("live", s.ai);
}).catch(() => {});

document.getElementById("promptInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") generate();
});
document.getElementById("promptInput").addEventListener("input", () => renderGallery()); // live search
document.getElementById("mentorInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") askMentor();
});
document.getElementById("photoInput").addEventListener("change", onPhotoPicked);
document.getElementById("tabs").addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
  renderTab(btn.dataset.tab);
});

function goHome() {
  document.getElementById("workshop").classList.add("hidden");
  document.getElementById("landing").classList.remove("hidden");
  destroyViewer();
  window.scrollTo({ top: 0 });
}

function quick(text) {
  document.getElementById("promptInput").value = text;
  generate();
}

// ---------------------------------------------------------------- gallery + filters

const CAT_LABEL = { practical: "Practical", fun: "Fun toy" };

function wireFilterGroup(id, apply) {
  document.getElementById(id).addEventListener("click", (e) => {
    const btn = e.target.closest(".fchip");
    if (!btn) return;
    document.querySelectorAll(`#${id} .fchip`).forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    apply(btn.dataset.val);
    renderGallery();
  });
}
wireFilterGroup("catFilter", (v) => (filterCat = v));
wireFilterGroup("diffFilter", (v) => (filterDiff = v));
wireFilterGroup("matFilter", (v) => (filterMat = v));

const MAT_LABEL = {
  cardboard: "cardboard", plastic: "bottles and plastic", wood: "scrap wood",
  metal: "scrap metal", electronics: "electronics",
};

function renderGallery() {
  const search = document.getElementById("promptInput").value.trim().toLowerCase();
  const el = document.getElementById("gallery");
  const items = DEMO_GADGETS.filter((g) => {
    if (filterCat !== "all" && g.category !== filterCat) return false;
    if (filterDiff !== "any" && g.difficulty !== filterDiff) return false;
    if (filterMat !== "any" && !(g.materials || []).includes(filterMat)) return false;
    if (search) {
      const hay = (g.name + " " + g.tagline + " " + (g.keywords || []).join(" ")).toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });
  if (!items.length) {
    el.innerHTML = `<div class="gallery-empty">No ready-made match. Choose <b>Design it</b> and the AI will design it for you${filterMat !== "any" ? " using just your " + MAT_LABEL[filterMat] : ""}.</div>`;
    return;
  }
  const total = (g) => (g.parts || []).reduce((s, p) => s + (Number(p.cost) || 0), 0);
  el.innerHTML = items.map((g) => {
    const locked = g.difficulty === "Advanced" && !parentMode;
    return `
    <button class="gcard ${locked ? "gcard-locked" : ""}" onclick="${locked ? "openParentModal()" : `openProject('${g.id}')`}">
      <div class="gcard-art">${locked ? ICONS.lock : gadgetArt(g)}</div>
      <div class="gcard-body">
        <b>${escapeHtml(g.name)}</b>
        <span class="gcard-tag">${locked ? "Advanced build. Ask an adult to unlock parent mode." : escapeHtml(g.tagline)}</span>
        <div class="gcard-pills">
          <span class="gpill gpill-cat">${CAT_LABEL[g.category] || "Project"}</span>
          <span class="gpill">${escapeHtml(g.difficulty)}</span>
        </div>
      </div>
    </button>`;
  }).join("");
}

function openProject(id) {
  const g = DEMO_GADGETS.find((x) => x.id === id);
  if (!g) return;
  if (g.difficulty === "Advanced" && !parentMode) { openParentModal(); return; }
  currentGadget = g;
  renderGadget(g, false, "");
  awardProgress("open_build");
  genieSay(pick(GENIE_LINES.project), true);
}

// ---------------------------------------------------------------- parent mode

let gateSolution = 0;

function refreshParentUI() {
  const btn = document.getElementById("parentBtn");
  btn.innerHTML = `<span class="i">${ICONS.shield}</span>${parentMode ? "Parent mode: on" : "Parent mode"}`;
  btn.classList.toggle("parent-on", parentMode);
  renderGallery();
  if (currentGadget && !document.getElementById("workshop").classList.contains("hidden")) {
    renderSupervision(currentGadget);
  }
}

function openParentModal() {
  const a = 3 + Math.floor(Math.random() * 6), b = 4 + Math.floor(Math.random() * 8), c = 11 + Math.floor(Math.random() * 30);
  gateSolution = a * b + c;
  document.getElementById("gateQuestion").textContent = `${a} × ${b} + ${c} = ?`;
  document.getElementById("gateAnswer").value = "";
  document.getElementById("gateError").classList.add("hidden");
  document.getElementById("parentGate").classList.toggle("hidden", parentMode);
  document.getElementById("parentPanel").classList.toggle("hidden", !parentMode);
  // accounts a parent set up for their child keep parent mode on — no off switch for kids
  const lockedOn = currentUser && currentUser.kind === "child";
  const offBtn = document.querySelector("#parentPanel .btn");
  if (offBtn) offBtn.classList.toggle("hidden", lockedOn);
  const status = document.querySelector("#parentPanel .parent-status");
  if (status && lockedOn) status.innerHTML = "<b>Parent mode is always on for this account.</b> It was set up by your parent when the account was created, so it can't be switched off here.";
  else if (status) status.innerHTML = "<b>Parent mode is on.</b> Advanced builds are unlocked, and each project's Safety card now lists the steps that need an adult.";
  document.getElementById("parentModal").classList.remove("hidden");
  if (!parentMode) document.getElementById("gateAnswer").focus();
}

function closeParentModal() {
  document.getElementById("parentModal").classList.add("hidden");
}

function checkParentGate() {
  if (Number(document.getElementById("gateAnswer").value) === gateSolution) {
    parentMode = true;
    localStorage.setItem("gg_parent", "1");
    document.getElementById("parentGate").classList.add("hidden");
    document.getElementById("parentPanel").classList.remove("hidden");
    refreshParentUI();
  } else {
    document.getElementById("gateError").classList.remove("hidden");
  }
}

function disableParentMode() {
  if (currentUser && currentUser.kind === "child") return; // locked on for parent-created accounts
  parentMode = false;
  localStorage.removeItem("gg_parent");
  closeParentModal();
  refreshParentUI();
}

// Steps whose text suggests an adult should help (works for AI gadgets too).
const ADULT_WORDS = /adult|grown.?up|hot glue|drill|cut |cutting|scissors|sharp|solder|water play|supervis/i;

function renderSupervision(g) {
  const el = document.getElementById("supervision");
  const flagged = (g.steps || [])
    .map((s, i) => ({ i, s }))
    .filter(({ s }) => ADULT_WORDS.test(s.title + " " + s.text));
  if (!parentMode || !flagged.length) { el.innerHTML = ""; return; }
  el.innerHTML = `<div class="supervision">
      <b>Parent supervision checklist</b>
      <ul>${flagged.map(({ i, s }) => `<li>Step ${i + 1}: ${escapeHtml(s.title)}</li>`).join("")}</ul>
    </div>`;
}

// ---------------------------------------------------------------- generate

const LOADER_MSGS = [
  "Reading your imagination…",
  "Sketching the blueprint…",
  "Snapping 3D parts together…",
  "Counting screws and LEDs…",
  "Pricing every part…",
  "Writing your Arduino code…",
  "Waking up Genie…",
];

let loaderTimer = null;
function showLoader() {
  document.getElementById("generateBtn").classList.add("is-loading");
  const el = document.getElementById("loading");
  el.classList.remove("hidden");
  let i = 0, pct = 8;
  document.getElementById("loaderMsg").textContent = LOADER_MSGS[0];
  document.getElementById("loaderFill").style.width = "8%";
  loaderTimer = setInterval(() => {
    i = (i + 1) % LOADER_MSGS.length;
    pct = Math.min(94, pct + 9 + Math.random() * 8);
    document.getElementById("loaderMsg").textContent = LOADER_MSGS[i];
    document.getElementById("loaderFill").style.width = pct + "%";
  }, 900);
}
function hideLoader() {
  document.getElementById("generateBtn").classList.remove("is-loading");
  clearInterval(loaderTimer);
  document.getElementById("loaderFill").style.width = "100%";
  setTimeout(() => document.getElementById("loading").classList.add("hidden"), 250);
}

async function generate() {
  const prompt = document.getElementById("promptInput").value.trim();
  if (!prompt) { document.getElementById("promptInput").focus(); return; }

  if (!isPaid() && aiLive && usage().ai >= FREE_LIMITS.aiDesigns) {
    openPricing(`You've used your ${FREE_LIMITS.aiDesigns} free AI designs for today. Premium removes the limit — or come back tomorrow.`);
    return;
  }

  showLoader();
  let gadget = null, demo = false, demoExtra = "";

  // active filters steer the AI's design too
  let aiPrompt = prompt;
  if (filterCat !== "all") aiPrompt += ` (make it a ${filterCat === "practical" ? "practical, useful gadget" : "fun toy"})`;
  if (filterDiff !== "any") aiPrompt += ` (difficulty: ${filterDiff}, matched to that skill level)`;
  if (filterMat !== "any") aiPrompt += ` (IMPORTANT: the kid only has ${MAT_LABEL[filterMat].replace(/^\S+ /, "")} available as the main building material — design around it, and give recycled alternatives for every other part)`;

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: aiPrompt, mx: planTier() === "mx", ...childModeInfo() }),
    });
    const data = await res.json();
    if (data.gadget) { gadget = data.gadget; bumpUsage("ai"); awardProgress("ai_design"); }
    else demo = true;
    if (data.error) { demo = true; demoExtra = "(AI error: " + data.error + ")"; }
  } catch { demo = true; }

  if (!gadget) {
    // demo mode: match against the built-in library
    await new Promise((r) => setTimeout(r, 1400)); // let the loader breathe
    gadget = matchDemoGadget(prompt);
    if (!gadget) {
      gadget = DEMO_GADGETS[0];
      demoExtra = `I don't have "${escapeHtml(prompt)}" in my demo library yet, so here's my favorite build instead!`;
    }
  }

  hideLoader();
  currentGadget = gadget;
  renderGadget(gadget, demo, demoExtra);
}

// ---------------------------------------------------------------- render

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderGadget(g, demo, demoExtra) {
  document.getElementById("landing").classList.add("hidden");
  document.getElementById("workshop").classList.remove("hidden");
  window.scrollTo({ top: 0 });

  document.getElementById("gArt").innerHTML = gadgetArt(g);
  document.getElementById("gName").textContent = g.name;
  document.getElementById("gTagline").textContent = g.tagline || "";
  document.getElementById("gDifficulty").textContent = g.difficulty || "Beginner";
  document.getElementById("gTime").textContent = g.buildTime || "~1 hour";
  document.getElementById("gAge").textContent = "Ages " + (g.ageRange || "8+");

  const banner = document.getElementById("demoBanner");
  banner.classList.toggle("hidden", !demo);
  document.getElementById("demoBannerExtra").innerHTML = demoExtra || "";

  buildViewer(document.getElementById("viewer3d"), g);
  document.getElementById("blueprint").innerHTML = generateBlueprintSVG(g);
  saveBuildToAccount(g); // signed-in users build a history automatically

  document.getElementById("sustainability").innerHTML = (g.sustainability || [])
    .map((s) => `<div class="sust">
        <div class="swap"><s>${escapeHtml(s.instead)}</s> → <b>${escapeHtml(s.use)}</b></div>
        <div class="why">${escapeHtml(s.why)}</div>
      </div>`).join("") || "<p class='stores-note'>No swaps needed — this build is already green!</p>";

  document.getElementById("safety").innerHTML = (g.safety || [])
    .map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  renderSupervision(g);

  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === "guide"));
  renderTab("guide");
}

function renderTab(tab) {
  const g = currentGadget;
  const el = document.getElementById("tabContent");
  if (!g) return;

  if (tab === "guide") {
    el.innerHTML =
      `<div class="guide-toolbar">
        <button class="btn btn-secondary btn-small" onclick="readAloud()">
          <span class="i">${ICONS.speaker}</span><span id="ttsLabel">Read aloud</span></button>
        <button class="btn btn-secondary btn-small" onclick="openVocab()">
          <span class="i">${ICONS.book}</span>Word Lab quiz</button>
      </div>` +
      `<div class="tools-row"><b>You'll need:</b> ${(g.tools || []).map(escapeHtml).join(" · ")}</div>` +
      (g.steps || []).map((s, i) => `
        <div class="step">
          <div class="step-n">${i + 1}</div>
          <div>
            <b>${escapeHtml(s.title)}</b>
            <p>${escapeHtml(s.text)}</p>
            ${s.mentor ? `<div class="mentor-tip">${escapeHtml(s.mentor)}</div>` : ""}
          </div>
        </div>`).join("");
  }

  if (tab === "parts") {
    const checked = getChecklist(g.id);
    const rows = (g.parts || []).map((p, i) => {
      const cost = Number(p.cost) || 0;
      return `<tr class="${checked.includes(i) ? "part-done" : ""}" data-part="${i}">
        <td class="tick"><input type="checkbox" aria-label="Got this part" ${checked.includes(i) ? "checked" : ""}
            onchange="togglePart('${escapeHtml(g.id)}', ${i}, this.checked)" /></td>
        <td>${escapeHtml(p.item)}${p.sustainable ? `<span class="sust-alt">Free option: ${escapeHtml(p.sustainable)}</span>` : ""}</td>
        <td>${escapeHtml(p.qty)}</td>
        <td class="cost">${cost === 0 ? "FREE" : "$" + cost.toFixed(2)}</td>
        <td>${p.buy ? `<a class="buy-link" target="_blank" rel="noopener" href="https://www.google.com/search?tbm=shop&q=${encodeURIComponent(p.buy)}">Buy</a>` : "—"}</td>
      </tr>`;
    }).join("");
    const freeCount = (g.parts || []).filter((p) => !Number(p.cost)).length;
    el.innerHTML = `<p class="checklist-hint">Check off each part as you collect it.</p>
      <div class="table-wrap"><table class="parts">
        <thead><tr><th></th><th>Item</th><th>Qty</th><th>Est. cost</th><th>Buy</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      ${freeCount ? `<div class="parts-total"><div class="free">${freeCount} part${freeCount > 1 ? "s" : ""} free from recycling</div></div>` : ""}`;
  }

  if (tab === "wiring") {
    el.innerHTML = (g.wiring || []).map((w) => `
      <div class="wire">
        <div class="wire-dot" style="background:${escapeHtml(w.color || "gray")}"></div>
        <div>
          <b>${escapeHtml(w.from)} → ${escapeHtml(w.to)}</b>
          <p>${escapeHtml(w.why || "")}</p>
        </div>
      </div>`).join("") || "<p>No wiring needed for this build!</p>";
  }

  if (tab === "code") {
    if (g.code && g.code.source) {
      el.innerHTML = `
        <div class="code-head">
          <span class="fname">${escapeHtml(g.code.filename || "sketch.ino")}</span>
          <button class="btn btn-small" onclick="downloadCode()">⬇ Download</button>
        </div>
        <pre class="code">${escapeHtml(g.code.source)}</pre>`;
    } else {
      el.innerHTML = "<p>This gadget doesn't need any code — pure mechanical engineering!</p>";
    }
  }

  if (tab === "how") {
    el.innerHTML = `<div class="how">${(g.howItWorks || "")
      .split(/\n\n+/).map((p) => `<p>${escapeHtml(p)}</p>`).join("")}</div>`;
  }
}

// ---------------------------------------------------------------- downloads

function downloadBlob(content, filename, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function downloadSTL() {
  if (!currentGadget) return;
  if (!isPaid()) {
    openPricing("STL downloads for 3D printing are a Premium feature. Blueprints stay free.");
    return;
  }
  downloadBlob(generateSTL(currentGadget.model, currentGadget.id), currentGadget.id + ".stl", "model/stl");
}

function downloadCode() {
  if (!currentGadget?.code?.source) return;
  downloadBlob(currentGadget.code.source, currentGadget.code.filename || "sketch.ino", "text/plain");
}

function downloadBlueprint() {
  if (!currentGadget) return;
  downloadBlob(generateBlueprintSVG(currentGadget), currentGadget.id + "-blueprint.svg", "image/svg+xml");
}

// Self-contained HTML guide — works with zero internet, for kids without a connection.
function downloadOfflineGuide() {
  const g = currentGadget;
  if (!g) return;
  if (!isPaid()) {
    openPricing("Offline guide downloads are a Premium feature — great for building with no internet.");
    return;
  }
  const total = (g.parts || []).reduce((s, p) => s + (Number(p.cost) || 0), 0);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(g.name)} — Build Guide</title>
<style>
 body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:24px;color:#1e2a38;line-height:1.6}
 h1{color:#1268c3} h2{border-bottom:2px solid #e8f2fd;padding-bottom:6px;margin-top:32px}
 .tip{background:#e8f2fd;border-left:4px solid #1268c3;padding:8px 14px;margin:8px 0;border-radius:0 8px 8px 0}
 table{border-collapse:collapse;width:100%} td,th{border:1px solid #d8e6f5;padding:8px;text-align:left}
 pre{background:#14202e;color:#d7e4f5;padding:16px;border-radius:10px;overflow-x:auto;font-size:13px}
 .safety{background:#fdecec;border:1px solid #f5c2c4;border-radius:10px;padding:12px 18px}
 .bp{margin:16px 0}
</style></head><body>
<h1>${g.emoji || ""} ${escapeHtml(g.name)}</h1>
<p><i>${escapeHtml(g.tagline || "")}</i></p>
<p><b>Difficulty:</b> ${escapeHtml(g.difficulty)} · <b>Time:</b> ${escapeHtml(g.buildTime)} · <b>Cost:</b> ~$${total.toFixed(2)}</p>
<div class="bp">${generateBlueprintSVG(g)}</div>
<h2>Parts</h2>
<table><tr><th>Item</th><th>Qty</th><th>Cost</th></tr>
${(g.parts || []).map((p) => `<tr><td>${escapeHtml(p.item)}${p.sustainable ? `<br><small>Free option: ${escapeHtml(p.sustainable)}</small>` : ""}</td><td>${escapeHtml(p.qty)}</td><td>${Number(p.cost) ? "$" + Number(p.cost).toFixed(2) : "FREE"}</td></tr>`).join("")}
</table>
<h2>Tools</h2><p>${(g.tools || []).map(escapeHtml).join(" · ")}</p>
<h2>Build steps</h2>
${(g.steps || []).map((s, i) => `<h3>Step ${i + 1}: ${escapeHtml(s.title)}</h3><p>${escapeHtml(s.text)}</p>${s.mentor ? `<div class="tip"><b>Mentor:</b> ${escapeHtml(s.mentor)}</div>` : ""}`).join("")}
<h2>Wiring</h2>
<ul>${(g.wiring || []).map((w) => `<li><b>${escapeHtml(w.from)} → ${escapeHtml(w.to)}</b> — ${escapeHtml(w.why || "")}</li>`).join("")}</ul>
${g.code?.source ? `<h2>Code (${escapeHtml(g.code.filename || "sketch.ino")})</h2><pre>${escapeHtml(g.code.source)}</pre>` : ""}
<h2>How it works</h2>
${(g.howItWorks || "").split(/\n\n+/).map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
<h2>Safety</h2><div class="safety"><ul>${(g.safety || []).map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul></div>
<p style="margin-top:40px;color:#888"><small>Made with GadgetGenie — this guide works completely offline.</small></p>
</body></html>`;
  downloadBlob(html, g.id + "-offline-guide.html", "text/html");
}

// ---------------------------------------------------------------- stores near me

function findNearby(query) {
  // Google Maps uses the device's own location — we never read or send it ourselves.
  window.open("https://www.google.com/maps/search/" + encodeURIComponent(query + " near me"), "_blank", "noopener");
}

// ---------------------------------------------------------------- mentor chat

const OFFLINE_MENTOR = [
  { keys: ["breadboard"], a: "A breadboard is a reusable building base for circuits! Under each row of 5 holes is a springy metal strip, so parts plugged into the same row are automatically connected — the breadboard conducts the electricity between them. No soldering, no glue, easy to redo." },
  { keys: ["resistor"], a: "A resistor slows electricity down, like a narrow section in a water slide. LEDs are delicate — without a resistor, too much current rushes through and burns them out. The 220 Ω resistor lets just the right amount through." },
  { keys: ["led", "light up", "won't light", "wont light"], a: "LEDs only work one direction! Check that the LONG leg goes toward + (your resistor/pin) and the SHORT leg toward GND. Also check every wire is pushed firmly into the breadboard — loose wires are the #1 gremlin. Still dark? Try a different LED; they do burn out." },
  { keys: ["battery", "9v", "power"], a: "The battery is your electron pump. Its voltage is like water pressure — 9V pushes harder than 1.5V. The Arduino takes the 9V and regulates it down to a steady 5V so the delicate chips don't fry. Never connect + straight to − with a wire: that's a short circuit and it gets hot fast!" },
  { keys: ["arduino", "upload", "code"], a: "The Arduino is a tiny computer that runs one program forever in a loop. You write code on a big computer, click Upload, and it travels over USB into the Arduino's memory. If upload fails, check you picked the right board and port under Tools in the Arduino IDE." },
  { keys: ["motor", "spin"], a: "A motor spins because electricity through a coil creates a magnet, and magnets inside push it around — then a clever switch flips the current so it keeps getting pushed. If it spins the wrong way, just swap the motor's two wires!" },
  { keys: ["transistor"], a: "A transistor is an electronic valve: a tiny current on its 'base' pin lets a BIG current flow through the other two pins. That's how a small Arduino signal can control a power-hungry motor. It's the same building block computers are made of — your laptop has billions!" },
  { keys: ["circuit", "ground", "gnd"], a: "Electricity only flows in complete loops: out of the battery's +, through your parts, and back to −. GND (ground) is the shared 'return path' everything flows back through. If your circuit doesn't work, trace the loop with your finger — any gap breaks everything." },
  { keys: ["pwm", "speed", "dim"], a: "PWM is a super-fast on/off trick! The Arduino can't give 'half power', so it switches ON and OFF a thousand times a second. ON 50% of the time = 50% power. Motors and LEDs average it out into smooth speed or brightness." },
  { keys: ["solder"], a: "Good news: none of these builds need soldering! The breadboard's springy metal rails hold everything. If a connection feels loose, push the wire deeper or move to a fresh row." },
];

function mentorAppend(text, cls) {
  const log = document.getElementById("mentorLog");
  const div = document.createElement("div");
  div.className = "mentor-msg" + (cls ? " " + cls : "");
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  return div;
}

async function askMentor() {
  const input = document.getElementById("mentorInput");
  const q = input.value.trim();
  if (!q) return;
  if (!isPaid() && usage().genie >= FREE_LIMITS.genieQuestions) {
    openPricing(`Genie answered ${FREE_LIMITS.genieQuestions} questions today — that's the Free limit. Premium makes Genie unlimited.`);
    return;
  }
  bumpUsage("genie");
  awardProgress("genie_q");
  input.value = "";
  const askBtn = document.getElementById("askBtn");
  askBtn.classList.add("is-loading");
  mentorAppend(q, "user");
  const thinking = mentorAppend("thinking…", "thinking");

  try {
    if (aiLive) {
      try {
        const res = await fetch("/api/mentor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q, context: currentGadget?.name, ...childModeInfo() }),
        });
        const data = await res.json();
        if (data.answer) { thinking.remove(); mentorAppend(data.answer); return; }
      } catch {}
    }
    // offline / demo mentor
    await new Promise((r) => setTimeout(r, 700));
    thinking.remove();
    const ql = q.toLowerCase();
    const hit = OFFLINE_MENTOR.find((m) => m.keys.some((k) => ql.includes(k)));
    mentorAppend(hit ? hit.a :
      "Great question! In demo mode I know about breadboards, LEDs, resistors, batteries, motors, transistors, circuits and code — try asking about one of those. (With an AI key set, I can answer anything!)");
  } finally {
    askBtn.classList.remove("is-loading");
  }
}

// ---------------------------------------------------------------- photo check

document.getElementById("gateAnswer").addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkParentGate();
});
// ============================================================================
// Gamification, settings, challenge, Word Lab, read-aloud, ads, assembly
// ============================================================================

// ---------- progress / XP ----------
const BADGES = {
  "first-build": ["First Build", "Opened your first project"],
  "builder-5": ["Serial Builder", "Completed 5 projects"],
  "inventor": ["Inventor", "Designed an invention with Genie"],
  "curious-mind": ["Curious Mind", "Asked Genie 10 questions"],
  "word-wizard": ["Word Wizard", "Passed a Word Lab quiz"],
  "recycler": ["Recycler", "Built with recycled materials"],
  "challenger": ["Challenger", "Entered a Monthly Challenge"],
  "streak-3": ["On Fire", "3-day build streak"],
  "streak-7": ["Unstoppable", "7-day build streak"],
};
function levelFromXp(xp) { return Math.floor(Math.sqrt((xp || 0) / 50)) + 1; }
function xpForLevel(l) { return Math.pow(l - 1, 2) * 50; }

async function awardProgress(type) {
  if (!currentUser) return; // XP lives on the account
  try {
    const before = (currentUser.progress?.badges || []).length;
    currentUser = (await api("/api/event", { type })).user;
    updateProgressUI();
    if ((currentUser.progress?.badges || []).length > before) {
      genieCelebrate();
      genieSay(pick(GENIE_LINES.badge), true);
    }
  } catch {}
}

function updateProgressUI() {
  const btn = document.getElementById("progressBtn");
  if (!currentUser) { btn.classList.add("hidden"); return; }
  const p = currentUser.progress || { xp: 0, streak: { count: 0 } };
  btn.classList.remove("hidden");
  document.getElementById("progressLabel").textContent =
    `Lv ${levelFromXp(p.xp)}${p.streak.count > 1 ? " · " + p.streak.count + "🔥".replace("🔥", "-day") : ""}`;
}

function openProgress() {
  if (!currentUser) { openAuth(); return; }
  const p = currentUser.progress || { xp: 0, badges: [], streak: { count: 0 }, tickets: 0 };
  const lvl = levelFromXp(p.xp);
  const cur = xpForLevel(lvl), next = xpForLevel(lvl + 1);
  const pct = Math.min(100, Math.round(((p.xp - cur) / (next - cur)) * 100));
  document.getElementById("progressBody").innerHTML = `
    <div class="level-row"><b>Level ${lvl}</b><span class="hint">${p.xp} XP · ${next - p.xp} to level ${lvl + 1}</span></div>
    <div class="level-bar"><div style="width:${pct}%"></div></div>
    <div class="prog-stats">
      <div class="prog-stat"><span class="i">${ICONS.flame}</span><b>${p.streak.count || 0}-day</b><small>streak</small></div>
      <div class="prog-stat"><span class="i">${ICONS.ticket}</span><b>${p.tickets || 0}</b><small>challenge tickets</small></div>
      <div class="prog-stat"><span class="i">${ICONS.cube}</span><b>${currentUser.buildCount}</b><small>builds saved</small></div>
    </div>
    <b class="badges-title">Badges — ${p.badges.length}/${Object.keys(BADGES).length}</b>
    <div class="badges">${Object.entries(BADGES).map(([id, [name, how]]) => `
      <div class="badge ${p.badges.includes(id) ? "earned" : ""}" title="${escapeHtml(how)}">
        <span class="i">${ICONS.medal}</span><span>${escapeHtml(name)}</span>
      </div>`).join("")}</div>`;
  document.getElementById("progressModal").classList.remove("hidden");
}
function closeProgress() { document.getElementById("progressModal").classList.add("hidden"); }

// ---------- settings (theme / color-blind / dyslexia font / age) ----------
function getSettings() {
  if (currentUser && currentUser.settings && Object.keys(currentUser.settings).length)
    return { ...currentUser.settings, age: currentUser.age };
  try { return JSON.parse(localStorage.getItem("gg_settings") || "{}"); } catch { return {}; }
}

function applySettings(fromUI) {
  let s;
  if (fromUI) {
    s = {
      theme: document.getElementById("setDark").checked ? "dark" : "light",
      cb: document.getElementById("setCb").checked,
      dyslexic: document.getElementById("setDyslexic").checked,
      age: document.getElementById("setAge").value,
    };
    localStorage.setItem("gg_settings", JSON.stringify(s));
    if (currentUser) api("/api/settings", { settings: s, age: s.age }).then((d) => (currentUser = d.user)).catch(() => {});
  } else {
    s = getSettings();
  }
  const root = document.documentElement;
  root.dataset.theme = s.theme === "dark" ? "dark" : "light";
  root.classList.toggle("cb-mode", !!s.cb);
  root.classList.toggle("dyslexic", !!s.dyslexic);
}

function openSettings() {
  const s = getSettings();
  document.getElementById("setDark").checked = s.theme === "dark";
  document.getElementById("setCb").checked = !!s.cb;
  document.getElementById("setDyslexic").checked = !!s.dyslexic;
  document.getElementById("setAge").value = s.age || "";
  document.getElementById("settingsNote").textContent = currentUser
    ? "Settings save to your account and follow you to any computer."
    : "Settings save to this device — sign in to keep them everywhere.";
  document.getElementById("settingsModal").classList.remove("hidden");
}
function closeSettings() { document.getElementById("settingsModal").classList.add("hidden"); }

// ---------- monthly challenge ----------
const CHALLENGE_THEMES = [
  "build something with recycled materials", "design an energy-saving gadget",
  "build something that helps someone in your family", "make a gadget for your pet or garden",
  "build something using only cardboard", "invent a gadget that cleans something up",
  "make something that moves without a motor", "build a gadget that uses light",
  "design something for a friend who needs it", "build the quietest useful machine you can",
  "make a gadget powered by rubber bands or gravity", "invent something festive",
];
function monthTheme() { return CHALLENGE_THEMES[new Date().getMonth()]; }

async function loadShowcase() {
  const el = document.getElementById("showcaseList");
  try {
    const res = await fetch("/api/challenge/list", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const data = await res.json();
    el.innerHTML = data.entries.length
      ? data.entries.map((e) => `<div class="showcase-entry"><b>${escapeHtml(e.project)}</b>
          <span>by ${escapeHtml(e.by)}${e.note ? " — “" + escapeHtml(e.note) + "”" : ""}</span></div>`).join("")
      : `<span class="hint">No entries yet this month — be the first!</span>`;
  } catch { el.innerHTML = `<span class="hint">Showcase loads when you're online.</span>`; }
}

async function openChallenge() {
  const body = document.getElementById("challengeBody");
  if (!currentUser) {
    body.innerHTML = `<p>Sign in to enter — your builds and tickets live on your account.</p>
      <button class="btn btn-primary" onclick="closeChallenge(); openAuth()">Sign in first</button>`;
  } else {
    let builds = [];
    try { builds = (await api("/api/builds/list", {})).builds; } catch {}
    const tickets = currentUser.progress?.tickets || 0;
    body.innerHTML = builds.length ? `
      <p>This month's theme: <b>${escapeHtml(monthTheme())}</b>. Pick one of your builds:</p>
      <label class="field"><span>Your build</span>
        <select id="chBuild">${builds.map((b) => `<option value="${escapeHtml(b.id)}">${escapeHtml(b.name)}</option>`).join("")}</select></label>
      <label class="field"><span>Tell the judges about it (optional)</span>
        <input id="chNote" type="text" maxlength="200" placeholder="I used two bottles from our recycling bin!" /></label>
      <label class="kind-opt"><input type="checkbox" id="chRecycled" /> I used recycled materials (bonus ticket)</label>
      <p class="hint">You have ${tickets} achievement ticket${tickets === 1 ? "" : "s"}. Winners are picked for creativity —
        tickets celebrate effort, they never change your odds. Paying users get no advantage.</p>
      <button class="btn btn-primary auth-submit" onclick="submitChallenge()">Submit my entry</button>
      <p id="chError" class="gate-error hidden"></p>`
      : `<p>You don't have any saved builds yet! Open a project or design something with Genie first —
         it saves to your account automatically.</p>`;
  }
  document.getElementById("challengeModal").classList.remove("hidden");
}
function closeChallenge() { document.getElementById("challengeModal").classList.add("hidden"); }

async function submitChallenge() {
  const err = document.getElementById("chError");
  err.classList.add("hidden");
  try {
    currentUser = (await api("/api/challenge/submit", {
      buildId: document.getElementById("chBuild").value,
      note: document.getElementById("chNote").value,
      recycled: document.getElementById("chRecycled").checked,
    })).user;
    closeChallenge();
    updateProgressUI();
    loadShowcase();
    openProgress(); // show off the new badge + tickets
  } catch (ex) {
    err.textContent = ex.message;
    err.classList.remove("hidden");
  }
}

// ---------- Word Lab (vocabulary quiz) ----------
const VOCAB_QUIZ = [
  { q: "What does a resistor do in a circuit?", a: ["Slows the current to a safe amount", "Stores electricity for later", "Makes the current go faster"], correct: 0 },
  { q: "Why do LEDs only light up one way around?", a: ["They're diodes — one-way streets for current", "The long leg is heavier", "They need to warm up first"], correct: 0 },
  { q: "What is a circuit?", a: ["A complete loop electricity flows around", "Any pile of wires", "A kind of battery"], correct: 0 },
  { q: "What does the breadboard do?", a: ["Connects parts with hidden metal rails — no soldering", "Keeps the parts warm", "Stores your code"], correct: 0 },
  { q: "PWM makes a motor slower by…", a: ["Switching power on and off really fast", "Lowering the room temperature", "Using thinner wires"], correct: 0 },
];
let vocabIndex = 0, vocabScore = 0;

function openVocab() {
  vocabIndex = 0; vocabScore = 0;
  renderVocabQ();
  document.getElementById("vocabModal").classList.remove("hidden");
}
function closeVocab() { document.getElementById("vocabModal").classList.add("hidden"); }

function renderVocabQ() {
  const body = document.getElementById("vocabBody");
  if (vocabIndex >= VOCAB_QUIZ.length) {
    const passed = vocabScore >= 4;
    body.innerHTML = `<p class="vocab-result"><b>${vocabScore}/${VOCAB_QUIZ.length} correct.</b>
      ${passed ? "You passed — Word Wizard material! XP and a challenge ticket earned." : "Almost! Reread the Genie tips in any guide and try again."}</p>
      <button class="btn btn-primary auth-submit" onclick="closeVocab()">Done</button>`;
    if (passed) awardProgress("vocab_quiz");
    return;
  }
  const item = VOCAB_QUIZ[vocabIndex];
  const order = item.a.map((t, i) => ({ t, i })).sort(() => Math.random() - 0.5);
  body.innerHTML = `<p class="hint">Question ${vocabIndex + 1} of ${VOCAB_QUIZ.length}</p>
    <p><b>${escapeHtml(item.q)}</b></p>
    <div class="vocab-answers">${order.map((o) => `
      <button class="btn btn-secondary vocab-a" onclick="answerVocab(${o.i}, this)">${escapeHtml(o.t)}</button>`).join("")}</div>`;
}
function answerVocab(i, btn) {
  const item = VOCAB_QUIZ[vocabIndex];
  if (i === item.correct) { vocabScore++; btn.classList.add("vocab-right"); }
  else btn.classList.add("vocab-wrong");
  setTimeout(() => { vocabIndex++; renderVocabQ(); }, 450);
}

// ---------- read aloud (text-to-speech) ----------
let speaking = false;
function readAloud() {
  const label = document.getElementById("ttsLabel");
  if (speaking) { speechSynthesis.cancel(); speaking = false; if (label) label.textContent = "Read aloud"; return; }
  const g = currentGadget;
  if (!g || !("speechSynthesis" in window)) return;
  const text = (g.steps || []).map((s, i) => `Step ${i + 1}. ${s.title}. ${s.text}`).join(" ");
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.95;
  utter.onend = () => { speaking = false; if (document.getElementById("ttsLabel")) document.getElementById("ttsLabel").textContent = "Read aloud"; };
  speechSynthesis.speak(utter);
  speaking = true;
  if (label) label.textContent = "Stop reading";
}

// ---------- parts checklist ----------
function getChecklist(id) {
  try { return JSON.parse(localStorage.getItem("gg_check_" + id) || "[]"); } catch { return []; }
}
function togglePart(id, index, on) {
  let c = getChecklist(id).filter((x) => x !== index);
  if (on) c.push(index);
  localStorage.setItem("gg_check_" + id, JSON.stringify(c));
  const row = document.querySelector(`tr[data-part="${index}"]`);
  if (row) row.classList.toggle("part-done", on);
}

// ---------- ads (free plan) ----------
function renderAds() {
  const paid = isPaid();
  for (const slotId of ["adSlotLanding", "adSlotWorkshop"]) {
    const el = document.getElementById(slotId);
    if (!el) continue;
    el.innerHTML = paid ? "" : `
      <div class="ad-slot">
        <span class="ad-tag">Sponsored</span>
        <span class="ad-copy">This spot supports free GadgetGenie for every kid. <b>Premium removes ads.</b></span>
        <button class="btn btn-secondary btn-small" onclick="openPricing()">Go ad-free</button>
      </div>`;
  }
}

// ---------- assembly animation (Premium) ----------
function playAssemblyGated() {
  if (!currentGadget) return;
  if (!isPaid()) {
    openPricing("The animated assembly — watching your gadget build itself in 3D — is a Premium feature.");
    return;
  }
  if (typeof playAssembly === "function") playAssembly();
}

// ---------- child mode helper ----------
function childModeInfo() {
  const s = getSettings();
  return { childMode: (currentUser && currentUser.kind === "child") || s.age === "6-8", age: (currentUser && currentUser.age) || s.age || "" };
}

// ---------- Genie avatar — the robot friend who talks to you ----------
let genieVoice = localStorage.getItem("gg_voice") === "1";
let genieHideTimer = null;

const GENIE_LINES = {
  welcome: [
    "Hi, I'm Genie! Type any invention idea up there and I'll design the whole build for you!",
    "Welcome back, inventor! Want to build something awesome today?",
    "Hello hello! Pick a project below, or dream up a brand-new one — I'll draw the plans!",
  ],
  project: [
    "Ooh, great pick! Check the Guide tab — I explain the science at every step!",
    "Nice choice! Tap the Parts tab and check off pieces as you find them!",
    "Let's build it! If you get stuck, ask me anything in the Ask Genie box!",
  ],
  badge: [
    "WOOHOO! You just earned a badge! Check your progress — I'm so proud of you!",
    "Badge unlocked! You're becoming a real engineer!",
    "Amazing work! A new badge, just for you!",
  ],
  tips: [
    "Did you know? LEDs only work one way around — the long leg is the plus side!",
    "Tip: a resistor is like a narrow water slide — it slows electricity to a safe speed!",
    "Recycling tip: broken toys are treasure chests full of free motors and LEDs!",
    "Stuck? Take a photo of your build and I'll look for mistakes — that's Photo Check!",
    "Try the Word Lab quiz — pass it and you earn XP and a challenge ticket!",
    "Enter the Monthly Challenge! Winners get featured right on the homepage!",
    "Electricity always flows in a loop. If your circuit's dead, look for the gap!",
    "The best inventors make mistakes ALL the time. That's how you learn — keep going!",
  ],
};

function genieSay(text, autoHide) {
  const bubble = document.getElementById("genieBubble");
  if (!bubble) return;
  document.getElementById("genieText").textContent = text;
  bubble.classList.remove("hidden");
  clearTimeout(genieHideTimer);
  if (autoHide) genieHideTimer = setTimeout(() => bubble.classList.add("hidden"), 9000);
  if (genieVoice && "speechSynthesis" in window) {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02; u.pitch = 1.25; // bright, friendly robot voice
    speechSynthesis.speak(u);
  }
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function toggleGenieBubble() {
  const bubble = document.getElementById("genieBubble");
  if (bubble.classList.contains("hidden")) genieSay(pick(GENIE_LINES.tips), false);
  else { bubble.classList.add("hidden"); speechSynthesis?.cancel(); }
}
function genieTip() { genieSay(pick(GENIE_LINES.tips), false); }

function toggleGenieVoice() {
  genieVoice = !genieVoice;
  localStorage.setItem("gg_voice", genieVoice ? "1" : "0");
  document.getElementById("genieVoiceBtn").textContent = "Voice: " + (genieVoice ? "on" : "off");
  if (genieVoice) genieSay("Now I can talk out loud! Hi, I'm Genie!", true);
  else speechSynthesis?.cancel();
}

function genieCelebrate() {
  // confetti burst for badge moments
  const holder = document.createElement("div");
  holder.className = "confetti";
  const colors = ["#1266C2", "#3FAE5A", "#F4B840", "#54E0F0", "#E06CA8"];
  for (let i = 0; i < 26; i++) {
    const bit = document.createElement("i");
    bit.style.left = Math.random() * 100 + "vw";
    bit.style.background = colors[i % colors.length];
    bit.style.animationDelay = Math.random() * 0.4 + "s";
    bit.style.transform = `rotate(${Math.random() * 360}deg)`;
    holder.appendChild(bit);
  }
  document.body.appendChild(holder);
  setTimeout(() => holder.remove(), 2400);
}

function genieBoot() {
  const avatar = document.getElementById("genieAvatarBtn");
  const hero = document.getElementById("heroMascot");
  if (avatar) avatar.innerHTML = GENIE_MASCOT;
  if (hero) hero.innerHTML = GENIE_MASCOT;
  document.getElementById("genieVoiceBtn").textContent = "Voice: " + (genieVoice ? "on" : "off");
  setTimeout(() => genieSay(pick(GENIE_LINES.welcome), true), 1200);
}

// ---------- boot ----------
try {
  document.querySelectorAll('input[name="authKind"]').forEach((r) =>
    r.addEventListener("change", () => {
      document.getElementById("kindNote").classList.toggle("hidden", r.value !== "child" || !r.checked);
    })
  );
  const cm = document.getElementById("challengeMascot");
  if (cm) cm.innerHTML = GENIE_MASCOT;
  const ct = document.getElementById("challengeTheme");
  if (ct) ct.textContent = "This month: " + monthTheme();
  applySettings(false);
  loadShowcase();
} catch (e) { console.error("boot extras failed:", e); }
refreshParentUI(); // initial gallery paint + parent state — must always run
updatePlanUI();
renderAds();
restoreSession();
genieBoot();

function onPhotoPicked(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!isPaid()) {
    e.target.value = "";
    openPricing("Photo check — where Genie looks at your build and spots mistakes — is a Premium feature.");
    return;
  }
  const reader = new FileReader();
  reader.onload = async () => {
    const dataUrl = reader.result;
    document.getElementById("photoPreview").src = dataUrl;
    document.getElementById("photoPreviewWrap").classList.remove("hidden");
    mentorAppend("(sent a photo of my build)", "user");
    const thinking = mentorAppend("looking at your photo…", "thinking");

    if (aiLive) {
      try {
        const base64 = dataUrl.split(",")[1];
        const res = await fetch("/api/check-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mimeType: file.type, context: currentGadget?.name }),
        });
        const data = await res.json();
        if (data.answer) { thinking.remove(); mentorAppend(data.answer); return; }
      } catch {}
    }
    await new Promise((r) => setTimeout(r, 900));
    thinking.remove();
    mentorAppend("Nice progress! In demo mode I can't truly see photos, but here's my checklist: 1) LED long leg toward +? 2) Every wire pushed ALL the way in? 3) All grounds connected together? 4) Battery clicked in firmly? With an AI key set, I analyze your actual photo and spot the exact mistake.");
  };
  reader.readAsDataURL(file);
  e.target.value = "";
}
