/*\
title: $:/plugins/nikorion/chart/modules/chart.widget.js
type: application/javascript
module-type: widget

Chart.js wrapper providing a <$chart> widget for TiddlyWiki.
\*/

/*
 * chart.widget.js — <$chart> widget
 *
 * Renders a Chart.js chart inside a <canvas> element. Data may come from
 * inline attributes or a JSON tiddler.
 *
 * ── Attributes ──────────────────────────────────────────────────────────────
 *
 *   type            {string}  Chart type: bar, line, pie, doughnut, radar,
 *                             polarArea, scatter, bubble. Default: "bar".
 *
 *   indexAxis       {string}  "y" for horizontal charts (bar/line only).
 *                             Default: "" (vertical).
 *
 *   width           {string}  CSS width of the chart container.  Default: "600px".
 *   height          {string}  CSS height of the chart container. Default: "400px".
 *
 *   label           {string}  Dataset label shown in the legend. Default: "Data".
 *
 *   data            {string}  Comma-separated numeric values. For scatter/bubble,
 *                             a JSON array of { x, y } / { x, y, r } objects.
 *   labels          {string}  Comma-separated axis labels.
 *   dataTiddler     {string}  Title of a JSON tiddler: { "labels": [...], "values": [...] }.
 *                             Takes precedence over inline data/labels.
 *
 *   backgroundColor {string}  Fill colour for bars/segments. Default: "orange".
 *   borderColor     {string}  Stroke colour. Default: "black".
 *   borderWidth     {number}  Stroke width in pixels. Default: 1.
 *
 * ── Lifecycle ────────────────────────────────────────────────────────────────
 *
 *   render()      Creates the container div + canvas, defers createChart()
 *                 via setTimeout so the DOM is attached before Chart.js runs.
 *   execute()     Reads all attributes; sets dataChanged flag for refresh().
 *   createChart() Instantiates (or re-instantiates) the Chart.js object.
 *   updateChart() Mutates the existing Chart.js instance — no canvas teardown.
 *   refresh()     Structural changes (type, size) → refreshSelf().
 *                 Data/style changes → updateChart(). No change → false.
 *   destroy()     Disposes the Chart.js instance to free canvas memory.
 */

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var lang   = require("$:/plugins/nikorion/chart/modules/lang.js");

var ChartWidget = function(parseTreeNode, options) {
    this.initialise(parseTreeNode, options);
};

ChartWidget.prototype = new Widget();

/* ── render ─────────────────────────────────────────────────────────────── */

ChartWidget.prototype.render = function(parent, nextSibling) {
    this.parentDomNode = parent;
    this.computeAttributes();
    this.execute();

    // Wrap the canvas in a sized div so Chart.js can read dimensions reliably.
    var container = this.document.createElement("div");
    container.style.width    = this.chartWidth;
    container.style.height   = this.chartHeight;
    container.style.position = "relative";

    var canvas = this.document.createElement("canvas");
    container.appendChild(canvas);
    parent.insertBefore(container, nextSibling);
    this.domNodes.push(container);

    this.isFirstRender = true;

    // Defer chart creation so the container is in the document before Chart.js
    // calls getBoundingClientRect() and canvas sizing APIs.
    var self = this;
    setTimeout(function() {
        self.createChart(canvas);
    }, 10);
};

/* ── execute ─────────────────────────────────────────────────────────────── */

ChartWidget.prototype.execute = function() {
    // Snapshot previous values so refresh() can detect what changed.
    var oldType      = this.chartType;
    var oldIndexAxis = this.indexAxis;
    var oldLabels    = this.chartLabels ? JSON.stringify(this.chartLabels) : null;
    var oldData      = this.chartData   ? JSON.stringify(this.chartData)   : null;

    this.chartType       = this.getAttribute("type",            "bar");
    this.indexAxis       = this.getAttribute("indexAxis",       "");
    this.chartWidth      = this.getAttribute("width",           "600px");
    this.chartHeight     = this.getAttribute("height",          "400px");
    this.chartLabel      = this.getAttribute("label",           "Data");
    this.backgroundColor = this.getAttribute("backgroundColor", "orange");
    this.borderColor     = this.getAttribute("borderColor",     "black");
    this.borderWidth     = parseInt(this.getAttribute("borderWidth", "1px"));

    var dataTiddler = this.getAttribute("dataTiddler");

    if (dataTiddler) {
        // Load labels and data from a JSON tiddler: { "labels": [...], "values": [...] }
        var tiddler = this.wiki.getTiddler(dataTiddler);
        if (tiddler) {
            try {
                var jsonData = JSON.parse(tiddler.fields.text);
                this.chartLabels = jsonData.labels || [];
                this.chartData   = jsonData.values || jsonData.data || [];
            } catch (_e) {
                // Silently fall back to empty arrays — no data points render a blank chart
                // which is preferable to crashing the entire widget tree.
                this.chartLabels = [];
                this.chartData   = [];
            }
        } else {
            this.chartLabels = [];
            this.chartData   = [];
        }
    } else {
        // Inline data: comma-separated strings parsed into typed arrays.
        var labels = this.getAttribute("labels", "");
        var data   = this.getAttribute("data",   "");

        this.chartLabels = labels
            ? labels.split(",").map(function(s) { return s.trim(); })
            : [];

        // scatter/bubble expect JSON objects ({ x, y } / { x, y, r });
        // all other types take plain numbers.
        if (this.chartType === "scatter" || this.chartType === "bubble") {
            try   { this.chartData = data ? JSON.parse(data) : []; }
            catch (_e) { this.chartData = []; }
        } else {
            this.chartData = data
                ? data.split(",").map(function(s) { return parseFloat(s.trim()); })
                : [];
        }
    }

    var newLabels = JSON.stringify(this.chartLabels);
    var newData   = JSON.stringify(this.chartData);

    // dataChanged drives the choice between updateChart() and a full re-render.
    this.dataChanged = (
        oldType      !== this.chartType  ||
        oldIndexAxis !== this.indexAxis  ||
        oldLabels    !== newLabels       ||
        oldData      !== newData
    );
};

/* ── createChart ─────────────────────────────────────────────────────────── */

ChartWidget.prototype.createChart = function(canvas) {
    var Chart;
    try {
        Chart = require("$:/plugins/nikorion/chart/modules/chart.min.js").Chart;
    } catch (_e) {
        // Fallback: some TW environments don't resolve bundle tiddlers via require().
        Chart = window.Chart;
    }

    if (!Chart) {
        canvas.parentNode.innerHTML =
            "<p style='color:red;'>" + lang.getString("Errors/LoadFailed") + "</p>";
        return;
    }

    // Destroy any previous instance so Chart.js releases canvas event listeners.
    if (this.chart) {
        this.chart.destroy();
    }

    var config = {
        type: this.chartType,
        data: {
            labels: this.chartLabels,
            datasets: [{
                label:           this.chartLabel,
                data:            this.chartData,
                backgroundColor: this.backgroundColor,
                borderColor:     this.borderColor,
                borderWidth:     this.borderWidth
            }]
        },
        options: {
            responsive:          true,
            maintainAspectRatio: false,
            // Full animation on first render; instant thereafter to avoid jarring
            // re-animations on every attribute change while the user is editing.
            animation: this.isFirstRender
                ? { duration: 750, easing: "easeInOutQuart" }
                : { duration: 0 }
        }
    };

    if (this.indexAxis) {
        config.options.indexAxis = this.indexAxis;
    }

    // Radial/polar chart types have no cartesian axes — skip beginAtZero setup.
    var noCartesianScales = ["pie", "doughnut", "polarArea", "radar"];
    if (noCartesianScales.indexOf(this.chartType) === -1) {
        if (this.chartType === "scatter" || this.chartType === "bubble") {
            config.options.scales = {
                x: { beginAtZero: true },
                y: { beginAtZero: true }
            };
        } else if (this.indexAxis === "y") {
            // Horizontal bar: value axis is x, not y.
            config.options.scales = { x: { beginAtZero: true } };
        } else {
            config.options.scales = { y: { beginAtZero: true } };
        }
    }

    if (this.chartType === "line") {
        config.data.datasets[0].tension = 0.4;
    }

    try {
        this.chart = new Chart(canvas, config);
        this.isFirstRender = false;
    } catch (e) {
        canvas.parentNode.innerHTML =
            "<p style='color:red;'>" + lang.getString("Errors/RenderFailed") + ": " + e.message + "</p>";
    }
};

/* ── updateChart ─────────────────────────────────────────────────────────── */

ChartWidget.prototype.updateChart = function() {
    if (!this.chart) return;
    // Mutate the existing Chart.js instance rather than destroying and recreating it.
    // Preserves animation state and avoids canvas teardown/setup overhead.
    this.chart.data.labels                      = this.chartLabels;
    this.chart.data.datasets[0].data            = this.chartData;
    this.chart.data.datasets[0].label           = this.chartLabel;
    this.chart.data.datasets[0].backgroundColor = this.backgroundColor;
    this.chart.data.datasets[0].borderColor     = this.borderColor;
    this.chart.data.datasets[0].borderWidth     = this.borderWidth;
    // "active" mode triggers the hover animation, giving visual feedback on change.
    this.chart.update("active");
};

/* ── refresh ─────────────────────────────────────────────────────────────── */

ChartWidget.prototype.refresh = function(changedTiddlers) {
    var changedAttributes = this.computeAttributes();
    var dataTiddler = this.getAttribute("dataTiddler");
    var needsRefresh = false;

    // A changed data tiddler triggers a data refresh even if no attributes changed.
    if (dataTiddler && changedTiddlers[dataTiddler]) {
        needsRefresh = true;
    }

    // Structural changes (chart type, axis orientation, container size) require a
    // full re-render because Chart.js config cannot be hot-swapped after creation.
    if (changedAttributes.type    || changedAttributes.indexAxis ||
        changedAttributes.width   || changedAttributes.height) {
        this.refreshSelf();
        return true;
    }

    // Data and style changes can be applied in-place via updateChart().
    if (changedAttributes.labels          || changedAttributes.data        ||
        changedAttributes.dataTiddler     || changedAttributes.label       ||
        changedAttributes.backgroundColor || changedAttributes.borderColor ||
        changedAttributes.borderWidth) {
        needsRefresh = true;
    }

    if (needsRefresh) {
        this.execute();
        if (this.dataChanged && this.chart) {
            this.updateChart();
            return true;
        }
    }

    return false;
};

/* ── destroy ─────────────────────────────────────────────────────────────── */

ChartWidget.prototype.destroy = function() {
    // Chart.js holds canvas references and event listeners; explicit disposal
    // prevents memory leaks when tiddlers containing charts are closed.
    if (this.chart) {
        this.chart.destroy();
        this.chart = null;
    }
};

exports.chart = ChartWidget;
