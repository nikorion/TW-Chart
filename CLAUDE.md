# TW-Chart — contexte projet pour Claude

## Ce que c'est
Plugin TiddlyWiki (`$:/plugins/nikorion/chart`) qui expose un widget `<$chart>` rendant des graphiques Chart.js. Les données viennent soit d'attributs inline, soit d'un tiddler JSON. Auteur : nikorion.

## Structure
```
src/chart/                  ← sources du plugin (seul dossier à toucher)
  modules/
    chart.widget.js         ← widget principal (<$chart>)
    lang.js                 ← helper de localisation (getString)
    chart.min.js            ← Chart.js minifié — NE PAS MODIFIER
  language/
    en-GB/Translations.multids
    fr-FR/Translations.multids
  macros/
    lingo.tid               ← procédure chart-lingo (i18n wikitext)
  root/
    settings.tid            ← onglet ControlPanel
    readme.tid
    licence.tid
    usage.tid
    tree.tid
  tiddlers/                 ← tiddlers d'exemples d'usage
  assets/
    icon.svg (.meta)
  plugin.info               ← métadonnées du plugin (v0.1.0)

wiki/                       ← wiki TW de développement
  tiddlywiki.info           ← plugins actifs, pluginPath: ../src, targets build
  tiddlers/                 ← tiddlers de config UI + system/$__dev-hmr.tid + system/$__config_SyncFilter.tid

dist/                       ← généré par pnpm build, gitignored
docs/                       ← TW-Chart-Wiki.html standalone
scripts/
  dev.cjs                   ← orchestrateur pnpm dev (résout les ports, spawn nodemon + dev-hmr)
  dev-hmr.cjs               ← serveur SSE de HMR de contenu (reboot/reload sur changement de module)
```

## Build html (docs/) — publishFilter
`--rendertiddler $:/core/save/all` embarque tout le store de tiddlers chargé dans wiki, pas seulement le plugin. La target `html` passe la variable `publishFilter` (mécanisme core du bouton "Download full wiki") en args supplémentaires de `--rendertiddler` pour exclure les tiddlers de dev :
```json
"--rendertiddler", "$:/core/save/all", "TW-Chart-Wiki.html", "text/plain", "",
"publishFilter", "-[[$:/dev/hmr]] -[[$:/config/dev/hmr-port]] -[[$:/config/SyncFilter]] -[[$:/plugins/wikilabs/link-to-tabs]] -[[$:/plugins/kookma/commander]] -[[$:/plugins/oeyoews/tiddlywiki-codemirror-6]]"
```
Le `""` avant `publishFilter` est le slot `template` (inutilisé, à laisser vide sinon les index se décalent). Exclus : les tiddlers de dev du HMR + `link-to-tabs`, `commander`, `codemirror-6` (confort perso, installés dans `wiki/tiddlers/` par glisser-déposé). Gardés : `katex`/`highlight` (plugins officiels TiddlyWiki).

## Workflow dev
```
pnpm install
pnpm lint     # ESLint sur src/chart/modules/*.js (sauf chart.min.js)
pnpm dev      # TW sur :8080 (défaut ; port libre si occupé) + HMR SSE — l'URL est affichée
pnpm build    # génère dist/TW-Chart-Plugin.json + docs/TW-Chart-Wiki.html
```

`pnpm dev` lance `scripts/dev.cjs`, orchestrateur (calqué sur TW-Hover-Tilt, zéro dépendance ajoutée) qui :
1. résout le port TW (défaut **8080**, sinon un port libre aléatoire si 8080 est pris) et le port SSE du HMR (défaut **35730**, même logique) — « move aside » ;
2. écrit le port SSE résolu dans le tiddler git-ignoré `$:/config/dev/hmr-port` (fichier `wiki/tiddlers/$__dev-hmr-port.tid`), lu par le client navigateur ;
3. lance en parallèle (spawn direct, plus de `concurrently`) :
   - **nodemon** → reboote TW **uniquement** sur changement de module JS / `plugin.info` (port injecté via `--exec` ; celui de `nodemon.json` n'est qu'un fallback standalone)
   - **dev-hmr.cjs** → serveur SSE de **HMR de contenu** : les tiddlers `.tid`/`.multids` **et les assets** (`assets/icon.svg` et son `.meta`, tout `.css`/`.json`/image) modifiés sont poussés à chaud (override de shadow en mémoire, état préservé, pas de reload) ; seuls un module `.js` (dont `chart.min.js`) ou `plugin.info` déclenchent reboot + reload complet une fois TW prêt

Le client `$:/dev/hmr` (`wiki/tiddlers/system/$__dev-hmr.tid`) ouvre l'EventSource (port lu dans `$:/config/dev/hmr-port`, fallback 35730). Le garde-fou `$:/config/SyncFilter` (`wiki/tiddlers/system/$__config_SyncFilter.tid`) exclut le préfixe du plugin du sync tiddlyweb pour que les overrides HMR ne soient jamais persistés sur disque. Principe détaillé : `../guides/hmr-tiddlywiki.md`.

## Fichiers de config
- [package.json](package.json) — scripts pnpm, dépendances dev
- [scripts/dev.cjs](scripts/dev.cjs) — orchestrateur `pnpm dev` : résolution des ports (défaut/libre) + spawn nodemon & dev-hmr
- [scripts/dev-hmr.cjs](scripts/dev-hmr.cjs) — serveur SSE de HMR de contenu (+ reboot/reload sur changement de module)
- [nodemon.json](nodemon.json) — watch `src/chart/modules` + `plugin.info` ; port de fallback standalone (`dev.cjs` surcharge le port réel)
- [eslint.config.js](eslint.config.js) — lint ES2021, sourceType "script" (IIFE + require/exports)
- [wiki/tiddlywiki.info](wiki/tiddlywiki.info) — plugins actifs, pluginPath: `../src`

## Architecture du widget (`chart.widget.js`)
Pipeline de rendu :
1. `render()` — crée un `<div>` conteneur + `<canvas>`, insère dans le DOM, diffère `createChart()` de 10 ms via `setTimeout` pour que le canvas soit attaché avant que Chart.js appelle `getBoundingClientRect()`.
2. `execute()` — lit tous les attributs, calcule `dataChanged` (comparaison JSON des anciennes/nouvelles données).
3. `createChart()` — instancie `new Chart(canvas, config)`. Gère le fallback Chart.js (require → window.Chart). Anime le premier rendu, désactive l'animation sur les suivants.
4. `updateChart()` — mute l'instance Chart.js en place (pas de destruction/recréation), appelle `chart.update("active")`.
5. `refresh()` — changements structurels (type, axe, dimensions) → `refreshSelf()` ; changements de données/style → `updateChart()`.
6. `destroy()` — libère l'instance Chart.js et ses event listeners canvas.

### `lang.js`
Même pattern que TW-Math : résout les chaînes traduites depuis les tiddlers `$:/plugins/nikorion/chart/language/<code>/<clé>`. Chaîne de fallback : langue active → en-GB → la clé elle-même.

### Traductions (`language/`)
Les clés disponibles sont dans `Translations.multids`. Ajouter un nouveau fichier `language/<code>/Translations.multids` pour une nouvelle langue ; aucun changement de code nécessaire.

## Attributs du widget `<$chart>`

| Attribut | Type | Défaut | Description |
|----------|------|--------|-------------|
| `type` | string | `bar` | Type de graphique |
| `indexAxis` | string | `""` | `"y"` pour les barres horizontales |
| `width` | string | `600px` | Largeur du conteneur |
| `height` | string | `400px` | Hauteur du conteneur |
| `label` | string | `Data` | Légende du dataset |
| `data` | string | — | Valeurs séparées par des virgules |
| `labels` | string | — | Labels séparés par des virgules |
| `dataTiddler` | string | — | Titre d'un tiddler JSON `{labels, values}` |
| `backgroundColor` | string | `orange` | Couleur de fond des barres/segments |
| `borderColor` | string | `black` | Couleur de bordure |
| `borderWidth` | number | `1` | Épaisseur de bordure en px |

## Conventions
- Tous les modules JS sont des IIFE `(function(){ "use strict"; ... })()` avec `require`/`exports` TiddlyWiki — **pas des ES modules**.
- `chart.min.js` est la bibliothèque Chart.js bundlée manuellement — ne jamais régénérer depuis npm.
- La conf ESLint a `sourceType: "script"` et `no-var: off` pour respecter le style IIFE existant.
- Commentaires en **anglais britannique** (colour, behaviour, initialise…).

## Symlink TIDDLYWIKI_PLUGIN_PATH
Le symlink doit pointer vers `src/chart/` :
```
C:\Users\Nico\tw\plugins\nikorion\chart → D:\projets\devops\tw\plugins\nikorion\TW-Chart\src\chart
```
⚠️ Après la restructuration du projet (plugins/ → src/), recréer le symlink en terminal administrateur :
```powershell
Remove-Item "C:\Users\Nico\tw\plugins\nikorion\chart" -Force
New-Item -ItemType SymbolicLink `
  -Path "C:\Users\Nico\tw\plugins\nikorion\chart" `
  -Target "D:\projets\devops\tw\plugins\nikorion\TW-Chart\src\chart"
```

## Points d'attention Windows
- `pnpm dev` nécessite **deux Ctrl+C** pour quitter (comportement normal sur Windows).
- Voir le CLAUDE.md de TW-Math (`D:\projets\devops\tw\plugins\nikorion\TW-Math\CLAUDE.md`) pour les pièges PowerShell : BOM UTF-8, fins de ligne CRLF, caractères Unicode, etc.
