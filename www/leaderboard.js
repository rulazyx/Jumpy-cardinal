// Classement en ligne. Hors ligne, le meilleur score attend dans la sauvegarde (s.unsent) et part à la prochaine connexion.
import { ONLINE } from './online.js';
import { save } from './store.js';

export const enabled = () => !!(ONLINE.url && ONLINE.key);

async function rpc(fn, body) {
  const r = await fetch(`${ONLINE.url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: ONLINE.key, Authorization: `Bearer ${ONLINE.key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout?.(8000),
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(data?.message || `Erreur ${r.status}`);
  return data;
}

// Envoie le pseudo, le meilleur score et le profil (oiseau, cadre, niveau) ; renvoie le rang du joueur. L'erreur « pseudo_pris » remonte telle quelle.
export async function sync(s) {
  if (!enabled() || !s.pseudo) return null;
  const rank = await rpc('jc_sync_player', { p_id: s.playerId, p_secret: s.secret, p_pseudo: s.pseudo, p_score: s.best, p_bird: s.bird, p_frame: s.frame, p_level: s.level });
  s.unsent = null; s.dirty = false; s.rank = rank; save(s);
  return rank;
}
export async function flush(s) { if ((s.unsent != null || s.dirty) && navigator.onLine !== false) { try { await sync(s); } catch { /* on réessaiera */ } } }

export const top = (limit = 50) => rpc('jc_top_scores', { p_limit: limit });

// Signaler un pseudo choquant (masqué du classement après 3 signalements) et effacer ses propres données
export async function report(s, pseudo) {
  if (!s.pseudo) await sync(s).catch(() => {});   // il faut être inscrit au classement pour signaler
  return rpc('jc_report', { p_id: s.playerId, p_secret: s.secret, p_pseudo: pseudo });
}
export const remove = (s) => rpc('jc_delete_player', { p_id: s.playerId, p_secret: s.secret });

// Amis : on les ajoute par pseudo ; la liste renvoyée contient aussi le joueur, classée par record
const me = (s) => ({ p_id: s.playerId, p_secret: s.secret });
export async function friends(s) {
  await flush(s);
  const rows = await rpc('jc_friend_scores', me(s));
  s.friends = rows; save(s);
  return rows;
}
export async function addFriend(s, pseudo) {
  if (s.unsent != null || s.dirty || !s.rank) await sync(s);   // il faut être inscrit au classement
  return rpc('jc_add_friend', { ...me(s), p_pseudo: pseudo });
}
export const removeFriend = (s, pseudo) => rpc('jc_remove_friend', { ...me(s), p_pseudo: pseudo });

// Support et bugs : le message part dans la table jc_feedback
export async function feedback(s, kind, message, contact, info) {
  if (!s.rank) await sync(s);
  return rpc('jc_send_feedback', { ...me(s), p_kind: kind, p_message: message, p_contact: contact || null, p_info: info });
}
