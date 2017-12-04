/*jslint nomen: true*/
(function ($, Backbone) {
'use strict';

var monthNames = [ "January", "February", "March", "April", "May", "June",
			"July", "August", "September", "October", "November", "December" ],

	fieldNames = {
		name: 'Project stage',
		resources: "Resources",
		percentageDone: "Status",
		estimatedHours: 'Estim. Hours'
	},

	mandatoryFields = ['id', 'name', 'startDate'],

	GanttElementModel = Backbone.Model.extend({
		defaults: { order: 0 },

		initialize(model, options) {
			this.collection = options.collection;
			this.normalize();
			if (this.collection.hasOwnProperty("localStorage")) {
				this.save();
			}
		},

		normalize() {
			mandatoryFields.forEach(field => {
				if (!this.has(field)) {
					throw `element ${this.get("id")} is missing ${field}.`;
				}
			});

			if (!(this.get("startDate") instanceof Date)) {
				this.set({ startDate: new Date(this.get("startDate")) });
			}

			if (this.has("endDate") && !(this.get("endDate") instanceof Date)) {
				this.set({ endDate: new Date(this.get("endDate")) });
			}

			if (!this.has("endDate")) {
				this.set({ endDate: new Date(this.get("startDate").getTime()) });
				if (this.has("duration")) {
					this.get("endDate").setDate(this.get("startDate").getDate() + this.get("duration"));
					this.unset("duration");
				} else {
					this.get("endDate").setDate(this.get("startDate").getDate() + 1);
				}
			}

			if (this.has("slackEndDate")) {
				if (!(this.get("slackEndDate") instanceof Date)) {
					this.set({ slackEndDate: new Date(this.get("slackEndDate")) });
				}
			} else if (this.has("slackDuration")) {
				var date = new Date(this.get("endDate"));
				date.setDate(date.getDate() + this.get("slackDuration"));
				this.set({ slackEndDate: date });
			}

			if (this.has("elements")) {
				this.collection.add(this.get("elements").map(el => {
					return Object.assign({}, el, {
						parentElement: this.get('id')
					});
				}));
				this.unset("elements");
			}

			if (this.has("icons")) {
				this.get("icons").forEach(icon => {
					if (!(icon.date instanceof Date)) {
						icon.date = new Date(icon.date);
					}
				});
			}
		}
	}),

	GanttElementCollection = Backbone.Collection.extend({
		model: GanttElementModel,
		initialize(models, options) {
			var triggerChange = () => { this.trigger("change"); };
			this.bind("add", triggerChange);
			this.bind("remove", triggerChange);
			this.bind("reset", triggerChange);
		},

		add(models) {
			if (!(models instanceof Array)) { models = [model]; }
			models.forEach(model => {
				Backbone.Collection.prototype.add.call(this, model, { at: this.length }); // Order properly
			});
			return this;
		},

		sort(model) {
			this.reset(collection.sortBy(model => {
				var order;
				if (model.has("parentElement") && this.get(model.get("parentElement"))) { /// HACK
					order = this.get(model.get("parentElement")).get("order") + (0.00001 * model.get("order") + 0.00001);
				} else {
					order = model.get("order");
				}
				return order;
			}));
		}
	}),

	DataTableView = Backbone.View.extend({
		className: "gantt-data-table",
		tagName: "table",

		initialize() {
			this.options.collection.bind("change", this.render);
			this.$el = $(this.el);
		},

		highlight(model) {
			if (model) {
				this.$el.find(`.jsgt_${model.get("id")}`).addClass("highlight")
					.siblings().removeClass("highlight");
			} else {
				this.$el.find('tr').removeClass("highlight");
			}
		},

		render() {
			this.$el.html('<thead><tr></tr></thead><tbody></tbody>');
			this.options.fields.forEach(field => this.$el.find('thead tr').append(`<th>${fieldNames[field]}</th>`));
			this.options.collection.forEach(model => {
				var $row = $(`<tr class="jsgt_${model.get("id")}"></tr>`);
				this.options.fields.forEach(field => {
					var str = (model.has(field) ? model.get(field) : '');
					if (field === "name" && model.get("parentElement") && model.get("parentElement").trim()) {
						str = `&nbsp;&nbsp;&nbsp;&nbsp;${str}`;
						$row.addClass("child");
					} else if (field === "resources") {
						str = (model.get(field) || []).map(resource => this.options.resources[resource]).join(', ');
					} else if (field === "percentageDone") {
						if (str === 100) {
							str = '<div class="finished">Done</div>';
						} else if (!str || str === 0) {
							str = '<div class="not-started">Not started</div>';
						} else {
							str = `<div class="in-progress">In progress: ${str}%</div>`;
						}
					}
					$row.append(`<td>${str || '&nbsp'}</td>`);
				});
				$row.click(e => this.trigger('row_click', e, model));
				$row.mouseenter(e => this.trigger('row_enter', e, model));
				$row.mouseleave(e => this.trigger('row_leave', e, model));
				this.$el.find('tbody').append($row);
			});

			return this;
		}
	}),

	GanttElementView = Backbone.View.extend({
		className: "gantt-element",

		initialize() {
			this.options.model.bind("change", this.render);
			this.$el = $(this.el);
		},

		render() {
			var model = this.options.model,
				noOfDays = Math.round((model.get("endDate").getTime() - model.get("startDate").getTime()) / (24 * 60 * 60 * 1000)),
				dayFromStart = Math.round((model.get("startDate").getTime() - this.options.firstDate.getTime()) / (24 * 60 * 60 * 1000));

			this.$el.css({ width: noOfDays * 23 - 3 });

			if (model.has("type") && this.options.types.hasOwnProperty(model.get("type"))) {
				this.$el.css({ borderBottomColor: this.options.types[model.get("type")].color });
			}

			if (model.has("percentageDone") && model.get("percentageDone") > 0) {
				let el = $('<div class="done"></div>');
				el.css({ width: model.get("percentageDone") + "%" });
				this.$el.append(el, $('<div class="donetext">' + (model.get("percentageDone") < 100 ? model.get("percentageDone") + "% done" : "Done") + '</div>'));
			}

			if (model.has("slackEndDate")) {
				let el = $('<div class="slack"><div class="slack-end"></div></div>');
				noOfDays = Math.round((model.get("slackEndDate").getTime() - model.get("endDate").getTime()) / (24 * 60 * 60 * 1000));
				el.css({ left: "100%", width: noOfDays * 23 });
				this.$el.append(el);
			}

			if (model.has("predecessors")) {
				model.get("predecessors").forEach(predecessor => {
					var predecessorModel = this.options.collection.get(predecessor);
					if (predecessorModel) {
						let el = $('<div class="arrowline"><div class="arrowhead"></div></div>');
						noOfDays = Math.round((model.get("startDate").getTime() - predecessorModel.get("endDate").getTime()) / (24 * 60 * 60 * 1000));
						var noOfRows = this.collection.indexOf(model) - this.collection.indexOf(predecessorModel);
						el.css({ right: "100%", bottom: "100%", width: noOfDays * 23, height: noOfRows * 17 - 5 });
						this.$el.appen(el);
					}
				});
			}

			return this;
		}
	}),

	GanttTableView = Backbone.View.extend({
		className: "gantt-table",
		tagName: "table",

		initialize() {
			this.options.collection.bind("change", this.render);
			this.$el = $(this.el);
		},

		highlight(model) {
			if (model) {
				this.$el.find('.jsgt_' + model.get("id"))
					.addClass("highlight")
					.siblings()
					.removeClass("highlight");
			} else {
				this.$el.find('tr').removeClass("highlight");
			}
		},

		render() {
			this.$el.html('');
			var firstDate,
				lastDate,
				dateIterator,
				today = new Date();

			// Determine when the gantt chart starts and finishes
			this.options.collection.each(model => {
				var startDate = model.get("startDate").getTime(),
					endDate = model.get("endDate").getTime();
				firstDate = (!firstDate || startDate < firstDate) ? startDate : firstDate;
				lastDate = (!lastDate || endDate > lastDate) ? endDate : lastDate;
			});

			firstDate = new Date(firstDate);
			lastDate = new Date(lastDate);

			var monthRow = $('<tr></tr>'),
				dayRow = $('<tr></tr>'),
				currMonth,
				currMonthSize,
				currMonthEl;

			dateIterator = new Date(firstDate.getTime());
			// Populate days
			while (dateIterator <= lastDate) {
				if (dateIterator.getMonth() !== currMonth) {
					if (currMonthEl) {
						currMonthEl.attr({ colspan: currMonthSize });
					}
					currMonth = dateIterator.getMonth();
					currMonthSize = 0;
					currMonthEl = $('<th>' + monthNames[dateIterator.getMonth()] + ' ' + dateIterator.getFullYear() + '</th>');
					monthRow.append(currMonthEl);
				}
				var el = $(`<th>${dateIterator.getDate()}</th>`),
					dateString = dateIterator.toDateString();
				
				if (today.toDateString() === dateString) {
					el.addClass("important");
				}
				if (dateIterator.getDay() === 6) {
					el.addClass("markend");
				}
				this.options.collection.map(model => {
					if (model.has("icons")) {
						model.get("icons").map(icon => {
							if (icon.date.toDateString() === dateString) {
								el.append('<div class="deadline"></div>');
							}
						});
					}
				});
				dayRow.append(el);
				dateIterator.setDate(dateIterator.getDate() + 1);
				currMonthSize = currMonthSize + 1;
			}
			if (currMonthEl) {
				currMonthEl.attr({ colspan: currMonthSize });
			}
			this.$el.append(monthRow, dayRow);

			this.options.collection.forEach(model => {
				var row = $(`<tr class="jsgt_${model.get("id")}"></tr>`),
					elementView = new GanttElementView({
						model: model,
						firstDate: firstDate,
						types: this.options.types,
						collection: this.options.collection
					}),
					dateIterator = new Date(firstDate.getTime()),
					elementHolder = $('<div class="gantt-element-holder">&nbsp;</div>'),
					modelDate = model.get("startDate");

				if (model.has("parentElement")) {
					row.addClass("child");
				}

				var html = "",
					classes = [];

				while (dateIterator <= lastDate) {
					classes = "";
					
					if (dateIterator.getDay() === 6) {
						classes += " markend";
					}
					if (dateIterator.getDay() === 6 || dateIterator.getDay() === 0) {
						classes += " weekend";
					}
					html += `<td class="${classes}"><div class="cell ${dateIterator.getDate()}-${dateIterator.getMonth()}-${dateIterator.getFullYear()}">`;

					(model.get("icons") || []).forEach(icon => {
						if (icon.date.toDateString() === dateIterator.toDateString()) {
							html += `<div class="icon ${icon.type}">${icon.description}</div>`;
						}
					});

					html += '</div></td>';

					dateIterator.setDate(dateIterator.getDate() + 1);
				}

				row.append(html);

				row.click(e => this.trigger("row_click", e, model));
				row.mouseenter(e => this.trigger("row_enter", e, model));
				row.mouseleave(e => this.trigger("row_leave", e, model));
				row.find(`.${modelDate.getDate()}-${modelDate.getMonth()}-${modelDate.getFullYear()}`)
					.append(elementHolder.append(elementView.render().el));

				this.$el.append(row);
			});

			return this;
		}
	});

	// Options:
	//  collection: collection of type GanttElementCollection
	//  displayKey
	//  fields: array of fields
	//  types: mapping of types to name+colour
let GanttContainerView = Backbone.View.extend({
		className: "gantt-container",

		initialize() {

			this.dataView = new DataTableView({
				collection: this.options.collection,
				fields: this.options.fields,
				resources: this.options.resources
			});
			this.ganttView = new GanttTableView({
				collection: this.options.collection,
				types: this.options.types
			});

			this.$el = $(this.el);

			var rowClick = (e, model) => {
					this.trigger("row_click", e, model);
				},
				rowEnter = (e, model) => {
					this.dataView.highlight(model);
					this.ganttView.highlight(model);
					this.trigger("row_enter", e, model);
				},
				rowLeave = (e, model) => {
					this.dataView.highlight();
					this.ganttView.highlight();
					this.trigger("row_leave", e, model);
				};

			this.dataView.bind("row_click", rowClick);
			this.ganttView.bind("row_click", rowClick);

			this.dataView.bind("row_enter", rowEnter);
			this.ganttView.bind("row_enter", rowEnter);
			this.dataView.bind("row_leave", rowLeave);
			this.ganttView.bind("row_leave", rowLeave);
		},

		render() {
			this.$el.html('')
				.append(this.dataView.render().el, this.ganttView.render().el);
			if (this.options.displayKey) {
				let $key = $('<div class="gantt-key"></div>');
				$key.append(`<b>Key</p>`);
				Object.values(this.options.types).map(type => {
					$key.append(`<div><div class="color" style="background:${type.color}"></div>${type.name}</div>`)
				});
				this.$el.append($key);
			}
			setTimeout(() => {
				this.ganttView.$el.css({ marginLeft: this.dataView.$el.outerWidth() });
			});
			return this;
		}
	});

const defaultFields = ['name', 'resources', 'percentageDone', 'estimatedHours'];
class JSGanttChart {
	constructor({ displayKey = true, fields = defaultFields, types = {}, resources = {}, elements = [], localStorage = null } = {}) {

		this.collection = new GanttElementCollection(elements);

		if (localStorage) {
			this.collection.localStorage = localStorage;
			this.collection.fetch();
			this.collection.sort();
		}

		this.ganttView = new GanttContainerView({
			collection: this.collection,
			displayKey, fields, types, resources
		});

		this.ganttView.bind("row_click", (e, model) => {
			this.trigger("row_click", e, model);
		});
	}

	setElements(newelements) {}

	setTypes(newtypes) {}

	render() {
		return this.ganttView.render();
	}

	newElementModel() {
		var model = new GanttElementModel({
			id: Math.round(Math.random() * 1000000),
			name: "New stage",
			startDate: new Date()
		}, { collection: this.collection });
		this.collection.add(model);
		return model;
	}

	getJSON() {
		return this.collection.toJSON();
	}

	setJSON(json) {
		this.collection.reset(json);
	}

	trigger(event, data) {

	}
};

window.JSGanttChart = JSGanttChart;

}(jQuery, Backbone));