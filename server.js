// GadgetGenie server — zero-dependency Node.js (18+) server.
// Serves the static site and proxies AI calls to Gemini when GEMINI_API_KEY is set.
// Without a key it falls back to the built-in demo gadget library (handled client-side).

const http = require("http");
const fs = require("fs");
const path = require("path");

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
    return send(res, 200, { ai: !!AI_PROVIDER, model: AI_MODEL_NAME });
  }

  if (route === "/api/generate") {
    if (!AI_PROVIDER) return send(res, 200, { demo: true });
    const prompt = `You are GadgetGenie, an AI engineering mentor for kids. A kid wants to build: "${payload.prompt}".
Design a safe, real, buildable DIY version of it.\n${GADGET_SCHEMA_HINT}`;
    const gadget = await aiJSON(prompt);
    return send(res, 200, { demo: false, gadget });
  }

  if (route === "/api/mentor") {
    if (!AI_PROVIDER) return send(res, 200, { demo: true });
    const prompt = `You are a friendly STEM mentor for kids aged 8-14. They are building: ${payload.context || "a DIY gadget"}.
Their question: "${payload.question}"
Answer in 2-4 short, encouraging sentences. Explain the science simply with a fun analogy. No markdown.`;
    const answer = await aiText(prompt);
    return send(res, 200, { demo: false, answer });
  }

  if (route === "/api/check-photo") {
    if (!AI_PROVIDER) return send(res, 200, { demo: true });
    const prompt = `You are a STEM mentor for kids. This photo shows a kid's in-progress build of: ${payload.context || "a DIY gadget"}.
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

server.listen(PORT, () => {
  console.log(`GadgetGenie running at http://localhost:${PORT}`);
  console.log(AI_PROVIDER ? `AI mode: ${AI_PROVIDER} (${AI_MODEL_NAME})` : "Demo mode: no AI key set — using built-in gadget library (add AZURE_OPENAI_URL/KEY or GEMINI_API_KEY to .env)");
});
