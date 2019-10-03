let DB = {
    tables: [],
    currTableId: 1,
    fieldTypes: {},
    incrementFields: [],
    indexes: [],
    addTable: function (name, tableId = false) {
        var id;
        tableId === false ? id = this.currTableId++ : id = tableId;
        this.tables.push({
            id: id,
            instance: new App.table({
                id: id,
                name: name
            })
        });

        App.updateDraggable();

        return this.tables[this.tables.length - 1].instance;
    },
    getTableById: function (id) {
        var instance = false;
        $.each(this.tables, function (i, table) {
            if (table.id == id) {
                instance = table.instance;
            }
        });
        return instance;
    }
};

/* Типы полей */
let fields = DB.fieldTypes;
// Числа
fields.TINYINT = {
    attribute: 'UNSIGNED',
    length: true,
    default: true
};
fields.SMALLINT = {
    attribute: 'UNSIGNED',
    length: true,
    default: true
};
fields.INT = {
    attribute: 'UNSIGNED',
    length: true,
    default: true
};
fields.MEDIUMINT = {
    attribute: 'UNSIGNED',
    length: true,
    default: true
};
fields.BIGINT = {
    attribute: 'UNSIGNED',
    length: true,
    default: true
};
DB.incrementFields = [
    'TINYINT', 'SMALLINT', 'INT', 'BIGINT'
];
// Числа с плавающей точкой
fields.FLOAT = {
    attribute: 'UNSIGNED',
    length: true,
    default: true
};
fields.DOUBLE = {
    attribute: 'UNSIGNED',
    length: true,
    default: true
};
fields.DECIMAL = {
    attribute: 'UNSIGNED',
    length: true,
    default: true
};
// Даты
fields.DATE = {
    length: false,
    default: true
};
fields.DATETIME = {
    length: false,
    default: true
};
fields.TIMESTAMP = {
    length: true,
    default: true
};
fields.TIME = {
    length: false,
    default: true
};
fields.YEAR = {
    length: true,
    default: true
};
// Текстовые типы
fields.CHAR = {
    attribute: 'BINARY',
    length: true,
    default: true
};
fields.VARCHAR = {
    attribute: 'BINARY',
    length: {
        required: true
    },
    default: true
};
fields.TINYTEXT = {
    length: false,
    default: false
};
fields.TEXT = {
    length: true,
    default: false
};
fields.MEDIUMTEXT = {
    length: false,
    default: false
};
fields.LONGTEXT = {
    length: false,
    default: false
};
fields.TINYBLOB = {
    length: false,
    default: false
};
fields.BLOB = {
    length: true,
    default: false
};
fields.MEDIUMBLOB = {
    length: false,
    default: false
};
fields.LONGBLOB = {
    length: false,
    default: false
};
// список
fields.ENUM = {
    length: {
        required: true
    },
    default: false
};
fields.SET = {
    length: {
        required: true
    },
    default: true
};

/* Индексы */
let indexes = DB.indexes;
indexes.push({
    name: 'INDEX',
    allowedFields: ['TINYINT', 'SMALLINT', 'INT', 'MEDIUMINT', 'BIGINT',
        'FLOAT', 'DOUBLE', 'DECIMAL',
        'DATE', 'DATETIME', 'TIMESTAMP', 'YEAR', 'TIME',
        'CHAR', 'VARCHAR',
        'ENUM', 'SET'
    ]
});
indexes.push({
    name: 'UNIQUE INDEX',
    allowedFields: ['TINYINT', 'SMALLINT', 'INT', 'MEDIUMINT', 'BIGINT',
        'FLOAT', 'DOUBLE', 'DECIMAL',
        'DATE', 'DATETIME', 'TIMESTAMP', 'YEAR', 'TIME',
        'CHAR', 'VARCHAR',
        'ENUM', 'SET'
    ]
});
indexes.push({
    name: 'FULLTEXT INDEX',
    allowedFields: ['TINYTEXT', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT',
        'TINYBLOB', 'BLOB', 'MEDIUMBLOB', 'LONGBLOB'
    ]
});

export {DB};