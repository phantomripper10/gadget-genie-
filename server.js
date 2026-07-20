// GadgetGenie server — zero-dependency Node.js (18+) server.
// Serves the static site and proxies AI calls to Gemini when GEMINI_API_KEY is set.
// Without a key it falls back to the built-in demo gadget library (handled client-side).

const http = require("http");
const fs = require("fs");
const path = require("path");
const net = require("net");
const tls = require("tls");
const crypto = require("crypto");

// Load .env (KEY=VALUE lines) so API keys stay out of the source code.
try {
  const env = fs.readFileSync(path.join(__dirname, ".env"), "utf8");
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {} // no .env = demo mode, that's fine

const PORT = process.env.PORT || 4180;
const PUBLIC_DIR = path.join(__dirname, "public");
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const AZURE_URL = process.env.AZURE_OPENAI_URL || "";
const AZURE_KEY = process.env.AZURE_OPENAI_KEY || "";
const AZURE_MODEL = process.env.AZURE_OPENAI_MODEL || "azure-openai";
const AI_PROVIDER = AZURE_URL && AZURE_KEY ? "azure" : GEMINI_KEY ? "gemini" : "";
const AI_MODEL_NAME = AI_PROVIDER === "azure" ? AZURE_MODEL : AI_PROVIDER === "gemini" ? GEMINI_MODEL : "demo library";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

// ============================================================================
// User accounts + saved builds
// Storage: one JSON blob. Held in memory, persisted to (a) a Redis-compatible
// store when REDIS_URL is set (Render Key Value — survives free-tier restarts),
// and (b) a local data.json file (works forever on a normal machine).
// ============================================================================

const DATA_FILE = path.join(__dirname, "data.json");
const REDIS_URL = process.env.REDIS_URL || "";
const DB_KEY = "gadgetgenie:db";

let db = { users: {}, sessions: {} };

// ---------- minimal Redis (RESP) client — just AUTH/GET/SET, promise-queued ----------
const redis = REDIS_URL ? (() => {
  const u = new URL(REDIS_URL);
  let sock = null, buf = Buffer.alloc(0), queue = [];
  function connect() {
    return new Promise((resolve, reject) => {
      const opts = { host: u.hostname, port: Number(u.port) || 6379 };
      sock = u.protocol === "rediss:" ? tls.connect({ ...opts, servername: u.hostname }, onUp) : net.connect(opts, onUp);
      function onUp() { resolve(); }
      sock.on("data", (d) => {
        buf = Buffer.concat([buf, d]);
        let parsed;
        while (queue.length && (parsed = tryParse()) !== undefined) {
          const { resolve: rs, reject: rj } = queue.shift();
          parsed instanceof Error ? rj(parsed) : rs(parsed);
        }
      });
      sock.on("error", (e) => { queue.forEach((q) => q.reject(e)); queue = []; sock = null; reject(e); });
      sock.on("close", () => { sock = null; });
    });
  }
  function tryParse() {
    if (!buf.length) return undefined;
    const nl = buf.indexOf("\r\n");
    if (nl < 0) return undefined;
    const head = buf.slice(0, nl).toString();
    const type = head[0], rest = head.slice(1);
    if (type === "+" || type === ":") { buf = buf.slice(nl + 2); return rest; }
    if (type === "-") { buf = buf.slice(nl + 2); return new Error(rest); }
    if (type === "$") {
      const len = Number(rest);
      if (len === -1) { buf = buf.slice(nl + 2); return null; }
      if (buf.length < nl + 2 + len + 2) return undefined;
      const val = buf.slice(nl + 2, nl + 2 + len).toString();
      buf = buf.slice(nl + 2 + len + 2);
      return val;
    }
    return new Error("unsupported RESP type " + type);
  }
  async function cmd(...args) {
    if (!sock) {
      await connect();
      if (u.password) await cmd("AUTH", ...(u.username ? [u.username, u.password] : [u.password]));
    }
    const payload = `*${args.length}\r\n` + args.map((a) => `$${Buffer.byteLength(String(a))}\r\n${a}\r\n`).join("");
    return new Promise((resolve, reject) => { queue.push({ resolve, reject }); sock.write(payload); });
  }
  return { cmd };
})() : null;

async function loadDB() {
  if (redis) {
    try {
      const raw = await redis.cmd("GET", DB_KEY);
      if (raw) { db = JSON.parse(raw); console.log(`Accounts: loaded ${Object.keys(db.users).length} users from Redis`); return; }
      console.log("Accounts: Redis connected (empty — fresh database)");
      return;
    } catch (e) { console.error("Accounts: Redis load failed:", e.message); }
  }
  try { db = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); console.log(`Accounts: loaded ${Object.keys(db.users).length} users from data.json`); }
  catch { console.log("Accounts: starting with empty local database"); }
}

let saveTimer = null;
function saveDB() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const raw = JSON.stringify(db);
    try { fs.writeFileSync(DATA_FILE, raw); } catch {}
    if (redis) { try { await redis.cmd("SET", DB_KEY, raw); } catch (e) { console.error("Accounts: Redis save failed:", e.message); } }
  }, 250);
}

// ---------- auth helpers ----------
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}
function newToken() { return crypto.randomBytes(24).toString("hex"); }
function cleanSessions() {
  const now = Date.now();
  for (const t of Object.keys(db.sessions)) if (db.sessions[t].expires < now) delete db.sessions[t];
}
function userFromToken(token) {
  if (!token) return null;
  const s = db.sessions[token];
  if (!s || s.expires < Date.now()) return null;
  return db.users[s.email] || null;
}
function publicUser(u) {
  return {
    name: u.name, email: u.email, plan: u.plan || { tier: "free" },
    buildCount: (u.builds || []).length,
    kind: u.kind || "me", age: u.age || "",
    settings: u.settings || {},
    progress: u.progress || { xp: 0, badges: [], streak: { count: 0, last: "" }, tickets: 0 },
  };
}

// ---------- gamification ----------
const XP_EVENTS = { open_build: 10, ai_design: 25, genie_q: 2, vocab_quiz: 15, challenge_entry: 20 };
const TICKET_EVENTS = { open_build: 1, ai_design: 1, vocab_quiz: 1, recycled_build: 1 }; // fair: earned by doing, never bought

function awardEvent(u, type) {
  if (!(type in XP_EVENTS) && !(type in TICKET_EVENTS)) return;
  const p = (u.progress = u.progress || { xp: 0, badges: [], streak: { count: 0, last: "" }, tickets: 0 });
  p.xp += XP_EVENTS[type] || 0;
  p.tickets += TICKET_EVENTS[type] || 0;
  p.counts = p.counts || {};
  p.counts[type] = (p.counts[type] || 0) + 1;
  // daily streak: any activity today extends it
  const today = new Date().toDateString();
  if (p.streak.last !== today) {
    const yesterday = new Date(Date.now() - 864e5).toDateString();
    p.streak.count = p.streak.last === yesterday ? p.streak.count + 1 : 1;
    p.streak.last = today;
  }
  // badges
  const has = (b) => p.badges.includes(b);
  const give = (b) => { if (!has(b)) p.badges.push(b); };
  if ((p.counts.open_build || 0) >= 1) give("first-build");
  if ((p.counts.open_build || 0) >= 5) give("builder-5");
  if ((p.counts.ai_design || 0) >= 1) give("inventor");
  if ((p.counts.genie_q || 0) >= 10) give("curious-mind");
  if ((p.counts.vocab_quiz || 0) >= 1) give("word-wizard");
  if ((p.counts.recycled_build || 0) >= 1) give("recycler");
  if ((p.counts.challenge_entry || 0) >= 1) give("challenger");
  if (p.streak.count >= 3) give("streak-3");
  if (p.streak.count >= 7) give("streak-7");
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function handleAccounts(route, payload) {
  cleanSessions();

  if (route === "/api/signup") {
    const name = String(payload.name || "").trim().slice(0, 60);
    const email = String(payload.email || "").trim().toLowerCase();
    const password = String(payload.password || "");
    if (!name) return [400, { error: "Please tell us your name (or a nickname!)." }];
    if (!EMAIL_RE.test(email)) return [400, { error: "That email doesn't look right — check for typos." }];
    if (password.length < 6) return [400, { error: "Password needs at least 6 characters." }];
    if (db.users[email]) return [409, { error: "That email already has an account. Try signing in instead." }];
    const salt = crypto.randomBytes(16).toString("hex");
    const kind = ["me", "child", "parent"].includes(payload.kind) ? payload.kind : "me";
    db.users[email] = {
      name, email, salt, passHash: hashPassword(password, salt),
      plan: { tier: "free" }, builds: [], createdAt: Date.now(),
      kind, age: String(payload.age || "").slice(0, 12),
      settings: {}, progress: { xp: 0, badges: [], streak: { count: 0, last: "" }, tickets: 0 },
    };
    const token = newToken();
    db.sessions[token] = { email, expires: Date.now() + 30 * 864e5 };
    saveDB();
    return [200, { token, user: publicUser(db.users[email]) }];
  }

  if (route === "/api/login") {
    const email = String(payload.email || "").trim().toLowerCase();
    const u = db.users[email];
    if (!u || hashPassword(String(payload.password || ""), u.salt) !== u.passHash)
      return [401, { error: "Wrong email or password." }];
    const token = newToken();
    db.sessions[token] = { email, expires: Date.now() + 30 * 864e5 };
    saveDB();
    return [200, { token, user: publicUser(u) }];
  }

  if (route === "/api/logout") {
    delete db.sessions[payload.token];
    saveDB();
    return [200, { ok: true }];
  }

  const u = userFromToken(payload.token);

  if (route === "/api/me") {
    if (!u) return [401, { error: "Not signed in." }];
    return [200, { user: publicUser(u) }];
  }

  if (route === "/api/plan") {
    if (!u) return [401, { error: "Sign in to change your plan." }];
    const tier = ["free", "premium", "mx"].includes(payload.tier) ? payload.tier : "free";
    u.plan = tier === "free" ? { tier: "free" } : { tier, until: payload.until || Date.now() + 7 * 864e5 };
    saveDB();
    return [200, { user: publicUser(u) }];
  }

  if (route === "/api/builds/save") {
    if (!u) return [401, { error: "Sign in to save builds." }];
    const g = payload.gadget;
    if (!g || !g.name || !g.id) return [400, { error: "No gadget to save." }];
    u.builds = (u.builds || []).filter((b) => b.gadget.id !== g.id); // newest version wins
    u.builds.unshift({ savedAt: Date.now(), gadget: g });
    if (u.builds.length > 30) u.builds.length = 30; // cap per user
    saveDB();
    return [200, { ok: true, buildCount: u.builds.length }];
  }

  if (route === "/api/builds/list") {
    if (!u) return [401, { error: "Sign in to see your builds." }];
    return [200, {
      builds: (u.builds || []).map((b) => ({
        id: b.gadget.id, name: b.gadget.name, savedAt: b.savedAt,
        difficulty: b.gadget.difficulty,
        cost: (b.gadget.parts || []).reduce((s, p) => s + (Number(p.cost) || 0), 0),
      })),
    }];
  }

  if (route === "/api/builds/get") {
    if (!u) return [401, { error: "Sign in first." }];
    const b = (u.builds || []).find((x) => x.gadget.id === payload.id);
    if (!b) return [404, { error: "Build not found." }];
    return [200, { gadget: b.gadget }];
  }

  if (route === "/api/event") {
    if (!u) return [401, { error: "Sign in to earn XP." }];
    awardEvent(u, String(payload.type || ""));
    saveDB();
    return [200, { user: publicUser(u) }];
  }

  if (route === "/api/settings") {
    if (!u) return [401, { error: "Sign in to save settings." }];
    const s = payload.settings || {};
    u.settings = {
      theme: ["light", "dark"].includes(s.theme) ? s.theme : "light",
      cb: !!s.cb, dyslexic: !!s.dyslexic,
    };
    if (payload.age !== undefined) u.age = String(payload.age || "").slice(0, 12);
    saveDB();
    return [200, { user: publicUser(u) }];
  }

  if (route === "/api/challenge/submit") {
    if (!u) return [401, { error: "Sign in to enter the challenge." }];
    const b = (u.builds || []).find((x) => x.gadget.id === payload.buildId);
    if (!b) return [400, { error: "Pick one of your saved builds to enter." }];
    db.challenge = db.challenge || [];
    if (db.challenge.some((c) => c.email === u.email && c.buildId === payload.buildId))
      return [409, { error: "You already entered this build. Enter a different one!" }];
    db.challenge.unshift({
      email: u.email, by: u.name, buildId: payload.buildId,
      project: b.gadget.name, note: String(payload.note || "").slice(0, 200), at: Date.now(),
    });
    if (db.challenge.length > 100) db.challenge.length = 100;
    awardEvent(u, "challenge_entry");
    if (payload.recycled) awardEvent(u, "recycled_build");
    saveDB();
    return [200, { user: publicUser(u) }];
  }

  if (route === "/api/challenge/list") { // public showcase
    return [200, {
      entries: (db.challenge || []).slice(0, 12).map((c) => ({ by: c.by, project: c.project, note: c.note, at: c.at })),
    }];
  }

  return null; // not an accounts route
}

// ---------- Gemini helpers ----------

const GADGET_SCHEMA_HINT = `
Return ONLY valid JSON (no markdown fences) with this exact shape:
{
  "id": "kebab-case-id",
  "name": "Gadget Name",
  "emoji": "one emoji",
  "tagline": "one exciting sentence for a kid",
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "buildTime": "e.g. 45 minutes",
  "ageRange": "e.g. 8-14",
  "model": { "units": "cm", "parts": [
      { "shape": "cylinder"|"box"|"sphere", "name": "part name",
        "size": [/* cylinder:[radius,height], box:[w,h,d], sphere:[radius] */],
        "pos": [x,y,z], "rot": [rxDeg,ryDeg,rzDeg], "color": "#hex", "glow": false }
  ]},
  "parts": [ { "item": "name", "qty": "1", "cost": 3.5, "buy": "search terms for buying", "sustainable": "free/recycled alternative or null" } ],
  "tools": ["scissors", "..."],
  "steps": [ { "title": "Step title", "text": "Clear kid-friendly instructions.", "mentor": "STEM concept explained simply, e.g. how the breadboard conducts electricity." } ],
  "code": { "language": "arduino", "filename": "gadget.ino", "source": "// full working Arduino sketch" },
  "wiring": [ { "from": "Arduino pin 9", "to": "LED + leg (via 220 ohm resistor)", "color": "red", "why": "why this connection matters" } ],
  "howItWorks": "2-3 paragraph plain-language explanation of the science.",
  "sustainability": [ { "instead": "store part", "use": "recycled alternative", "why": "impact" } ],
  "safety": ["short safety rules"]
}
Rules: the "model" must build a recognizable 3D toy-like version of the gadget out of 4-12 primitives,
centered near the origin, sized in cm, y = up. All costs are realistic USD numbers.
Everything must be safe and buildable by a kid with adult supervision: low-voltage electronics only
(batteries, LEDs, small DC motors, Arduino). Never include mains power, blades, projectiles,
chemicals, heat, or anything dangerous — if asked for something unsafe, redesign it as a safe
toy/prop version and say so in the tagline.`;

async function geminiJSON(userText, imageBase64, mimeType) {
  const parts = [{ text: userText }];
  if (imageBase64) parts.push({ inline_data: { mime_type: mimeType || "image/jpeg", data: imageBase64 } });
  const body = {
    contents: [{ parts }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  return JSON.parse(text);
}

async function geminiText(userText, imageBase64, mimeType) {
  const parts = [{ text: userText }];
  if (imageBase64) parts.push({ inline_data: { mime_type: mimeType || "image/jpeg", data: imageBase64 } });
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.6 } }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
}

// ---------- Azure OpenAI helpers (chat completions API) ----------

async function azureChat(userText, imageBase64, mimeType, wantJSON) {
  const content = imageBase64
    ? [
        { type: "text", text: userText },
        { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` } },
      ]
    : userText;
  const body = { messages: [{ role: "user", content }] };
  if (wantJSON) body.response_format = { type: "json_object" };
  // The BSMP endpoint intermittently answers "server is overloaded" — retry a couple times.
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(AZURE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": AZURE_KEY },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    }
    lastErr = new Error(`Azure ${res.status}: ${(await res.text()).slice(0, 300)}`);
    if (res.status < 500 && res.status !== 429) break; // only retry overload/rate-limit errors
    await new Promise((r) => setTimeout(r, 2500 * (attempt + 1)));
  }
  throw lastErr;
}

// ---------- provider-agnostic entry points ----------

function stripFences(text) {
  return text.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
}

async function aiJSON(userText) {
  if (AI_PROVIDER === "azure") return JSON.parse(stripFences(await azureChat(userText, null, null, true)));
  return geminiJSON(userText);
}

async function aiText(userText, imageBase64, mimeType) {
  if (AI_PROVIDER === "azure") return azureChat(userText, imageBase64, mimeType, false);
  return geminiText(userText, imageBase64, mimeType);
}

// ---------- API routes ----------

async function handleApi(req, res, route, payload) {
  if (route === "/api/status") {
    return send(res, 200, { ai: !!AI_PROVIDER, model: AI_MODEL_NAME, accounts: true, persistent: !!redis });
  }

  const account = handleAccounts(route, payload);
  if (account) return send(res, account[0], account[1]);

  if (route === "/api/generate") {
    if (!AI_PROVIDER) return send(res, 200, { demo: true });
    const mxExtra = payload.mx
      ? `\nThis user has the MX plan: make the design EXTRA detailed — 8-10 build steps, a richer
"howItWorks" (4+ paragraphs), more wiring entries with deeper explanations, and a 3D model with
10-12 primitives. Quality over brevity.`
      : "";
    const childExtra = payload.childMode
      ? `\nCHILD MODE is on${payload.age ? ` (the builder is around ${payload.age})` : ""}: use extra
simple words and short sentences, pick the safest possible parts (no cutting tools if avoidable,
prefer tape over hot glue), require an adult for anything even slightly risky, and keep the build
under an hour. Keep the fun high and the difficulty gentle.`
      : "";
    const prompt = `You are Genie, GadgetGenie's AI engineering mentor for kids. A kid wants to build: "${payload.prompt}".
Design a safe, real, buildable DIY version of it.${mxExtra}${childExtra}\n${GADGET_SCHEMA_HINT}`;
    const gadget = await aiJSON(prompt);
    return send(res, 200, { demo: false, gadget });
  }

  if (route === "/api/mentor") {
    if (!AI_PROVIDER) return send(res, 200, { demo: true });
    const prompt = `You are Genie, a friendly STEM mentor for kids aged 8-14. They are building: ${payload.context || "a DIY gadget"}.
Their question: "${payload.question}"
Answer in 2-4 short, encouraging sentences. Explain the science simply with a fun analogy. No markdown.${payload.childMode ? " The kid is young — use extra simple words." : ""}`;
    const answer = await aiText(prompt);
    return send(res, 200, { demo: false, answer });
  }

  if (route === "/api/check-photo") {
    if (!AI_PROVIDER) return send(res, 200, { demo: true });
    const prompt = `You are Genie, a STEM mentor for kids. This photo shows a kid's in-progress build of: ${payload.context || "a DIY gadget"}.
Look carefully at the photo. In 3-5 short sentences: say one thing they did well, spot any mistake
(wrong wiring, missing part, loose connection), and tell them exactly how to fix it. Be encouraging. No markdown.`;
    const answer = await aiText(prompt, payload.image, payload.mimeType);
    return send(res, 200, { demo: false, answer });
  }

  return send(res, 404, { error: "Unknown API route" });
}

function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(body);
}

// ---------- Server ----------

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const route = url.pathname;

  if (route.startsWith("/api/")) {
    if (req.method !== "POST" && route !== "/api/status") return send(res, 405, { error: "POST required" });
    let chunks = [];
    req.on("data", (c) => {
      chunks.push(c);
      if (Buffer.concat(chunks).length > 12 * 1024 * 1024) req.destroy(); // 12 MB cap (photos)
    });
    req.on("end", async () => {
      let payload = {};
      try { payload = chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}; } catch {}
      try {
        await handleApi(req, res, route, payload);
      } catch (err) {
        console.error(`[api] ${route} failed:`, err.message);
        send(res, 500, { error: err.message });
      }
    });
    return;
  }

  // static files
  let filePath = path.join(PUBLIC_DIR, route === "/" ? "index.html" : route);
  if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end(); }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
});

loadDB().then(() => {
  server.listen(PORT, () => {
    console.log(`GadgetGenie running at http://localhost:${PORT}`);
    console.log(AI_PROVIDER ? `AI mode: ${AI_PROVIDER} (${AI_MODEL_NAME})` : "Demo mode: no AI key set — using built-in gadget library (add AZURE_OPENAI_URL/KEY or GEMINI_API_KEY to .env)");
    console.log(redis ? "Accounts: persistent (Redis)" : "Accounts: local file storage (data.json)");
  });
});
