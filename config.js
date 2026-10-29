// Réglages de Jumpy Cardinal, repris de config.js du dépôt COLOCATION (seule la partie « oiseaux » est utile au jeu).
// Les oiseaux se gagnent dans les caisses (BIRD_CRATE) ; w = poids de tirage (plus c'est grand, plus c'est fréquent)
export const SHOP = {
  bird: [
    { key: 'bleu',     name: 'Oiseau bleu',   w: 20,  body: '#3b82f6', belly: '#bfdbfe', wing: '#1d4ed8' },
    { key: 'vert',     name: 'Perroquet',     w: 20,  body: '#22c55e', belly: '#bbf7d0', wing: '#15803d' },
    { key: 'rose',     name: 'Flamant',       w: 20,  body: '#f472b6', belly: '#fbcfe8', wing: '#db2777' },
    { key: 'jaune',    name: 'Canari',        w: 20,  body: '#facc15', belly: '#fef9c3', wing: '#ca8a04' },
    { key: 'pigeon',   name: 'Pigeon',        w: 12,  body: '#9aa3ad', belly: '#c8ced5', wing: '#6b7480', acc: 'pigeon' },
    { key: 'canard',   name: 'Canard',        w: 12,  body: '#ffd23f', belly: '#fff1b0', wing: '#e0a800', acc: 'duck' },
    { key: 'lunettes', name: 'Cool',          w: 8,   body: '#ef4444', belly: '#fecaca', wing: '#b91c1c', acc: 'shades' },
    { key: 'clodo',    name: 'Oiseau clodo',  w: 8,   body: '#8a8478', belly: '#b9b2a3', wing: '#5f5a50', acc: 'clodo' },
    { key: 'ptero',    name: 'Ptérodactyl',   w: 5,   body: '#6f8a4a', belly: '#c9d39a', wing: '#4a5f2f', acc: 'ptero' },
    { key: 'ninja',    name: 'Ninja',         w: 2,   body: '#1f2937', belly: '#6b7280', wing: '#111827', acc: 'band' },
    { key: 'chevalier', name: 'Oiseau chevalier', w: 1.5, body: '#8f99a4', belly: '#d7dde3', wing: '#5b6470', acc: 'knight' },
    { key: 'or',       name: 'Oiseau doré',   w: 1,   body: '#fbbf24', belly: '#fef3c7', wing: '#b45309', acc: 'crown' },
    { key: 'arcenciel', name: 'Arc-en-ciel',  w: 1,   body: '#ef4444', belly: '#fff', wing: '#8b5cf6', rainbow: true },
    { key: 'tenebres', name: 'Oiseau des ténèbres', w: 1, body: '#15121c', belly: '#2c2638', wing: '#0b0910', eye: '#ef1d1d', eyeBg: '#1a0000', acc: 'dark' },
  ],
};
export const BIRD_CRATE = { price: 150 };
export const birdRarity = (w) => (w >= 12 ? 'Commun' : w >= 5 ? 'Rare' : w >= 2 ? 'Épique' : 'Légendaire');
