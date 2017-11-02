/* global COOKIE_PATH:false */
import '../../node_modules/bootstrap/dist/css/bootstrap.css';
import '../../node_modules/bootstrap-switch/dist/css/bootstrap3/bootstrap-switch.css';
import '../../node_modules/toastr/build/toastr.min.css';
import '../../node_modules/jquery.terminal/css/jquery.terminal.min.css';
import '../styles/main.scss';
import 'babel-polyfill';

import Miew from './Miew.full';
import Menu from './ui/Menu';
import $ from 'jquery';
import toastr from 'toastr';

window.DEBUG = true;

const div = document.createElement('div');
div.className = 'miew-container';
div.innerHTML = '<div class="miew-message"><p>Please wait<br><small>while viewer is loading</small></p></div>';

const body = document.querySelector('body');
body.appendChild(div);

function onError(err) {
  var doc = document.createDocumentFragment();

  var containers = document.getElementsByClassName('miew-container');
  var parent = containers.length > 0 ? containers[0] : null;
  var element = document.getElementById('miew-error');

  // on the first error
  if (!element) {
    // clear the container
    while (parent && parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }

    // create message box
    element = document.createElement('div');
    element.setAttribute('class', 'miew-message');
    doc.appendChild(element);

    var par = element.appendChild(document.createElement('p'));
    par.appendChild(document.createTextNode('We are sorry'));
    par.appendChild(document.createElement('br'));
    par.appendChild(document.createElement('small')).textContent = 'for the failure';

    element = document.createElement('div');
    element.setAttribute('class', 'miew-error');
    element.id = 'miew-error';
    doc.appendChild(element);
  }

  // append the error details
  var child = element.appendChild(document.createElement('p'));
  child.appendChild(document.createTextNode('Error details:'));
  child = element.appendChild(document.createElement('pre'));
  if (!err.stack || String(err.stack).indexOf(String(err)) === -1) {
    child.appendChild(document.createTextNode(err + '\n'));
  }
  if (err.stack) {
    child.appendChild(document.createTextNode(err.stack + '\n'));
  }

  if (parent) {
    parent.appendChild(doc);
  }
}

// requirejs.onError = onError;

window.onerror = function(err, url, line, col, obj) {
  onError(obj = obj || {
    name: 'window.onerror',
    message: err,
    sourceURL: url,
    line: line,
    column: col
  });
  throw obj;
};

// Uncomment this to profile parsing
// Miew.profile('data/4TNW.pdb', 10, $('miew-container').first.firstChild.firstChild);

/** @deprecated */
window.MIEWS = [];

// create viewer (and run it) for each container element on the page
$('.miew-container').each(function(i, container) {

  var viewer = window.miew = new Miew($.extend(
    true,
    {
      container: container,
      load: 'data/1CRN.pdb',
      cookiePath: typeof COOKIE_PATH !== 'undefined' && COOKIE_PATH || '/',
    },
    Miew.options.fromAttr(container.getAttribute('data-miew')),
    Miew.options.fromURL(window.location.search)
  ));

  var convertLevel = {
    'error': 'error',
    'warn': 'warning',
    'report': 'info',
  };
  toastr.options.newestOnTop = false;
  viewer.logger.addEventListener('message', function onLogMessage(e) {
    var level = convertLevel[e.level];
    if (level) {
      toastr[level](e.message);
    }
  });

  window.MIEWS.push(viewer);

  var menu = new Menu(container, viewer);

  if (viewer.init()) {
    viewer.benchmarkGfx().then(function() {
      menu.showOverlay();
      viewer.run();
    });
  }
});
