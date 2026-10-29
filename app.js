// Jumpy Cardinal : menus, pièces, boîte mystère, défis du jour et classement autour du jeu (games/flappy.js)
import { mount, birdPreview, STAGE_AT } from './games/flappy.js';
import { logoArt, gIcon } from './gameart.js';
import { SHOP, BIRD_CRATE, birdRarity, STAGE_NAMES, STAGE_COINS, MISSIONS_BONUS, FRAMES, GRADES, gradeOf, xpToNext } from './config.js';
import * as S from './store.js';
import { showRewarded, privacyOptions } from './ads.js';
import { badPseudo } from './moderation.js';
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
const HANGER = (size = 30) => `<svg viewBox="0 0 48 48" width="${size}" height="${size}" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M24 17v-3a4.5 4.5 0 1 0-4.5-4.5" stroke="#6b4a2b" stroke-width="2.6"/><path d="M24 17 5 33a3 3 0 0 0 2 5.3h34A3 3 0 0 0 43 33z" fill="#e2a35c" stroke="#6b4a2b" stroke-width="2.4"/><path d="M10 34h28" stroke="#fde7c3" stroke-width="2.2"/></svg>`;
const FRIENDS = (size = 30) => `<svg viewBox="0 0 48 48" width="${size}" height="${size}" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><circle cx="32" cy="16" r="6.5" fill="#93c5fd" stroke="#1e40af"/><path d="M21 39c0-7 5-12 11-12s11 5 11 12z" fill="#93c5fd" stroke="#1e40af"/><circle cx="17" cy="18" r="7" fill="#fca5a5" stroke="#991b1b"/><path d="M4 41c0-8 6-13 13-13s13 5 13 13z" fill="#fca5a5" stroke="#991b1b"/></svg>`;
const SCROLL = (size = 30) => `<svg viewBox="0 0 48 48" width="${size}" height="${size}" fill="none" stroke="#7c4a12" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8h26a4 4 0 0 1 0 8h-4v22a4 4 0 0 1-4 4H10a4 4 0 0 1 0-8h4V12a4 4 0 0 1 4-4" fill="#fde7b0"/><path d="M14 34h12a4 4 0 0 1-4 8M20 18h8M20 25h8"/><path d="M38 8a4 4 0 0 0-4 4v4" /></svg>`;
const DECOR = (size = 30) => `<svg viewBox="0 0 48 48" width="${size}" height="${size}" fill="none" stroke="#1f5d3a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="8" width="38" height="32" rx="6" fill="#7ec8e3" stroke="#2a6f8f"/><circle cx="33" cy="17" r="4" fill="#facc15" stroke="#b7791f"/><path d="M5 34l11-12 9 9 6-6 12 11v-2a6 6 0 0 1-6 6H11a6 6 0 0 1-6-6z" fill="#7bbf59"/></svg>`;
const TARGET = (size = 30) => `<svg viewBox="0 0 48 48" width="${size}" height="${size}" fill="none" stroke="#991b1b" stroke-width="2.2" aria-hidden="true"><circle cx="24" cy="24" r="18" fill="#fff"/><circle cx="24" cy="24" r="12" fill="#ef4444"/><circle cx="24" cy="24" r="6" fill="#fff"/><circle cx="24" cy="24" r="2" fill="#991b1b"/></svg>`;
const RAR_CLS = { 'Commun': 'rar-c', 'Rare': 'rar-r', 'Épique': 'rar-e', 'Légendaire': 'rar-l' };
const imgCache = {};
const birdImg = (k, size) => `<img class="bimg" src="${imgCache[k] ??= birdPreview(k, 160)}" width="${size}" height="${size}" alt="">`;
// Oiseau dans son cadre (profil, amis, classement) et badge de niveau coloré selon le grade
const avatar = (bird, frame, size) => `<span class="av fr-${esc(frame || 'simple')}" style="--s:${size}px">${birdImg(bird || 'cardinal', Math.round(size * 0.78))}</span>`;
const lvlBadge = (lvl) => `<i class="lvl" style="background:${gradeOf(lvl || 1).color}">${lvl || 1}</i>`;
const tabs = (cur, list) => `<div class="tabs">${list.map(([k, label]) => `<button class="${cur === k ? 'on' : ''}" data-a="tab" data-k="${k}">${label}</button>`).join('')}</div>`;
const SUPPORT_FAQ = [
  ['Ma partie est-elle sauvegardée ?', 'Oui, sur ton téléphone. Pièces, oiseaux, niveau et défis restent même sans connexion. Attention : désinstaller l\'appli les efface.'],
  ['Comment gagner des oiseaux ?', 'Avec la boîte mystère : 150 pièces, ou une boîte gratuite par jour contre une pub.'],
  ['Comment gagner des pièces ?', 'En atteignant de nouveaux décors pendant une partie, en réussissant les défis du jour et en montant de niveau.'],
  ['Comment débloquer des cadres ?', 'En montant de niveau : chaque partie rapporte de l\'XP (1 par colonne passée).'],
  ['Mon score n\'apparaît pas au classement', 'Il part dès que tu as du réseau. Vérifie que tu as choisi un pseudo.'],
];
const reward = (r) => (r.coins ? `+${r.coins} ${COIN}` : '');

const APP_VERSION = '1.0.0';
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

function newRun() { run = { started: false, flaps: 0, coins: 0, counted: 0, xp: 0, adUsed: false, record: false }; }

function play() {
  sheet = null; mode = 'play'; newRun();
  game.restart(); game.resume(); render();
}

function gameOver(score) {
  mode = 'over';
  const ups = S.addXp(s, score - run.counted, !run.adUsed);   // après « repartir », seules les nouvelles colonnes comptent
  run.xp += score - run.counted + (run.adUsed ? 0 : 3);
  S.track(s, 'cols', score - run.counted); run.counted = score;
  S.track(s, 'best', score); S.track(s, 'flaps', run.flaps); run.flaps = 0;
  if (score > s.best) { s.best = score; s.unsent = score; run.record = true; }
  S.save(s);
  LB.flush(s);
  render();
  for (const u of ups) toast(`<b>Niveau ${u.level} !</b><span>${reward(u)}${FRAMES.find((f) => f.lvl === u.level) ? ' · nouveau cadre' : ''}${GRADES.find((g) => g.lvl === u.level) ? ` · grade ${esc(gradeOf(u.level).name)}` : ''}</span>`);
}

function revive() {
  run.adUsed = true;
  S.track(s, 'revives', 1); S.save(s);
  mode = 'play'; game.revive(); render();
}

// ---------- Affichage ----------
function topbar() {
  return `<div class="topbar">
    <span class="pill coins">${COIN}<b>${s.coins}</b></span>
    <button class="round" data-a="wardrobe" aria-label="Oiseaux et cadres">${HANGER(30)}</button>
    <button class="round" data-a="friends" aria-label="Amis">${FRIENDS(30)}</button>
    <button class="round" data-a="board" aria-label="Classement">${TROPHY(30)}</button>
    <button class="round prof" data-a="profile" aria-label="Profil et paramètres">${avatar(s.bird, s.frame, 46)}${lvlBadge(s.level)}</button>
  </div>`;
}

function homeHTML() {
  const ms = S.missionsToClaim(s);
  return `${topbar()}
  <div class="home">
    <div class="logo"><div class="gl-bird">${birdImg(s.bird, 140)}</div><div class="gl-shadow"></div></div>
    <h1>Jumpy Cardinal</h1>
    <p class="best">RECORD : <b>${s.best}</b>${s.rank ? ` · ${s.rank}<sup>e</sup> mondial` : ''}</p>
    <button class="gh-btn go big" data-a="play">${gIcon('play')}Jouer</button>
    <button class="gh-btn big crate" data-a="crate">${CRATE(30)}Boîte mystère${S.cratePool(s).length && s.adBoxDay !== S.dayOf() ? '<i class="dot">1</i>' : ''}</button>
    <button class="gh-btn big crate" data-a="quests">${SCROLL(30)}Quêtes${ms ? `<i class="dot">${ms}</i>` : ''}</button>
  </div>`;
}

function overHTML() {
  const sc = game.score, canAd = !run.adUsed;
  return `<div class="panel over">
    <h2>${run.record ? 'Nouveau record !' : 'Partie terminée'}</h2>
    <p class="big-score">${sc}</p>
    <p class="sub">Record : ${s.best}${run.coins ? ` · +${run.coins} ${COIN}` : ''} · +${run.xp} XP</p>
    ${canAd ? `<button class="gh-btn ad" data-a="rev-ad">▶ Repartir avec une pub</button>` : ''}
    <div class="two"><button class="gh-btn" data-a="play">${gIcon('replay')}Rejouer</button><button class="gh-btn" data-a="home">${gIcon('home')}Menu</button></div>
  </div>`;
}

function sheetHTML() {
  const close = '<button class="x" data-a="close" aria-label="Fermer">✕</button>';
  switch (sheet.type) {
    case 'wardrobe': {
      const tab = sheet.tab ?? 'birds';
      if (tab === 'frames') {
        return `<div class="panel">${close}<h2>Vestiaire</h2>${tabs(tab, [['birds', 'Oiseaux'], ['frames', 'Cadres']])}
          <p class="sub">De nouveaux cadres se débloquent en montant de niveau (tu es niveau ${s.level}).</p><div class="birds">${FRAMES.map((f) => {
          const mine = s.level >= f.lvl, eq = s.frame === f.key;
          return `<button class="bird ${mine ? '' : 'lock'} ${eq ? 'eq' : ''}" ${mine ? `data-a="frame" data-k="${f.key}"` : 'disabled'}>${avatar(s.bird, f.key, 60)}<small>${esc(f.name)}</small>${mine ? '' : `<span class="rar rar-c">Niveau ${f.lvl}</span>`}${eq ? '<em>Équipé</em>' : ''}</button>`;
        }).join('')}</div></div>`;
      }
      const all = [{ key: 'cardinal', name: 'Cardinal', w: 99 }, ...SHOP.bird];
      return `<div class="panel">${close}<h2>Vestiaire</h2>${tabs(tab, [['birds', 'Oiseaux'], ['frames', 'Cadres']])}<p class="sub">${s.owned.length + 1} / ${all.length} oiseaux débloqués</p><div class="birds">${all.map((b) => {
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
    case 'quests': {
      const tab = sheet.tab ?? 'defis';
      if (tab === 'decors') {
        return `<div class="panel">${close}<h2>Quêtes</h2>${tabs(tab, [['defis', 'Défis du jour'], ['decors', 'Décors']])}<p class="sub">Chaque nouveau décor atteint en partie rapporte des pièces.</p><ol class="decors">${STAGE_NAMES.map((n, i) => `<li class="${s.best >= STAGE_AT[i] ? 'seen' : ''}"><b>${s.best >= STAGE_AT[i] ? esc(n) : '???'}</b><span>${STAGE_AT[i] ? `${STAGE_AT[i]} colonnes · +${STAGE_COINS[i]} ${COIN}` : 'Départ'}</span></li>`).join('')}</ol></div>`;
      }
      const list = s.missions.list.map((x) => {
        const m = S.missionOf(x.key), p = S.missionProg(s, x.key), done = p >= m.goal;
        return `<div class="mission ${x.claimed ? 'ok' : ''}"><div><b>${esc(m.text)}</b><div class="bar"><i style="width:${(p / m.goal) * 100}%"></i></div><small>${p} / ${m.goal} · ${reward(m.reward)}</small></div>
          ${x.claimed ? '<span class="check">✓</span>' : `<button class="gh-btn mini go" data-a="claim" data-k="${x.key}" ${done ? '' : 'disabled'}>Récupérer</button>`}</div>`;
      }).join('');
      const allOk = s.missions.list.every((x) => x.claimed);
      return `<div class="panel">${close}<h2>Quêtes</h2>${tabs(tab, [['defis', 'Défis du jour'], ['decors', 'Décors']])}<p class="sub">Nouveaux défis chaque jour à minuit.</p>${list}
        <div class="mission bonus"><div><b>Coffre des 3 défis</b><small>${reward(MISSIONS_BONUS)}</small></div>${s.missions.bonus ? '<span class="check">✓</span>' : `<button class="gh-btn mini go" data-a="claim-bonus" ${allOk ? '' : 'disabled'}>Ouvrir</button>`}</div></div>`;
    }
    case 'profile': {
      const g = gradeOf(s.level), next = GRADES.find((x) => x.lvl > s.level), need = xpToNext(s.level);
      return `<div class="panel center">${close}
        <div class="pf-av">${avatar(s.bird, s.frame, 104)}${lvlBadge(s.level)}</div>
        <h2>${esc(s.pseudo || 'Sans pseudo')}</h2><button class="link" data-a="pseudo">${s.pseudo ? 'Modifier mon pseudo' : 'Choisir un pseudo'}</button>
        <p class="grade" style="color:${g.color}">${esc(g.name)} · niveau ${s.level}</p>
        <div class="xp"><div class="bar"><i style="width:${(s.xp / need) * 100}%"></i></div><small>${s.xp} / ${need} XP${next ? ` · ${esc(next.name)} au niveau ${next.lvl}` : ''}</small></div>
        <div class="stats">
          <button data-a="wardrobe"><small>Oiseau</small><b>${esc(s.bird === 'cardinal' ? 'Cardinal' : SHOP.bird.find((b) => b.key === s.bird)?.name)}</b></button>
          <button data-a="wardrobe" data-k="frames"><small>Cadre</small><b>${esc(FRAMES.find((f) => f.key === s.frame)?.name)}</b></button>
          <div><small>Record</small><b>${s.best}</b></div>
          <div><small>Classement</small><b>${s.rank ? `${s.rank}<sup>e</sup>` : '–'}</b></div>
        </div>
        <div class="two"><button class="gh-btn" data-a="support">Support</button><button class="gh-btn" data-a="feedback" data-k="bug">Signaler un bug</button></div>
        ${privacyLinks()}</div>`;
    }
    case 'support':
      return `<div class="panel">${close}<h2>Support</h2><div class="faq">${SUPPORT_FAQ.map(([q, r]) => `<details><summary>${esc(q)}</summary><p>${esc(r)}</p></details>`).join('')}</div>
        <button class="gh-btn go" data-a="feedback" data-k="support">Écrire au support</button></div>`;
    case 'feedback': {
      const bug = sheet.kind === 'bug';
      if (sheet.done) return `<div class="panel center">${close}<h2>Merci !</h2><p class="sub">${bug ? 'Ton signalement est bien arrivé. On s\'en occupe.' : 'Ton message est bien arrivé.'}</p><button class="gh-btn" data-a="profile">Retour au profil</button></div>`;
      return `<div class="panel">${close}<h2>${bug ? 'Signaler un bug' : 'Écrire au support'}</h2>
        <form data-f="feedback"><textarea name="m" maxlength="2000" minlength="3" required rows="5" placeholder="${bug ? 'Que s\'est-il passé ? Qu\'est-ce que tu faisais juste avant ?' : 'Ton message'}"></textarea>
        ${bug ? '' : '<input name="c" type="email" maxlength="200" placeholder="Ton e-mail, si tu veux une réponse (facultatif)">'}
        ${sheet.err ? `<p class="err">${esc(sheet.err)}</p>` : ''}<button class="gh-btn go">Envoyer</button></form>
        <p class="hint">${bug ? 'Le modèle de ton appareil et la version de l\'appli sont joints pour nous aider.' : 'Pas besoin de compte. Sans e-mail, on ne pourra pas te répondre.'}</p></div>`;
    }
    case 'friends': {
      if (!LB.enabled()) return `<div class="panel center">${close}<h2>Amis</h2><p class="sub">Les amis arrivent bientôt.</p></div>`;
      const rows = sheet.rows ?? s.friends ?? [];
      return `<div class="panel">${close}<h2>Amis</h2>
        ${s.pseudo ? `<form data-f="friend" class="addf"><input name="f" maxlength="16" minlength="3" required placeholder="Pseudo de ton ami" autocomplete="off"><button class="gh-btn go mini">Ajouter</button></form>
        ${sheet.err ? `<p class="err">${esc(sheet.err)}</p>` : ''}` : '<p class="hint">Choisis un pseudo pour ajouter des amis.</p><button class="gh-btn go" data-a="pseudo">Choisir un pseudo</button>'}
        ${sheet.rows === null ? '<p class="sub">Pas de connexion : voici les derniers scores connus.</p>' : sheet.rows === undefined && !rows.length ? '<p class="sub">Chargement…</p>' : ''}
        ${rows.length > 1 ? `<ol class="board">${rows.map((r, i) => boardRow(r, i, 'friends')).join('')}</ol><p class="hint">Touche un ami pour le retirer.</p>`
          : sheet.rows !== undefined ? '<p class="sub">Ajoute tes amis avec leur pseudo pour comparer vos records.</p>' : ''}</div>`;
    }
    case 'board': {
      if (!LB.enabled()) return `<div class="panel center">${close}<h2>Classement</h2><p class="sub">Le classement en ligne n'est pas encore branché. Ton meilleur score (${s.best}) est gardé et sera envoyé dès qu'il le sera.</p></div>`;
      const rows = sheet.rows;
      return `<div class="panel">${close}<h2>Classement mondial</h2>${!s.pseudo ? '<p class="hint">Choisis un pseudo pour apparaître dans le classement.</p>' : ''}
        ${rows === undefined ? '<p class="sub">Chargement…</p>' : rows === null ? '<p class="sub">Pas de connexion. Ton score sera envoyé plus tard.</p>'
          : `<ol class="board">${rows.filter((r) => !(s.blocked ?? []).includes(r.pseudo.toLowerCase())).map((r, i) => boardRow(r, i, 'board')).join('') || '<p class="sub">Personne encore : à toi !</p>'}</ol>
            <p class="hint">Un pseudo choquant ? Touche-le pour le signaler ou le masquer.</p>`}
        ${s.rank ? `<p class="sub">Ta place : ${s.rank}<sup>e</sup> · meilleur score ${s.best}</p>` : ''}
      </div>`;
    }
    case 'player': {
      const r = sheet.row ?? {}, friend = (s.friends ?? []).some((f) => f.pseudo === sheet.pseudo);
      return `<div class="panel center">${close}${r.bird ? `<div class="pf-av">${avatar(r.bird, r.frame, 84)}${lvlBadge(r.level)}</div>` : ''}<h2>${esc(sheet.pseudo)}</h2>
        ${r.level ? `<p class="grade" style="color:${gradeOf(r.level).color}">${esc(gradeOf(r.level).name)} · niveau ${r.level} · record ${r.best}</p>` : ''}
        ${friend ? '<button class="gh-btn" data-a="unfriend">Retirer des amis</button>' : s.pseudo && LB.enabled() ? '<button class="gh-btn go" data-a="addfriend">Ajouter en ami</button>' : ''}
        ${sheet.done ? `<p class="sub">${esc(sheet.done)}</p>` : `<p class="sub">Ce pseudo est insultant ou choquant ?</p>
        <button class="gh-btn go" data-a="report">Signaler ce pseudo</button>
        <button class="gh-btn" data-a="block">Masquer ce joueur</button>
        <p class="hint">Un pseudo signalé par plusieurs joueurs disparaît du classement. Masquer le cache seulement chez toi.</p>`}</div>`;
    }
    case 'delete':
      return `<div class="panel center">${close}<h2>Mes données</h2>
        ${sheet.done ? `<p class="sub">${esc(sheet.done)}</p>` : `<p class="sub">Ton pseudo et ton score seront effacés du classement mondial. Tes pièces et tes oiseaux restent sur ton téléphone.</p>
        ${sheet.err ? `<p class="err">${esc(sheet.err)}</p>` : ''}<button class="gh-btn go" data-a="delete-ok">Supprimer</button><button class="gh-btn" data-a="close">Annuler</button>`}</div>`;
    case 'pseudo':
      return `<div class="panel center">${s.pseudo ? close : ''}<h2>Ton pseudo</h2><p class="sub">Il s'affiche dans le classement mondial (3 à 16 caractères).</p>
        <form data-f="pseudo"><input name="p" maxlength="16" minlength="3" required pattern="[A-Za-z0-9À-ÿ_ .\\-]{3,16}" value="${esc(s.pseudo)}" placeholder="Pseudo" autocomplete="off">
        ${sheet.err ? `<p class="err">${esc(sheet.err)}</p>` : ''}<button class="gh-btn go">Valider</button></form>
        ${s.pseudo ? '' : '<button class="link" data-a="close">Plus tard</button>'}
        ${privacyLinks()}</div>`;
  }
  return '';
}

// Ligne du classement ou de la liste d'amis : rang, oiseau dans son cadre, pseudo, grade, record
function boardRow(r, i, from) {
  const inner = `<span>${i + 1}</span>${r.bird ? avatar(r.bird, r.frame, 34) : ''}<b>${esc(r.pseudo)}${r.level ? `<small style="color:${gradeOf(r.level).color}">${esc(gradeOf(r.level).name)} · niv. ${r.level}</small>` : ''}</b><em>${r.best}</em>`;
  return r.pseudo === s.pseudo ? `<li class="me">${inner}</li>` : `<li><button data-a="player" data-k="${esc(r.pseudo)}" data-i="${i}" data-from="${from}">${inner}</button></li>`;
}

// Liens de confidentialité (classement et pseudo) : politique, choix pour les pubs, suppression des données
function privacyLinks() {
  return `<p class="legal"><a href="confidentialite.html" target="_blank" rel="noopener">Confidentialité</a> · <button class="link" data-a="ads-privacy">Choix pour les pubs</button>${LB.enabled() && s.pseudo ? ' · <button class="link" data-a="delete">Supprimer mes données</button>' : ''}</p>`;
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
    case 'wardrobe': case 'quests': case 'profile': case 'support': sheet = { type: a, tab: el.dataset.k }; render(); break;
    case 'tab': sheet.tab = el.dataset.k; render(); break;
    case 'frame': s.frame = el.dataset.k; s.dirty = true; S.save(s); LB.flush(s); render(); break;
    case 'feedback': sheet = { type: 'feedback', kind: el.dataset.k }; render(); break;
    case 'friends': {
      sheet = { type: 'friends' }; render();
      if (!LB.enabled() || !s.pseudo) return;
      let rows = null; try { rows = await LB.friends(s); } catch { /* hors ligne : on garde les derniers scores connus */ }
      if (sheet?.type === 'friends') { sheet.rows = rows; render(); }
      break;
    }
    case 'addfriend': case 'unfriend': {
      try {
        if (a === 'addfriend') await LB.addFriend(s, sheet.pseudo); else await LB.removeFriend(s, sheet.pseudo);
        await LB.friends(s).catch(() => {});
        sheet.done = a === 'addfriend' ? `${sheet.pseudo} fait partie de tes amis.` : `${sheet.pseudo} ne fait plus partie de tes amis.`;
      } catch { sheet.done = 'Impossible pour le moment. Vérifie ta connexion et réessaie.'; }
      render(); break;
    }
    case 'crate': sheet = { type: 'crate' }; render(); break;
    case 'pseudo': sheet = { type: 'pseudo' }; render(); ui.querySelector('input')?.focus(); break;
    case 'equip': s.bird = el.dataset.k; s.dirty = true; S.save(s); LB.flush(s); game.setBird(s.bird); sheet = { type: 'wardrobe' }; render(); break;
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
    case 'player': {
      const from = el.dataset.from, rows = sheet?.rows ?? (from === 'friends' ? s.friends : null);
      sheet = { type: 'player', pseudo: el.dataset.k, row: rows?.[+el.dataset.i], back: { type: from, rows: sheet?.rows } }; render(); break;
    }
    case 'report': {
      try { await LB.report(s, sheet.pseudo); sheet.done = 'Merci, le pseudo a été signalé.'; }
      catch { sheet.done = 'Signalement impossible pour le moment (pas de connexion ?). Tu peux masquer ce joueur.'; }
      render(); break;
    }
    case 'block': {
      s.blocked = [...new Set([...(s.blocked ?? []), sheet.pseudo.toLowerCase()])]; S.save(s);
      sheet = sheet.back; render(); break;
    }
    case 'ads-privacy': if (!await privacyOptions()) toast('<b>Pubs</b><span>Les choix s\'affichent dans l\'appli installée.</span>'); break;
    case 'delete': sheet = { type: 'delete' }; render(); break;
    case 'delete-ok': {
      try { await LB.remove(s); Object.assign(s, { pseudo: '', rank: null, unsent: null }); S.save(s); sheet.done = 'C\'est fait : tes données ont été effacées du classement.'; }
      catch { sheet.err = 'Impossible pour le moment. Vérifie ta connexion et réessaie.'; }
      render(); break;
    }
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
  const f = e.target.dataset.f, data = new FormData(e.target);
  if (f === 'friend') {
    const p = data.get('f').toString().trim();
    try { await LB.addFriend(s, p); sheet.err = ''; sheet.rows = await LB.friends(s); }
    catch (err) { sheet.err = /joueur_introuvable/.test(err.message) ? 'Aucun joueur avec ce pseudo.' : /trop_amis/.test(err.message) ? 'Tu as déjà 100 amis.' : 'Impossible pour le moment. Vérifie ta connexion.'; }
    render(); return;
  }
  if (f === 'feedback') {
    const btn = e.target.querySelector('button'); btn.disabled = true;
    const info = `v${APP_VERSION} · ${navigator.userAgent.slice(0, 300)} · niveau ${s.level} · record ${s.best}`;
    try { await LB.feedback(s, sheet.kind, data.get('m').toString(), data.get('c')?.toString(), info); sheet.done = true; }
    catch (err) { sheet.err = /trop_messages/.test(err.message) ? 'Tu as déjà envoyé 5 messages aujourd\'hui. Réessaie demain.' : !s.pseudo ? 'Choisis d\'abord un pseudo (dans ton profil).' : 'Envoi impossible. Vérifie ta connexion et réessaie.'; }
    render(); return;
  }
  const p = data.get('p').toString().trim();
  if (badPseudo(p)) { sheet.err = 'Ce pseudo n\'est pas autorisé. Choisis-en un autre.'; render(); return; }
  const old = s.pseudo; s.pseudo = p; S.save(s);
  if (LB.enabled()) {
    try { await LB.sync(s); } catch (err) {
      if (/pseudo_pris/.test(err.message)) { s.pseudo = old; S.save(s); sheet.err = 'Ce pseudo est déjà pris.'; render(); return; }
      if (/pseudo_interdit|pseudo_invalide/.test(err.message)) { s.pseudo = old; S.save(s); sheet.err = 'Ce pseudo n\'est pas autorisé. Choisis-en un autre.'; render(); return; }
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
