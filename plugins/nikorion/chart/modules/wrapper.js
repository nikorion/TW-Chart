/*\
title: $:/plugins/nikorion/chart/wrapper.js
type: application/javascript
module-type: widget

Wrapper for `chart.min.js` that provides a `<$chart>` widget.
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ChartWidget = function(parseTreeNode, options) {
    this.initialise(parseTreeNode, options);
};

ChartWidget.prototype = new Widget();

ChartWidget.prototype.render = function(parent, nextSibling) {
    this.parentDomNode = parent;
    this.computeAttributes();
    this.execute();
    
    var container = this.document.createElement("div");
    container.style.width = this.chartWidth;
    container.style.height = this.chartHeight;
    container.style.position = "relative";
    
    var canvas = this.document.createElement("canvas");
    
    container.appendChild(canvas);
    parent.insertBefore(container, nextSibling);
    this.domNodes.push(container);
    
    this.isFirstRender = true;
    
    var self = this;
    setTimeout(function() {
        self.createChart(canvas);
    }, 10);
};

ChartWidget.prototype.execute = function() {
    var oldType =   this.chartType;
    var oldLabels = this.chartLabels ? JSON.stringify(this.chartLabels) : null;
    var oldData =   this.chartData ? JSON.stringify(this.chartData) : null;

    this.chartType =            this.getAttribute("type", "bar");
    this.chartWidth =           this.getAttribute("width", "600px");
    this.chartHeight =          this.getAttribute("height", "400px");
    this.chartLabel =           this.getAttribute("label", "Data");
    this.backgroundColor =      this.getAttribute("backgroundColor", "rgba(75, 192, 192, 0.5)");
    this.borderColor =          this.getAttribute("borderColor", "rgba(75, 192, 192, 1)");
    this.borderWidth = parseInt(this.getAttribute("borderWidth", "2"));
    
    var dataTiddler =           this.getAttribute("dataTiddler");
    
    if (dataTiddler) {
        var tiddler = this.wiki.getTiddler(dataTiddler);
        if (tiddler) {
            try {
                var jsonData = JSON.parse(tiddler.fields.text);
                this.chartLabels = jsonData.labels || [];
                this.chartData = jsonData.values || jsonData.data || [];
            } catch(e) {
                this.chartLabels = [];
                this.chartData = [];
            }
        } else {
            this.chartLabels = [];
            this.chartData = [];
        }
    } else {
        var labels = this.getAttribute("labels", "");
        var data = this.getAttribute("data", "");
        
        this.chartLabels = labels ? labels.split(",").map(function(s) { return s.trim(); }) : [];
        this.chartData = data ? data.split(",").map(function(s) { return parseFloat(s.trim()); }) : [];
    }
    
    var newLabels = JSON.stringify(this.chartLabels);
    var newData = JSON.stringify(this.chartData);
    
    this.dataChanged = (
        oldType !== this.chartType ||
        oldLabels !== newLabels ||
        oldData !== newData
    );
};

ChartWidget.prototype.createChart = function(canvas) {
    var Chart;
    try {
        Chart = require("$:/plugins/nikorion/chart/chart.min.js").Chart;
    } catch(e) {
        Chart = window.Chart;
    }
    
    if (!Chart) {
        canvas.parentNode.innerHTML = "<p style='color:red;'>Chart.js is not loaded!</p>";
        return;
    }
    
    if (this.chart) {
        this.chart.destroy();
    }
    
    var config = {
        type: this.chartType,
        data: {
            labels: this.chartLabels,
            datasets: [{
                label: this.chartLabel,
                data: this.chartData,
                backgroundColor: this.backgroundColor,
                borderColor: this.borderColor,
                borderWidth: this.borderWidth
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: this.isFirstRender ? {
                duration: 750,
                easing: 'easeInOutQuart'
            } : {
                duration: 0
            }
        }
    };
    
    if (this.chartType !== "pie" && this.chartType !== "doughnut" && this.chartType !== "polarArea") {
        config.options.scales = {
            y: {
                beginAtZero: true
            }
        };
    }
    
    if (this.chartType === "line") {
        config.data.datasets[0].tension = 0.4;
    }
    
    try {
        this.chart = new Chart(canvas, config);
    } catch(e) {
        canvas.parentNode.innerHTML = "<p style='color:red;'>Error: " + e.message + "</p>";
    }
};

ChartWidget.prototype.updateChart = function() {
    if (!this.chart) return;
    this.chart.data.labels =                      this.chartLabels;
    this.chart.data.datasets[0].data =            this.chartData;
    this.chart.data.datasets[0].label =           this.chartLabel;
    this.chart.data.datasets[0].backgroundColor = this.backgroundColor;
    this.chart.data.datasets[0].borderColor =     this.borderColor;
    this.chart.data.datasets[0].borderWidth =     this.borderWidth;
    this.chart.update('active');
};

ChartWidget.prototype.refresh = function(changedTiddlers) {
    var changedAttributes = this.computeAttributes();
    var dataTiddler = this.getAttribute("dataTiddler");
    var needsRefresh = false;

    if (dataTiddler && changedTiddlers[dataTiddler]) {
        needsRefresh = true;
    }
    if (changedAttributes.type || changedAttributes.width || changedAttributes.height) {
        this.refreshSelf();
        return true;
    }
    if (changedAttributes.labels || 
        changedAttributes.data || 
        changedAttributes.dataTiddler || 
        changedAttributes.label ||
        changedAttributes.backgroundColor || 
        changedAttributes.borderColor ||
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

ChartWidget.prototype.destroy = function() {
    if (this.chart) {
        this.chart.destroy();
        this.chart = null;
    }
};

exports.chart = ChartWidget;