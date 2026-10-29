// Jumpy Cardinal : menus, pièces, boîte mystère, défis du jour et classement autour du jeu (games/flappy.js)
import { mount, birdPreview, STAGE_AT } from './games/flappy.js';
import { logoArt, gIcon } from './gameart.js';
import { SHOP, BIRD_CRATE, birdRarity, STAGE_NAMES, STAGE_COINS, MISSIONS_BONUS } from './config.js';
import * as S from './store.js';
import { showRewarded } from './ads.js';
import * as LB from './leaderboard.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const COIN = '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="#f6b91d" stroke="#9a6209" stroke-width="1.6"/><circle cx="10" cy="10" r="5.4" fill="none" stroke="#fde68a" stroke-width="1.5"/></svg>';
const CRATE = (size = 96) => `<svg viewBox="0 0 96 90" width="${size}" height="${Math.round(size * 0.94)}" aria-hidden="true">
  <ellipse cx="48" cy="84" rx="38" ry="5" fill="rgba(0,0,0,.18)"/>
  <rect x="10" y="26" width="76" height="56" rx="5" fill="#c98a4b" stroke="#4a2c12" stroke-width="3"/>
  <path d="M10 44h76M10 62h76" stroke="#4a2c12" stroke-width="2" opacity=".5"/>
  <rect x="6" y="16" width="84" height="16" rx="4" fill="#e2a35c" stroke="#4a2c12" stroke-width="3"/>
  <path d="M30 26v56M66 26v56" stroke="#4a2c12" stroke-width="2.5" opacity=".6"/>
  <circle cx="48" cy="56" r="15" fill="#ffd23f" stroke="#4a2c12" stroke-width="3"/>
  <path d="M43 51a5.5 5.5 0 1 1 8 5c-2 1.4-3 2.4-3 4.5M48 66.5v.5" fill="none" stroke="#4a2c12" stroke-width="3.4" stroke-linecap="round"/></svg>`;
// Icônes des boutons ronds du menu (même trait que le trophée de La Kaz)
const TROPHY = (size = 30) => `<svg viewBox="0 0 48 48" width="${size}" height="${size}" fill="none" stroke="#9a6a00" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 6h20v12a10 10 0 0 1-20 0z" fill="#facc15"/><path d="M14 10H7c0 7 3 10 8 10M34 10h7c0 7-3 10-8 10"/><path d="M24 28v8"/><path d="M16 42h16v-6H16z" fill="#facc15"/></svg>`;
const DECOR = (size = 30) => `<svg viewBox="0 0 48 48" width="${size}" height="${size}" fill="none" stroke="#1f5d3a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="8" width="38" height="32" rx="6" fill="#7ec8e3" stroke="#2a6f8f"/><circle cx="33" cy="17" r="4" fill="#facc15" stroke="#b7791f"/><path d="M5 34l11-12 9 9 6-6 12 11v-2a6 6 0 0 1-6 6H11a6 6 0 0 1-6-6z" fill="#7bbf59"/></svg>`;
const TARGET = (size = 30) => `<svg viewBox="0 0 48 48" width="${size}" height="${size}" fill="none" stroke="#991b1b" stroke-width="2.2" aria-hidden="true"><circle cx="24" cy="24" r="18" fill="#fff"/><circle cx="24" cy="24" r="12" fill="#ef4444"/><circle cx="24" cy="24" r="6" fill="#fff"/><circle cx="24" cy="24" r="2" fill="#991b1b"/></svg>`;
const RAR_CLS = { 'Commun': 'rar-c', 'Rare': 'rar-r', 'Épique': 'rar-e', 'Légendaire': 'rar-l' };
const imgCache = {};
const birdImg = (k, size) => `<img class="bimg" src="${imgCache[k] ??= birdPreview(k, 160)}" width="${size}" height="${size}" alt="">`;
const reward = (r) => (r.coins ? `+${r.coins} ${COIN}` : '');

const s = S.load();
const root = document.getElementById('game');
const ui = document.getElementById('ui');
let mode = 'home', run = null, sheet = null;

// ---------- Jeu ----------
const game = mount(root, {
  bird: s.bird,
  onFlap() {
    if (mode !== 'play') return false;
    if (!run.started) { run.started = true; S.track(s, 'games', 1); S.save(s); }
    run.flaps++;
    return true;
  },
  onStage(i) {
    const c = STAGE_COINS[i] ?? 0;
    s.coins += c; run.coins += c; S.save(s);
    toast(`<b>${esc(STAGE_NAMES[i])}</b><span>Palier ${STAGE_AT[i]} · +${c} ${COIN}</span>`);
  },
  onOver({ score }) { gameOver(score); },
});
game.pause();

function newRun() { run = { started: false, flaps: 0, coins: 0, counted: 0, adUsed: false, record: false }; }

function play() {
  sheet = null; mode = 'play'; newRun();
  game.restart(); game.resume(); render();
}

function gameOver(score) {
  mode = 'over';
  S.track(s, 'cols', score - run.counted); run.counted = score;
  S.track(s, 'best', score); S.track(s, 'flaps', run.flaps); run.flaps = 0;
  if (score > s.best) { s.best = score; s.unsent = score; run.record = true; }
  S.save(s);
  LB.flush(s);
  render();
}

function revive() {
  run.adUsed = true;
  S.track(s, 'revives', 1); S.save(s);
  mode = 'play'; game.revive(); render();
}

// ---------- Affichage ----------
function topbar() {
  const ms = S.missionsToClaim(s);
  return `<div class="topbar">
    <span class="pill coins">${COIN}<b>${s.coins}</b></span>
    <button class="round" data-a="birds" aria-label="Oiseaux">${birdImg(s.bird, 40)}</button>
    <button class="round" data-a="board" aria-label="Classement">${TROPHY(30)}</button>
    <button class="round" data-a="decors" aria-label="Décors">${DECOR(30)}</button>
    <button class="round" data-a="missions" aria-label="Défis du jour">${TARGET(30)}${ms ? `<i class="dot">${ms}</i>` : ''}</button>
  </div>`;
}

function homeHTML() {
  return `${topbar()}
  <div class="home">
    <div class="logo"><div class="gl-bird">${birdImg(s.bird, 140)}</div><div class="gl-shadow"></div></div>
    <h1>Jumpy Cardinal</h1>
    <p class="best">RECORD : <b>${s.best}</b>${s.rank ? ` · ${s.rank}<sup>e</sup> mondial` : ''}</p>
    <button class="gh-btn go big" data-a="play">${gIcon('play')}Jouer</button>
    <button class="gh-btn big crate" data-a="crate">${CRATE(30)}Boîte mystère${S.cratePool(s).length && s.adBoxDay !== S.dayOf() ? '<i class="dot">1</i>' : ''}</button>
  </div>`;
}

function overHTML() {
  const sc = game.score, canAd = !run.adUsed;
  return `<div class="panel over">
    <h2>${run.record ? 'Nouveau record !' : 'Partie terminée'}</h2>
    <p class="big-score">${sc}</p>
    <p class="sub">Record : ${s.best}${run.coins ? ` · +${run.coins} ${COIN}` : ''}</p>
    ${canAd ? `<button class="gh-btn ad" data-a="rev-ad">▶ Repartir avec une pub</button>` : ''}
    <div class="two"><button class="gh-btn" data-a="play">${gIcon('replay')}Rejouer</button><button class="gh-btn" data-a="home">${gIcon('home')}Menu</button></div>
  </div>`;
}

function sheetHTML() {
  const close = '<button class="x" data-a="close" aria-label="Fermer">✕</button>';
  switch (sheet.type) {
    case 'birds': {
      const all = [{ key: 'cardinal', name: 'Cardinal', w: 99 }, ...SHOP.bird];
      return `<div class="panel">${close}<h2>Oiseaux</h2><p class="sub">${s.owned.length + 1} / ${all.length} débloqués</p><div class="birds">${all.map((b) => {
        const mine = b.key === 'cardinal' || s.owned.includes(b.key), eq = s.bird === b.key;
        return `<button class="bird ${mine ? '' : 'lock'} ${eq ? 'eq' : ''}" ${mine ? `data-a="equip" data-k="${b.key}"` : 'disabled'}>${mine ? birdImg(b.key, 56) : '<span class="q">?</span>'}<small>${mine ? esc(b.name) : '???'}</small>${b.key !== 'cardinal' ? `<span class="rar ${RAR_CLS[birdRarity(b.w)]}">${birdRarity(b.w)}</span>` : ''}${eq ? '<em>Équipé</em>' : ''}</button>`;
      }).join('')}</div></div>`;
    }
    case 'crate': {
      const pool = S.cratePool(s), adOk = pool.length && s.adBoxDay !== S.dayOf();
      if (sheet.phase === 'shake') return `<div class="panel center"><div class="crateshake">${CRATE(150)}</div><p class="sub">Ouverture…</p></div>`;
      if (sheet.phase === 'won') {
        const b = sheet.bird, r = birdRarity(b.w);
        return `<div class="panel center pop"><span class="rar ${RAR_CLS[r]}">${r}</span><div class="bigbird">${birdImg(b.key, 150)}</div><h2>${esc(b.name)}</h2><p class="sub">Nouvel oiseau débloqué !</p>
          <div class="two"><button class="gh-btn go" data-a="equip" data-k="${b.key}">Équiper</button><button class="gh-btn" data-a="crate">Fermer</button></div></div>`;
      }
      return `<div class="panel center">${close}<h2>Boîte mystère</h2>${CRATE(120)}
        <p class="sub">Un oiseau au hasard parmi ceux que tu n'as pas encore. Les oiseaux de couleur sont les plus fréquents.</p>
        ${pool.length ? `<button class="gh-btn go" data-a="crate-buy" ${s.coins >= BIRD_CRATE.price ? '' : 'disabled'}>Ouvrir · ${BIRD_CRATE.price} ${COIN}</button>
        <button class="gh-btn ad" data-a="crate-ad" ${adOk ? '' : 'disabled'}>▶ ${adOk ? 'Boîte gratuite avec une pub' : 'Boîte gratuite : reviens demain'}</button>` : '<p><b>Tous les oiseaux sont débloqués !</b></p>'}
        <p class="hint">Tu as ${s.coins} ${COIN}. Chaque nouveau décor atteint en partie rapporte des pièces.</p></div>`;
    }
    case 'missions': {
      const list = s.missions.list.map((x) => {
        const m = S.missionOf(x.key), p = S.missionProg(s, x.key), done = p >= m.goal;
        return `<div class="mission ${x.claimed ? 'ok' : ''}"><div><b>${esc(m.text)}</b><div class="bar"><i style="width:${(p / m.goal) * 100}%"></i></div><small>${p} / ${m.goal} · ${reward(m.reward)}</small></div>
          ${x.claimed ? '<span class="check">✓</span>' : `<button class="gh-btn mini go" data-a="claim" data-k="${x.key}" ${done ? '' : 'disabled'}>Récupérer</button>`}</div>`;
      }).join('');
      const allOk = s.missions.list.every((x) => x.claimed);
      return `<div class="panel">${close}<h2>Défis du jour</h2><p class="sub">Nouveaux défis chaque jour à minuit.</p>${list}
        <div class="mission bonus"><div><b>Coffre des 3 défis</b><small>${reward(MISSIONS_BONUS)}</small></div>${s.missions.bonus ? '<span class="check">✓</span>' : `<button class="gh-btn mini go" data-a="claim-bonus" ${allOk ? '' : 'disabled'}>Ouvrir</button>`}</div></div>`;
    }
    case 'board': {
      if (!LB.enabled()) return `<div class="panel center">${close}<h2>Classement</h2><p class="sub">Le classement en ligne n'est pas encore branché. Ton meilleur score (${s.best}) est gardé et sera envoyé dès qu'il le sera.</p></div>`;
      const rows = sheet.rows;
      return `<div class="panel">${close}<h2>Classement mondial</h2>${!s.pseudo ? '<p class="hint">Choisis un pseudo pour apparaître dans le classement.</p>' : ''}
        ${rows === undefined ? '<p class="sub">Chargement…</p>' : rows === null ? '<p class="sub">Pas de connexion. Ton score sera envoyé plus tard.</p>'
          : `<ol class="board">${rows.map((r, i) => `<li class="${r.pseudo === s.pseudo ? 'me' : ''}"><span>${i + 1}</span><b>${esc(r.pseudo)}</b><em>${r.best}</em></li>`).join('') || '<p class="sub">Personne encore : à toi !</p>'}</ol>`}
        ${s.rank ? `<p class="sub">Ta place : ${s.rank}<sup>e</sup> · meilleur score ${s.best}</p>` : ''}
        <button class="link" data-a="pseudo">Pseudo : ${esc(s.pseudo || 'à choisir')} · changer</button></div>`;
    }
    case 'decors':
      return `<div class="panel">${close}<h2>Décors</h2><p class="sub">Chaque nouveau décor atteint en partie rapporte des pièces.</p><ol class="decors">${STAGE_NAMES.map((n, i) => `<li class="${s.best >= STAGE_AT[i] ? 'seen' : ''}"><b>${s.best >= STAGE_AT[i] ? esc(n) : '???'}</b><span>${STAGE_AT[i] ? `${STAGE_AT[i]} colonnes · +${STAGE_COINS[i]} ${COIN}` : 'Départ'}</span></li>`).join('')}</ol></div>`;
    case 'pseudo':
      return `<div class="panel center">${s.pseudo ? close : ''}<h2>Ton pseudo</h2><p class="sub">Il s'affiche dans le classement mondial (3 à 16 caractères).</p>
        <form data-f="pseudo"><input name="p" maxlength="16" minlength="3" required pattern="[A-Za-z0-9À-ÿ_ .\\-]{3,16}" value="${esc(s.pseudo)}" placeholder="Pseudo" autocomplete="off">
        ${sheet.err ? `<p class="err">${esc(sheet.err)}</p>` : ''}<button class="gh-btn go">Valider</button></form>
        ${s.pseudo ? '' : '<button class="link" data-a="close">Plus tard</button>'}</div>`;
  }
  return '';
}

function render() {
  root.classList.toggle('dim', mode !== 'play');
  ui.className = `ui m-${mode}`;
  game.menu(mode === 'home');
  let h = mode === 'home' ? homeHTML() : mode === 'over' ? overHTML() : '';
  if (sheet) h += `<div class="sheet">${sheetHTML()}</div>`;
  ui.innerHTML = h;
}

let toastT = 0;
function toast(html) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div'); el.className = 'toast'; el.innerHTML = html; document.body.appendChild(el);
  clearTimeout(toastT); toastT = setTimeout(() => el.remove(), 2600);
}

// ---------- Actions ----------
async function act(a, el) {
  switch (a) {
    case 'play': play(); break;
    case 'home': mode = 'home'; sheet = null; game.restart(); render(); break;
    case 'close': sheet = null; render(); break;
    case 'rev-ad': if (await showRewarded('Regarde la pub pour repartir au même score.')) revive(); break;
    case 'birds': case 'missions': case 'decors': sheet = { type: a }; render(); break;
    case 'crate': sheet = { type: 'crate' }; render(); break;
    case 'pseudo': sheet = { type: 'pseudo' }; render(); ui.querySelector('input')?.focus(); break;
    case 'equip': s.bird = el.dataset.k; S.save(s); game.setBird(s.bird); sheet = { type: 'birds' }; render(); break;
    case 'crate-buy': case 'crate-ad': {
      if (a === 'crate-ad') { if (!await showRewarded('Regarde la pub pour ouvrir une boîte gratuite.')) return; s.adBoxDay = S.dayOf(); }
      const b = S.openCrate(s, { free: a === 'crate-ad' });
      if (!b) return;
      sheet = { type: 'crate', phase: 'shake' }; render();
      setTimeout(() => { sheet = { type: 'crate', phase: 'won', bird: b }; render(); }, 1300);
      break;
    }
    case 'claim': { const r = S.claimMission(s, el.dataset.k); if (r) toast(`<b>Défi réussi</b><span>${reward(r)}</span>`); render(); break; }
    case 'claim-bonus': { const r = S.claimMissionsBonus(s); if (r) toast(`<b>Coffre ouvert</b><span>${reward(r)}</span>`); render(); break; }
    case 'board': {
      sheet = { type: 'board' }; render();
      if (!LB.enabled()) return;
      try { await LB.flush(s); sheet.rows = await LB.top(50); } catch { sheet.rows = null; }
      if (sheet?.type === 'board') render();
      break;
    }
  }
}
ui.addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (b && !b.disabled) act(b.dataset.a, b); });
ui.addEventListener('submit', async (e) => {
  e.preventDefault();
  const p = new FormData(e.target).get('p').toString().trim();
  const old = s.pseudo; s.pseudo = p; S.save(s);
  if (LB.enabled()) {
    try { await LB.sync(s); } catch (err) {
      if (/pseudo_pris/.test(err.message)) { s.pseudo = old; S.save(s); sheet.err = 'Ce pseudo est déjà pris.'; render(); return; }
      s.unsent = s.best;   // hors ligne : on enverra plus tard
    }
  }
  sheet = null; render();
});
window.addEventListener('online', () => LB.flush(s));

// ---------- Démarrage : écran de chargement, puis menu ----------
const splash = document.createElement('div');
splash.className = 'gsplash';
splash.innerHTML = `<div class="gs-art">${logoArt('flappy')}</div><div class="gs-name">Jumpy Cardinal</div><div class="gs-bar"><i></i></div>`;
document.body.appendChild(splash);
setTimeout(() => splash.remove(), 1150);
newRun();
if (!s.pseudo) sheet = { type: 'pseudo' };
render();
game.resume();   // l'oiseau flotte derrière le menu
LB.flush(s);
