/* global COOKIE_PATH:false */
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-switch/dist/css/bootstrap3/bootstrap-switch.css';
import 'toastr/build/toastr.min.css';
import 'jquery.terminal/css/jquery.terminal.min.css';
import '../styles/main.scss';

import $ from 'jquery';
import toastr from 'toastr';
// waiting for fix https://github.com/benmosher/eslint-plugin-import/issues/1712
// eslint-disable-next-line import/no-extraneous-dependencies
import Miew from 'Miew'; // eslint-disable-line import/no-unresolved
import Menu from './ui/Menu';

window.DEBUG = true;

const miewErrorId = 'miew-error';

function onError(err) {
  const doc = document.createDocumentFragment();

  const containers = document.getElementsByClassName('miew-container');
  const parent = containers.length > 0 ? containers[0] : null;
  let element = document.getElementById(miewErrorId);

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

    const par = element.appendChild(document.createElement('p'));
    par.appendChild(document.createTextNode('We are sorry'));
    par.appendChild(document.createElement('br'));
    par.appendChild(document.createElement('small')).textContent = 'for the failure';

    element = document.createElement('div');
    element.setAttribute('class', miewErrorId);
    element.id = miewErrorId;
    doc.appendChild(element);
  }

  // append the error details
  let child = element.appendChild(document.createElement('p'));
  child.appendChild(document.createTextNode('Error details:'));
  child = element.appendChild(document.createElement('pre'));
  if (!err.stack || String(err.stack).indexOf(String(err)) === -1) {
    child.appendChild(document.createTextNode(`${err}\n`));
  }
  if (err.stack) {
    child.appendChild(document.createTextNode(`${err.stack}\n`));
  }

  if (parent) {
    parent.appendChild(doc);
  }
}

window.onerror = function (err, url, line, col, obj) {
  onError(obj = obj || {
    name: 'window.onerror',
    message: err,
    sourceURL: url,
    line,
    column: col,
  });
  throw obj;
};

// create viewer (and run it) for each container element on the page
window.addEventListener('load', () => {
  $('.miew-container').each((i, container) => {
    const viewer = window.miew = new Miew($.extend(
      true,
      {
        container,
        load: 'data/1CRN.pdb',
        cookiePath: (typeof COOKIE_PATH !== 'undefined' && COOKIE_PATH) || '/',
      },
      Miew.options.fromAttr(container.getAttribute('data-miew')),
      Miew.options.fromURL(window.location.search),
    ));

    const convertLevel = {
      error: 'error',
      warn: 'warning',
      report: 'info',
    };
    toastr.options.newestOnTop = false;
    viewer.logger.addEventListener('message', (e) => {
      const level = convertLevel[e.level];
      if (level) {
        toastr[level](e.message);
      }
    });

    const menu = new Menu(container, viewer);

    if (viewer.init()) {
      menu.showOverlay();
      viewer.run();
    }
  });
});
