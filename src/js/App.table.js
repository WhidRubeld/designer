let table = class {
    constructor(opt) {
        this.id = opt.id;
        this.currFieldId = 1;

        this.name = opt.name;
        this.fields = [];
        this.primary = {
            increment: false,
            fields: []
        };
        this.foreigns = [];
        this.indexes = [];

        this.$instance = $(App.templates.schema.table({
            id: this.id,
            name: this.name
        }));

        this.$instance.appendTo('#schema');
    }
    addField(data) {
        data.id = this.currFieldId++;
        this.fields.push(data);
        this.updateUI();
    }
    editField(id, data) {
        this.fields.forEach(function (field) {
            if (field.id == id) {
                for (let attr in data) {
                    field[attr] = data[attr];
                }
                if (!data.defaultVal) {
                    delete field.defaultVal;
                }
            }
        });
        this.updateUI();
    }
    removeField(id) {
        var self = this;
        for (let i = 0; i < this.fields.length; i++) {
            if (this.fields[i].id == id) {
                this.fields.splice(i, 1);
                break;
            }
        }
        self.updateUI();
    }
    setPrimary(data) {
        this.primary = data;
        this.updateUI();
    }
    isPrimary(id) {
        for (let i = 0; i < this.primary.fields.length; i++) {
            if (this.primary.fields[i] == id) return i;
        }
        return false;
    }
    addForeign(data) {
        this.deleteAllConnection();
        this.foreigns.push(data);
        this.addAllConnection();
    }
    editForeign(id, data) {
        this.deleteAllConnection();
        this.foreigns[id] = data;
        this.addAllConnection();
    }
    removeForeign(id) {
        this.deleteAllConnection();
        this.foreigns.splice(id, 1);
        this.addAllConnection();
    }
    isForeign(id) {
        for (var i = 0; i < this.foreigns.length; i++) {
            if (this.foreigns[i].id == id) return i;
        }
        return false;
    }
    addIndex(data) {
        this.indexes.push(data);
    }
    editIndex(id, data) {
        this.indexes[id] = data;
    }
    removeIndex(id) {
        this.indexes.splice(id, 1);
    }
    getFieldById(id) {
        var result = false;
        this.fields.forEach(function (field) {
            if (field.id == id) {
                result = field;
            }
        });

        return result;
    }
    getFieldByName(name) {
        for (var i = 0; i < this.fields.length; i++) {
            if (this.fields[i].name == name) return this.fields[i];
        }

        return false;
    }
    deleteAllConnection() {
        var self = this;
        $.each(this.foreigns, function (i, foreign) {
            var conn = App.plumb.getConnections({
                source: 't-' + self.id + '-f-' + foreign.id,
                target: 't-' + foreign.table + '-f-' + foreign.onId
            });
            App.plumb.deleteConnection(conn[0]);
        });
    }
    addAllConnection() {
        var self = this;
        $.each(this.foreigns, function (i, foreign) {
            App.plumb.connect({
                source: 't-' + self.id + '-f-' + foreign.id,
                target: 't-' + foreign.table + '-f-' + foreign.onId
            });
        });
    }
    updateUI() {
        this.$instance.find('.name').text(this.name);
        var fieldsUI = '',
            self = this;

        this.deleteAllConnection();

        $.each(this.fields, function (index, field) {
            var primary = false;

            for (var i = 0; i < self.primary.fields.length; i++) {
                if (self.primary.fields[i] == field.id) {
                    primary = true;
                    break;
                }
            }

            fieldsUI += App.templates.schema.field({
                tableId: self.id,
                id: field.id,
                name: field.name,
                type: field.type,
                length: field.length,
                primary: primary
            });
        });
        this.$instance.find('.fields').html(fieldsUI);

        this.addAllConnection();

        App.minimap.refresh();
    }
};

export {table};