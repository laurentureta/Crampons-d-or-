# Crampons d'Or

Simulateur de carrière de footballeur pensé pour iPhone. De 14 ans au Ballon d'Or : centre de formation, matchs en direct en 3D, commentaires vocaux, mercato, sélection, vie privée.

**Jouer :** https://laurentureta.github.io/Crampons-d-or-/
Sur iPhone, ouvre le lien dans Safari puis *Partager → Sur l'écran d'accueil* : le jeu s'installe comme une app, marche hors connexion et se met à jour tout seul (un bandeau « Nouvelle version disponible » apparaît quand une mise à jour est prête).

## Organisation du projet

| Dossier / fichier | Rôle |
|---|---|
| `src/` | **Le code source** — c'est ici qu'on modifie le jeu (un fichier par grande partie : simulation, vie, match en direct, commentaires, 3D, sons, écrans…) |
| `assets/foule/` | Ambiances de stade (MP3, licences dans `CREDITS.md`) |
| `assets/sons/` | Bruitages (frappe, poteau, filet, sifflet…), fabriqués sur ElevenLabs |
| `assets/voix/` | Répliques enregistrées des commentateurs et personnages + `index.json` |
| `assets/joueur/` | Le modèle 3D des joueurs (géométrie, textures, squelette) préparé par `tools/joueur3d.py` |
| `assets/stade/` | Les pièces 3D du stade (mâts d'éclairage, sièges, bancs de touche) préparées par `tools/stade3d.py` |
| `assets/decor/` | Les arbres et textures des décors autour du stade, préparés par `tools/decor3d.py` |
| `assets/icones/` | Icônes de l'app |
| `lib/` | Three.js (3D) |
| `tools/build.js` | Fabrique le jeu publié à partir de `src/` et `assets/` |
| `tools/fetch-media.js` | Télécharge les médias déposés dans `media-queue/` (utilisé par le robot) |
| `tools/decouper-voix.py` | Découpe un enregistrement de plusieurs répliques en un fichier par réplique |
| `tools/voix-lots.json` | Les lots de répliques à enregistrer (texte exact, voix, modèle, fait ou non) |
| `tools/supabase.sql` | Tables et fonctions de la sauvegarde en ligne et du classement mondial |
| `index.html`, `jeu.js`, `jeu.css`, `sw.js`, `manifest.webmanifest`, `version.json` | **Fichiers générés** (ne pas modifier à la main) — c'est ce que GitHub Pages publie |
| `tests/` | Tests automatiques (menus, sauvegardes, simulation, match en direct, navigateur) |

## Les robots (GitHub Actions)

- **Construire le jeu** (`.github/workflows/build.yml`) : à chaque modification de `src/`, `assets/`, `tools/` ou `package.json`, il refabrique les fichiers publiés, vérifie que les menus et les sauvegardes marchent, puis enregistre le résultat. GitHub Pages met le site à jour une minute plus tard.
- **Importer les sons et les voix** (`.github/workflows/fetch-media.yml`) : quand une liste `media-queue/*.json` est déposée (`[{ "url": "https://…", "out": "assets/sons/kick.mp3" }]`), il télécharge les fichiers (seulement depuis ElevenLabs / Google Cloud Storage, seulement des fichiers audio, seulement vers `assets/` ou `media-raw/`), refabrique le jeu et enregistre. Le compte rendu est dans `media-queue/journal.txt`.

## Fabriquer et tester sur un ordinateur

```sh
node tools/build.js            # fabrique le jeu (+ versions « un seul fichier » dans dist/)
node tests/menu_test.js        # menus, sauvegardes, import/export
node tests/sim_test.js 1 3     # simulation de saisons (1 carrière, 3 ans)
node tests/online_test.js      # sauvegarde en ligne et classement (faux Supabase)
TEST=1 node tests/serve.js     # sert le vrai site sur http://localhost:8767/
URL=http://localhost:8767/ node tests/browser13.js   # parcours complet dans Chromium (Playwright)
```

`dist/crampons-dor.html` est une version autonome en un seul fichier (sans les bruitages ni les voix enregistrées), pratique à partager.

## Voix enregistrées

Les répliques fixes des commentateurs (sans nom de joueur) sont enregistrées une fois sur ElevenLabs, par lots séparés par `[long pause]` (voir `tools/voix-lots.json`), importées par le robot dans `media-raw/voix/`, puis découpées :

```sh
python3 tools/decouper-voix.py tools/voix-lots.json media-raw/voix
```

Le jeu les joue sans clé ni réseau (option *Voix enregistrées*). Les phrases avec des noms passent par la voix IA si une clé est réglée, sinon par la voix du téléphone.

## En ligne (Supabase)

Projet Supabase **crampons-dor** (région Paris), installé avec `tools/supabase.sql`. L'adresse et la clé **publiable** sont dans `src/online.js` (`ONL.url`, `ONL.key`) : cette clé est publique par nature, elle ne permet que ce que les 4 fonctions SQL autorisent. Les tables elles-mêmes sont fermées (personne ne peut lister les sauvegardes).

Ensuite apparaissent : la sauvegarde en ligne (un code de 12 caractères pour retrouver sa carrière sur un autre téléphone, envoi automatique toutes les 5 minutes) et le classement mondial des carrières (le joueur fictif, aucune donnée personnelle).

## Joueurs en 3D

Les joueurs des matchs en 3D utilisent le modèle **« A footballer 3d model »** par **AP 3d models** ([Sketchfab](https://sketchfab.com/3d-models/a-footballer-3d-model-afd601d0e0ea471f90b26c0d3b6c1cb7)), sous licence [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/). Adaptations : allégé à 35 % des triangles (gltfpack), squelette ramené aux 15 os du jeu, peau cachée sous les vêtements retirée, textures réduites, vêtements recolorés aux couleurs de chaque club.

Pour changer de modèle (un .glb « riggé », squelette type Mixamo) :

```sh
gltfpack -i modele.glb -o leger.glb -si 0.35 -noq -kn -km
python3 tools/joueur3d.py leger.glb --noms modele.glb
node tools/build.js
```

Les 25 joueurs sont dessinés en une seule fois par pièce (instanciation + texture d'os) ; les animations restent celles du jeu (`g3Pose`).

## Stade, filets et caméras en 3D

Les mâts d'éclairage, les sièges des tribunes et les bancs de touche viennent du modèle **« football stade »** par **mohamed ouartassi** ([Sketchfab](https://sketchfab.com/3d-models/football-stade-cda2fcbaefb84fa280a5bf7213c67a71)), sous licence [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/). Le modèle d'origine est un city-stade aux échelles mélangées (900 000 triangles) : `tools/stade3d.py` en extrait seulement ces pièces, les allège (gltfpack) et les ramène à leur taille réelle (60 Ko dans `assets/stade/`) ; le jeu les place lui-même autour du terrain (`src/m3dst.js`) — mâts aux quatre coins, un vrai siège à chaque place des petites tribunes, bancs de touche sous abri. Clôtures, main courante et pare-ballons sont dessinés par le jeu.

```sh
GLTFPACK=chemin/vers/gltfpack python3 tools/stade3d.py football_stade.glb
node tools/build.js
```

Autour du stade (`src/m3ddeco.js`) : un terrain, une route goudronnée avec ses lampadaires (allumés la nuit), un chemin forestier, et une forêt de chênes et de sapins avec du sous-bois (herbes, fougères, buissons). Les chênes viennent de **« Oak trees pack (17var, LODs, seasons) »** par **LOLIPOP** ([Sketchfab](https://sketchfab.com/3d-models/oak-trees-pack-17var-lods-seasons-gameready-a5e4e64f9f1d4089bdcc6170a9333393)), le sapin, le sous-bois et le chemin de **« a forest (3) with a road at night for game »** par **dasy444** ([Sketchfab](https://sketchfab.com/3d-models/a-forest-3-with-a-road-at-night-for-game-61f8c7817fe6457fb26e4814cfc48a3f)), tous deux sous licence [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/). `tools/decor3d.py` en extrait les arbres (versions allégées) et les textures (`assets/decor/`, WebP) ; les chênes changent de feuillage avec la saison du match et tous les feuillages bougent au vent.

```sh
python3 tools/decor3d.py --chenes oak_trees_pack.glb --foret a_forest_with_a_road.glb
```

Les filets de but (`src/m3dnet.js`) sont une toile de nœuds qui ondule : le ballon la creuse, l'onde se propage puis s'amortit, un ballon sur le toit ou dans le petit filet l'enfonce de l'extérieur, et le vent la fait respirer (plus fort sous la pluie). Caméras au choix pendant le match : TV, Large, Tactique, Mon joueur, Derrière le but, Bord du terrain, Drone.

## Pépites et Boutique

Les Pépites se gagnent uniquement en jouant (matchs, buts, passes, notes, trophées, succès, bonus du jour) et n'achètent que du style : crampons, ballons, célébrations et effets de but en 3D, halos, cartes de joueur, thèmes de couleurs (`src/shop.js`). Le porte-monnaie est commun à toutes les carrières et voyage avec les sauvegardes exportées ou en ligne.

## Version

Le numéro de version est dans `package.json` ; il s'affiche en bas du menu principal et dans *Données & crédits*. Chaque nouvelle version change le nom du cache hors connexion, ce qui déclenche le bandeau de mise à jour chez les joueurs.

## Sécurité

Les clés ElevenLabs / OpenAI des joueurs restent dans leur téléphone (stockage local du jeu) : elles ne sont jamais écrites dans ce dépôt. Les médias du dépôt ont été fabriqués une fois et sont servis comme de simples fichiers.
