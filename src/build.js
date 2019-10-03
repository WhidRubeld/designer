/* jquery/materialize */
window.jQuery = require('jquery');
window.$ = require('jquery');
import 'jquery-ui-dist/jquery-ui.min.js';

import 'materialize-css/dist/css/materialize.min.css';
import 'materialize-css/dist/js/materialize.min.js';

/* jsplumb */
import 'jsplumb/dist/js/jsplumb.min.js';

/* mousewheel */
import 'jquery-mousewheel/jquery.mousewheel.js';

/* handlebars */
let Handlebars = require('handlebars/runtime');
import {compare} from './helpers/compare.handlebars.js';
Handlebars.registerHelper('compare', compare);

/* highlight */
import hljs from 'highlightjs/highlight.pack.min.js';
window.hljs = hljs;
import 'highlightjs/styles/default.css';

/* app */
import './scss/main.scss';
import {App} from './js/App.js';
window.App = App;

$(document).ready(function () {
    App.init();
});