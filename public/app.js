// GadgetGenie app — UI wiring: generate, tabs, downloads, mentor chat, photo check, stores.

let currentGadget = null;
let aiLive = false;
let filterCat = "all";   // all | practical | fun
let filterDiff = "any";  // any | Beginner | Intermediate | Advanced
let filterMat = "any";   // any | cardboard | plastic | wood | metal | electronics
let parentMode = localStorage.getItem("gg_parent") === "1";

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
          <span class="gpill gpill-cost">~$${total(g).toFixed(0)}</span>
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
  "Waking up your mentor…",
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
      body: JSON.stringify({ prompt: aiPrompt }),
    });
    const data = await res.json();
    if (data.gadget) gadget = data.gadget;
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
  const total = (g.parts || []).reduce((s, p) => s + (Number(p.cost) || 0), 0);
  document.getElementById("gCost").textContent = "~$" + total.toFixed(2);

  const banner = document.getElementById("demoBanner");
  banner.classList.toggle("hidden", !demo);
  document.getElementById("demoBannerExtra").innerHTML = demoExtra || "";

  buildViewer(document.getElementById("viewer3d"), g);
  document.getElementById("blueprint").innerHTML = generateBlueprintSVG(g);

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
    const rows = (g.parts || []).map((p) => {
      const cost = Number(p.cost) || 0;
      return `<tr>
        <td>${escapeHtml(p.item)}${p.sustainable ? `<span class="sust-alt">Free option: ${escapeHtml(p.sustainable)}</span>` : ""}</td>
        <td>${escapeHtml(p.qty)}</td>
        <td class="cost">${cost === 0 ? "FREE" : "$" + cost.toFixed(2)}</td>
        <td>${p.buy ? `<a class="buy-link" target="_blank" rel="noopener" href="https://www.google.com/search?tbm=shop&q=${encodeURIComponent(p.buy)}">Buy</a>` : "—"}</td>
      </tr>`;
    }).join("");
    const total = (g.parts || []).reduce((s, p) => s + (Number(p.cost) || 0), 0);
    const freeCount = (g.parts || []).filter((p) => !Number(p.cost)).length;
    el.innerHTML = `<div class="table-wrap"><table class="parts">
        <thead><tr><th>Item</th><th>Qty</th><th>Est. cost</th><th>Buy</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <div class="parts-total">Total: ~$${total.toFixed(2)}
        ${freeCount ? `<div class="free">${freeCount} part${freeCount > 1 ? "s" : ""} free from recycling</div>` : ""}
      </div>`;
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
          body: JSON.stringify({ question: q, context: currentGadget?.name }),
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
refreshParentUI(); // initial gallery paint + parent state

function onPhotoPicked(e) {
  const file = e.target.files[0];
  if (!file) return;
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
