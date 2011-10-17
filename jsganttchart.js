(function ($, _, Backbone) {
	"use strict";

	var root = window,

		jsgtThis = window,

		JSGanttChart = root.JSGanttChart = function () {
			jsgtThis = this;
		},

		elements,

		GanttChartView = new Backbone.View({
			elements: [],

			rowOrder: ["name", "graphic"],

			initialize: function () {
				this.render();
			},

			setElements: function (elements) {
				_(elements).each(function (element) {
					var row = [];
					row.push(element.name);
				});
			},

			render: function () {
				$(this.el).html(""); // make it a adjustable table view
				return this;
			}
		});
	
	JSGanttChart.create = function () {
		var F = function () {}, // Dummy function
            o;
        F.prototype = JSGanttChart.prototype;
        o = new F();
        JSGanttChart.apply(o, arguments);
        o.constructor = JSGanttChart;
        return o;
	};

	_(Greasy.prototype).extend({
		setElements(newelements) {
			elements = newelements;
		},

		getDOM: function () {
			var gc = new GanttChartView();
			gc.setElements(elements);
			var el = gc.render().el;
			return el;
		}
	});

}(jQuery, _, Backbone));