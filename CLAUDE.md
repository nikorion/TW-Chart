# TW-Chart — contexte projet pour Claude

> **Avant toute tâche sur ce plugin, consulter d'abord le `CLAUDE.md` du workspace** (`../CLAUDE.md`) et ses `guides/` : outillage de dev commun (pnpm, `dev.cjs`/HMR, Ctrl+C, git push), pièges PowerShell/Windows, `publishFilter`, conventions modules JS, symlink. Ci-dessous : uniquement le spécifique à TW-Chart.

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
  tiddlywiki.info           ← plugins actifs, targets build
  tiddlers/                 ← tiddlers de config UI + system/$__config_SyncFilter.tid

dist/                       ← généré par pnpm build, gitignored
docs/                       ← démo générée par `pnpm build` (`index.html` + moteur externe), gitignorée, publiée par la CI
```

## Spécificités dev
- `pnpm build` → `dist/TW-Chart-Plugin.json` + démo `docs/` (publiée par la CI : `../guides/publication.md`). Démo `publishFilter` (`../guides/build-html-publishfilter.md`) : `katex`/`highlight` gardés (officiels TW).
- HMR : les `.tid`/`.multids` et assets sont poussés à chaud ; seuls un module `.js` (dont `chart.min.js`) ou `plugin.info` rebootent. `eslint.config.js` : ES2021.

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

## Conventions spécifiques
- `chart.min.js` est la bibliothèque Chart.js bundlée manuellement — ne jamais régénérer depuis npm (règle générale des `*.min.js` : voir workspace).
