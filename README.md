# Jumpy Cardinal

Un oiseau qui bat des ailes entre des colonnes : touche l'écran (ou Espace / ↑) pour voler. Le score est le nombre de colonnes passées.

Le jeu vient de l'appli de coloc « La Kaz » (dépôt [rulazyx/COLOCATION](https://github.com/rulazyx/COLOCATION), commit `c134f9a`). Ce dépôt en fait une appli pour téléphones et tablettes, qui marche hors ligne.

## Ce que contient l'appli

- **Décors** : 16 décors qui changent à 15, 30, 50, 75, 100, 150, 200, 300, 400, 500, 600, 700, 800, 900 et 1000 colonnes (aube, désert, automne, banquise, aurore boréale, abysses, bonbons, néon, espace, paradis doré…). Chaque nouveau décor atteint rapporte des pièces.
- **Boîte mystère** : même système que La Kaz (150 pièces, un oiseau au hasard parmi ceux qu'on n'a pas, tirage pondéré par rareté). Une boîte gratuite par jour contre une pub.
- **Oiseaux** : les 14 de La Kaz plus 8 nouveaux (Pirate, Père Noël, Zombie, Robot, Astronaute, Fantôme, Licorne, Phénix).
- **Repartir** : une pub permet de repartir au même score, une fois par partie.
- **Défis du jour** : 3 défis tirés chaque jour qui rapportent des pièces, plus un coffre quand les 3 sont réussis.
- **Pseudo et classement mondial** : le meilleur score part en ligne dès qu'il y a du réseau (Supabase, voir plus bas).

Tout est sauvegardé sur l'appareil (`localStorage`), sans compte.

## Fichiers

- `www/` : l'appli web, qui sera embarquée telle quelle dans l'appli Android / iOS.
  - `games/flappy.js` : le jeu (logique, dessin, décors, sons, skins), repris de COLOCATION.
  - `app.js` : menus, pièces, boîte mystère, défis du jour, classement.
  - `store.js` : sauvegarde et règles (défis, boîte).
  - `config.js` : oiseaux, pièces par décor, défis du jour.
  - `fonts/LilitaOne.woff2` : police cartoon du titre (licence SIL OFL), embarquée pour marcher hors ligne.
  - `icons/` : icône de l'appli (l'oiseau de La Kaz sur fond bleu), regénérée par `node tools/icons.cjs`.
  - `ads.js` : pubs récompensées (AdMob dans l'appli, pub simulée de 5 s dans le navigateur).
  - `leaderboard.js` + `online.js` : classement en ligne (désactivé tant que `online.js` est vide).
- `supabase/schema.sql` : base du classement (table `jc_players`, fonctions `jc_sync_player` et `jc_top_scores`, préfixées pour pouvoir partager une base existante).

## Lancer

`npx serve www` puis ouvrir l'adresse affichée (les fichiers sont des modules ES, il faut un petit serveur).

## Classement en ligne

1. Exécuter `supabase/schema.sql` dans un projet Supabase (aujourd’hui : le projet « Coloc », à côté de La Kaz).
2. Mettre l'URL du projet et la clé publique (anon / publishable) dans `www/online.js`.
