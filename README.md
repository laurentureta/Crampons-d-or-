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
| `assets/textures/` | Photos libres (Poly Haven, CC0) : ciel des matchs, grain du gazon, prés, route, dalles — téléchargées et réduites par le robot médias |
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
- **Importer les sons et les voix** (`.github/workflows/fetch-media.yml`) : quand une liste `media-queue/*.json` est déposée (`[{ "url": "https://…", "out": "assets/sons/kick.mp3" }]`), il télécharge les fichiers (seulement depuis ElevenLabs / Google Cloud Storage / Poly Haven, seulement des fichiers audio ou des images, seulement vers `assets/` ou `media-raw/`), refabrique le jeu et enregistre. Pour une image, on peut demander de la réduire avant de la ranger (`"resize": "4096x2048!"`, `"crop": "4096x1024+0+0"`, `"quality": 84`) : l'original, souvent énorme, n'entre jamais dans le dépôt. Le compte rendu est dans `media-queue/journal.txt`.

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

Ciel et sols photographiés (`src/m3dgfx.js`, `assets/textures/`) : les matchs de jour ont un vrai ciel à cumulus (« Kloofendal 48d Partly Cloudy (Pure Sky) »), les matchs sous la pluie ou la neige un ciel couvert (« Kloofendal Overcast (Pure Sky) ») ; le soleil de la photo est placé là où se trouve la lumière du jeu, et la brume au loin prend la couleur de son horizon. Le gazon reçoit le grain d'une photo d'herbe (« Leafy Grass »), les prés celui d'une photo aérienne (« Aerial Grass Rock ») teintée selon la saison, la route un enrobé (« Clean Asphalt ») et le parvis des grands stades des dalles (« Concrete Pavement »). Toutes viennent de [Poly Haven](https://polyhaven.com), dans le domaine public ([CC0](https://creativecommons.org/publicdomain/zero/1.0/)). Le jeu en retire les grandes taches de lumière de la prise de vue pour que la répétition ne se voie pas au loin ; tant qu'une photo n'est pas arrivée, le dessin d'origine reste.

Les filets de but (`src/m3dnet.js`) sont une toile de nœuds qui ondule : le ballon la creuse, l'onde se propage puis s'amortit, un ballon sur le toit ou dans le petit filet l'enfonce de l'extérieur, et le vent la fait respirer (plus fort sous la pluie). Caméras au choix pendant le match : TV, Large, Tactique, Mon joueur, Derrière le but, Bord du terrain, Drone.

## Mouvements capturés

Les joueurs 3D bougent avec de la **vraie capture de mouvement** : course, footing, marche, sprint, attente, frappes (pied droit et, en miroir, pied gauche), passe, saut de la tête et célébrations (joie, salto, roue, vrille, danse). Source : la base de capture de mouvement de **Carnegie Mellon University** ([mocap.cs.cmu.edu](http://mocap.cs.cmu.edu)), dans la conversion BVH de Bruce Hahne ([copie GitHub](https://github.com/una-dinosauria/cmu-mocap)), libre d'utilisation y compris dans un jeu. `tools/mocap.py` (avec `tools/bvh.py`) ramène chaque mouvement sur les 15 os du joueur 3D — seules les orientations des os sont gardées, les longueurs restent celles du modèle — extrait une foulée qui boucle pour chaque allure, aligne l'instant de la frappe sur celui du moteur, et écrit `assets/anim/` (anim.json + anim.bin, ~100 Ko). Dans le jeu (`src/m3dmc.js`), l'allure choisit et mélange les foulées (la phase suit la course du joueur), et les gestes capturés remplacent les gestes dessinés ; tacles, plongeons, gardien, touche et contrôles restent dessinés à la main.

```sh
python3 tools/mocap.py chemin/vers/cmu-mocap/data
```

## Moments clés au doigt

En 3D (`src/geste.js`), au moment clé le match se fige et la caméra se place derrière toi : glisse vers le but pour frapper (le ballon part là où le doigt s'arrête, la vitesse du geste donne la puissance, un geste courbé enroule le ballon), glisse vers un coéquipier pour lui passer, coup sec sur le côté quand le cercle devient vert pour dribbler. En défense : glisse vers l'attaquant au bon moment pour tacler. Gardien : glisse du côté du tir quand le cercle touche le ballon. Coups de pied arrêtés : penalty (geste lent et court au centre : Panenka), coup franc direct (c'est toi qui le tires si tu es bon tireur ; enroule par-dessus le mur), corner (tu le tires : envoie le ballon sur une zone ; ou tu montes : choisis ta zone puis saute au bon moment). « Choisir dans la liste » garde l'ancien choix ; l'option *Moments clés au doigt* peut revenir à la liste pour toujours. Le bouton ⏭ pendant le match propose de **simuler la fin du match**.

## Écran d'ouverture

Au lancement (`src/intro.js`), un vrai retourné en photo : un joueur photographié de nuit en plein retourné (photo de **Chaim Weingarten**, [Unsplash](https://unsplash.com/photos/man-performs-acrobatic-kick-with-soccer-ball-on-beach-5WzxI2voAfg)), détouré par le robot médias (`rembg`), posé devant le **Parc des Princes** de nuit vu du bord du terrain (photo de **Chris Kursikowski**, [Unsplash](https://unsplash.com/photos/a-soccer-field-at-night-with-the-lights-on-5IS7UghgoMA)), flouté comme par un objectif. Les deux photos sont sous [licence Unsplash](https://unsplash.com/license) (usage libre). Travelling lent, flashs des photographes dans les tribunes, puis la frappe : le vrai ballon de la photo fonce vers l'objectif et brise la vitre du téléphone — les éclats décalent l'image comme du verre cassé, fissures, flash, écran qui bave — et le titre apparaît derrière la vitre. Tout est dessiné en canvas 2D. `tools/intro_photos.py` prépare les images de `assets/intro/` (joueur sans le ballon, ballon seul, stade flouté, repères dans `intro.json`) à partir des originaux de `media-raw/intro/`.

## Motion design

Tout est dessiné en code (`src/motion.js`), sans vidéo :

- **Habillage télé des matchs** (sur le calque du direct, en 3D comme en 2D) : entrée des équipes avant le coup d'envoi (compétition, écussons, systèmes, les deux onze en cascade, toi en or, « VS », « Coup d'envoi » ; on touche pour passer), bandeau « BUT ! » / « TU MARQUES ! » aux couleurs de l'équipe avec buteur, minute, manière, passeur et tableau d'affichage dont le chiffre bascule, puis le ralenti encadré par un volet de transition.
- **Grands moments de carrière** (plein écran, format story 9:16, on touche pour passer) : annonce de transfert « Here we go » à chaque signature (info mercato, départ → arrivée, montant et salaire qui défilent, tampon « Officiel »), maillot dévoilé qui se retourne avec ton nom et ton numéro, et récap de fin de saison en 8 écrans (matchs, minutes, buts et passes, note moyenne, match de l'année, classement et trophées, cote, affiche finale) **exportable en vidéo** (`MediaRecorder`, MP4 sur iPhone) pour les réseaux.
- **Interface vivante** : l'argent, la note et les Pépites défilent quand ils changent (vert si ça monte, rouge si ça baisse), les jauges se remplissent, le contenu glisse dans le sens de l'onglet choisi, l'icône de l'onglet saute, la cloche sonne à chaque message, les fenêtres d'événement s'ouvrent comme une carte qu'on retourne, la fin de match fait claquer le résultat et monter ta note.

Réglages → *Habillage télé et animations* : tout se désactive, et trois boutons rejouent les grands moments. Les animations respectent le réglage « réduire les animations » de l'iPhone.

**Bande-annonce** (`bande-annonce/crampons-dor-bande-annonce.mp4`, 1080×1920, ~27 s, pour les réseaux) : montée à partir d'images du vrai jeu capturées image par image (ouverture, entrée des équipes, match en 3D, bandeau de but, annonce de transfert, maillot, trophée en 3D, récap de saison), avec la foule et les bruitages du jeu.

## Pépites et Boutique

Les Pépites se gagnent uniquement en jouant (matchs, buts, passes, notes, trophées, succès, bonus du jour) et n'achètent que du style : crampons, ballons, célébrations et effets de but en 3D, halos, cartes de joueur, thèmes de couleurs (`src/shop.js`). Le porte-monnaie est commun à toutes les carrières et voyage avec les sauvegardes exportées ou en ligne.

## Version

Le numéro de version est dans `package.json` ; il s'affiche en bas du menu principal et dans *Données & crédits*. Chaque nouvelle version change le nom du cache hors connexion, ce qui déclenche le bandeau de mise à jour chez les joueurs.

## Sécurité

Les clés ElevenLabs / OpenAI des joueurs restent dans leur téléphone (stockage local du jeu) : elles ne sont jamais écrites dans ce dépôt. Les médias du dépôt ont été fabriqués une fois et sont servis comme de simples fichiers.
