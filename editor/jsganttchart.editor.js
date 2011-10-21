/*jslint nomen: true*/
(function ($, _, Backbone, JSGanttChart) {
    'use strict';

    var ToolbarView = Backbone.View.extend({
            className: "toolbar",
            $el: undefined,

            initialize: function () {
                this.$el = $(this.el);
            },

            render: function () {
                var this_ = this;
                $.fn.append.apply(this.$el.html(""), _(this.options.buttons).map(function (button) {
                    return jQuery('<input type="button" value="' + button.name + '">')
                        .click(function () {
                            button.action.call(this_);
                        });
                }));
                return this;
            }
        }),

        FieldSetView = Backbone.View.extend({
            className: "fieldset",
            tagName: "table",
            $el: undefined,
            fieldInputs: undefined,
            model: undefined,
            initialize: function () {
                this.$el = $(this.el);
            },
            render: function () {
                var this_ = this;
                this.fieldInputs = [];
                $.fn.append.apply(this.$el.html(""), _(this.options.fields).map(function (field) {
                    var row = jQuery('<tr><th>' + field.name + '</th><td><input type="text" value=""></td></tr>');
                    this_.fieldInputs.push(row.find("input"));
                    return row;
                }));
                return this;
            },
            load: function (model) {
                var this_ = this;
                this.model = model;
                _(this.options.fields).each(function (field, i) {
                    this_.fieldInputs[i].val(field.load(model));
                });
            },
            save: function() {
                var this_ = this;
                _(this.options.fields).each(function (field, i) {
                    field.save(this_.model, this_.fieldInputs[i].val());
                });
                this.model.save();
            }
        }),
        
        DialogView = Backbone.View.extend({
            className: "dialog",
            $el: undefined,
            initialize: function () {
                this.$el = $(this.el);
            },
            show: function () {
                this.$el.fadeIn();
            },
            hide: function () {
                this.$el.fadeOut();
            }
        }),

        EditDialogView = DialogView.extend({
            fieldset: undefined,
            model: undefined,
            render: function () {
                var this_ = this,
                    apply = function () {
                        this_.fieldset.save();
                    },
                    toolbar = new ToolbarView({
                        buttons: [
                            {
                                name: "Apply",
                                action: function () {
                                    apply.call();
                                }
                            },
                            {
                                name: "OK",
                                action: function () {
                                    apply.call();
                                    this_.hide();
                                }
                            },
                            {
                                name: "Cancel",
                                action: function () {
                                    this_.hide();
                                }
                            },
                            {
                                name: "Delete",
                                action: function () {
                                    this_.model.destroy();
                                    this_.hide();
                                }
                            },
                        ]
                    });
                
                this.fieldset = new FieldSetView({
                    fields: [
                        { 
                            name: "ID", 
                            load: function (model) { return model.get("id"); }, 
                            save: function (model, value) { model.set({ id: value }); } },
                        { 
                            name: "Name", 
                            load: function (model) { return model.get("name"); }, 
                            save: function (model, value) { model.set({ name: value }); } },
                        { 
                            name: "Start date", 
                            load: function (model) { return model.get("startDate"); }, 
                            save: function (model, value) { model.set({ startDate: value ? new Date(value) : undefined }); } },
                        { 
                            name: "End date", 
                            load: function (model) { return model.get("endDate"); }, 
                            save: function (model, value) { model.set({ endDate: value ? new Date(value) : undefined }); } },
                        { 
                            name: "Slack end date", 
                            load: function (model) { return model.get("slackEndDate"); }, 
                            save: function (model, value) { model.set({ slackEndDate: value ? new Date(value) : undefined }); } },
                        { 
                            name: "Type", 
                            load: function (model) { return model.get("type"); }, 
                            save: function (model, value) { model.set({ type: value }); } },
                        { 
                            name: "Percentage done", 
                            load: function (model) { return model.get("percentageDone"); }, 
                            save: function (model, value) { model.set({ percentageDone: parseInt(value) }); } },
                        { 
                            name: "Hours expected", 
                            load: function (model) { return model.get("hoursExpected"); }, 
                            save: function (model, value) { model.set({ hoursExpected: parseInt(value) }); } },
                        { 
                            name: "Resource (comma separated)", 
                            load: function (model) { return (model.get("resources") || []).join(", "); }, 
                            save: function (model, value) { 
                                model.set({ resources: _(value.split(",")).chain()
                                    .map(function (r) { return r.trim(); })
                                    .reject(function (r) { return r === ""; }).value() });
                            }
                        },
                        { 
                            name: "Predecessors (dependancies,<br />comma separated)", 
                            load: function (model) { return (model.get("predecessors") || []).join(", "); }, 
                            save: function (model, value) { 
                                model.set({ predecessors: _(value.split(",")).chain()
                                    .map(function (r) { return r.trim(); })
                                    .reject(function (r) { return r === ""; }).value() });
                            }
                        }
                    ]
                });

                this.$el.html("").append(this.fieldset.render().el, toolbar.render().el).hide();
                return this;
            },
            load: function (model) {
                this.model = model;
                this.fieldset.load(model);
            }
        }),

        JSONDialogView = DialogView.extend({
            textarea: undefined,

            render: function () {
                var this_ = this,
                    textarea = jQuery("<textarea></textarea>"),
                    apply = function () {
                        this_.options.gantt.setJSON(JSON.parse(this_.val()));
                    },
                    toolbar = new ToolbarView({
                        buttons: [
                            {
                                name: "Apply",
                                action: function () {
                                    apply.call();
                                }
                            },
                            {
                                name: "OK",
                                action: function () {
                                    apply.call();
                                    this_.hide();
                                }
                            },
                            {
                                name: "Cancel",
                                action: function () {
                                    this_.hide();
                                }
                            },
                        ]
                    });

                this.textarea = textarea;

                this.$el.html("").append(textarea, toolbar.render().el).hide();

                return this;
            },
            val: function () { return $.fn.val.apply(this.textarea, arguments); }
        }),

        EditorView = Backbone.View.extend({
            className: "editor",
            $el: undefined,
            gantt: undefined,
            editDialog: undefined,
            jsonDialog: undefined,
            toolbar: undefined,

            initialize: function () {
                var this_ = this;
                this.$el = $(this.el);
                this.gantt = this.options.gantt;
                this.editDialog = new EditDialogView();
                this.jsonDialog = new JSONDialogView({ gantt: this.gantt });
                this.toolbar = new ToolbarView({
                    buttons: [
                        {
                            name: "New Stage",
                            action: function () {
                                this_.editDialog.load(this_.gantt.newElementModel());
                                this_.editDialog.show();
                            }
                        },
                        {
                            name: "View Resources",
                            action: function () {
                                this_.resourcesDialog.show();
                            }
                        },
                        {
                            name: "View Types",
                            action: function () {
                                this_.resourcesDialog.show();
                            }
                        },
                        {
                            name: "View/Edit JSON",
                            action: function () {
                                this_.jsonDialog.val(JSON.stringify(this_.gantt.getJSON(), undefined, "    "));
                                this_.jsonDialog.show();
                            }
                        }
                    ]
                });

                this.gantt.bind("row_click", function (e, model) {
                    e.preventDefault();
                    e.stopPropagation();
                    this_.editDialog.load(model);
                    this_.editDialog.show();
                });
            },
            render: function () {
                this.$el.html("").append(this.gantt.render().el, this.toolbar.render().el, 
                    this.editDialog.render().el, this.jsonDialog.render().el);
                return this;
            }
        }),

        editor;

    JSGanttChart.Editor = function (options) {
        editor = new EditorView({ gantt: options.gantt });
    };

    _(JSGanttChart.Editor).extend({
        create: function () {
            var F = function () {}, // Dummy function
                o;
            F.prototype = JSGanttChart.Editor.prototype;
            o = new F();
            JSGanttChart.Editor.apply(o, arguments);
            o.constructor = JSGanttChart.Editor;
            return o;
        }
    });

    _(JSGanttChart.Editor.prototype).extend(Backbone.Events, {
        render: function () {
            return editor.render();
        }
    });

}(jQuery, _, Backbone, JSGanttChart));