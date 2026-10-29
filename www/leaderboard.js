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

// Envoie le pseudo et le meilleur score ; renvoie le rang du joueur. L'erreur « pseudo_pris » remonte telle quelle.
export async function sync(s) {
  if (!enabled() || !s.pseudo) return null;
  const rank = await rpc('sync_player', { p_id: s.playerId, p_secret: s.secret, p_pseudo: s.pseudo, p_score: s.best });
  s.unsent = null; s.rank = rank; save(s);
  return rank;
}
export async function flush(s) { if (s.unsent != null && navigator.onLine !== false) { try { await sync(s); } catch { /* on réessaiera */ } } }

export const top = (limit = 50) => rpc('top_scores', { p_limit: limit });
