// Sources des icônes et écrans de lancement natifs (dossier assets/), à partir du même dessin que tools/icons.cjs.
// npm run assets  → ce script, puis @capacitor/assets qui génère toutes les tailles iOS et Android.  (Playwright requis)
const { chromium } = require('playwright');
const fs = require('fs');
const BIRD = '<path d="M8 40q-6-10 0-18 4 10 12 14z" fill="#b91c1c"/><circle cx="40" cy="38" r="26" fill="#ef4444"/><ellipse cx="44" cy="48" rx="16" ry="10" fill="#fecaca"/><ellipse cx="30" cy="40" rx="13" ry="8" transform="rotate(-18 30 40)" fill="#b91c1c"/><circle cx="50" cy="28" r="8" fill="#fff"/><circle cx="52.5" cy="28" r="4" fill="#111"/><path d="M62 33l16 5-16 7z" fill="#f59e0b"/>';
const SKY = '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ad0ff"/><stop offset="1" stop-color="#bfeaff"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><rect width="100%" height="100%" fill="rgba(255,255,255,.28)"/>';
const svg = (size, { sky = true, scale = 0 }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${sky ? SKY : ''}
  ${scale ? `<g transform="translate(${size / 2} ${size / 2}) scale(${scale}) translate(-41 -37)">${BIRD}</g>` : ''}</svg>`;
(async () => {
  fs.mkdirSync('assets', { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage();
  for (const [file, size, opt] of [
    ['icon-only.png', 1024, { scale: 9.8 }],                 // iOS + App Store (1024, sans transparence)
    ['icon-foreground.png', 1024, { sky: false, scale: 6.6 }], // Android adaptative : l'oiseau tient dans la zone sûre
    ['icon-background.png', 1024, { scale: 0 }],
    ['splash.png', 2732, { scale: 10 }],
    ['splash-dark.png', 2732, { scale: 10 }],
  ]) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<body style="margin:0;background:transparent">${svg(size, opt)}</body>`);
    await p.screenshot({ path: `assets/${file}`, omitBackground: !opt.sky && opt.sky !== undefined });
    console.log('✓ assets/' + file);
  }
  // Fiches des stores : icône 512 (Google Play), icône 1024 (App Store) et bannière 1024×500 (Google Play)
  fs.mkdirSync('store', { recursive: true });
  for (const [file, size] of [['store/icone-512.png', 512], ['store/icone-1024.png', 1024]]) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<body style="margin:0">${svg(size, { scale: size / 104.5 })}</body>`);
    await p.screenshot({ path: file }); console.log('✓ ' + file);
  }
  const font = fs.readFileSync('www/fonts/GlacialIndifference-Bold.woff2').toString('base64');
  await p.setViewportSize({ width: 1024, height: 500 });
  await p.setContent(`<style>@font-face{font-family:G;src:url(data:font/woff2;base64,${font})}body{margin:0}
    .b{position:relative;width:1024px;height:500px;overflow:hidden;background:linear-gradient(#7ad0ff,#bfeaff)}
    .t{position:absolute;left:400px;top:150px;font:700 92px/0.95 G;color:#fff;letter-spacing:2px;text-shadow:0 5px 0 rgba(0,40,90,.18)}
    .s{position:absolute;left:404px;top:350px;font:700 30px G;color:#0b4f7a;letter-spacing:1px}
    .h{position:absolute;bottom:-160px;border-radius:50%;background:#9ad1a0}
    .c{position:absolute;background:#fff;border-radius:40px;opacity:.85}</style>
    <div class="b"><div class="c" style="left:620px;top:50px;width:150px;height:46px"></div><div class="c" style="left:80px;top:40px;width:110px;height:36px"></div>
    <div class="h" style="left:-120px;width:620px;height:300px"></div><div class="h" style="left:560px;width:700px;height:260px;background:#86c08f"></div>
    <svg style="position:absolute;left:70px;top:90px" width="300" height="300" viewBox="0 0 82 75">${BIRD}</svg>
    <div class="t">JUMPY<br>CARDINAL</div><div class="s">Vole, débloque, collectionne</div></div>`);
  await p.screenshot({ path: 'store/banniere-google-1024x500.png' }); console.log('✓ store/banniere-google-1024x500.png');
  await b.close();
})();
