# Jumpy Cardinal

Un oiseau rouge qui bat des ailes entre des colonnes : touche l'écran (ou Espace / ↑) pour voler. Le score est le nombre de colonnes passées, et le décor change par paliers (soir à 50, crépuscule à 100, nuit à 150, monde délabré à 200, enfers à 250).

Le jeu vient de l'appli de coloc « La Kaz » (dépôt [rulazyx/COLOCATION](https://github.com/rulazyx/COLOCATION), commit `c134f9a`). Ce dépôt en est la version autonome, base de la future appli pour téléphones et tablettes.

## Fichiers

- `games/flappy.js` : le jeu (logique, dessin, sons synthétisés), copié tel quel.
- `gameart.js` : icônes des menus et logo animé, copié tel quel.
- `config.js` : les 14 oiseaux (couleurs, accessoires, rareté) et la caisse mystère, extraits de `config.js` de COLOCATION.
- Écran de chargement animé (oiseau qui sautille, nom du jeu, barre de progression), repris de `openGame` dans `app.js` et des styles `.gsplash` / `.gl-bird`.
- `index.html`, `style.css`, `manifest.webmanifest` : page autonome plein écran, sans compte ni serveur (meilleur score gardé sur l'appareil).
- `icons/` : icônes du cardinal.

Ce qui reste dans COLOCATION car lié aux comptes Supabase : XP, colocoins, défis, classements, boutique et choix de l'oiseau.

## Lancer

Les fichiers sont des modules ES : il faut un petit serveur, par exemple `npx serve .` puis ouvrir l'adresse affichée.
