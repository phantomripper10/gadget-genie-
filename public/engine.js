// GadgetGenie engine — turns a gadget's "model spec" (a list of simple 3D primitives)
// into three things: an interactive 3D preview, an engineering blueprint SVG, and an STL file.
// One spec, three outputs — which is also exactly what the AI generates for new gadgets.

// ---------------------------------------------------------------- mesh math

function deg2rad(d) { return (d * Math.PI) / 180; }

// Euler XYZ rotation + translation (matches Three.js default order)
function transformPoint(p, rot, pos) {
  let [x, y, z] = p;
  const [rx, ry, rz] = rot.map(deg2rad);
  // X axis
  let cy = Math.cos(rx), sy = Math.sin(rx);
  [y, z] = [y * cy - z * sy, y * sy + z * cy];
  // Y axis
  cy = Math.cos(ry); sy = Math.sin(ry);
  [x, z] = [x * cy + z * sy, -x * sy + z * cy];
  // Z axis
  cy = Math.cos(rz); sy = Math.sin(rz);
  [x, y] = [x * cy - y * sy, x * sy + y * cy];
  return [x + pos[0], y + pos[1], z + pos[2]];
}

// Tessellate one primitive into triangles (arrays of 3 points), in LOCAL space.
function tessellate(part) {
  const tris = [];
  const quad = (a, b, c, d) => { tris.push([a, b, c], [a, c, d]); };

  if (part.shape === "box") {
    const [w, h, d] = part.size;
    const x = w / 2, y = h / 2, z = d / 2;
    const v = [
      [-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z],
      [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z],
    ];
    quad(v[0], v[3], v[2], v[1]); // back
    quad(v[4], v[5], v[6], v[7]); // front
    quad(v[0], v[1], v[5], v[4]); // bottom
    quad(v[3], v[7], v[6], v[2]); // top
    quad(v[0], v[4], v[7], v[3]); // left
    quad(v[1], v[2], v[6], v[5]); // right
  } else if (part.shape === "cylinder") {
    const [r, h] = part.size;
    const half = h / 2, N = 24;
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
      const x0 = Math.cos(a0) * r, z0 = Math.sin(a0) * r;
      const x1 = Math.cos(a1) * r, z1 = Math.sin(a1) * r;
      quad([x0, -half, z0], [x1, -half, z1], [x1, half, z1], [x0, half, z0]); // side
      tris.push([[0, half, 0], [x0, half, z0], [x1, half, z1]]);   // top cap
      tris.push([[0, -half, 0], [x1, -half, z1], [x0, -half, z0]]); // bottom cap
    }
  } else if (part.shape === "sphere") {
    const r = part.size[0], LAT = 10, LON = 16;
    for (let i = 0; i < LAT; i++) {
      const t0 = (i / LAT) * Math.PI, t1 = ((i + 1) / LAT) * Math.PI;
      for (let j = 0; j < LON; j++) {
        const p0 = (j / LON) * Math.PI * 2, p1 = ((j + 1) / LON) * Math.PI * 2;
        const pt = (t, p) => [r * Math.sin(t) * Math.cos(p), r * Math.cos(t), r * Math.sin(t) * Math.sin(p)];
        quad(pt(t0, p0), pt(t0, p1), pt(t1, p1), pt(t1, p0));
      }
    }
  }
  return tris;
}

// World-space triangles for every part of the model.
function modelTriangles(model) {
  const out = []; // { tri: [p,p,p], part }
  for (const part of model.parts) {
    const rot = part.rot || [0, 0, 0], pos = part.pos || [0, 0, 0];
    for (const tri of tessellate(part)) {
      out.push({ tri: tri.map((p) => transformPoint(p, rot, pos)), part });
    }
  }
  return out;
}

function modelBounds(model) {
  let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const { tri } of modelTriangles(model))
    for (const p of tri)
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i], p[i]);
        max[i] = Math.max(max[i], p[i]);
      }
  return { min, max, size: max.map((m, i) => m - min[i]), center: max.map((m, i) => (m + min[i]) / 2) };
}

// ---------------------------------------------------------------- STL export

function generateSTL(model, name) {
  const lines = [`solid ${name}`];
  for (const { tri } of modelTriangles(model)) {
    const [a, b, c] = tri;
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const len = Math.hypot(...n) || 1;
    n = n.map((x) => x / len);
    lines.push(
      ` facet normal ${n[0].toFixed(4)} ${n[1].toFixed(4)} ${n[2].toFixed(4)}`,
      "  outer loop",
      ...tri.map((p) => `   vertex ${p[0].toFixed(3)} ${p[1].toFixed(3)} ${p[2].toFixed(3)}`),
      "  endloop",
      " endfacet"
    );
  }
  lines.push(`endsolid ${name}`);
  return lines.join("\n");
}

// ---------------------------------------------------------------- blueprint SVG

// 2D convex hull (monotone chain) — gives each part's silhouette in a view.
function convexHull(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  for (const p of pts.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

// project: fn([x,y,z]) -> [u,v] in view plane
function viewSilhouettes(model, project) {
  const byPart = new Map();
  for (const { tri, part } of modelTriangles(model)) {
    if (!byPart.has(part)) byPart.set(part, []);
    const arr = byPart.get(part);
    for (const p of tri) arr.push(project(p));
  }
  return [...byPart.entries()].map(([part, pts]) => ({ part, hull: convexHull(pts) }));
}

function generateBlueprintSVG(gadget) {
  const model = gadget.model;
  const views = [
    { label: "FRONT VIEW", project: (p) => [p[0], -p[1]] },
    { label: "SIDE VIEW", project: (p) => [p[2], -p[1]] },
    { label: "TOP VIEW", project: (p) => [p[0], p[2]] },
  ];

  const W = 1000, H = 640, PAD = 60;
  const cellW = (W - PAD * 2) / 3;

  let shapes = "";
  for (let vi = 0; vi < 3; vi++) {
    const sils = viewSilhouettes(model, views[vi].project);
    // bounds of this view
    let mn = [Infinity, Infinity], mx = [-Infinity, -Infinity];
    for (const s of sils) for (const p of s.hull) {
      mn[0] = Math.min(mn[0], p[0]); mn[1] = Math.min(mn[1], p[1]);
      mx[0] = Math.max(mx[0], p[0]); mx[1] = Math.max(mx[1], p[1]);
    }
    const vw = mx[0] - mn[0] || 1, vh = mx[1] - mn[1] || 1;
    const scale = Math.min((cellW - 70) / vw, (H - 250) / vh);
    const cx = PAD + cellW * vi + cellW / 2, cy = 90 + (H - 250) / 2;
    const tx = (p) => cx + (p[0] - (mn[0] + mx[0]) / 2) * scale;
    const ty = (p) => cy + (p[1] - (mn[1] + mx[1]) / 2) * scale;

    for (const s of sils) {
      const d = s.hull.map((p, i) => `${i ? "L" : "M"}${tx(p).toFixed(1)},${ty(p).toFixed(1)}`).join(" ") + " Z";
      shapes += `<path d="${d}" fill="rgba(255,255,255,0.07)" stroke="#eaf6ff" stroke-width="1.6"/>`;
    }
    // dimension line under the view (real cm from the model)
    const dimY = cy + (vh * scale) / 2 + 26;
    const x0 = tx([mn[0], 0]), x1 = tx([mx[0], 0]);
    shapes += `
      <line x1="${x0}" y1="${dimY}" x2="${x1}" y2="${dimY}" stroke="#9fd8ff" stroke-width="1"/>
      <line x1="${x0}" y1="${dimY - 5}" x2="${x0}" y2="${dimY + 5}" stroke="#9fd8ff" stroke-width="1"/>
      <line x1="${x1}" y1="${dimY - 5}" x2="${x1}" y2="${dimY + 5}" stroke="#9fd8ff" stroke-width="1"/>
      <text x="${(x0 + x1) / 2}" y="${dimY + 16}" text-anchor="middle" fill="#9fd8ff" font-size="12" font-family="monospace">${vw.toFixed(1)} cm</text>
      <text x="${cx}" y="${H - 96}" text-anchor="middle" fill="#cdeaff" font-size="13" font-family="monospace" letter-spacing="2">${views[vi].label}</text>`;
  }

  // grid
  let grid = "";
  for (let x = 0; x <= W; x += 25) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="rgba(255,255,255,0.06)" stroke-width="${x % 100 ? 0.5 : 1}"/>`;
  for (let y = 0; y <= H; y += 25) grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="${y % 100 ? 0.5 : 1}"/>`;

  const today = new Date().toLocaleDateString();
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;border-radius:12px">
    <rect width="${W}" height="${H}" fill="#1268c3"/>
    <rect width="${W}" height="${H}" fill="url(#bpshade)"/>
    <defs><linearGradient id="bpshade" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="rgba(255,255,255,0.10)"/><stop offset="1" stop-color="rgba(0,0,40,0.22)"/>
    </linearGradient></defs>
    ${grid}
    <rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="none" stroke="#eaf6ff" stroke-width="2"/>
    <rect x="22" y="22" width="${W - 44}" height="${H - 44}" fill="none" stroke="rgba(234,246,255,0.5)" stroke-width="0.8"/>
    <text x="${W / 2}" y="58" text-anchor="middle" fill="#ffffff" font-size="24" font-family="monospace" font-weight="bold" letter-spacing="4">${gadget.name.toUpperCase()} — ENGINEERING BLUEPRINT</text>
    ${shapes}
    <g font-family="monospace" fill="#eaf6ff">
      <rect x="${W - 320}" y="${H - 84}" width="292" height="56" fill="rgba(0,20,60,0.35)" stroke="#eaf6ff" stroke-width="1"/>
      <text x="${W - 308}" y="${H - 64}" font-size="11">PROJECT: ${gadget.name.toUpperCase()}</text>
      <text x="${W - 308}" y="${H - 48}" font-size="11">UNITS: CM   SCALE: FIT   REV: A</text>
      <text x="${W - 308}" y="${H - 34}" font-size="11">DRAWN BY: GADGETGENIE AI   DATE: ${today}</text>
    </g>
  </svg>`;
}

// ---------------------------------------------------------------- 3D viewer

let viewer = null; // { renderer, scene, camera, group, raf }

function destroyViewer() {
  if (!viewer) return;
  cancelAnimationFrame(viewer.raf);
  viewer.renderer.dispose();
  viewer.renderer.domElement.remove();
  viewer = null;
}

function buildViewer(container, gadget) {
  destroyViewer();
  container.innerHTML = "";

  if (typeof THREE === "undefined") {
    // offline / CDN blocked — blueprint already covers the visuals
    container.innerHTML = `<div class="viewer-fallback">📐 3D preview needs internet for the first load.<br>Your blueprint below shows every angle!</div>`;
    return;
  }

  const w = container.clientWidth || 600, h = container.clientHeight || 420;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(5, 10, 7);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x88bbff, 0.35);
  rim.position.set(-6, -4, -8);
  scene.add(rim);

  const group = new THREE.Group();
  for (const part of gadget.model.parts) {
    let geo;
    if (part.shape === "box") geo = new THREE.BoxGeometry(...part.size);
    else if (part.shape === "cylinder") geo = new THREE.CylinderGeometry(part.size[0], part.size[0], part.size[1], 32);
    else geo = new THREE.SphereGeometry(part.size[0], 24, 18);
    const mat = new THREE.MeshStandardMaterial({
      color: part.color || "#999999",
      roughness: part.glow ? 0.25 : 0.55,
      metalness: part.glow ? 0.1 : 0.35,
      emissive: part.glow ? new THREE.Color(part.color) : new THREE.Color(0x000000),
      emissiveIntensity: part.glow ? 0.9 : 0,
      transparent: !!part.glow,
      opacity: part.glow ? 0.92 : 1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const rot = part.rot || [0, 0, 0];
    mesh.rotation.set(deg2rad(rot[0]), deg2rad(rot[1]), deg2rad(rot[2]));
    mesh.position.set(...(part.pos || [0, 0, 0]));
    group.add(mesh);
  }
  // center the model
  const b = modelBounds(gadget.model);
  group.position.set(-b.center[0], -b.center[1], -b.center[2]);
  const pivot = new THREE.Group();
  pivot.add(group);
  scene.add(pivot);

  const radius = Math.hypot(...b.size) / 2 || 10;
  const grid = new THREE.GridHelper(radius * 3, 14, 0xbccbe0, 0xdde6f2);
  grid.position.y = -b.size[1] / 2 - 1;
  scene.add(grid);

  const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, radius * 20);
  let dist = radius * 2.6;
  camera.position.set(0, radius * 0.35, dist);
  camera.lookAt(0, 0, 0);

  // drag to rotate, wheel to zoom
  let dragging = false, px = 0, py = 0, autoSpin = true;
  const el = renderer.domElement;
  el.style.touchAction = "none";
  el.addEventListener("pointerdown", (e) => { dragging = true; autoSpin = false; px = e.clientX; py = e.clientY; el.setPointerCapture(e.pointerId); });
  el.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    pivot.rotation.y += (e.clientX - px) * 0.01;
    pivot.rotation.x = Math.max(-1.2, Math.min(1.2, pivot.rotation.x + (e.clientY - py) * 0.008));
    px = e.clientX; py = e.clientY;
  });
  el.addEventListener("pointerup", () => (dragging = false));
  el.addEventListener("wheel", (e) => {
    e.preventDefault();
    dist = Math.max(radius * 1.2, Math.min(radius * 6, dist + e.deltaY * radius * 0.002));
    camera.position.setLength(dist);
  }, { passive: false });

  function frame() {
    if (autoSpin) pivot.rotation.y += 0.006;
    renderer.render(scene, camera);
    viewer.raf = requestAnimationFrame(frame);
  }
  viewer = { renderer, scene, camera, group: pivot, raf: 0 };
  frame();
}
