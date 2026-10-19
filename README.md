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
| `assets/icones/` | Icônes de l'app |
| `lib/` | Three.js (3D) |
| `tools/build.js` | Fabrique le jeu publié à partir de `src/` et `assets/` |
| `tools/fetch-media.js` | Télécharge les médias déposés dans `media-queue/` |
| `index.html`, `jeu.js`, `jeu.css`, `sw.js`, `manifest.webmanifest`, `version.json` | **Fichiers générés** (ne pas modifier à la main) — c'est ce que GitHub Pages publie |
| `tests/` | Tests automatiques (menus, sauvegardes, simulation, match en direct, navigateur) |

## Les robots (GitHub Actions)

- **Construire le jeu** (`.github/workflows/build.yml`) : à chaque modification de `src/`, `assets/`, `tools/` ou `package.json`, il refabrique les fichiers publiés, vérifie que les menus et les sauvegardes marchent, puis enregistre le résultat. GitHub Pages met le site à jour une minute plus tard.
- **Importer les sons et les voix** (`.github/workflows/fetch-media.yml`) : quand une liste `media-queue/*.json` est déposée (`[{ "url": "https://…", "out": "assets/sons/kick.mp3" }]`), il télécharge les fichiers (seulement depuis ElevenLabs / Google Cloud Storage, seulement des fichiers audio, seulement vers `assets/` ou `media-raw/`), refabrique le jeu et enregistre. Le compte rendu est dans `media-queue/journal.txt`.

## Fabriquer et tester sur un ordinateur

```sh
node tools/build.js            # fabrique le jeu (+ versions « un seul fichier » dans dist/)
node tests/menu_test.js        # menus, sauvegardes, import/export
node tests/sim_test.js         # simulation de saisons
TEST=1 node tests/serve.js     # sert le vrai site sur http://localhost:8767/
URL=http://localhost:8767/ node tests/browser13.js   # parcours complet dans Chromium (Playwright)
```

`dist/crampons-dor.html` est une version autonome en un seul fichier (sans les bruitages ni les voix enregistrées), pratique à partager.

## Version

Le numéro de version est dans `package.json` ; il s'affiche en bas du menu principal et dans *Données & crédits*. Chaque nouvelle version change le nom du cache hors connexion, ce qui déclenche le bandeau de mise à jour chez les joueurs.

## Sécurité

Les clés ElevenLabs / OpenAI des joueurs restent dans leur téléphone (stockage local du jeu) : elles ne sont jamais écrites dans ce dépôt. Les médias du dépôt ont été fabriqués une fois et sont servis comme de simples fichiers.
