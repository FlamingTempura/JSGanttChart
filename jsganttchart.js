(function ($, _, Backbone) {
	'use strict';

	var root = window,

		jsgtThis = undefined,

		JSGanttChart = root.JSGanttChart = function () {
			jsgtThis = this;
		},

		fieldNames = {
			id: 'ID',
			name: 'Item name',
			estimatedHours: 'Estim. Hours'
		},

		mandatoryFields = ['id', 'name', 'startDate'],


		GanttElementModel = Backbone.Model.extend({
			defaults: {}
		}),

		GanttElementCollection = Backbone.Collection.extend({
			Model: GanttElementModel
		}),
		
		// Options:
		//	collection: collection of type GanttElementCollection
		//	displayKey
		//	fields: array of fields
		//	types: mapping of types to name+colour
		GanttContainerView = Backbone.View.extend({
			className: "gantt-container",
			dataView: undefined,
			ganttView: undefined,
			keyView: undefined,
			$el: undefined,

			initialize: function () {
				var this_ = this;

				this.dataView = new DataTableView({
					collection: this.options.collection,
					fields: this.options.fields
				});
				this.ganttView = new GanttTableView({ collection: this.options.collection });
				this.keyView = new KeyView({ types: this.options.types });
				this.$el = $(this.el);

				var rowClick = function (e, element) {
					this_.trigger("row_click", e, element)
				}

				this.dataView.bind("row_click", rowClick);
				this.ganttView.bind("row_click", rowClick);
			},

			render: function () {
				$el.html('')
					.append(this.dataView.el, this.keyView.el);
				if (!this.options.displayKey) {
					$el.append(this.keyView.el);
				}
				return this;
			}
		}),

		DataTableView = Backbone.View.extend({
			$el: undefined,

			initialize: function () {
				_.bindAll(this, "render");
				this.options.collection.bind("change", this.render);
				this.$el = $(this.el);
			},
			render: function () {
				var this_ = this,
					table = jQuery('<table cellspacing="0"></table>');

				// Populate headers
				table.append(jQuery('<tr></tr>').append(_(this_.fields).map(function (field) { 
					return jQuery('<th>' + fieldNames[field] + '</th>'); 
				})));

				// Populate data
				table.append(this.options.collection.map(function (element) {
					return jQuery('<tr></tr>').append(_(this_.fields).map(function (field) {
						return jQuery('<td>' + (element.has(field) ? element.get(field) : '') + '</td>'); 
					})).click(function (e) {
						this_.trigger("row_click", e, element);
						return false; 
					});
				});

				this.$el.append(table);
			}
		}),

		GanttTableView = Backbone.View.extend({
			$el: undefined,

			initialize: function () {
				_.bindAll(this, "render");
				this.options.collection.bind("change", this.render);
				this.$el = $(this.el);
			},
			
			render: function () {
				var firstDate,
					lastDate,
					dateIterator;

				// Determine when the gantt chart starts and finishes
				this.options.collection.each(function (element) {
					var startDate = element.startDate.getTime(),
						endDate = element.endDate.getTime();
					firstDate = (!firstDate || startDate < firstDate) ? startDate : firstDate;
					lastDate = (!lastDate || endDate > lastDate) ? endDate : lastDate;
				});

				firstDate = new Date(firstDate);
				lastDate = new Date(lastDate);

				var container = jQuery('<div class="gantt"></div>');
				var row = jQuery('<div class="dates"></div>');

				dateIterator = new Date(firstDate.getTime());
				// Populate days
				while (dateIterator <= lastDate) {
					row.append('<div class="cell">' + dateIterator.getDate() + '</div>');
					dateIterator.setDate(dateIterator.getDate() + 1);
				}
				container.append(row);

				_(elements).each(function (element) {
					row = jQuery('<div class="row"></div>');
					row.click(function (e) { jsgtThis.trigger("row_click", e, element); })

					dateIterator = new Date(firstDate.getTime());
					while (dateIterator <= lastDate) {
						cell = jQuery('<div class="cell"></div>');

						if (element.startDate.getDate() == dateIterator.getDate() && 
								element.startDate.getMonth() == dateIterator.getMonth() &&
								element.startDate.getFullYear() == dateIterator.getFullYear()) {
							var noOfDays = Math.round((element.endDate.getTime() - element.startDate.getTime()) / (24 * 60 * 60 * 1000));
							cell.append('<div class="el" style="width:' + (noOfDays * 25)+ 'px;' + 
								(element.type ? ' background:' + types[element.type].color + ';' : '') + '">&nbsp;</div>');
						}
						row.append(cell);
						dateIterator.setDate(dateIterator.getDate() + 1);
					}
					container.append(row);
				});

				$(this.el).append(container); // make it a adjustable table view
				return this;
			}
		}),

		GanttElementView = 
		KeyView = 









		GanttChartView = Backbone.View.extend({
			elements: undefined,

			fieldOrder: ['id', 'name'],

			setElements: function (elements) {
				this.elements = this.normalise(_(elements).clone());
			},

			normalise: function (elements) {
				_(elements).each(function (element) {
					_(mandatoryFields).each(function (field) {
						if (!element.hasOwnProperty(field)) {
							throw "element is missing " + field + " " + element;
						}
					});

					if (!_(element.startDate).isDate()) {
						element.startDate = new Date(element.startDate);
					}

					if (element.hasOwnProperty("endDate") && !_(element.endDate).isDate()) {
						element.endDate = new Date(element.endDate);
					}

					if (!element.hasOwnProperty("endDate")) {
						element.endDate = new Date(element.startDate.getTime());
						if (element.hasOwnProperty("duration")) {
							element.endDate.setDate(element.startDate.getDate() + element.duration);
						} else {
							element.endDate.setDate(element.startDate.getDate() + 1);
						}
						delete element.duration;
					}
				});
				return elements;
			},

			render: function () {
				var this_ = this,
					firstDate,
					lastDate,
					dateIterator,
					container = jQuery('<table cellspacing="0"></table>'),
					row,
					cell;

				$(this.el).html('');

				


				
			}
		});

	_(JSGanttChart).extend({
		create: function () {
			var F = function () {}, // Dummy function
	            o;
	        F.prototype = JSGanttChart.prototype;
	        o = new F();
	        JSGanttChart.apply(o, arguments);
	        o.constructor = JSGanttChart;
	        return o;
		}
	});

	_(JSGanttChart.prototype).extend(Backbone.Events, {
		setElements: function (newelements) {
			elements = newelements;
		},

		setTypes: function (newtypes) {
			types = newtypes;
		},

		setElement: function (element) {
			_(elements).each(function (el) {
				if (el.id === element.id) {
					_(el).extend(el); // Ewww... hacky
				}
			});
			console.log("Render?")
			gc.render();
		},

		getDOM: function () {
			gc = new GanttChartView();
			gc.setElements(elements);
			var el = gc.render().el;
			return el;
		}
	});

}(jQuery, _, Backbone));