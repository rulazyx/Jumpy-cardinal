// Filtre des pseudos (insultes, injures racistes ou sexuelles, en français et en anglais).
// La même liste est vérifiée côté serveur (supabase/schema.sql, jc_bad_pseudo) : ce filtre-ci sert à prévenir le joueur tout de suite.
const ROOTS = [   // refusés n'importe où dans le pseudo (assez longs pour ne pas toucher des mots normaux)
  'connard', 'connasse', 'salope', 'salaud', 'putain', 'encul', 'batard', 'couille', 'gouine', 'negre', 'bougnoul', 'youpin', 'nazi',
  'hitler', 'merde', 'foutre', 'branleur', 'pouffiasse', 'enfoir', 'trouduc', 'zizi', 'penis', 'vagin', 'porno', 'tapette', 'fdp',
  'fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'nigger', 'nigga', 'faggot', 'whore', 'slut', 'porn', 'asshole', 'bastard',
];
const WORDS = ['con', 'cul', 'pd', 'pede', 'pute', 'bite', 'viol', 'nique', 'niquer', 'ntm', 'tg', 'chatte', 'negro', 'catin',
  'fag', 'sex', 'cock', 'rape', 'retard', 'kys'];   // contenus dans des mots normaux (technique, violet, computer…) : refusés seulement comme mot entier

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', '@': 'a', $: 's', '!': 'i', '|': 'i' };
export const normalize = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[0134578@$!|]/g, (c) => LEET[c]);

export function badPseudo(p) {
  const n = normalize(p), flat = n.replace(/[^a-z]/g, '').replace(/(.)\1+/g, '$1');   // « s.a.l.o.p.e », « saaalope » → « salope »
  if (ROOTS.some((r) => flat.includes(r.replace(/(.)\1+/g, '$1')))) return true;
  return n.split(/[^a-z]+/).some((w) => WORDS.includes(w));
}
