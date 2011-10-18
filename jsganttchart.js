(function ($, _, Backbone) {
    'use strict';

    var root = window,

        jsgtThis = undefined,

        ganttView,
        
        monthNames = [ "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December" ],

        JSGanttChart = root.JSGanttChart = function (options) {
            jsgtThis = this;

            _(options).defaults({
                displayKey: true,
                fields: [ "name", "resources", "percentageDone", "estimatedHours" ]
            })

            var collection = new GanttElementCollection(options.elements);

            ganttView = new GanttContainerView({
                collection: collection,
                displayKey: options.displayKey,
                fields: options.fields,
                types: options.types,
                resources: options.resources
            });
        },

        fieldNames = {
            name: 'Project stage',
            resources: "Resources",
            percentageDone: "Status",
            estimatedHours: 'Estim. Hours'
        },

        mandatoryFields = ['id', 'name', 'startDate'],

        GanttElementModel = Backbone.Model.extend({
            defaults: {},
            collection: undefined,

            initialize: function (model, options) {
                this.collection = options.collection;
                this.normalize();
                window.m = this.collection;
            },

            normalize: function () {
                var this_ = this;
                // Ensure the element has all mandatory fields
                _(mandatoryFields).each(function (field) {
                    if (!this_.has(field)) {
                        throw "element " + this_.get("id") + " is missing " + field + ".";
                    }
                });

                if (!_(this.get("startDate")).isDate()) {
                    this.set({ startDate: new Date(this.get("startDate")) });
                }

                if (this.has("endDate") && !_(this.get("endDate")).isDate()) {
                    this.set({ endDate: new Date(this.get("endDate")) });
                }

                if (!this.has("endDate")) {
                    this.set({ endDate: new Date(this.get("startDate").getTime()) });
                    if (this.has("duration")) {
                        this.get("endDate").setDate(this.get("startDate").getDate() + element.duration);
                        this.unset("duration");
                    } else {
                        this.get("endDate").setDate(this.get("startDate").getDate() + 1);
                    }
                }

                if (this.has("slackDuration")) {
                    var date = new Date(this.get("endDate"));
                    date.setDate(date.getDate() + this.get("slackDuration"));
                    this.set({ slackEndDate: date });
                }

                if (this.has("elements")) {
                    this.collection.add(_(this.get("elements")).map(function (el) {
                        var element = _(el).clone();
                        element.parentElement = this_.get("id");
                        return element;
                    }));
                    this.unset("elements")
                }
            }
        }),

        GanttElementCollection = Backbone.Collection.extend({
            model: GanttElementModel,

            initialize: function () {
                var this_ = this,
                    triggerChange = function () { this_.trigger("change"); };
                
                this.bind("add", triggerChange);
                this.bind("remove", triggerChange);
                this.bind("reset", triggerChange);
            },

            add: function (models) {
                if (_.isArray(models)) {
                    for (var i = 0, l = models.length; i < l; i++) {
                        this.add(models[i]);
                    }
                } else {
                    Backbone.Collection.prototype.add.call(this, models, { at: this.length }); // Order properly
                }
                return this;
            }
        }),
        
        // Options:
        //  collection: collection of type GanttElementCollection
        //  displayKey
        //  fields: array of fields
        //  types: mapping of types to name+colour
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
                    fields: this.options.fields,
                    resources: this.options.resources
                });
                this.ganttView = new GanttTableView({ 
                    collection: this.options.collection,
                    types: this.options.types
                });
                this.keyView = new KeyView({ types: this.options.types });
                this.$el = $(this.el);

                var rowClick = function (e, model) {
                    this_.trigger("row_click", e, model)
                }

                this.dataView.bind("row_click", rowClick);
                this.ganttView.bind("row_click", rowClick);
            },

            render: function () {
                this.$el.html('')
                    .append(this.dataView.render().el, this.ganttView.render().el);
                if (this.options.displayKey) {
                    this.$el.append(this.keyView.render().el);
                }
                return this;
            }
        }),

        /* options:
            fields
            */
        DataTableView = Backbone.View.extend({
            className: "gantt-data-table",
            $el: undefined,

            initialize: function () {
                _.bindAll(this, "render");
                this.options.collection.bind("change", this.render);
                this.$el = $(this.el);
            },
            render: function () {
                this.$el.html('');
                var this_ = this,
                    table = jQuery('<table cellspacing="0"></table>');

                // Populate headers
                table.append($.fn.append.apply(jQuery('<tr></tr>'), _(this_.options.fields).map(function (field) { 
                    return jQuery('<th>' + fieldNames[field] + '</th>'); 
                })));

                // Populate data
                $.fn.append.apply(table, this.options.collection.map(function (model) {
                    var row = jQuery('<tr></tr>');
                    return $.fn.append.apply(row, _(this_.options.fields).map(function (field) {
                        var str = (model.has(field) ? model.get(field) : '');
                        if (field === "name" && model.has("parentElement")) {
                            str = "&nbsp;&nbsp;&nbsp;&nbsp;" + str;
                            row.addClass("child");
                        } else if (field === "resources") {
                            str = _(model.get(field)).reduce(function (memo, resource) {
                                return (memo ? memo + ", " : "") + this_.options.resources[resource];
                            }, "");
                        } else if (field === "percentageDone") {
                            if (str === 100) {
                                str = '<div class="finished">Done</div>';
                            } else if (!str) {
                                str = '<div class="not-started">Not started</div>';
                            } else {
                                str = '<div class="in-progress">In progress: ' + str + '%</div>';
                            }
                        }
                        return jQuery('<td>' + str + '</td>'); 
                    })).click(function (e) {
                        this_.trigger("row_click", e, model);
                        return false; 
                    });
                }));

                this.$el.append(table);
                
                return this;
            }
        }),

        GanttTableView = Backbone.View.extend({
            className: "gantt-table",
            $el: undefined,

            initialize: function () {
                _.bindAll(this, "render");
                this.options.collection.bind("change", this.render);
                this.$el = $(this.el);
            },
            
            render: function () {
                this.$el.html('');
                var this_ = this,
                    firstDate,
                    lastDate,
                    dateIterator,
                    today = new Date();

                // Determine when the gantt chart starts and finishes
                this.options.collection.each(function (model) {
                    var startDate = model.get("startDate").getTime(),
                        endDate = model.get("endDate").getTime();
                    firstDate = (!firstDate || startDate < firstDate) ? startDate : firstDate;
                    lastDate = (!lastDate || endDate > lastDate) ? endDate : lastDate;
                });

                firstDate = new Date(firstDate);
                lastDate = new Date(lastDate);

                var monthRow = jQuery('<div class="dates bl"></div>'),
                    dayRow = jQuery('<div class="dates"></div>'),
                    currMonth,
                    currMonthSize,
                    currMonthEl;

                dateIterator = new Date(firstDate.getTime());
                // Populate days
                while (dateIterator <= lastDate) {
                    if (dateIterator.getMonth() != currMonth) {
                        if (currMonthEl) {
                            currMonthEl.css({ width: currMonthSize * 25 - 1 });
                        }
                        currMonth = dateIterator.getMonth();
                        currMonthSize = 0;
                        currMonthEl = jQuery('<div class="cell">' + monthNames[dateIterator.getMonth()] + ' ' + dateIterator.getFullYear() + '</div>');
                        monthRow.append(currMonthEl);
                    }
                    var el = $('<div class="cell">' + dateIterator.getDate() + '</div>');
                    if (dateIterator.toDateString() === today.toDateString()) {
                        el.addClass("today");
                    }
                    if (dateIterator.getDay() === 6) {
                        el.addClass("markend");
                    }
                    dayRow.append(el);
                    dateIterator.setDate(dateIterator.getDate() + 1);
                    currMonthSize = currMonthSize + 1;
                }
                if (currMonthEl) {
                    currMonthEl.css({ width: currMonthSize * 25 - 1 });
                }
                this.$el.append(monthRow, dayRow);

                $.fn.append.apply(this.$el, this.options.collection.map(function (model) {
                    var row = jQuery('<div class="row"></div>'),
                        elementView = new GanttElementView({ 
                            model: model,
                            firstDate: firstDate,
                            types: this_.options.types,
                            collection: this_.options.collection
                        }),
                        dateIterator = new Date(firstDate.getTime()),
                        elementHolder = $('<div class="gantt-element-holder"></div>');

                    if (model.has("parentElement")) {
                        row.addClass("child");
                    }

                    row.append(elementHolder.append(elementView.render().el))
                        .click(function (e) { jsgtThis.trigger("row_click", e, model); });

                    while (dateIterator <= lastDate) {
                        var el = jQuery('<div class="cell"></div>');
                        if (dateIterator.getDay() === 6) {
                            el.addClass("markend");
                        }
                        if (dateIterator.getDay() === 6 || dateIterator.getDay() === 0) {
                            el.addClass("weekend");
                        }
                        row.append(el);
                        dateIterator.setDate(dateIterator.getDate() + 1);
                    }

                    return row;
                }));

                return this;
            }
        }),

        GanttElementView = Backbone.View.extend({
            className: "gantt-element",
            $el: undefined,

            initialize: function () {
                _.bindAll(this, "render");
                this.options.model.bind("change", this.render);
                this.$el = $(this.el);
            },

            render: function () {
                var this_ = this,
                    model = this.options.model,
                    noOfDays = Math.round((model.get("endDate").getTime() - model.get("startDate").getTime()) / (24 * 60 * 60 * 1000)),
                    dayFromStart = Math.round((model.get("startDate").getTime() - this.options.firstDate.getTime()) / (24 * 60 * 60 * 1000)),
                    el;
                    
                this.$el.css({ left: dayFromStart * 25, width: noOfDays * 25 });

                if (model.has("type") && this.options.types[model.get("type")]) {
                    this.$el.css({ background: this.options.types[model.get("type")].color });
                }

                if (model.has("percentageDone")) {
                    el = jQuery('<div class="done"></div>');
                    el.css({ width: model.get("percentageDone") + "%" });
                    this.$el.append(el, jQuery('<div class="donetext">' + (model.get("percentageDone") < 100 ? model.get("percentageDone") + "% done" : "Done" ) + '</div>'));
                }

                if (model.has("slackEndDate")) {
                    el = jQuery('<div class="slack"></div>');
                    noOfDays = Math.round((model.get("slackEndDate").getTime() - model.get("endDate").getTime()) / (24 * 60 * 60 * 1000)),
                    el.css({ left: "100%", width: noOfDays * 25 });
                    this.$el.append(el);
                }

                if (model.has("predecessors")) {
                    $.fn.append.apply(this.$el, _(model.get("predecessors")).map(function (predecessor) {
                        var predecessorModel = this_.options.collection.get(predecessor);
                        el = jQuery('<div class="arrowline"><div class="arrowhead"></div></div>');
                        noOfDays = Math.round((model.get("startDate").getTime() - predecessorModel.get("endDate").getTime()) / (24 * 60 * 60 * 1000));
                        var noOfRows = parseInt(model.cid.substr(1)) - parseInt(predecessorModel.cid.substr(1));
                        el.css({ right: "100%", bottom: "100%", width: noOfDays * 25, height: noOfRows * 19 - 7 });
                        return el;
                    }));
                }

                return this;
            }
        }),

        KeyView = Backbone.View.extend({
            className: "gantt-key",
            $el: undefined,

            initialize: function () {
                _.bindAll(this, "render");
                this.$el = $(this.el);
            },

            render: function () {
                this.$el.append("<b>Key</p>");

                $.fn.append.apply(this.$el, _(this.options.types).map(function (type) {
                    return $('<div><div class="color" style="background:' + type.color + '"></div>' + type.name + '</div>');
                }));

                return this;
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
        setElements: function (newelements) {},

        setTypes: function (newtypes) {},

        setElement: function (element) {
            _(elements).each(function (el) {
                if (el.id === element.id) {
                    _(el).extend(el); // Ewww... hacky
                }
            });
            console.log("Render?")
            gc.render();
        },

        render: function () {
            return ganttView.render();
        }
    });

}(jQuery, _, Backbone));