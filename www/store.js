// Sauvegarde sur l'appareil (localStorage) : tout le jeu marche hors ligne
import { SHOP, BIRD_CRATE, LIVES, STREAK, MISSIONS, MISSIONS_BONUS } from './config.js';

const KEY = 'jc-save-v1', H = 3600e3;
const pad = (n) => String(n).padStart(2, '0');
export const dayOf = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayOf(d); };
const rid = () => (crypto.randomUUID?.() ?? 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => (Math.random() * 16 | 0).toString(16)));

function fresh() {
  return {
    pseudo: '', playerId: rid(), secret: rid() + rid(),
    coins: 0, best: 0, bird: 'cardinal', owned: [],
    lives: LIVES.start, livesAt: Date.now(),
    adBoxDay: '', streak: { day: 0, last: '' },
    missions: { day: '', list: [], bonus: false, stats: {} },
    unsent: null,   // meilleur score pas encore envoyé au classement (hors ligne)
  };
}

export const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* stockage plein ou bloqué */ } };
export function load() {
  let s = fresh();
  try { s = { ...s, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { /* sauvegarde illisible : on repart de zéro */ }
  regen(s); rollMissions(s); save(s);
  return s;
}

// Vies : recharge gratuite d'une vie toutes les LIVES.regenH heures, jusqu'à LIVES.regenMax
export function regen(s) {
  const every = LIVES.regenH * H;
  if (s.lives >= LIVES.regenMax) { s.livesAt = Date.now(); return; }
  const n = Math.floor((Date.now() - s.livesAt) / every);
  if (n > 0) { s.lives = Math.min(LIVES.regenMax, s.lives + n); s.livesAt += n * every; }
}
export const nextLifeIn = (s) => (s.lives >= LIVES.regenMax ? 0 : Math.max(0, s.livesAt + LIVES.regenH * H - Date.now()));
export function addLives(s, n) { if (s.lives < LIVES.regenMax && s.lives + n >= LIVES.regenMax) s.livesAt = Date.now(); s.lives = Math.min(LIVES.max, s.lives + n); }
export function give(s, r = {}) { if (r.coins) s.coins += r.coins; if (r.lives) addLives(s, r.lives); }

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

// Bonus de connexion (série de 7 jours)
export const streakReady = (s) => s.streak.last !== dayOf();
export function claimStreak(s) {
  if (!streakReady(s)) return null;
  const day = s.streak.last === yesterday() ? (s.streak.day % STREAK.length) + 1 : 1;
  s.streak = { day, last: dayOf() };
  const r = STREAK[day - 1]; give(s, r); save(s);
  return { day, ...r };
}
export const streakNext = (s) => (s.streak.last === dayOf() || s.streak.last === yesterday() ? s.streak.day % STREAK.length : 0);   // case du prochain bonus (0-6)

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
