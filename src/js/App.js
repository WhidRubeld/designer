// APP MODULES
import './App.minimap.js';
import {modal} from './App.modal.js';
import {sidenav} from './App.sidenav.js';
import {editor} from './App.editor.js';
import {table} from './App.table.js';
import {DB} from './App.DB.js';
import {events} from './App.events.js';

// HANDLEBARS TEMPLATES
import _modal from '../hbs/modal.hbs';
import _editor from '../hbs/editor.hbs';
import _sidenav from '../hbs/sidenav.hbs';

import _menu from '../hbs/menu.sidenav.hbs';
import _import from '../hbs/import.modal.hbs';
import _viewCode from '../hbs/viewCode.modal.hbs';

import _addTable from '../hbs/addTable.modal.hbs';
import _tableOptions from '../hbs/tableOptions.sidenav.hbs';
import _editTableName from '../hbs/editTableName.modal.hbs';

import _fieldEditor from '../hbs/fields/editor.hbs';
import _fieldsView from '../hbs/fields/view.modal.hbs';

import _addForeign from '../hbs/foreigns/add.editor.hbs';
import _changeForeign from '../hbs/foreigns/change.editor.hbs';
import _foreignsView from '../hbs/foreigns/view.modal.hbs';

import _indexEditor from '../hbs/indexes/editor.hbs';
import _indexesView from '../hbs/indexes/view.modal.hbs';

import _primaryEditor from '../hbs/primary/editor.hbs';
import _primaryView from '../hbs/primary/view.modal.hbs';

import _tableField from '../hbs/schema/field.hbs';
import _table from '../hbs/schema/table.hbs';

// EXPORT APP MODULE
let App = function () {
    'use struct';

    var templates = {
        modal: _modal,
        editor: _editor,
        sidenav: _sidenav,
        schema: {
            field: _tableField,
            table: _table
        },
        menu: _menu,
        import: _import,
        viewCode: _viewCode,
        addTable: _addTable,
        tableOptions: _tableOptions,
        editTableName: _editTableName,
        fields: {
            editor: _fieldEditor,
            view: _fieldsView
        },
        primary: {
            editor: _primaryEditor,
            view: _primaryView
        },
        foreigns: {
            add: _addForeign,
            change: _changeForeign,
            view: _foreignsView
        },
        indexes: {
            editor: _indexEditor,
            view: _indexesView
        }
    };

    var minimap = MiniView.init({
        selector: '#schema',
        onZoom: function (zoom) {
            var val = zoom.toFixed(2);
            App.plumb.setZoom(val);
            $('#zoom').text((val * 100).toFixed() + '%');
            //console.log((val * 100).toFixed());
        }
    });

    var updateDraggable = function () {
        App.plumb.draggable($('.table'), {
            containment: 'schema',
            //handle: '.name',
            filter: '.options',
            drag: function (e, ui) {
                App.minimap.refresh();
            }
        });
    };

    return {
        plumb: jsPlumb.getInstance(),
        templates: templates,
        minimap: minimap,
        modal: modal,
        sidenav: sidenav,
        editor: editor,
        table: table,
        events: events,
        updateDraggable: updateDraggable,
        DB: DB,
        init: function () {
            // инициализация MaterializeCSS
            M.AutoInit();

            // настройка jsPlumb
            App.plumb.importDefaults({
                Container: 'schema',
                ConnectionsDetachable: false,
                Connector: ['Bezier', {
                    curviness: 75
                }],
                Anchor: ['RightMiddle', 'LeftMiddle'],
                Endpoint: ['Dot', {
                    radius: 2
                }],
                PaintStyle: {
                    strokeWidth: 1,
                    stroke: '#8a8a8a'
                },
            });

            // добавление событий
            App.events();

            $('#loader').animate({opacity: 0}, 1500, function() {$(this).remove()});

            console.log(App);
        }
    }
}();

export {App};