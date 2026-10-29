// Réglages de Jumpy Cardinal. Les oiseaux viennent de config.js du dépôt COLOCATION, avec 8 nouveaux skins.
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
    { key: 'pirate',   name: 'Pirate',        w: 8,   body: '#ef4444', belly: '#fecaca', wing: '#991b1b', acc: 'pirate' },
    { key: 'noel',     name: 'Père Noël',     w: 8,   body: '#ef4444', belly: '#fff',    wing: '#b91c1c', acc: 'santa' },
    { key: 'zombie',   name: 'Zombie',        w: 5,   body: '#7fa36b', belly: '#b9cfa6', wing: '#4d6b3d', acc: 'zombie' },
    { key: 'robot',    name: 'Robot',         w: 5,   body: '#9ca3af', belly: '#d1d5db', wing: '#6b7280', acc: 'robot' },
    { key: 'astro',    name: 'Astronaute',    w: 5,   body: '#f8fafc', belly: '#e2e8f0', wing: '#94a3b8', acc: 'astro' },
    { key: 'fantome',  name: 'Fantôme',       w: 2,   body: '#eef2ffdd', belly: '#ffffffdd', wing: '#c7d2fecc', acc: 'ghost' },
    { key: 'licorne',  name: 'Licorne',       w: 2,   body: '#fdf2f8', belly: '#fff',    wing: '#f9a8d4', acc: 'unicorn' },
    { key: 'phenix',   name: 'Phénix',        w: 1,   body: '#ea580c', belly: '#fde047', wing: '#b91c1c', acc: 'phoenix' },
    { key: 'tenebres', name: 'Oiseau des ténèbres', w: 1, body: '#15121c', belly: '#2c2638', wing: '#0b0910', eye: '#ef1d1d', eyeBg: '#1a0000', acc: 'dark' },
  ],
};
export const BIRD_CRATE = { price: 150 };
export const birdRarity = (w) => (w >= 12 ? 'Commun' : w >= 5 ? 'Rare' : w >= 2 ? 'Épique' : 'Légendaire');

// Nom des décors et pièces gagnées en atteignant chaque palier (même ordre que STAGE_AT dans games/flappy.js)
export const STAGE_NAMES = ['Prairie', 'Aube rose', 'Désert', 'Soir', 'Automne', 'Crépuscule', 'Nuit', 'Banquise', 'Aurore boréale', 'Monde délabré', 'Enfers', 'Abysses', 'Pays des bonbons', 'Néon', 'Espace', 'Paradis doré'];
export const STAGE_COINS = [0, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 250];

// Défis du jour : 3 tirés au hasard chaque jour ; les 3 réussis = coffre bonus
export const MISSIONS = [
  { key: 'games3',   text: 'Jouer 3 parties',              goal: 3,   stat: 'games',   reward: { coins: 20 } },
  { key: 'games8',   text: 'Jouer 8 parties',              goal: 8,   stat: 'games',   reward: { coins: 50 } },
  { key: 'cols30',   text: 'Passer 30 colonnes au total',  goal: 30,  stat: 'cols',    reward: { coins: 25 } },
  { key: 'cols100',  text: 'Passer 100 colonnes au total', goal: 100, stat: 'cols',    reward: { coins: 50 } },
  { key: 'run15',    text: 'Atteindre 15 en une partie',   goal: 15,  stat: 'best',    reward: { coins: 30 } },
  { key: 'run30',    text: 'Atteindre 30 en une partie',   goal: 30,  stat: 'best',    reward: { coins: 50 } },
  { key: 'run50',    text: 'Atteindre 50 en une partie',   goal: 50,  stat: 'best',    reward: { coins: 80 } },
  { key: 'flaps200', text: 'Battre des ailes 200 fois',    goal: 200, stat: 'flaps',   reward: { coins: 20 } },
  { key: 'box1',     text: 'Ouvrir une boîte mystère',     goal: 1,   stat: 'boxes',   reward: { coins: 40 } },
  { key: 'revive1',  text: 'Repartir une fois',            goal: 1,   stat: 'revives', reward: { coins: 30 } },
];
export const MISSIONS_BONUS = { coins: 100 };
