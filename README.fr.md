# TW-Chart

[English](README.md) · **Français**

Un plugin TiddlyWiki pour la bibliothèque [Chart.js](https://www.chartjs.org/).

Version actuelle de la bibliothèque : v4.2.1

Ce plugin, disponible sur [GitHub](https://github.com/nikorion/TW-Chart), est une adaptation pour TiddlyWiki de la bibliothèque JavaScript de graphiques [Chart.js](https://www.chartjs.org/). La version actuelle du plugin (0.1.0) repose sur *Chart.js v4.5.1* (octobre 2025). [Lire la documentation](https://www.chartjs.org/docs/4.5.1/).

*Chart.js* est moins souple et personnalisable que *D3.js* ou *ECharts.js* et ne propose que 8 types de graphiques, mais sa force tient à sa simplicité d'accès et à sa légèreté (200 Ko, environ 1/6 d'ECharts, qui alourdit TiddlyWiki de 150 % 😲). Il convient à qui veut produire rapidement des graphiques, moins aux artistes ou aux bricoleurs. À ceux-là, je ne peux que recommander [l'adaptation TiddlyWiki d'ECharts.js](https://tiddly-gittly.github.io/tw-echarts/) conçue à l'origine par Gk0Wk. Ce plugin est aussi disponible via le gestionnaire CPL-Repo, avec en prime la notification automatique des mises à jour. L'adaptation officielle de D3.js, quant à elle, est en sommeil.

## Crédits

[Chart.js](https://www.chartjs.org/), créé par la communauté Chart.js.

Icône issue de [SVG Repo](https://www.svgrepo.com/svg/429933/chart-bar-graph-analytics) —
voir les conditions d'utilisation de SVG Repo.

Développé avec l'aide d'Anthropic Claude pour la revue de code,
le refactoring et la documentation.

## Installation

**Démo en ligne** : [https://nikorion.github.io/TW-Chart/](https://nikorion.github.io/TW-Chart/) — pour essayer le plugin avant de l'installer.

**Depuis la bibliothèque de plugins nikorion** (TiddlyWiki propose ensuite chaque nouvelle version en mise à jour) :

1. Sur [nikorion.github.io/tw-plugins](https://nikorion.github.io/tw-plugins/), glisser le bouton **Bibliothèque de plugins nikorion** sur votre wiki (une fois par wiki).
2. Ouvrir *Panneau de configuration → Plugins → Obtenir d'autres plugins → Ouvrir la bibliothèque de plugins*, choisir l'onglet nikorion et installer **Chart**.

**À la main** : télécharger [`TW-Chart-Plugin.json`](https://nikorion.github.io/TW-Chart/TW-Chart-Plugin.json) et le glisser-déposer sur votre wiki.

Nécessite TiddlyWiki ≥ 5.3.8.

## Développement

Cloner [tw-dev](https://github.com/nikorion/tw-dev) à côté de ce dépôt : `pnpm dev` l'exécute, et il relie lui-même les plugins nikorion que charge le wiki de dev — depuis les clones placés à côté de celui-ci (`../TW-Math`…), pour que vos modifications y soient prises en direct, sinon depuis une copie en lecture seule qu'il récupère sur GitHub. Ni lien symbolique, ni `TIDDLYWIKI_PLUGIN_PATH`, ni droits administrateur. Seul `pnpm build` a encore besoin de `TIDDLYWIKI_PLUGIN_PATH` : le faire pointer sur `../tw-dev/.state/TW-Chart/plugins`, créé par `pnpm dev`.

```sh
pnpm install
pnpm dev     # wiki de dev + rechargement à chaud ; l'URL (port libre aléatoire) s'affiche au démarrage
pnpm build   # dist/TW-Chart-Plugin.json + docs/ (wiki de démo, publié par la CI)
```

## Licence

MIT — voir `LICENSE`. Inclut Chart.js (MIT).
