// GadgetGenie brand assets — custom stroke icon set + per-gadget illustrations.
// All icons: 24px grid, 1.75px stroke, round caps. Art: 48px grid, 2px stroke.
// Inline SVG inherits currentColor and CSS custom properties, so icons recolor with context.

function svg24(inner) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

const ICONS = {
  logo: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="1" y="1" width="22" height="22" rx="6" fill="var(--blue)"/>
    <path d="M12 5.5l1.2 2.6 2.6 1.2-2.6 1.2L12 13.1l-1.2-2.6-2.6-1.2 2.6-1.2z" fill="#fff"/>
    <path d="M7.5 15.5h9M9 18.5h6" stroke="#fff" stroke-width="1.75" stroke-linecap="round"/>
  </svg>`,
  spark: svg24(`<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M18 16.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>`),
  cube: svg24(`<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12L4 7.5M12 12v9"/>`),
  blueprint: svg24(`<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 16v-4h4v4M14 8h4M14 11h4M7 8h3"/>`),
  guide: svg24(`<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5M9 7h6M9 10h6"/>`),
  cart: svg24(`<path d="M4 5h2l2.2 10.2a1 1 0 001 .8h7.9a1 1 0 001-.8L20 8H7"/><circle cx="10" cy="19.5" r="1.3"/><circle cx="16.5" cy="19.5" r="1.3"/>`),
  plug: svg24(`<path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 01-5 5 5 5 0 01-5-5z"/><path d="M12 16v5"/>`),
  code: svg24(`<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>`),
  flask: svg24(`<path d="M10 3h4M11 3v6l-5.2 8.7A2 2 0 007.5 21h9a2 2 0 001.7-3.3L13 9V3"/><path d="M8.5 15h7"/>`),
  robot: svg24(`<rect x="5" y="8" width="14" height="10" rx="3"/><path d="M12 8V4M12 4h3"/><circle cx="9.5" cy="13" r="1"/><circle cx="14.5" cy="13" r="1"/><path d="M2.5 12v3M21.5 12v3"/>`),
  leaf: svg24(`<path d="M6 15C6 8 12 4 20 4c0 8-4 14-11 14a7 7 0 01-3-3z"/><path d="M4 20c3-5 7-8 11-10"/>`),
  pin: svg24(`<path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>`),
  shield: svg24(`<path d="M12 3l7 2.8v5.4c0 4.5-3 8.2-7 9.8-4-1.6-7-5.3-7-9.8V5.8z"/><path d="M9.2 12l2 2 3.6-3.8"/>`),
  lock: svg24(`<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V7.5a4 4 0 018 0v3"/>`),
  download: svg24(`<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>`),
  offline: svg24(`<path d="M17.5 17.5H7a4 4 0 01-.7-7.9A5.5 5.5 0 0117 8.3a4.3 4.3 0 01.5 9.2z"/><path d="M9.5 13.5l5 0M12 11v5"/>`),
  camera: svg24(`<path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/><circle cx="12" cy="14" r="3.5"/>`),
  wrench: svg24(`<path d="M14.5 6.5a4 4 0 015.2-1.1l-3 3 .9 2.1 2.1.9 3-3a4 4 0 01-5.6 4.6L9 21a2 2 0 01-2.8-2.8l8-8a4 4 0 01.3-3.7z" transform="scale(0.85) translate(1.5 1.5)"/>`),
  alert: svg24(`<path d="M12 4l9 15.5H3z"/><path d="M12 10v4M12 17h.01"/>`),
  grid: svg24(`<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>`),
  controller: svg24(`<path d="M7 8h10a5 5 0 014.9 5.9l-.6 3a2.5 2.5 0 01-4.4 1.1L15 16H9l-1.9 2a2.5 2.5 0 01-4.4-1.1l-.6-3A5 5 0 017 8z"/><path d="M9 11v3M7.5 12.5h3"/><circle cx="16" cy="11.5" r=".9" fill="currentColor" stroke="none"/><circle cx="17.8" cy="13.5" r=".9" fill="currentColor" stroke="none"/>`),
  box: svg24(`<path d="M3.5 8L12 4l8.5 4v8L12 20l-8.5-4z"/><path d="M3.5 8L12 12l8.5-4M12 12v8"/>`),
  bottle: svg24(`<path d="M10 3h4M10.5 3v3.5c0 1 .5 1.5 1 2.5.6 1.2.5 2 .5 3v8.5a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5V12c0-1-.1-1.8.5-3 .5-1 1-1.5 1-2.5V3" transform="translate(2.5 0)"/>`),
  wood: svg24(`<ellipse cx="7" cy="12" rx="3" ry="7"/><path d="M7 5h10c1.7 0 3 3.1 3 7s-1.3 7-3 7H7"/><ellipse cx="7" cy="12" rx="1.2" ry="3"/>`),
  nut: svg24(`<path d="M12 3.5l7.4 4.25v8.5L12 20.5l-7.4-4.25v-8.5z"/><circle cx="12" cy="12" r="3"/>`),
  chip: svg24(`<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 7V4M14 7V4M10 20v-3M14 20v-3M7 10H4M7 14H4M20 10h-3M20 14h-3"/>`),
  check: svg24(`<path d="M5 12.5l4.5 4.5L19 7.5"/>`),
  arrow: svg24(`<path d="M5 12h14M13 6l6 6-6 6"/>`),
  github: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-3.16 19.5c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03a9.56 9.56 0 015 0c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0012 2z"/></svg>`,
};

// Injects icons into <span class="i" data-icon="name"> placeholders.
function mountIcons(root) {
  (root || document).querySelectorAll(".i[data-icon]").forEach((el) => {
    const icon = ICONS[el.dataset.icon];
    if (icon) el.innerHTML = icon;
  });
}

// ---------------------------------------------------------------- gadget illustrations

function art48(inner) {
  return `<svg viewBox="0 0 48 48" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

const GADGET_ART = {
  lightsaber: art48(`
    <path d="M22 27L10 39M12.5 24.5l11 11" stroke="var(--blue)" stroke-width="3" opacity=".25"/>
    <path d="M23 26L38 11" stroke="var(--blue)" stroke-width="4"/>
    <path d="M23 26L38 11" stroke="var(--blue)" stroke-width="1.5" opacity=".4" transform="translate(0 0)"/>
    <rect x="12.6" y="26.6" width="9" height="5" rx="1.5" transform="rotate(-45 17 29)" fill="var(--surface)"/>
    <path d="M11 33l4 4" />
    <circle cx="19.5" cy="26.5" r="1" fill="var(--ink)" stroke="none"/>`),
  flashlight: art48(`
    <path d="M14 18h16l4-6v24l-4-6H14a2 2 0 01-2-2V20a2 2 0 012-2z" fill="var(--surface)"/>
    <path d="M34 12v24" />
    <path d="M38 20l5-2M38 24h5M38 28l5 2" stroke="var(--blue)"/>
    <rect x="18" y="21.5" width="6" height="5" rx="1" stroke="var(--blue)"/>`),
  "mini-fan": art48(`
    <circle cx="24" cy="20" r="3" fill="var(--surface)"/>
    <path d="M24 17c1-6 7-7 9-4-2 1-4 3-5 6M27 21.5c6-1 8 4 6 7-1.5-2-4-3.5-7-3.5M21 21.5c-6-1-8 4-6 7 1.5-2 4-3.5 7-3.5M24 17c-1-6-7-7-9-4 2 1 4 3 5 6" stroke="var(--blue)" fill="var(--surface)"/>
    <path d="M24 23v11M17 40h14M20 40v-3h8v3"/>`),
  "burglar-alarm": art48(`
    <path d="M14 30a10 10 0 0120 0" fill="var(--surface)"/>
    <rect x="10" y="30" width="28" height="6" rx="2" fill="var(--surface)"/>
    <path d="M24 14v-3M13 18l-2.5-2M35 18l2.5-2" stroke="var(--blue)"/>
    <circle cx="24" cy="24" r="2.5" stroke="var(--blue)"/>`),
  "bottle-vacuum": art48(`
    <path d="M16 16c-3 1.5-5 3-5 6v6c0 4 3 7 8 7h10c4 0 7-3 7-7v-5c0-4-3-7-7-7H19z" fill="var(--surface)"/>
    <path d="M11 24h-6M8 20l-3-1.5M8 28l-3 1.5" stroke="var(--blue)"/>
    <circle cx="30" cy="27" r="4"/>
    <path d="M30 23v8M26 27h8" stroke-width="1.5"/>`),
  "bionic-hand": art48(`
    <path d="M16 42V26l-4-5 2.5-2.5L19 23v-9h3v8h2.5v-9h3v9H30v-7h3v8c0 3-1 5-2 7v12" fill="var(--surface)"/>
    <path d="M19 30h11" stroke="var(--blue)" stroke-dasharray="2 3"/>`),
  "bluetooth-car": art48(`
    <path d="M8 30l3-8a3 3 0 012.8-2H30a3 3 0 012.6 1.5L36 27l4 1.5a2 2 0 011.3 1.9V33a1 1 0 01-1 1H8a1 1 0 01-1-1v-2a1 1 0 011-1z" fill="var(--surface)"/>
    <circle cx="15" cy="34" r="3.5" fill="var(--surface)"/><circle cx="34" cy="34" r="3.5" fill="var(--surface)"/>
    <path d="M24 14v-4m0 0c2 0 3.5-1.5 3.5-1.5M24 10c-2 0-3.5-1.5-3.5-1.5" stroke="var(--blue)"/>
    <path d="M17 25h8" stroke="var(--blue)"/>`),
  "propeller-boat": art48(`
    <path d="M8 32h32l-4 6H14z" fill="var(--surface)"/>
    <path d="M6 38c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0 4-1.5 6 0 4 1.5 6 0" stroke="var(--blue)" stroke-width="1.5"/>
    <path d="M30 32V18M30 18l-4-4M30 18l4-4" />
    <circle cx="30" cy="14" r="1.5" stroke="var(--blue)"/>
    <path d="M14 28h10" stroke="var(--blue)"/>`),
  "arcade-game": art48(`
    <path d="M14 8h20v14l-4 4v14H18V26l-4-4z" fill="var(--surface)"/>
    <rect x="19" y="12" width="10" height="7" rx="1" stroke="var(--blue)"/>
    <path d="M21 33v-4M21 29a2 2 0 112.5-2" />
    <circle cx="21" cy="27" r="2" fill="var(--ink)" stroke="none"/>
    <circle cx="28" cy="31" r="1.5" stroke="var(--blue)"/>`),
  default: art48(`
    <path d="M24 10l9.5 5.5v11L24 32l-9.5-5.5v-11z" fill="var(--surface)"/>
    <circle cx="24" cy="21" r="3.5"/>
    <path d="M24 36v4M17 38l-2 3M31 38l2 3" stroke="var(--blue)"/>`),
};

function gadgetArt(g) {
  return GADGET_ART[g && g.id] || GADGET_ART.default;
}
