// Sauvegarde sur l'appareil (localStorage) : tout le jeu marche hors ligne
import { SHOP, BIRD_CRATE, MISSIONS, MISSIONS_BONUS, xpToNext, levelReward } from './config.js';

const KEY = 'jc-save-v1';
const pad = (n) => String(n).padStart(2, '0');
export const dayOf = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const rid = () => (crypto.randomUUID?.() ?? 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => (Math.random() * 16 | 0).toString(16)));

function fresh() {
  return {
    pseudo: '', playerId: rid(), secret: rid() + rid(),
    coins: 0, best: 0, bird: 'cardinal', owned: [], frame: 'simple',
    xp: 0, level: 1,   // niveau du joueur (voir config.js)
    friends: [],       // derniers scores des amis connus, pour l'affichage hors ligne
    adBoxDay: '',
    missions: { day: '', list: [], bonus: false, stats: {} },
    unsent: null,   // meilleur score pas encore envoyé au classement (hors ligne)
  };
}

export const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* stockage plein ou bloqué */ } };
export function load() {
  let s = fresh();
  let old = {};
  try { old = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { /* sauvegarde illisible : on repart de zéro */ }
  if (old.best && old.xp === undefined) { old.xp = old.best * 3; old.level = 1; old.dirty = true; }   // sauvegarde d'avant les niveaux : un peu d'XP selon le record
  s = { ...s, ...old };
  while (s.xp >= xpToNext(s.level)) { s.xp -= xpToNext(s.level); s.level++; }
  rollMissions(s); save(s);
  return s;
}

export function give(s, r = {}) { if (r.coins) s.coins += r.coins; }

// Boîte mystère : un oiseau au hasard parmi ceux qu'on n'a pas encore (tirage pondéré par w)
export const cratePool = (s) => SHOP.bird.filter((b) => !s.owned.includes(b.key));
export function openCrate(s, { free = false } = {}) {
  const pool = cratePool(s);
  if (!pool.length || (!free && s.coins < BIRD_CRATE.price)) return null;
  let r = Math.random() * pool.reduce((t, b) => t + b.w, 0);
  const b = pool.find((x) => (r -= x.w) <= 0) ?? pool[pool.length - 1];
  if (!free) s.coins -= BIRD_CRATE.price;
  s.owned.push(b.key); track(s, 'boxes', 1); save(s);
  return b;
}

// Défis du jour : 3 défis tirés chaque jour. Chaque défi compte sa propre progression depuis qu'il est apparu,
// et un défi récupéré peut être remplacé par un nouveau contre une pub. Le coffre s'ouvre après 3 défis récupérés.
export function rollMissions(s) {
  if (s.missions.day === dayOf()) {
    for (const x of s.missions.list) if (x.p === undefined) { const m = missionOf(x.key); x.p = Math.min(m.goal, s.missions.stats?.[m.stat] ?? 0); }   // ancienne sauvegarde
    s.missions.claims ??= s.missions.list.filter((x) => x.claimed).length;
    return;
  }
  const keys = [...MISSIONS].sort(() => Math.random() - 0.5).slice(0, 3).map((m) => m.key);
  s.missions = { day: dayOf(), list: keys.map((key) => ({ key, claimed: false, p: 0 })), bonus: false, claims: 0, stats: {} };
}
export function track(s, stat, v) {
  rollMissions(s);
  const st = s.missions.stats;
  st[stat] = stat === 'best' ? Math.max(st[stat] ?? 0, v) : (st[stat] ?? 0) + v;
  for (const x of s.missions.list) {
    const m = missionOf(x.key);
    if (m.stat === stat && !x.claimed) x.p = stat === 'best' ? Math.max(x.p, v) : x.p + v;
  }
}
export const missionOf = (key) => MISSIONS.find((m) => m.key === key);
export const missionProg = (s, key) => { const x = s.missions.list.find((y) => y.key === key); return Math.min(missionOf(key).goal, x?.p ?? 0); };
export function claimMission(s, key) {
  const it = s.missions.list.find((x) => x.key === key), m = missionOf(key);
  if (!it || it.claimed || missionProg(s, key) < m.goal) return null;
  it.claimed = true; s.missions.claims++; give(s, m.reward); save(s);
  return m.reward;
}
// Après une pub : le défi récupéré laisse la place à un nouveau défi (différent de ceux affichés)
export function rerollMission(s, key) {
  const i = s.missions.list.findIndex((x) => x.key === key && x.claimed);
  if (i < 0) return null;
  const shown = s.missions.list.map((x) => x.key), pool = MISSIONS.filter((m) => !shown.includes(m.key));
  const m = (pool.length ? pool : MISSIONS)[Math.floor(Math.random() * (pool.length || MISSIONS.length))];
  s.missions.list[i] = { key: m.key, claimed: false, p: 0 }; save(s);
  return m;
}
export function claimMissionsBonus(s) {
  if (s.missions.bonus || s.missions.claims < 3) return null;
  s.missions.bonus = true; give(s, MISSIONS_BONUS); save(s);
  return MISSIONS_BONUS;
}
export const missionsToClaim = (s) => s.missions.list.filter((x) => !x.claimed && missionProg(s, x.key) >= missionOf(x.key).goal).length + (!s.missions.bonus && s.missions.claims >= 3 ? 1 : 0);

// Niveaux : ajoute de l'XP (défi réussi, palier atteint) et renvoie les niveaux gagnés (avec leurs pièces)
export function addXp(s, xp = 0) {
  s.xp += xp;
  const ups = [];
  while (s.xp >= xpToNext(s.level)) {
    s.xp -= xpToNext(s.level); s.level++;
    const r = levelReward(s.level); give(s, r); ups.push({ level: s.level, ...r });
  }
  if (ups.length) s.dirty = true;
  save(s);
  return ups;
}
