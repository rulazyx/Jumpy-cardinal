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
  - `moderation.js` : filtre anti-insultes des pseudos (même liste que `jc_bad_pseudo` côté serveur).
  - `confidentialite.html` : politique de confidentialité (à héberger publiquement pour l'App Store).
- `supabase/schema.sql` : base du classement (table `jc_players`, fonctions `jc_sync_player` et `jc_top_scores`, préfixées pour pouvoir partager une base existante).

## Lancer

`npx serve www` puis ouvrir l'adresse affichée (les fichiers sont des modules ES, il faut un petit serveur).

## Classement en ligne

1. Exécuter `supabase/schema.sql` dans un projet Supabase (aujourd’hui : le projet dédié « jumpy-cardinal », région Irlande).
2. Mettre l'URL du projet et la clé publique (anon / publishable) dans `www/online.js`.

## Préparation App Store

- **Pseudos (règle 1.2)** : pseudos insultants refusés dans l'appli et par le serveur (`jc_bad_pseudo`). Toucher un joueur du classement permet de le signaler ou de le masquer pour soi. Après 3 signalements de joueurs différents, il disparaît du classement (il réapparaît s'il change de pseudo).
- **Suppression des données (règle 5.1.1)** : « Supprimer mes données » en bas du menu appelle `jc_delete_player`.
- **Pubs** : au premier lancement natif, `ads.js` affiche le choix RGPD de Google (UMP) puis, sur iOS, la demande de suivi Apple (ATT), avant d'initialiser AdMob. « Choix pour les pubs » rouvre le choix RGPD.
- **Confidentialité** : `www/confidentialite.html`. App Store Connect demande une URL publique (par exemple GitHub Pages sur ce dépôt). Remplacer l'adresse de contact à compléter.
- **Nom** : ne jamais écrire « Flappy » dans le nom, la description ou les mots-clés de la fiche (risque de rejet pour copie, règles 4.1 / 4.3).

### Réglages iOS à ajouter dans `ios/App/App/Info.plist`

- `NSUserTrackingUsageDescription` : « Ton identifiant sert seulement à afficher des pubs plus adaptées. Tu peux refuser, les pubs resteront disponibles. »
- `GADApplicationIdentifier` : l'ID d'appli AdMob (`ca-app-pub-…~…`).
- `SKAdNetworkItems` : la liste fournie par Google dans la doc AdMob iOS.

Le plugin `@capacitor-community/admob` n'accepte pas encore Capacitor 8 : installer Capacitor 7 (`npm i @capacitor/core@7 @capacitor/cli@7 @capacitor/ios@7 @capacitor/android@7`) ou attendre sa mise à jour. Sans le plugin, les pubs restent simulées.
