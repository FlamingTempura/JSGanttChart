/*jslint nomen: true*/
(function ($, _, Backbone) {
    'use strict';

    var root = window,

        jsgtThis,

        ganttView,
        collection,

        monthNames = [ "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December" ],

        fieldNames = {
            name: 'Project stage',
            resources: "Resources",
            percentageDone: "Status",
            estimatedHours: 'Estim. Hours'
        },

        mandatoryFields = ['id', 'name', 'startDate'],

        GanttElementModel = Backbone.Model.extend({
            defaults: {
                order: 0,
                name: undefined,
                description: undefined,
                startDate: undefined,
                endDate: undefined,
                slackEndDate: undefined,
                type: undefined,
                percentageDone: undefined,
                hoursExpected: undefined,
                resources: undefined,
                predecessors: undefined,
                icons: undefined
            },

            collection: undefined,

            initialize: function (model, options) {
                this.collection = options.collection;
                this.normalize();
                if (this.collection.hasOwnProperty("localStorage")) {
                    this.save();
                }
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
                        this.get("endDate").setDate(this.get("startDate").getDate() + this.get("duration"));
                        this.unset("duration");
                    } else {
                        this.get("endDate").setDate(this.get("startDate").getDate() + 1);
                    }
                }

                if (this.has("slackEndDate")) {
                    if (!_(this.get("slackEndDate")).isDate()) {
                        this.set({ slackEndDate: new Date(this.get("slackEndDate")) });
                    }
                } else if (this.has("slackDuration")) {
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
                    this.unset("elements");
                }

                if (this.has("icons")) {
                    _(this.get("icons")).each(function (icon) {
                        if (!_(icon.date).isDate()) {
                            icon.date = new Date(icon.date);
                        }
                    });
                }
            }
        }),

        GanttElementCollection = Backbone.Collection.extend({
            model: GanttElementModel,
            initialize: function (models, options) {
                var this_ = this,
                    triggerChange = function () { this_.trigger("change"); };

                this.bind("add", triggerChange);
                this.bind("remove", triggerChange);
                this.bind("reset", triggerChange);
            },

            add: function (models) {
                var i,
                    l;
                if (_.isArray(models)) {
                    for (i = 0, l = models.length; i < l; i = i + 1) {
                        this.add(models[i]);
                    }
                } else {
                    Backbone.Collection.prototype.add.call(this, models, { at: this.length }); // Order properly
                }
                return this;
            },

            sort: function (model) {
                var this_ = this;
                this.reset(collection.sortBy(function (model) {
                    var order;
                    if (model.has("parentElement") && this_.get(model.get("parentElement"))) { /// HACK
                        order = this_.get(model.get("parentElement")).get("order") + (0.00001 * model.get("order") + 0.00001);
                    } else {
                        order = model.get("order");
                    }
                    console.log(model.get("name"), "Order", order, "Parent", model.get("parentElement"))
                    return order;
                }));
            }
        }),

        /* options:
            fields
            */
        DataTableView = Backbone.View.extend({
            className: "gantt-data-table",
            tagName: "table",
            $el: undefined,

            initialize: function () {
                _.bindAll(this, "render");
                this.options.collection.bind("change", this.render);
                this.$el = $(this.el);
            },

            highlight: function (model) {
                if (model) {
                    this.$el.find('.jsgt_' + model.get("id"))
                        .addClass("highlight")
                        .siblings()
                        .removeClass("highlight");
                } else {
                    this.$el.find('tr').removeClass("highlight");
                }
            },

            render: function () {
                var this_ = this;

                this.$el.html('');

                // Populate headers
                this.$el.append($.fn.append.apply($('<tr></tr>'), _(this_.options.fields).map(function (field) {
                    return $('<th>' + fieldNames[field] + '</th>');
                })));

                // Populate data
                $.fn.append.apply(this.$el, this.options.collection.map(function (model) {
                    var row = $('<tr class="jsgt_' + model.get("id") + '"></tr>');
                    return $.fn.append.apply(row, _(this_.options.fields).map(function (field) {
                        var str = (model.has(field) ? model.get(field) : '');
                        if (field === "name" && model.get("parentElement") && model.get("parentElement").trim()) {
                            str = "&nbsp;&nbsp;&nbsp;&nbsp;" + str;
                            row.addClass("child");
                        } else if (field === "resources") {
                            str = _(model.get(field)).reduce(function (memo, resource) {
                                return (memo ? memo + ", " : "") + this_.options.resources[resource];
                            }, "");
                        } else if (field === "percentageDone") {
                            if (str === 100) {
                                str = '<div class="finished">Done</div>';
                            } else if (!str || str === 0) {
                                str = '<div class="not-started">Not started</div>';
                            } else {
                                str = '<div class="in-progress">In progress: ' + str + '%</div>';
                            }
                        }
                        return $('<td>' + (str || "&nbsp") + '</td>');
                    }))
                        .click(function (e) { this_.trigger("row_click", e, model); })
                        .mouseenter(function (e) { this_.trigger("row_enter", e, model); })
                        .mouseleave(function (e) { this_.trigger("row_leave", e, model); });
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

                this.$el.css({ width: noOfDays * 23 - 3 });

                if (model.has("type") && this.options.types.hasOwnProperty(model.get("type"))) {
                    this.$el.css({ borderBottomColor: this.options.types[model.get("type")].color });
                }

                if (model.has("percentageDone") && model.get("percentageDone") > 0) {
                    el = $('<div class="done"></div>');
                    el.css({ width: model.get("percentageDone") + "%" });
                    this.$el.append(el, $('<div class="donetext">' + (model.get("percentageDone") < 100 ? model.get("percentageDone") + "% done" : "Done") + '</div>'));
                }

                if (model.has("slackEndDate")) {
                    el = $('<div class="slack"><div class="slack-end"></div></div>');
                    noOfDays = Math.round((model.get("slackEndDate").getTime() - model.get("endDate").getTime()) / (24 * 60 * 60 * 1000));
                    el.css({ left: "100%", width: noOfDays * 23 });
                    this.$el.append(el);
                }

                if (model.has("predecessors")) {
                    $.fn.append.apply(this.$el, _(model.get("predecessors")).map(function (predecessor) {
                        var predecessorModel = this_.options.collection.get(predecessor);
                        if (predecessorModel) {
                            el = $('<div class="arrowline"><div class="arrowhead"></div></div>');
                            noOfDays = Math.round((model.get("startDate").getTime() - predecessorModel.get("endDate").getTime()) / (24 * 60 * 60 * 1000));
                            var noOfRows = collection.indexOf(model) - collection.indexOf(predecessorModel);
                            el.css({ right: "100%", bottom: "100%", width: noOfDays * 23, height: noOfRows * 17 - 5 });
                            return el;
                        }
                    }));
                }

                return this;
            }
        }),

        GanttTableView = Backbone.View.extend({
            className: "gantt-table",
            tagName: "table",
            $el: undefined,

            initialize: function () {
                _.bindAll(this, "render");
                this.options.collection.bind("change", this.render);
                this.$el = $(this.el);
            },

            highlight: function (model) {
                if (model) {
                    this.$el.find('.jsgt_' + model.get("id"))
                        .addClass("highlight")
                        .siblings()
                        .removeClass("highlight");
                } else {
                    this.$el.find('tr').removeClass("highlight");
                }
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
                    var el = $('<th>' + dateIterator.getDate() + '</th>'),
                        dateString = dateIterator.toDateString();
                    
                    if (today.toDateString() === dateString) {
                        el.addClass("important");
                    }
                    if (dateIterator.getDay() === 6) {
                        el.addClass("markend");
                    }
                    this.options.collection.map(function (model) {
                        if (model.has("icons")) {
                            model.get("icons").map(function (icon) {
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

                $.fn.append.apply(this.$el, this.options.collection.map(function (model) {
                    var row = $('<tr class="jsgt_' + model.get("id") + '"></tr>'),
                        elementView = new GanttElementView({
                            model: model,
                            firstDate: firstDate,
                            types: this_.options.types,
                            collection: this_.options.collection
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
                        html += '<td class="' + classes + '"><div class="cell ' + dateIterator.getDate() + "-" + dateIterator.getMonth() + "-" + dateIterator.getFullYear() + '">';

                        _(model.get("icons")).each(function (icon) {
                            if (icon.date.toDateString() === dateIterator.toDateString()) {
                                html += '<div class="icon ' + icon.type + '">' + icon.description + '</div>';
                            }
                        });

                        html += '</div></td>';

                        dateIterator.setDate(dateIterator.getDate() + 1);
                    }

                    row.append(html);

                    row.click(function (e) { this_.trigger("row_click", e, model); })
                        .mouseenter(function (e) { this_.trigger("row_enter", e, model); })
                        .mouseleave(function (e) { this_.trigger("row_leave", e, model); })
                        .find("." + modelDate.getDate() + "-" + modelDate.getMonth() + "-" + modelDate.getFullYear())
                        .append(elementHolder.append(elementView.render().el));

                    return row;
                }));

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
                    return '<div><div class="color" style="background:' + type.color + '"></div>' + type.name + '</div>';
                }));

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
                        this_.trigger("row_click", e, model);
                    },
                    rowEnter = function (e, model) {
                        this_.dataView.highlight(model);
                        this_.ganttView.highlight(model);
                        this_.trigger("row_enter", e, model);
                    },
                    rowLeave = function (e, model) {
                        this_.dataView.highlight();
                        this_.ganttView.highlight();
                        this_.trigger("row_leave", e, model);
                    };

                this.dataView.bind("row_click", rowClick);
                this.ganttView.bind("row_click", rowClick);

                this.dataView.bind("row_enter", rowEnter);
                this.ganttView.bind("row_enter", rowEnter);
                this.dataView.bind("row_leave", rowLeave);
                this.ganttView.bind("row_leave", rowLeave);
            },

            render: function () {
                var this_ = this;
                this.$el.html('')
                    .append(this.dataView.render().el, this.ganttView.render().el);
                if (this.options.displayKey) {
                    this.$el.append(this.keyView.render().el);
                }
                setTimeout(function () {
                    console.log(this_.dataView.$el.outerWidth())
                    this_.ganttView.$el.css({ marginLeft: this_.dataView.$el.outerWidth() });
                });
                return this;
            }
        }),

        JSGanttChart = root.JSGanttChart = function (options) {
            jsgtThis = this;

            if (!options) {
                options = {};
            }

            _(options).defaults({
                displayKey: true,
                fields: [ "name", "resources", "percentageDone", "estimatedHours" ],
                types: {},
                resources: {}
            });

            collection = new GanttElementCollection(options.elements);

            if (options.hasOwnProperty("localStorage")) {
                collection.localStorage = options.localStorage;
                collection.fetch();
                collection.sort();
            }

            ganttView = new GanttContainerView({
                collection: collection,
                displayKey: options.displayKey,
                fields: options.fields,
                types: options.types,
                resources: options.resources
            });

            ganttView.bind("row_click", function (e, model) {
                jsgtThis.trigger("row_click", e, model);
            });
        };

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

        render: function () {
            return ganttView.render();
        },

        newElementModel: function () {
            var model = new GanttElementModel({
                id: Math.round(Math.random() * 1000000),
                name: "New stage",
                startDate: new Date()
            }, { collection: collection });
            collection.add(model);
            return model;
        },

        getJSON: function () {
            return collection.toJSON();
        },

        setJSON: function (json) {
            collection.reset(json);
        }
    });

}(jQuery, _, Backbone));