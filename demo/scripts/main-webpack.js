require('../../node_modules/bootstrap/dist/css/bootstrap.css');
require('../../node_modules/bootstrap-switch/dist/css/bootstrap3/bootstrap-switch.css');
require('../../node_modules/toastr/build/toastr.min.css');
require('../../node_modules/jquery.terminal/css/jquery.terminal.min.css');
require('../styles/main.scss');
require('es6-promise');

window.DEBUG = true;

var div = document.createElement('div');
div.className = 'miew-container';
div.innerHTML = '<div class="miew-message"><p>Please wait<br><small>while viewer is loading</small></p></div>';

var body = document.querySelector('body');
body.appendChild(div);

require('./main');
