let events = function () {

    'use strict';

    // функция поиска по массиву
    var find = function (array, value) {
        for (var i = 0; i < array.length; i++) {
            if (array[i] == value) return i;
        }
        return -1;
    };
    // функция очистки проекта
    var cleanProject = function () {
        App.plumb.deleteEveryConnection();
        App.plumb.deleteEveryEndpoint();

        App.DB.tables.forEach(function (currTable) {
            App.plumb.remove(currTable.instance.$instance);
            //currTable.instance.$instance.remove();
        });

        App.DB.tables = [];
        App.DB.currTableId = 1;

        App.minimap.refresh();
    };

    var importProject = function (data) {
        cleanProject();

        data.tables.forEach(function (t) {
            var table = App.DB.addTable(t.name, t.id);
            table.currFieldId = t.currFieldId;
            table.fields = t.fields;
            table.primary = t.primary;
            table.foreigns = t.foreigns;
            table.indexes = t.indexes;
            table.$instance.css('left', t.position.x);
            table.$instance.css('top', t.position.y);
        });

        App.DB.currTableId = data.currTableId;

        App.DB.tables.forEach(function (table) {
            table.instance.updateUI();
        });

        App.minimap.refresh();
    }

    var getDataInFile = function (file, callback){
        var reader = new FileReader();
        reader.onload = function() { 
            callback(reader.result); 
        };
        reader.readAsText(file);
    }

    $('#menu .open').on('click', function() {
        App.sidenav.init({
            title: 'Меню',
            content: App.templates.menu()
        });
    });

    // export data
    $(document).on('click', '#export', function (e) {
        e.preventDefault();

        if (!App.DB.tables.length) {
            M.toast({
                html: 'Нет таблиц, чтобы экспортировать проект',
                classes: 'red darken-1'
            });

            return;
        }

        var data = {
            currTableId: App.DB.currTableId,
            tables: []
        };

        App.DB.tables.forEach(function (currTable) {
            var table = {};
            table.id = currTable.instance.id;
            table.name = currTable.instance.name;
            table.currFieldId = currTable.instance.currFieldId;
            table.fields = currTable.instance.fields;
            table.primary = currTable.instance.primary;
            table.foreigns = currTable.instance.foreigns;
            table.indexes = currTable.instance.indexes;
            table.position = {
                x: currTable.instance.$instance.css('left'),
                y: currTable.instance.$instance.css('top')
            };

            data.tables.push(table);
        });

        data = JSON.stringify(data);

        var link = document.createElement('a');
        var csvData = 'data:plain/text;charset=utf-8,' + encodeURIComponent(data);
        link.setAttribute('href', csvData)
        link.setAttribute('download', 'my_database.json')
        link.click();

        M.toast({
            html: 'Скачивание JSON файла с данными сцены',
            //classes: 'green'
        });
    });

    // import data
    $(document).on('click', '#import', function (e) {
        e.preventDefault();

        App.modal.init({
            content: App.templates.import(),
            submitText: 'Импортировать',
            onSubmit: function (data) {
                if (App.DB.tables.length) {
                    if (!confirm('Текущий проект не пуст. Все данные будут безвозвратно удалены. Вы уверены?')) return;
                }

                var file = document.getElementById('file');
            
                getDataInFile(file.files[0], function(content) {
                    importProject(JSON.parse(content));
                });

                M.toast({
                    html: 'Данные успешно импортированы. Сцена обновлена',
                    classes: 'green'
                });

                return true;

            },
        });
    });

    // очистка проекта
    $(document).on('click', '#clean', function (e) {
        e.preventDefault();

        if (!App.DB.tables.length) {
            M.toast({
                html: 'Проект пустой. Очистка не требуется'
            });
            return;
        } else {
            if (!confirm('Все данные будут безвозвратно удалены. Вы уверены?')) return;
        }

        cleanProject();

        M.toast({
            html: 'Проект успешно сброшен',
            classes: 'green'
        });
    });

    // запуск тестового проекта
    $(document).on('click', '#test-project', function(e) {
        e.preventDefault();

        if(App.DB.tables.length) {
            if (!confirm('Текущий проект не пуст. Все данные будут безвозвратно удалены. Вы уверены?')) return;
        }

        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", 'test.json', false);
        xmlhttp.send();

        importProject(JSON.parse(xmlhttp.responseText));

        M.toast({
            html: 'Тестовый проект успешно загружен',
            classes: 'green'
        });
    });

    // ПРОСМОТР КОДА ТАБЛИЦЫ
    $(document).on('click', '#code-view', function (e) {
        e.preventDefault();

        if (!App.DB.tables.length) {
            M.toast({
                html: 'Проект пуст. Поэтому код тоже пуст...'
            });
            return;
        }

        // &#9; - табуляция
        // &nbsp; - пробел
        // &#10; - переход строки
        var symbols = {
            tab: '  ',
            feed: '&#10;',
            spec: '`',
            quote: "'"
        };

        var code = '';

        // CREATE TABLES...
        var stateTables = [],
            status = false,
            tables = App.DB.tables;

        while (!status) {
            tables.forEach(function (curr) {
                if (find(stateTables, curr.id) == -1) {
                    var instance = curr.instance;
                    if (instance.foreigns.length) {
                        for (var i = 0; i < instance.foreigns.length; i++) {
                            if (find(stateTables, instance.foreigns[i].table) == -1) return;
                        }
                    }
                    code += 'CREATE TABLE ' + symbols.spec + instance.name + symbols.spec + ' (' + symbols.feed;
                    for (var i = 0; i < instance.fields.length; i++) {
                        code += symbols.tab + symbols.spec + instance.fields[i].name + symbols.spec + ' ' + instance.fields[i].type;
                        if (instance.fields[i].length) code += '(' + instance.fields[i].length + ')';
                        if (instance.fields[i].attribute) code += ' ' + instance.fields[i].attribute;
                        if (!instance.fields[i].nullable) code += ' NOT NULL';
                        if (instance.isPrimary(instance.fields[i].id) !== false && instance.primary.increment) code += ' AUTO_INCREMENT';
                        if (instance.fields[i].default) {
                            code += ' DEFAULT ';
                            if (instance.fields[i].defaultVal) {
                                code += symbols.quote + instance.fields[i].defaultVal + symbols.quote;
                            } else {
                                code += 'NULL';
                            }
                        }

                        if (i + 1 != instance.fields.length) code += ',' + symbols.feed;
                    }
                    if (instance.primary.fields.length) {
                        var arr = instance.primary.fields;
                        code += ',' + symbols.feed + symbols.feed + symbols.tab + 'PRIMARY KEY (';
                        for (var i = 0; i < arr.length; i++) {
                            code += symbols.spec + instance.getFieldById(arr[i]).name + symbols.spec;
                            if (i + 1 != arr.length) code += ',';
                        }
                        code += ')';
                    }

                    if (instance.foreigns.length) {
                        var arr = instance.foreigns;
                        code += ',' + symbols.feed + symbols.feed;
                        for (let i = 0; i < arr.length; i++) {
                            var onTable = App.DB.getTableById(arr[i].table);
                            code += symbols.tab + 'FOREIGN KEY (' + symbols.spec + instance.getFieldById(arr[i].id).name + symbols.spec + ')';
                            code += ' REFERENCES ' + symbols.spec + onTable.name + symbols.spec;
                            code += '(' + symbols.spec + onTable.getFieldById(arr[i].onId).name + symbols.spec + ')';
                            if (arr[i].delete != 'RESTRICT') code += symbols.feed + symbols.tab + 'ON DELETE ' + arr[i].delete;
                            if (arr[i].update != 'RESTRICT') code += symbols.feed + symbols.tab + 'ON UPDATE ' + arr[i].update;
                            if (i + 1 != arr.length) code += ',' + symbols.feed + symbols.feed;
                        }
                    }

                    if (instance.indexes.length) {
                        var arr = instance.indexes;
                        code += ',' + symbols.feed + symbols.feed;
                        for (let i = 0; i < arr.length; i++) {
                            code += symbols.tab + arr[i].type + ' (';
                            for (let j = 0; j < arr[i].fields.length; j++) {
                                code += symbols.spec + instance.getFieldById(arr[i].fields[j]).name + symbols.spec;
                                if (j + 1 != arr[i].fields.length) code += ', ';
                            }
                            code += ')';
                            if (i + 1 != arr.length) code += ',' + symbols.feed + symbols.feed;
                        }
                    }

                    code += symbols.feed;
                    code += ');' + symbols.feed + symbols.feed;
                    stateTables.push(curr.id);
                }
            });
            if (stateTables.length == tables.length) status = true;
        }


        App.modal.init({
            name: 'code',
            content: App.templates.viewCode({
                code: code
            }),
            isForm: false
        });

        hljs.highlightBlock(document.querySelector('#code pre code'));
    });

    // ДОБАВЛЕНИЕ НОВОЙ ТАБЛИЦЫ
    $(document).on('click', '#add-table', function (e) {
        e.preventDefault();

        App.modal.init({
            content: App.templates.addTable(),
            submitText: 'Добавить таблицу',
            onSubmit: function (data) {
                var name = data.get('name');

                for (var i = 0; i < App.DB.tables.length; i++) {
                    if (name == App.DB.tables[i].instance.name) {
                        M.toast({
                            html: 'Таблица с именем ' + name + ' уже существует',
                            classes: 'red darken-1'
                        });
                        return false;
                    }
                }

                App.DB.addTable(data.get('name'));

                M.toast({
                    html: 'Таблица ' + name + ' успешно создана',
                    classes: 'green'
                });

                App.minimap.refresh();

                return true;
            },
        });
    });

    // ON/OFF КАРТЫ
    $('#minimap-status').on('change', function () {
        $(this).prop('checked') ? $('#minimap').show() : $('#minimap').hide();
    });


    // НАСТРОЙКИ ТАБЛИЦЫ

    /* ------------------ FIELDS ------------------- */
    $(document).on('click', '.table .options', function () {
        var data = $(this).parents('.table').attr('id'),
            tableId = data.split('-')[1],
            table = App.DB.getTableById(tableId);

        App.sidenav.init({
            name: 'tableOptions',
            title: table.name,
            content: App.templates.tableOptions({
                fields: table.fields.length,
                primary: table.primary.fields.length,
                foreigns: table.foreigns.length,
                indexes: table.indexes.length
            }),
            onOpen: function ($sidenav) {
                App.currTable = table;
            },
            closeText: 'Закрыть панель параметров',
            onClose: function () {
                delete App.currTable;
            }
        });
    });

    // Изменение имени таблицы
    $(document).on('click', '#tableOptions .editName', function (e) {
        e.preventDefault();

        var table = App.currTable;

        App.modal.init({
            name: 'editName',
            content: App.templates.editTableName({
                name: table.name
            }),
            submitText: 'Сохранить',
            onSubmit: function (data) {
                var name = data.get('name');
                for (var i = 0; i < App.DB.tables.length; i++) {
                    var currTable = App.DB.tables[i].instance;
                    if (currTable.id != table.id) {
                        if (name == currTable.name) {
                            M.toast({
                                html: 'Таблица с таким именем уже существует',
                                classes: 'red darken-1'
                            });
                            return false;
                        }
                    }
                }

                table.name = name;
                table.updateUI();

                App.sidenav.updateTitle(table.name);

                M.toast({
                    html: 'Имя таблицы успешно изменено',
                    classes: 'green'
                });

                return true;
            }
        });

    });

    // Удаление таблицы
    $(document).on('click', '#tableOptions .deleteTable', function (e) {
        e.preventDefault();

        var table = App.currTable;

        for (var i = 0; i < App.DB.tables.length; i++) {
            var currTable = App.DB.tables[i].instance;
            if (currTable.id != table.id && currTable.foreigns.length) {
                for (var j = 0; j < currTable.foreigns.length; j++) {
                    var foreign = currTable.foreigns[j];
                    if (foreign.table == table.id) {
                        M.toast({
                            html: 'Таблица ' + currTable.name + ' связана с данной таблицей. Удаление невозможно',
                            classes: 'red darken-1'
                        });

                        return;
                    }
                }
            }
        }

        if (!confirm('Вы уверены, что хотите удалить данную таблицу?')) return;

        for (var i = 0; i < App.DB.tables.length; i++) {
            if (App.DB.tables[i].id == table.id) {
                App.plumb.remove('t-' + table.id);
                App.DB.tables.splice(i, 1);
                break;
            }
        }
        $('.sidenav').sidenav('close');

        M.toast({
            html: 'Таблица успешно удалена',
            classes: 'green'
        });
    });

    // Просмотр полей таблицы
    $(document).on('click', '#tableOptions .fields', function (e) {
        e.preventDefault();

        var table = App.currTable;

        App.modal.init({
            name: 'tableFields',
            content: App.templates.fields.view({
                fields: table.fields
            }),
            closeText: 'Закрыть',
            isForm: false
        });
    });

    //
    $(document).on('click', '#tableFields .add', function () {
        var table = App.currTable,
            types = [],
            attrs = [];

        for (var typeName in App.DB.fieldTypes) {
            types.push(typeName);
            if (App.DB.fieldTypes[typeName].attribute) {
                var status = false;
                attrs.forEach(function (attr) {
                    if (attr == App.DB.fieldTypes[typeName].attribute) {
                        status = true;
                    }
                });
                if (!status) {
                    attrs.push(App.DB.fieldTypes[typeName].attribute);
                }
            }
        }

        App.editor.init({
            name: 'addField',
            content: App.templates.fields.editor({
                fieldTypes: types,
                attributes: attrs,
            }),
            submitText: 'Добавить',
            onSubmit: function (formData) {
                if (table.getFieldByName(formData.get('name'))) {
                    M.toast({
                        html: 'Поле с таким именем уже существует в данной таблице',
                        classes: 'red darken-1'
                    });
                    return false;
                }

                var data = {},
                    typeName = formData.get('type'),
                    type = App.DB.fieldTypes[typeName];

                data.name = formData.get('name');
                data.type = typeName;
                data.length = formData.get('length') ? formData.get('length') : false;

                data.nullable = formData.get('nullable') ? false : true;

                if (type.default) {
                    data.default = formData.get('default') == '0' ? false : formData.get('default');
                    if (data.default == 'own') {
                        data.defaultVal = formData.get('defaultOwn');
                    }
                }
                if (type.attribute) {
                    data.attribute = formData.get('attribute') == '0' ? false : formData.get('attribute');
                }

                table.addField(data);

                App.sidenav.updateContent(App.templates.tableOptions({
                    fields: table.fields.length,
                    primary: table.primary.fields.length,
                    foreigns: table.foreigns.length,
                    indexes: table.indexes.length
                }));

                App.modal.updateContent(App.templates.fields.view({
                    fields: table.fields
                }));

                M.toast({
                    html: 'Поле успешно добавлено',
                    classes: 'green'
                });
                return true;
            }
        });

        var instance = $('#addField'),
            type = instance.find('[name="type"]'),
            length = instance.find('[name="length"]'),
            def = instance.find('[name="default"]'),
            defOwn = instance.find('[name="defaultOwn"]'),
            attribute = instance.find('[name="attribute"]');

        type.on('change', function () {
            var value = $(this).val(),
                fieldType = App.DB.fieldTypes[value];

            if (fieldType.length) {
                length.prop('disabled', false)
                    .prop('required', fieldType.length.required ? true : false)
            } else {
                length.attr('type', 'text')
                    .prop('disabled', true)
            }
            length.val('');
            if (fieldType.default) {
                def.prop('disabled', false);
            } else {
                def.prop('disabled', true);
            }

            def.val('0')
                .change();

            attribute.val('0');

            attrs.forEach(function (attrName) {
                if (fieldType.attribute && fieldType.attribute == attrName) {
                    attribute.find('[value="' + attrName + '"]')
                        .prop('disabled', false);

                } else {
                    attribute.find('[value="' + attrName + '"]')
                        .prop('disabled', true);
                }
            });
        });

        def.on('change', function () {
            if ($(this).val() == 'own') {
                $('#addField .defaultOwn').show();
                defOwn.prop('required', true);
            } else {
                $('#addField .defaultOwn').hide();
                defOwn.val('').prop('required', false);
            }
        });

        type.change();

    });

    //
    $(document).on('click', '#tableFields .edit', function () {
        var table = App.currTable,
            fieldId = $(this).data('id'),
            data = table.getFieldById(fieldId),
            types = [],
            attrs = [];

        for (var typeName in App.DB.fieldTypes) {
            types.push(typeName);
            if (App.DB.fieldTypes[typeName].attribute) {
                var status = false;
                attrs.forEach(function (attr) {
                    if (attr == App.DB.fieldTypes[typeName].attribute) {
                        status = true;
                    }
                });
                if (!status) {
                    attrs.push(App.DB.fieldTypes[typeName].attribute);
                }
            }
        }

        App.editor.init({
            name: 'editField',
            content: App.templates.fields.editor({
                fieldTypes: types,
                attributes: attrs
            }),
            submitText: 'Сохранить',
            onSubmit: function (formData) {
                var newData = {},
                    typeName = formData.get('type'),
                    type = App.DB.fieldTypes[typeName];

                newData.name = formData.get('name');
                newData.type = typeName;
                newData.length = formData.get('length') ? formData.get('length') : false;
                newData.nullable = formData.get('nullable') ? false : true;

                if (type.default) {
                    newData.default = formData.get('default') == '0' ? false : formData.get('default');
                    if (newData.default == 'own') {
                        newData.defaultVal = formData.get('defaultOwn');
                    }
                }
                if (type.attribute) {
                    newData.attribute = formData.get('attribute') == '0' ? false : formData.get('attribute');
                }

                var testField = table.getFieldByName(newData.name);
                if (testField != false && testField.id != data.id) {
                    M.toast({
                        html: 'Поле с таким именем уже существует в данной таблице',
                        classes: 'red darken-1'
                    });
                    return false;
                }

                var status = table.isPrimary(data.id);
                if (status !== false && (newData.type != data.type || newData.attribute != data.attribute)) {
                    for (var i = 0; i < App.DB.tables.length; i++) {
                        var currTable = App.DB.tables[i].instance;
                        if (currTable.id != table.id) {
                            for (var j = 0; j < currTable.foreigns.length; j++) {
                                var foreign = currTable.foreigns[j];
                                if (foreign.table == table.id && foreign.onId == data.id) {
                                    M.toast({
                                        html: 'На данное поле ссылается внешний ключ. Запрещено изменять тип или атрибут',
                                        classes: 'red darken-1'
                                    });
                                    return false;
                                }
                            }
                        }
                    }
                }

                if ((newData.type != data.type || newData.attribute != data.attribute) && table.isForeign(data.id) !== false) {
                    M.toast({
                        html: 'Данное поле является внешним ключом, которое ссылается на поле другой таблицы. Изменение типа или атрибута запрещено',
                        classes: 'red darken-1'
                    });
                    return false;
                }

                if (status !== false && (newData.nullable || newData.default)) {
                    M.toast({
                        html: 'Данное поле является частью первичного ключа, которое не может иметь значение по умолчанию и не может быть NULL',
                        classes: 'red darken-1'
                    });
                    return false;
                }

                if (status !== false && table.primary.increment) {
                    var status2 = false;
                    for (var i = 0; i < App.DB.incrementFields.length; i++) {
                        if (newData.type == App.DB.incrementFields[i]) {
                            status2 = true;
                            break;
                        }
                    }
                    if (!status2) {
                        M.toast({
                            html: 'Данное поле является первичным ключом с авто-инкрементом. Выбранный вами тип не поддерживает авто-инкремент. Изменение невозможно',
                            classes: 'red darken-1'
                        });
                        return false;
                    }
                }

                if (newData.type != data.type) {
                    for (var i = 0; i < table.indexes.length; i++) {
                        reset: for (var j = 0; j < table.indexes[i].fields.length; j++) {
                            var currField = table.indexes[i].fields[j];
                            if (currField == data.id) {
                                for (var k = 0; k < App.DB.indexes.length; k++) {
                                    if (App.DB.indexes[k].name == table.indexes[i].type) {
                                        var allowed = App.DB.indexes[k].allowedFields;
                                        for (var f = 0; f < allowed.length; f++) {
                                            if (allowed[f] == newData.type) break;
                                            if (f == allowed.length - 1) {
                                                M.toast({
                                                    html: 'Данное поле является частью индекса, который не поддерживает выбранный вами тип. Изменение запрещено',
                                                    classes: 'red darken-1'
                                                });
                                                return false;
                                            }
                                        }
                                        break reset;
                                    }
                                }
                            }
                        }
                    }
                }

                table.editField(data.id, newData);

                App.sidenav.updateContent(App.templates.tableOptions({
                    fields: table.fields.length,
                    primary: table.primary.fields.length,
                    foreigns: table.foreigns.length,
                    indexes: table.indexes.length
                }));

                App.modal.updateContent(App.templates.fields.view({
                    fields: table.fields
                }));

                M.toast({
                    html: 'Поле успешно изменено',
                    classes: 'green'
                });

                return true;
            }
        });

        var instance = $('#editField'),
            name = instance.find('[name="name"]'),
            type = instance.find('[name="type"]'),
            length = instance.find('[name="length"]'),
            nullable = instance.find('[name="nullable"]'),
            def = instance.find('[name="default"]'),
            defOwn = instance.find('[name="defaultOwn"]'),
            attribute = instance.find('[name="attribute"]');

        name.val(data.name);
        type.val(data.type);

        type.on('change', function () {
            var value = $(this).val(),
                fieldType = App.DB.fieldTypes[value];

            if (fieldType.length) {
                length.prop('disabled', false)
                    .prop('required', fieldType.length.required ? true : false);
            } else {
                length.prop('disabled', true)
                    .prop('required', false);
            }
            length.val('');
            if (fieldType.default) {
                def.prop('disabled', false);
            } else {
                def.prop('disabled', true);
            }

            def.val('0')
                .change();

            attribute.val('0');

            attrs.forEach(function (attrName) {
                if (fieldType.attribute && fieldType.attribute == attrName) {
                    attribute.find('[value="' + attrName + '"]')
                        .prop('disabled', false);

                } else {
                    attribute.find('[value="' + attrName + '"]')
                        .prop('disabled', true);
                }
            });
        });

        def.on('change', function () {
            if ($(this).val() == 'own') {
                $('#editField .defaultOwn').show();
                defOwn.prop('required', true);
            } else {
                $('#editField .defaultOwn').hide();
                defOwn.val('').prop('required', false);
            }
        });

        type.change();

        if (data.length) {
            length.val(data.length);
        }

        if (!data.nullable) {
            nullable.prop('checked', true);
        }

        if (data.default) {
            def.val(data.default);
        }

        if (data.defaultVal) {
            defOwn.val(data.defaultVal);
            $('.defaultOwn').show();
        }

        if (data.attribute) {
            attribute.val(data.attribute);
        }
    });

    //
    $(document).on('click', '#tableFields .delete', function () {
        var id = $(this).data('id'),
            table = App.currTable,
            field = table.getFieldById(id);

        // Проверка на внешние ключи с других таблиц
        var status = false;
        first: for (var i = 0; i < App.DB.tables.length; i++) {
            var currTable = App.DB.tables[i];
            if (currTable.id != table.id) {
                var instance = currTable.instance;
                for (var j = 0; j < instance.foreigns.length; j++) {
                    var foreign = instance.foreigns[j];
                    if (foreign.table == table.id && foreign.onId == field.id) {
                        status = true;
                        break first;
                    }
                }
            }
        }
        if (status) {
            M.toast({
                html: 'На данное поле ссылается внешний ключ. Удаление невозможно',
                classes: 'red darken-1'
            });
            return;
        }

        if (table.isPrimary(id) !== false) {
            M.toast({
                html: 'Данное поле является частью первичного ключа. Удаление невозможно',
                classes: 'red darken-1'
            });
            return;
        }

        if (table.isForeign(id) !== false) {
            M.toast({
                html: 'Данное поле является внешним ключом. Удаление невозможно',
                classes: 'red darken-1'
            });
            return;
        }

        for (var i = 0; i < table.indexes.length; i++) {
            var index = table.indexes[i];
            for (var j = 0; j < index.fields.length; j++) {
                if (index.fields[j] == id) {
                    M.toast({
                        html: 'Данное поле является частью индеса. Удаление невозможно',
                        classes: 'red darken-1'
                    });
                    return;
                }
            }
        }

        if (!confirm('Вы уверены, что хотите удалить данное поле?')) return;

        table.removeField(id);

        App.sidenav.updateContent(App.templates.tableOptions({
            fields: table.fields.length,
            primary: table.primary.fields.length,
            foreigns: table.foreigns.length,
            indexes: table.indexes.length
        }));

        App.modal.updateContent(App.templates.fields.view({
            fields: table.fields
        }));

        M.toast({
            html: 'Поле успешно удалено',
            classes: 'green'
        });
    });

    /* ------------------ PRIMARY KEY ------------------- */
    $(document).on('click', '#tableOptions .primary', function (e) {
        e.preventDefault();

        var table = App.currTable,
            primaryFieldNames = [];

        table.fields.forEach(function (field) {
            if (find(table.primary.fields, field.id) !== -1) primaryFieldNames.push(field.name);
        });

        App.modal.init({
            name: 'tablePrimary',
            content: App.templates.primary.view({
                fields: primaryFieldNames,
                increment: table.primary.increment
            }),
            closeText: 'Закрыть',
            isForm: false
        });
    });

    $(document).on('click', '#tablePrimary .edit', function (e) {
        var table = App.currTable;

        var fields = [],
            increment = table.primary.increment;

        //
        table.fields.forEach(function (field, i) {
            // все поля у которых нет параметра default и nullable
            if (!field.default && !field.nullable) {
                fields.push({
                    name: field.name,
                    id: field.id,
                    primary: find(table.primary.fields, field.id) == -1 ? false : true
                });
            }
        });

        if (!fields.length) {
            M.toast({
                html: 'Нет подходящих полей для первичного ключа',
                classes: 'red darken-1'
            });
            return;
        }

        App.editor.init({
            name: 'editPrimary',
            content: App.templates.primary.editor({
                fields: fields,
                increment: increment
            }),
            submitText: 'Сохранить',
            onSubmit: function () {
                var primaryFieldNames = [];

                var newData = {};
                newData.fields = [];
                newData.increment = $('#editPrimary [name="increment"]').prop('checked');

                $('#editPrimary [name="fields[]"]:checked').each(function () {
                    var id = $(this).val();
                    newData.fields.push(id);
                    primaryFieldNames.push(table.getFieldById(id).name);
                });

                table.setPrimary(newData);

                App.sidenav.updateContent(App.templates.tableOptions({
                    fields: table.fields.length,
                    primary: table.primary.fields.length,
                    foreigns: table.foreigns.length,
                    indexes: table.indexes.length
                }));

                App.modal.updateContent(App.templates.primary.view({
                    fields: primaryFieldNames,
                    increment: newData.increment
                }));

                M.toast({
                    html: 'Первичный ключ успешно изменен',
                    classes: 'green'
                });

                return true;
            }
        });

        var instance = $('#editPrimary'),
            fieldsUI = instance.find('[name="fields[]"]'),
            incrementUI = instance.find('[name="increment"]');


        fieldsUI.on('change', function () {
            var status = true,
                count = 0;

            for (var i = 0; i < fieldsUI.length; i++) {
                if ($(fieldsUI[i]).prop('checked')) {
                    count++;
                    var field = table.getFieldById($(fieldsUI[i]).val());
                    if (find(App.DB.incrementFields, field.type) == -1) {
                        status = false;
                        break;
                    }
                }
                if (count > 1) {
                    status = false;
                    break;
                }
            }

            if (!status || !count) {
                incrementUI.prop('checked', false)
                    .prop('disabled', true);
            } else {
                incrementUI.prop('disabled', false);
            }
        });

        fieldsUI.change();
    });


    /* ------------------ FOREIGN KEYS ------------------- */
    $(document).on('click', '#tableOptions .foreigns', function (e) {
        e.preventDefault();

        var table = App.currTable,
            foreigns = [];

        for (var i = 0; i < table.foreigns.length; i++) {
            var field = table.getFieldById(table.foreigns[i].id),
                onTable = App.DB.getTableById(table.foreigns[i].table),
                onField = onTable.getFieldById(table.foreigns[i].onId);
            foreigns.push({
                id: i,
                field: field.name,
                table: onTable.name,
                onField: onField.name,
                update: table.foreigns[i].update,
                delete: table.foreigns[i].delete
            });
        }

        App.modal.init({
            name: 'tableForeigns',
            content: App.templates.foreigns.view({
                foreigns: foreigns
            }),
            closeText: 'Закрыть',
            isForm: false
        });
    });
    // Добавление нового внешнего ключа
    $(document).on('click', '#tableForeigns .add', function (e) {
        var table = App.currTable,
            fields = [],
            tables = [];

        table.fields.forEach(function (field) {
            if (table.isForeign(field.id) === false) fields.push(field);
        });

        if (!fields.length) {
            M.toast({
                html: 'Не найдено подходящих полей для создания внешнего ключа',
                classes: 'red darken-1'
            });
            return;
        }

        App.DB.tables.forEach(function (val) {
            if (val.id != table.id) {
                tables.push({
                    id: val.id,
                    name: val.instance.name
                });
            }
        });

        App.editor.init({
            name: 'addForeignKey',
            content: App.templates.foreigns.add({
                fields: fields,
                tables: tables
            }),
            submitText: 'Добавить',
            onSubmit: function (data) {
                var key = {
                    id: data.get('field'),
                    table: data.get('table'),
                    onId: data.get('onField'),
                    update: data.get('onUpdate'),
                    delete: data.get('onDelete')
                }
                if (key.id == '0' || !key.table || !key.onId) {
                    M.toast({
                        html: 'Не заполнены все поля',
                        classes: 'red darken-1'
                    });
                    return false;
                }

                table.addForeign(key);

                // Обновление оконо - start
                var foreigns = [];

                for (var i = 0; i < table.foreigns.length; i++) {
                    var field = table.getFieldById(table.foreigns[i].id),
                        onTable = App.DB.getTableById(table.foreigns[i].table),
                        onField = onTable.getFieldById(table.foreigns[i].onId);
                    foreigns.push({
                        id: i,
                        field: field.name,
                        table: onTable.name,
                        onField: onField.name,
                        update: table.foreigns[i].update,
                        delete: table.foreigns[i].delete
                    });
                }

                App.sidenav.updateContent(App.templates.tableOptions({
                    fields: table.fields.length,
                    primary: table.primary.fields.length,
                    foreigns: table.foreigns.length,
                    indexes: table.indexes.length
                }));

                App.modal.updateContent(App.templates.foreigns.view({
                    foreigns: foreigns
                }));
                // Обновление окон - end

                M.toast({
                    html: 'Внешний ключ успешно добавлен',
                    classes: 'green'
                });
                return true;
            }
        });

        var $instance = $('#addForeignKey'),
            $fieldUI = $instance.find('[name="field"]'),
            $tableUI = $instance.find('[name="table"]'),
            $onFieldUI = $instance.find('[name="onField"]');

        $tableUI.find('option').each(function (i, opt) {
            var val = $(opt).attr('value');
            if (val != '0') {
                var currTable = App.DB.getTableById(val);
                for (var i = 0; i < currTable.foreigns.length; i++) {
                    if (currTable.foreigns[i].table == table.id) {
                        $(opt).prop('disabled', true);
                        break;
                    }
                }
            }
        });

        $fieldUI.on('change', function () {
            $tableUI.val('0')
                .prop('disabled', false);

            $onFieldUI.html('')
                .prop('disabled', true);
        });

        $tableUI.on('change', function () {
            var currTable = App.DB.getTableById($tableUI.val()),
                currField = table.getFieldById($fieldUI.val()),
                temp = '',
                count = 0;

            for (var i = 0; i < currTable.fields.length; i++) {
                var status = 'disabled';
                if (currTable.fields[i].type == currField.type &&
                    currTable.fields[i].attribute == currField.attribute &&
                    currTable.isPrimary(currTable.fields[i].id) !== false) {
                    count++;
                    status = '';
                }
                temp += '<option value="' + currTable.fields[i].id + '" ' + status + '>' + currTable.fields[i].name + '</option>';
            }

            $onFieldUI.html(temp);

            if (!count) {
                M.toast({
                    html: 'В таблице не найдено подходящих столбцов для связи',
                    classes: 'red darken-1'
                });
            }

            $onFieldUI.prop('disabled', false);
        });

    });
    // Редактирование внешнего ключа
    $(document).on('click', '#tableForeigns .edit', function () {
        var table = App.currTable,
            id = $(this).data('id'),
            foreign = table.foreigns[id],
            fields = [],
            tables = [],
            onFields = [];

        table.fields.forEach(function (field) {
            if (table.isForeign(field.id) === false || field.id == foreign.id) fields.push(field);
        });

        var getFieldsHtml = function (currTable, currField) {
            var temp = '',
                count = 0;
            for (var i = 0; i < currTable.fields.length; i++) {
                var status = 'disabled';
                if (currTable.fields[i].type == currField.type &&
                    currTable.fields[i].attribute == currField.attribute &&
                    currTable.isPrimary(currTable.fields[i].id) !== false) {
                    count++;
                    status = '';
                }
                temp += '<option value="' + currTable.fields[i].id + '" ' + status + '>' + currTable.fields[i].name + '</option>';
            }

            return {
                html: temp,
                count: count
            }
        }

        App.DB.tables.forEach(function (val) {
            if (val.id != table.id) {
                tables.push({
                    id: val.id,
                    name: val.instance.name
                });
            }
        });

        var onTable = App.DB.getTableById(foreign.table),
            currField = table.getFieldById(foreign.id),
            result = getFieldsHtml(onTable, currField);

        App.editor.init({
            name: 'editForeignKey',
            content: App.templates.foreigns.change({
                fields: fields,
                tables: tables
            }),
            submitText: 'Сохранить',
            onSubmit: function (data) {
                var key = {
                    id: data.get('field'),
                    table: data.get('table'),
                    onId: data.get('onField'),
                    update: data.get('onUpdate'),
                    delete: data.get('onDelete')
                }
                if (key.id == '0' || !key.table || !key.onId) {
                    M.toast({
                        html: 'Не заполнены все поля',
                        classes: 'red darken-1'
                    });
                    return false;
                }

                table.editForeign(id, key);

                // Обновление оконо - start
                var foreigns = [];

                for (var i = 0; i < table.foreigns.length; i++) {
                    var field = table.getFieldById(table.foreigns[i].id),
                        onTable = App.DB.getTableById(table.foreigns[i].table),
                        onField = onTable.getFieldById(table.foreigns[i].onId);
                    foreigns.push({
                        id: i,
                        field: field.name,
                        table: onTable.name,
                        onField: onField.name,
                        update: table.foreigns[i].update,
                        delete: table.foreigns[i].delete
                    });
                }

                App.modal.updateContent(App.templates.foreigns.view({
                    foreigns: foreigns
                }));
                // Обновление окон - end

                M.toast({
                    html: 'Внешний ключ успешно изменен',
                    classes: 'green'
                });
                return true;
            }
        });

        var $instance = $('#editForeignKey'),
            $fieldUI = $instance.find('[name="field"]'),
            $tableUI = $instance.find('[name="table"]'),
            $onFieldUI = $instance.find('[name="onField"]'),
            $updateUI = $instance.find('[name="onUpdate"]'),
            $deleteUI = $instance.find('[name="onDelete"]');

        $fieldUI.val(foreign.id);
        $tableUI.val(foreign.table);
        $updateUI.val(foreign.update);
        $deleteUI.val(foreign.delete);
        $onFieldUI.html(result.html).val(foreign.onId);

        $tableUI.find('option').each(function (i, opt) {
            var val = $(opt).attr('value');
            if (val != '0') {
                var currTable = App.DB.getTableById(val);
                for (var i = 0; i < currTable.foreigns.length; i++) {
                    if (currTable.foreigns[i].table == table.id) {
                        $(opt).prop('disabled', true);
                        break;
                    }
                }
            }
        });

        $fieldUI.on('change', function () {
            $tableUI.val('0')
                .prop('disabled', false);
            $onFieldUI.html('')
                .prop('disabled', true);
        });

        $tableUI.on('change', function () {
            var currTable = App.DB.getTableById($tableUI.val()),
                currField = table.getFieldById($fieldUI.val()),
                result = getFieldsHtml(currTable, currField);

            $onFieldUI.html(result.html);

            if (!result.count) {
                M.toast({
                    html: 'В таблице не найдено подходящих столбцов для связи',
                    classes: 'red darken-1'
                });
            }

            $onFieldUI.prop('disabled', false);
        });
        //console.log(foreign);
    });

    // Удаление внешнего ключа
    $(document).on('click', '#tableForeigns .delete', function () {
        var id = $(this).data('id'),
            table = App.currTable;

        if (!confirm("Вы уверены, что хотите удалить данный внешний ключ?")) return;

        table.removeForeign(id);

        // Обновление оконо - start
        var foreigns = [];

        for (var i = 0; i < table.foreigns.length; i++) {
            var field = table.getFieldById(table.foreigns[i].id),
                onTable = App.DB.getTableById(table.foreigns[i].table),
                onField = onTable.getFieldById(table.foreigns[i].onId);
            foreigns.push({
                id: i,
                field: field.name,
                table: onTable.name,
                onField: onField.name,
                update: table.foreigns[i].update,
                delete: table.foreigns[i].delete
            });
        }

        App.sidenav.updateContent(App.templates.tableOptions({
            fields: table.fields.length,
            primary: table.primary.fields.length,
            foreigns: table.foreigns.length,
            indexes: table.indexes.length
        }));

        App.modal.updateContent(App.templates.foreigns.view({
            foreigns: foreigns
        }));
        // Обновление окон - end

        M.toast({
            html: 'Внешний ключ успешно удален',
            classes: 'green'
        });

    });

    /* ------------------ INDEXES ------------------- */
    $(document).on('click', '#tableOptions .indexes', function (e) {
        e.preventDefault();

        var table = App.currTable,
            indexes = [];

        for (var i = 0; i < table.indexes.length; i++) {
            var index = table.indexes[i],
                fields = '';
            for (var j = 0; j < index.fields.length; j++) {
                fields += table.getFieldById(index.fields[j]).name;
                if (j + 1 != index.fields.length) {
                    fields += ', ';
                }
            }

            indexes.push({
                type: index.type,
                fields: fields,
                id: i
            });
        }

        App.modal.init({
            name: 'tableIndexes',
            content: App.templates.indexes.view({
                indexes: indexes
            }),
            closeText: 'Закрыть',
            isForm: false
        });
    });

    // Добавление индекса
    $(document).on('click', '#tableIndexes .add', function () {
        var table = App.currTable,
            indexes = [],
            fields = [];

        App.DB.indexes.forEach(function (index) {
            indexes.push(index.name);
        });

        table.fields.forEach(function (field) {
            fields.push({
                id: field.id,
                name: field.name
            });
        });

        if (!fields.length) {
            M.toast({
                html: 'Не найдены поля для создания индекса',
                classes: 'red darken-1'
            });
            return;
        }

        App.editor.init({
            name: 'addIndex',
            content: App.templates.indexes.editor({
                indexes: indexes,
                fields: fields
            }),
            submitText: 'Добавить',
            onSubmit: function (data) {
                var fields = [];
                $('#addIndex [name="fields[]"]').each(function (i, field) {
                    if ($(field).prop('checked')) {
                        fields.push($(field).val());
                    }
                });

                if (!fields.length) {
                    M.toast({
                        html: 'Нужно выбрать хотя бы одно поле',
                        classes: 'red darken-1'
                    });
                    return false;
                }

                table.addIndex({
                    type: data.get('index'),
                    fields: fields
                });

                // Обновление окон
                App.sidenav.updateContent(App.templates.tableOptions({
                    fields: table.fields.length,
                    primary: table.primary.fields.length,
                    foreigns: table.foreigns.length,
                    indexes: table.indexes.length
                }));

                var indexes = [];

                for (var i = 0; i < table.indexes.length; i++) {
                    var index = table.indexes[i],
                        fields = '';
                    for (var j = 0; j < index.fields.length; j++) {
                        fields += table.getFieldById(index.fields[j]).name;
                        if (j + 1 != index.fields.length) {
                            fields += ', ';
                        }
                    }

                    indexes.push({
                        type: index.type,
                        fields: fields,
                        id: i
                    });
                }

                App.modal.updateContent(App.templates.indexes.view({
                    indexes: indexes
                }));

                M.toast({
                    html: 'Индекс успешно добавлен',
                    classes: 'green'
                });

                return true;
            }
        });

        var $instance = $('#addIndex'),
            $indexUI = $instance.find('[name="index"]'),
            $fieldsUI = $instance.find('[name="fields[]"]');

        $indexUI.on('change', function () {
            var type;

            for (var i = 0; i < App.DB.indexes.length; i++) {
                if (App.DB.indexes[i].name == $(this).val()) {
                    type = App.DB.indexes[i];
                    break;
                }
            }

            $fieldsUI.each(function (i, field) {
                var fieldType = table.getFieldById($(field).val()).type;
                if (find(type.allowedFields, fieldType) !== -1) {
                    $(field).prop('disabled', false);
                } else {
                    $(field).prop('disabled', true)
                        .prop('checked', false);
                }
            });
        });

        $indexUI.change();

    });

    // Изменение индекса
    $(document).on('click', '#tableIndexes .edit', function () {
        var table = App.currTable,
            currIndexId = $(this).data('id'),
            currIndex = table.indexes[currIndexId],
            indexes = [],
            fields = [];

        App.DB.indexes.forEach(function (index) {
            indexes.push(index.name);
        });

        table.fields.forEach(function (field) {
            fields.push({
                id: field.id,
                name: field.name
            });
        });

        App.editor.init({
            name: 'editIndex',
            content: App.templates.indexes.editor({
                indexes: indexes,
                fields: fields
            }),
            submitText: 'Сохранить',
            onSubmit: function (data) {
                var fields = [];
                $('#editIndex [name="fields[]"]').each(function (i, field) {
                    if ($(field).prop('checked')) {
                        fields.push($(field).val());
                    }
                });

                if (!fields.length) {
                    M.toast({
                        html: 'Нужно выбрать хотя бы одно поле',
                        classes: 'red darken-1'
                    });
                    return false;
                }

                table.editIndex(currIndexId, {
                    type: data.get('index'),
                    fields: fields
                });

                // Обновление окон
                App.sidenav.updateContent(App.templates.tableOptions({
                    fields: table.fields.length,
                    primary: table.primary.fields.length,
                    foreigns: table.foreigns.length,
                    indexes: table.indexes.length
                }));

                var indexes = [];

                for (var i = 0; i < table.indexes.length; i++) {
                    var index = table.indexes[i],
                        fields = '';
                    for (var j = 0; j < index.fields.length; j++) {
                        fields += table.getFieldById(index.fields[j]).name;
                        if (j + 1 != index.fields.length) {
                            fields += ', ';
                        }
                    }

                    indexes.push({
                        type: index.type,
                        fields: fields,
                        id: i
                    });
                }

                App.modal.updateContent(App.templates.indexes.view({
                    indexes: indexes
                }));

                M.toast({
                    html: 'Индекс успешно изменен',
                    classes: 'green'
                });

                return true;
            }
        });

        var $instance = $('#editIndex'),
            $indexUI = $instance.find('[name="index"]'),
            $fieldsUI = $instance.find('[name="fields[]"]');

        $indexUI.on('change', function () {
            var type;

            for (var i = 0; i < App.DB.indexes.length; i++) {
                if (App.DB.indexes[i].name == $(this).val()) {
                    type = App.DB.indexes[i];
                    break;
                }
            }

            $fieldsUI.each(function (i, field) {
                var fieldType = table.getFieldById($(field).val()).type;
                if (find(type.allowedFields, fieldType) !== -1) {
                    $(field).prop('disabled', false);
                } else {
                    $(field).prop('disabled', true)
                        .prop('checked', false);
                }
            });
        });

        $indexUI.val(currIndex.type)
            .change();

        $fieldsUI.each(function (i, field) {
            if (find(currIndex.fields, $(field).val()) !== -1) {
                $(field).prop('checked', true);
            }
        });

    });

    // Удаление индекса
    $(document).on('click', '#tableIndexes .delete', function () {
        var table = App.currTable,
            id = $(this).data('id');

        if (!confirm('Вы уверены, что хотите удалить данный индекс?')) return;

        table.removeIndex(id);

        var indexes = [];

        for (var i = 0; i < table.indexes.length; i++) {
            var index = table.indexes[i],
                fields = '';
            for (var j = 0; j < index.fields.length; j++) {
                fields += table.getFieldById(index.fields[j]).name;
                if (j + 1 != index.fields.length) {
                    fields += ', ';
                }
            }

            indexes.push({
                type: index.type,
                fields: fields,
                id: i
            });
        }

        App.modal.updateContent(App.templates.indexes.view({
            indexes: indexes
        }));

        M.toast({
            html: 'Индекс успешно удален',
            classes: 'green'
        });

    });

};

export {
    events
};