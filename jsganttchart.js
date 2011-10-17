(function ($, _, Backbone) {
	"use strict";

	var root = window,

		jsgtThis = window,

		JSGanttChart = root.JSGanttChart = function () {
			jsgtThis = this;
		},

		elements,

		fieldNames = {
			id: "ID",
			name: "Item name",
			graphic: "1 2 3 4"
		},

		GanttChartView = Backbone.View.extend({
			elements: [],

			fieldOrder: ["id", "name", "graphic"],

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
				var this_ = this,
					html = "<table>";

				html += "<tr>";

				_(this_.fieldOrder).each(function (field) {
					html += "<th>" + fieldNames[field] + "</th>";
				});

				html += "</tr>";

				_(elements).each(function (element) {
					html += "<tr>";

					_(this_.fieldOrder).each(function (field) {
						html += "<td>";

						if (element.hasOwnProperty(field)) {
							html += element[field];
						}

						html += "</td>";
					});

					html += "</tr>";
				});

				html += "</table>";

				$(this.el).html(html); // make it a adjustable table view
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

	_(JSGanttChart.prototype).extend({
		setElements: function (newelements) {
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