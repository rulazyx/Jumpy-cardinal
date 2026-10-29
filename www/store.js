// Sauvegarde sur l'appareil (localStorage) : tout le jeu marche hors ligne
import { SHOP, BIRD_CRATE, MISSIONS, MISSIONS_BONUS } from './config.js';

const KEY = 'jc-save-v1';
const pad = (n) => String(n).padStart(2, '0');
export const dayOf = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const rid = () => (crypto.randomUUID?.() ?? 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => (Math.random() * 16 | 0).toString(16)));

function fresh() {
  return {
    pseudo: '', playerId: rid(), secret: rid() + rid(),
    coins: 0, best: 0, bird: 'cardinal', owned: [],
    adBoxDay: '',
    missions: { day: '', list: [], bonus: false, stats: {} },
    unsent: null,   // meilleur score pas encore envoyé au classement (hors ligne)
  };
}

export const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* stockage plein ou bloqué */ } };
export function load() {
  let s = fresh();
  try { s = { ...s, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { /* sauvegarde illisible : on repart de zéro */ }
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

// Défis du jour : 3 défis tirés chaque jour, compteurs remis à zéro
export function rollMissions(s) {
  if (s.missions.day === dayOf()) return;
  const keys = [...MISSIONS].sort(() => Math.random() - 0.5).slice(0, 3).map((m) => m.key);
  s.missions = { day: dayOf(), list: keys.map((key) => ({ key, claimed: false })), bonus: false, stats: {} };
}
export function track(s, stat, v) {
  rollMissions(s);
  const st = s.missions.stats;
  st[stat] = stat === 'best' ? Math.max(st[stat] ?? 0, v) : (st[stat] ?? 0) + v;
}
export const missionOf = (key) => MISSIONS.find((m) => m.key === key);
export const missionProg = (s, key) => { const m = missionOf(key); return Math.min(m.goal, s.missions.stats[m.stat] ?? 0); };
export function claimMission(s, key) {
  const it = s.missions.list.find((x) => x.key === key), m = missionOf(key);
  if (!it || it.claimed || missionProg(s, key) < m.goal) return null;
  it.claimed = true; give(s, m.reward); save(s);
  return m.reward;
}
export function claimMissionsBonus(s) {
  if (s.missions.bonus || !s.missions.list.every((x) => x.claimed)) return null;
  s.missions.bonus = true; give(s, MISSIONS_BONUS); save(s);
  return MISSIONS_BONUS;
}
export const missionsToClaim = (s) => s.missions.list.filter((x) => !x.claimed && missionProg(s, x.key) >= missionOf(x.key).goal).length + (!s.missions.bonus && s.missions.list.every((x) => x.claimed) ? 1 : 0);
