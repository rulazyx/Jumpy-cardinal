// Génère les icônes de l appli (oiseau de La Kaz sur fond bleu) : node tools/icons.cjs  (Playwright requis)
const { chromium } = require('playwright');
const BIRD = '<path d="M8 40q-6-10 0-18 4 10 12 14z" fill="#b91c1c"/><circle cx="40" cy="38" r="26" fill="#ef4444"/><ellipse cx="44" cy="48" rx="16" ry="10" fill="#fecaca"/><ellipse cx="30" cy="40" rx="13" ry="8" transform="rotate(-18 30 40)" fill="#b91c1c"/><circle cx="50" cy="28" r="8" fill="#fff"/><circle cx="52.5" cy="28" r="4" fill="#111"/><path d="M62 33l16 5-16 7z" fill="#f59e0b"/>';
// même composition que l'icône de La Kaz (oiseau sur un disque clair), fond bleu de l'écran de chargement
const svg = (birdScale, disc) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ad0ff"/><stop offset="1" stop-color="#bfeaff"/></linearGradient></defs>
  <rect width="512" height="512" fill="url(#g)"/><circle cx="256" cy="256" r="${disc}" fill="rgba(255,255,255,.28)"/>
  <g transform="translate(256 256) scale(${birdScale}) translate(-41 -37)">${BIRD}</g></svg>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 512, height: 512 } });
  for (const [file, size, sc, disc] of [['icon-512.png', 512, 4.9, 236], ['icon-192.png', 192, 4.9, 236], ['apple-touch-icon.png', 180, 4.9, 236], ['icon-maskable-512.png', 512, 3.9, 190]]) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<body style="margin:0">${svg(sc, disc).replace('width="512" height="512"', `width="${size}" height="${size}"`)}</body>`);
    await p.screenshot({ path: `${process.argv[2] || 'www/icons'}/${file}`, omitBackground: false });
  }
  await b.close();
})();
