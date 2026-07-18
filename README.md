# ⚡ GadgetGenie

**Dream it. Build it.** An AI engineering mentor for kids: type any gadget you can imagine and
get a 3D preview, an engineering blueprint, an STL file, Arduino code, a priced parts list with
buy links, step-by-step build instructions with STEM explanations, sustainable/recycled part
swaps, nearby-store finder, a photo "Mentor Check", and a downloadable offline guide.

## Run it

```
node server.js
```

Then open http://localhost:4180 — no installs, no dependencies (Node 18+).

## Modes

- **Demo mode (default):** works instantly with zero setup using the built-in project library
  (9 full builds: flashlight, burglar alarm, bottle vacuum, bionic hand, lightsaber, desk fan,
  Bluetooth race car, propeller boat, arcade game). Great for demos and offline use.
- **AI mode:** put keys in a `.env` file next to `server.js` and kids can invent *anything*:

```
# Azure OpenAI (chat completions endpoint):
AZURE_OPENAI_URL=https://<resource>.openai.azure.com/openai/deployments/<model>/chat/completions?api-version=...
AZURE_OPENAI_KEY=...
AZURE_OPENAI_MODEL=gpt-5.4-nano

# — or Google Gemini (free key at https://aistudio.google.com/apikey):
GEMINI_API_KEY=...
```

With a key set:
- `/api/generate` — the AI designs a brand-new gadget (full JSON: 3D model, parts, steps, code…)
- `/api/mentor` — real AI answers to any science question
- `/api/check-photo` — AI vision looks at a photo of the kid's build and spots mistakes

## Make it public (deploy)

The app is one dependency-free Node server, so any free Node host works. Easiest path — **Render**:

1. Push this folder to a GitHub repo (the `.gitignore` already keeps your `.env` secret out).
2. On https://render.com → New → Web Service → connect the repo.
   Build command: *(leave empty)* · Start command: `node server.js`
3. In the service's **Environment** tab, add `AZURE_OPENAI_URL`, `AZURE_OPENAI_KEY`,
   `AZURE_OPENAI_MODEL` (never put keys in the code).
4. Deploy — you get a public `https://your-app.onrender.com` URL anyone can open.

Instant temporary sharing from your own PC instead: run the server, then in another terminal
`npx localtunnel --port 4180` — it prints a public URL that works while your PC is on.

## How it works

One JSON "gadget spec" drives everything. The AI (or the demo library) produces a gadget as
structured JSON including a 3D model made of simple primitives (boxes / cylinders / spheres).
`public/engine.js` turns that one spec into:

1. an interactive Three.js 3D preview,
2. a 3-view engineering blueprint (SVG, real dimensions in cm),
3. a downloadable STL file (mesh tessellated from the same primitives).

So every new AI-invented gadget automatically gets all three — nothing is hand-drawn.

## Files

- `server.js` — zero-dependency Node server + Gemini proxy (the API key never reaches the browser)
- `public/index.html / style.css / app.js` — the site
- `public/gadgets.js` — demo gadget library (same schema the AI returns)
- `public/engine.js` — 3D viewer + blueprint generator + STL exporter
