# TW-Chart

**English** · [Français](README.fr.md)

A TiddlyWiki plugin for the [Chart.js](https://www.chartjs.org/) library.

Current library version: v4.2.1

This plugin, available on [GitHub](https://github.com/nikorion/TW-Chart), is a TiddlyWiki adaptation of the [Chart.js](https://www.chartjs.org/) JavaScript charting library. The current plugin version (0.1.0) is built on *Chart.js v4.5.1* (October 2025). [Read the documentation](https://www.chartjs.org/docs/4.5.1/).

*Chart.js* is less flexible and customisable than *D3.js* or *ECharts.js* and only offers 8 chart types, but its strength lies in its accessibility and lightweight footprint (200 KB, roughly 1/6th of ECharts which bloats TiddlyWiki by 150% 😲). It suits anyone who wants to quickly generate charts, less so artists or tinkerers. For them, I can only recommend [the TiddlyWiki adaptation of ECharts.js](https://tiddly-gittly.github.io/tw-echarts/) originally designed by Gk0Wk. The plugin is also available through the CPL-Repo manager, with the added benefit of automatic update notifications. The official D3.js adaptation, for its part, is dormant.

## Credits

[Chart.js](https://www.chartjs.org/), created by the Chart.js community.

Icon from [SVG Repo](https://www.svgrepo.com/svg/429933/chart-bar-graph-analytics) —
see SVG Repo terms of use.

Developed with assistance from Anthropic Claude for code
review, refactoring, and documentation.

## Installation

**Live demo**: [https://nikorion.github.io/TW-Chart/](https://nikorion.github.io/TW-Chart/) — try the plugin before installing it.

**From the nikorion plugin library** (TiddlyWiki then offers each new version as an update):

1. In your wiki, create a tiddler tagged `$:/tags/PluginLibrary`, with a field `url` set to `https://nikorion.github.io/tw-dev/library/index.html` and a `caption` such as `nikorion`.
2. Open *Control Panel → Plugins → Get more plugins*, choose the nikorion library and install **Chart**.

**By hand**: download [`TW-Chart-Plugin.json`](https://nikorion.github.io/TW-Chart/TW-Chart-Plugin.json) and drag it onto your wiki.

Requires TiddlyWiki ≥ 5.3.8.

## License

MIT — see `LICENSE`. Includes Chart.js (MIT).
