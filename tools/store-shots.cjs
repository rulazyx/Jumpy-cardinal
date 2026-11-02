// Captures d'écran des fiches App Store / Google Play, prises sur le vrai jeu (www/) : node tools/store-shots.cjs  (Playwright requis)
// Le jeu est servi tel quel ; seul flappy.js reçoit, en mémoire, un pilote automatique pour que l'oiseau passe les colonnes.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const WWW = path.join(__dirname, '..', 'www'), OUT = path.join(__dirname, '..', 'store', 'captures');
const TYPES = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
const DEVICES = [   // tailles exigées : iPhone 6,9 po (1290×2796), Android téléphone (1080×1920)
  { dir: 'iphone-6.9', w: 430, h: 932, dpr: 3 },
  { dir: 'android', w: 360, h: 640, dpr: 3 },
];
const SAVE = {   // une partie bien avancée, pour montrer les oiseaux, les cadres et les niveaux
  pseudo: '', pseudoAsked: true, coins: 1240, best: 163, bird: 'cardinal', frame: 'simple', xp: 40, level: 9,
  owned: ['bleu', 'vert', 'rose', 'jaune', 'pigeon', 'canard', 'lunettes', 'pirate', 'ninja', 'robot', 'astro', 'or'],
};
const AUTO = `if (window.__auto && g.started && !g.dead) { const p = g.pipes.find((q) => q.x + PIPE_W > BIRD_X - BIRD_R); const ty = p ? p.top + GAP / 2 : H / 2 - 40; g.vy = Math.max(-4, Math.min(4, (ty - g.y) * 0.12)); }
    if (window.__score != null) { g.score = window.__score; g.stageMax = stageOf(g.score); window.__score = null; }
    g.menu = menu; draw(`;
const SCENES = [
  { file: '1-jeu', score: 12 },
  { file: '2-nuit', score: 168 },
  { file: '3-menu', menu: true },
  { file: '4-volcan', score: 528 },
  { file: '5-oiseaux', click: 'wardrobe' },
  { file: '6-boite', click: 'crate' },
  { file: '7-quetes', click: 'quests' },
  { file: '8-aurore', score: 334 },
];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const b = await chromium.launch();
  for (const d of DEVICES) {
    fs.mkdirSync(path.join(OUT, d.dir), { recursive: true });
    for (const sc of SCENES) {
      const ctx = await b.newContext({ viewport: { width: d.w, height: d.h }, deviceScaleFactor: d.dpr, hasTouch: true });
      await ctx.route('**/*', async (route) => {
        const u = new URL(route.request().url());
        if (u.hostname !== 'jc.local') return route.abort();   // hors ligne : pas de classement, pas de pubs
        let f = path.join(WWW, decodeURIComponent(u.pathname === '/' ? '/index.html' : u.pathname));
        if (!fs.existsSync(f)) return route.fulfill({ status: 404, body: '' });
        let body = fs.readFileSync(f);
        if (f.endsWith('flappy.js')) body = body.toString().replace('g.menu = menu; draw(', AUTO);
        route.fulfill({ status: 200, contentType: TYPES[path.extname(f)] || 'application/octet-stream', body });
      });
      await ctx.addInitScript((save) => {
        const today = new Date(), pad = (n) => String(n).padStart(2, '0');
        const day = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
        localStorage.setItem('jc-save-v1', JSON.stringify({ ...save, missions: { day: '', list: [], bonus: false, stats: {} } }));
        localStorage.setItem('jc-mute', '1');
        window.__day = day;
      }, SAVE);
      const p = await ctx.newPage();
      await p.goto('http://jc.local/');
      await wait(500);
      await p.mouse.click(d.w / 2, d.h / 2);   // un toucher passe l'intro
      await wait(2500);
      if (sc.click) { await p.click(`[data-a="${sc.click}"]`, { force: true }); await wait(900); }
      if (sc.score != null) {
        await p.click('[data-a="play"]', { force: true }); await wait(600);
        await p.evaluate((n) => { window.__auto = true; window.__score = n; }, sc.score);
        await p.mouse.click(d.w / 2, d.h * 0.6); await wait(3200);
      }
      await p.screenshot({ path: path.join(OUT, d.dir, `${sc.file}.png`) });
      console.log('✓', d.dir, sc.file);
      await ctx.close();
    }
  }
  await b.close();
})();
