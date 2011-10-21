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
                    var html = field.type === "textarea" ? '<textarea rows="6" cols="60"></textarea>' : '<input type="text" value="">',
                        row = jQuery('<tr><th>' + field.name + '</th><td>' + html + '</td></tr>'),
                        input = row.find("input, textarea");
                    this_.fieldInputs.push(input);
                    switch (field.type) {
                        case "date":
                            input.datepicker({
                                dateformar: "D d M yy"
                            });
                            break;
                    }
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
                var this_ = this,
                    newsettings = {};
                _(this.options.fields).each(function (field, i) {
                    _(newsettings).extend(field.save(this_.model, this_.fieldInputs[i].val()));
                });
                this.model.save(newsettings);
            }
        }),
        
        DialogView = Backbone.View.extend({
            className: "dialog",
            $el: undefined,
            initialize: function () {
                this.dialogOptions = {
                    autoOpen: false,
                    show: "fade",
                    hide: "fade"
                };
                this.$el = $(this.el);
            },
            show: function () {
                this.$el.dialog("open");
            },
            hide: function () {
                this.$el.dialog("close");
            },
            render: function () {
                this.$el.dialog(this.dialogOptions);
                return this;
            }
        }),

        EditDialogView = DialogView.extend({
            fieldset: undefined,
            model: undefined,
            render: function () {
                var this_ = this,
                    apply = function () { this_.fieldset.save(); }
                
                _(this.dialogOptions).extend({
                    buttons: {
                        Apply: function () { apply.call(); },
                        OK: function () {
                            apply.call();
                            this_.hide();
                        },
                        Cancel: function () { this_.hide(); },
                        Delete: function () {
                            this_.model.destroy();
                            this_.hide();
                        }
                    },
                    title: "Add / Edit stage",
                    resizable: false,
                    width: 600
                });

                this.fieldset = new FieldSetView({
                    fields: [
                        { 
                            name: "ID", 
                            load: function (model) { return model.get("id"); }, 
                            save: function (model, value) { 
                                return { id: value };
                                model.collection.sort();
                            } },
                        { 
                            name: "Order", 
                            load: function (model) { return model.get("order"); }, 
                            save: function (model, value) { return { order: parseInt(value) }; } },
                        { 
                            name: "Name", 
                            load: function (model) { return model.get("name"); }, 
                            save: function (model, value) { return { name: value }; } },
                        { 
                            name: "Description",
                            type: "textarea",
                            load: function (model) { return model.get("description"); }, 
                            save: function (model, value) { return { description: value }; } },
                        { 
                            name: "Start date", 
                            type: "date",
                            load: function (model) { return model.get("startDate"); }, 
                            save: function (model, value) { return { startDate: value ? new Date(value) : undefined }; } },
                        { 
                            name: "End date", 
                            type: "date",
                            load: function (model) { return model.get("endDate"); }, 
                            save: function (model, value) { return { endDate: value ? new Date(value) : undefined }; } },
                        { 
                            name: "Slack end date", 
                            type: "date",
                            load: function (model) { return model.get("slackEndDate"); }, 
                            save: function (model, value) { return { slackEndDate: value ? new Date(value) : undefined }; } },
                        { 
                            name: "Type", 
                            load: function (model) { return model.get("type"); }, 
                            save: function (model, value) { return { type: value }; } },
                        { 
                            name: "Parent", 
                            load: function (model) { return model.get("parentElement"); }, 
                            save: function (model, value) { console.log({ parentElement: value.trim() === "" ? undefined : value.trim() });return { parentElement: value.trim() === "" ? undefined : value.trim() }; } },
                        { 
                            name: "Percentage done", 
                            load: function (model) { return model.get("percentageDone"); }, 
                            save: function (model, value) { return { percentageDone: value === undefined ? undefined : parseInt(value) }; } },
                        { 
                            name: "Hours expected", 
                            load: function (model) { return model.get("estimatedHours"); }, 
                            save: function (model, value) { return { estimatedHours: value === undefined ? undefined : parseInt(value) }; } },
                        { 
                            name: "Resource (comma separated)", 
                            load: function (model) { return (model.get("resources") || []).join(", "); }, 
                            save: function (model, value) { 
                                return { resources: _(value.split(",")).chain()
                                    .map(function (r) { return r.trim(); })
                                    .reject(function (r) { return r === ""; }).value() };
                            }
                        },
                        { 
                            name: "Predecessors (dependancies,<br />comma separated)", 
                            load: function (model) { return (model.get("predecessors") || []).join(", "); }, 
                            save: function (model, value) { 
                                return { predecessors: _(value.split(",")).chain()
                                    .map(function (r) { return r.trim(); })
                                    .reject(function (r) { return r === ""; }).value() };
                            }
                        },
                        { 
                            name: "Icons",
                            type: "textarea",
                            load: function (model) { return JSON.stringify(model.get("icons") || []); }, 
                            save: function (model, value) { 
                                var icons = JSON.parse(value);
                                _(icons).each(function (icon) {
                                    icon.date = new Date(icon.date);
                                });
                                return { icons: icons }; 
                            }
                        }
                    ]
                });

                this.$el.html("").append(this.fieldset.render().el);
                return DialogView.prototype.render.apply(this);
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

                return DialogView.prototype.render.apply(this);
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
                this.$el.html("").append(this.gantt.render().el, this.toolbar.render().el);
                this.editDialog.render();
                this.jsonDialog.render();
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