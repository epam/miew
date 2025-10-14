/* eslint-disable quote-props */
/* eslint-disable prefer-destructuring */
import $ from 'jquery';
import _ from 'lodash';
// waiting for fix https://github.com/benmosher/eslint-plugin-import/issues/1712
// eslint-disable-next-line import/no-extraneous-dependencies
import Miew from 'Miew'; // eslint-disable-line import/no-unresolved
import menuHtml from '../../menu.html';
import 'bootstrap';
import 'bootstrap-switch';
import 'jquery.terminal';

const {
  chem: { selectors },
  io: { parsers },
  gfx: { Representation },
  modes,
  colorers,
  palettes,
  materials,
  settings,
  utils,
} = Miew;

const { createElement, hexColor } = utils;

function stringColorToHex(color) {
  const hexString = `0x${color.substr(-6)}`;
  return parseInt(hexString, 16);
}

function unarray(x) {
  if (x instanceof Array) {
    x = x[0];
  }
  return x;
}

function hasComplex(viewer) {
  let bHaveComplexes = false;
  viewer._forEachComplexVisual(() => {
    bHaveComplexes = true;
  });
  return bHaveComplexes;
}

function getNumAtomsBySelector(viewer, selector) {
  const visual = viewer._getComplexVisual();
  return visual ? visual.getComplex().getNumAtomsBySelector(selector) : -1;
}

function Menu(/** Node */ container, /** Miew */ viewer) {
  // Add proper DOM elements
  _.forEach($.parseHTML(menuHtml), (element) => container.parentNode.appendChild(element));

  // Save some objects for future reference
  this._viewer = viewer;
  this._menuId = '#miew-menu';
  this._titlebar = $(`${this._menuId} .titlebar`);
  this._menu = $(`${this._menuId} .main-menu`);
  this._curPanelID = 'miew-menu-panel-info';
  this._curMenuItem = 'miew-menu-panel-info';
  this._xs = false;
  this._curReprIdx = 0;

  this._menu.find('.PACKAGE_VERSION').text(Miew.VERSION);

  // FIX ME!
  this._singleWordsPrimary = [
    'all', 'none', 'water', 'hetatm', 'protein', 'basic', 'acidic', 'charged',
    'polar', 'nonpolar', 'aromatic', 'nucleic', 'purine', 'pyrimidine', 'polarh', 'nonpolarh',
  ];
  this._singleWords = [
    'all', 'none', 'water', 'hetatm', 'protein', 'basic', 'acidic', 'charged',
    'polar', 'nonpolar', 'aromatic', 'nucleic', 'purine', 'pyrimidine', 'polarh', 'nonpolarh',
  ];
  this._keyWordsPrimary = ['serial', 'name', 'elem', 'residue', 'sequence', 'chain', 'altloc'];

  this._init();
  this._initializeTerminal();
}

Menu.prototype._initializeTerminal = function () {
  const self = this;
  let res = null;
  let urlSubString = '';
  const element = $('#miew-menu [data-btn-type=miew-menu-btn-browse-file] input');

  function onChangeEventListener() {
    if ($(element).val()) {
      const { files } = $(element)[0];
      if (files.length > 0) {
        let opts;
        if (res !== null) {
          opts = { mdFile: res[1] };
        }
        self._viewer.load(files[0], opts);
      }
    }
    urlSubString = '';
    $(element).val('');
  }

  element.change(onChangeEventListener);

  this._terminal = $(`${this._menuId} .miew-terminal`);
  this._terminalWindow = this._terminal.find('.terminal-window');
  this._terminalWindow.on('click', () => this._hideToolbarPanel());
  this._term = this._terminalWindow.terminal(
    (command, term) => {
      if (self._viewer) {
        command = command.trim();
        const loadStr = command.split(/\s+/);

        if (loadStr[0] === 'load' && loadStr[1] === '-f') {
          urlSubString = command.substr(command.indexOf('-f') + 2);
          res = urlSubString.match(/(?:"([^"]*)"|'([^']*)')/);
          if (urlSubString !== '') {
            if (res !== null && res[0] === urlSubString.trim() && res[1].indexOf('.nc') === (res[1].length - 3)) {
              element.click();
            } else {
              term.error('You can use only URL string to *.nc file to determine trajectory');
            }
          } else {
            res = null;
            element.click();
          }
        } else {
          self._viewer.script(command, (str) => {
            term.echo(str);
          }, (str) => {
            term.error(str);
          });
        }
      } else {
        term.error('Miew is not initialized.');
      }
    },
    {
      greetings: 'Miew - 3D Molecular Viewer\nCopyright © 2015-2025 EPAM Systems, Inc.\n',
      prompt: 'miew> ',
      name: 'miew',
      scrollOnEcho: true,
      keydown(event, _term) {
        if (event.keyCode === 192) { // skip '~'
          return false;
        }

        return undefined;
      },
      onInit(term) {
        if (self._viewer) {
          const colors = {
            'error': '#f00',
            'warn': '#990',
            'report': '#1a9cb0',
          };
          const onLogMessage = function (e) {
            const msg = e.message.replace('[', '(').replace(']', ')'); // temp workaround for https://github.com/jcubic/jquery.terminal/issues/470
            term.echo(`[[b;${colors[e.level] || '#666'};]${msg}]`);
          };
          self._viewer.logger.addEventListener('message', onLogMessage);
        }
      },
    },
  );
};

Menu.prototype._fillSelectionColorCombo = function (paletteID) {
  const self = this;
  const frag = document.createDocumentFragment();
  const palette = palettes.get(paletteID) || palettes.first;
  const colorList = palette.namedColorsArray;

  const comboboxPanel = $(`${self._menuId} [data-panel-type=miew-menu-panel-select-color]`);
  for (let i = 0, n = colorList.length; i < n; i++) {
    const color = hexColor(colorList[i][1]);
    const newItem = createElement('div', {
      'class': 'col-xs-2 col-sm-2',
      'data-toggle': 'selectcolor',
      'data-value': color,
    }, [
      createElement(
        'a',
        {
          'href': '#',
          'class': 'thumbnail',
          'style': 'text-align:center;',
        },
        createElement('img', {
          'src': 'images/empty_icon.png',
          'style': `background-color: ${color};`,
          'data-tooltip': 'tooltip',
          'data-placement': 'bottom',
          'title': colorList[i][0],
        }),
      ),
    ]);
    frag.appendChild(newItem);
  }
  $(comboboxPanel.get(0).lastElementChild.firstElementChild).empty();
  comboboxPanel.get(0).lastElementChild.firstElementChild.appendChild(frag);

  $(`${self._menuId} [data-toggle=selectcolor]`).on('click', /** @this HTMLSelectElement */ function () {
    const prevActive = self._getCurReprPropertyId('miew-menu-panel-select-color');
    $(`${self._menuId} [data-value="${prevActive}"]`).removeClass('active');
    comboboxPanel.get(0).firstElementChild.firstElementChild.click();
    const elements = $(`${self._menuId} [data-panel-type=miew-menu-panel-representation] .miew-repr-list `
        + `.panel.valid:eq(${self._curReprIdx}) [data-value=miew-menu-panel-select-color]`);
    const newColor = this.getAttribute('data-value');
    elements[0].lastChild.firstElementChild.setAttribute('data-id', newColor);
    elements[0].lastChild.firstElementChild.firstElementChild.style.backgroundColor = newColor;
  });

  comboboxPanel.find('.panel-heading:first-of-type button:first-of-type').on('click', () => {
    const activeItem = self._getCurReprPropertyId('miew-menu-panel-select-color');
    $(`${self._menuId} [data-toggle=selectcolor][data-value="${activeItem}"]`).removeClass('active');
  });
};

Menu.prototype._fillCombo = function (type, name, path, entityList) {
  const self = this;
  const frag = document.createDocumentFragment();
  let newItem;

  const comboboxPanel = $(`${self._menuId} [data-panel-type=${type}]`).get(0);
  const list = entityList.all;
  for (let i = 0, n = list.length; i < n; i++) {
    let entry = list[i];
    entry = entry.prototype || entry; // entry may be Class or Object
    newItem = createElement('a', {
      'href': '#',
      'class': 'list-group-item',
      'data-toggle': name,
      'data-value': entry.id,
    }, [
      createElement(
        'div',
        { 'class': 'media-left' },
        createElement('img', {
          'class': 'media-object',
          'src': `images/${name}/${entry.id}.png`,
          'width': '48',
          'height': '48',
        }),
      ),
      createElement('div', {
        'class': 'media-body media-middle',
      }, entry.name),
    ]);
    frag.appendChild(newItem);
  }
  comboboxPanel.lastElementChild.firstElementChild.appendChild(frag);

  $(`${self._menuId} [data-toggle=${name}]`).on('click', /** @this HTMLSelectElement */ function () {
    const itemID = this.getAttribute('data-value');
    let prevActive;
    if (type === 'miew-menu-panel-palette') {
      prevActive = settings.get(path);
      settings.set(path, itemID);
    } else {
      prevActive = self._getCurReprPropertyId(type);
    }
    $(`${self._menuId} [data-value="${prevActive}"]`).removeClass('active');
    comboboxPanel.firstElementChild.firstElementChild.click();
  });

  $(`${self._menuId} [data-toggle=combobox-panel][data-value="${type}"]`).on(
    'click',
    /** @this HTMLSelectElement */ () => {
      let activeItem;
      if (type === 'miew-menu-panel-palette') {
        activeItem = settings.get(path);
      } else {
        activeItem = self._getCurReprPropertyId(type);
      }
      $(`${self._menuId} a[data-value="${activeItem}"]`).addClass('active');
    },
  );

  $(`${self._menuId} [data-panel-type=${type}] .panel-heading:first-of-type button:first-of-type`).on(
    'click',
    () => {
      let activeItem;
      if (type === 'miew-menu-panel-palette') {
        activeItem = settings.get(path);
      } else {
        activeItem = self._getCurReprPropertyId(type);
      }
      $(`${self._menuId} a[data-value="${activeItem}"]`).removeClass('active');
    },
  );
};

Menu.prototype._initReprListItemListeners = function (index) {
  const self = this;
  const reprList = $(`${self._menuId} [data-panel-type=miew-menu-panel-representation] .miew-repr-list`);

  function onActiveReprChanged(event) {
    const newReprIdx = reprList.find('.panel.valid').index($(event.currentTarget).parent());
    const btnSelector = reprList.find(`.panel.valid:eq(${newReprIdx}) .panel-heading .btn span`);
    if (event.target !== btnSelector[0] && event.target !== btnSelector[1]) {
      let rowSelector = reprList.find(`.panel.valid:eq(${self._curReprIdx}) .panel-heading`);
      rowSelector.removeClass('active');
      rowSelector = reprList.find(`.panel.valid:eq(${self._curReprIdx}) .panel-collapse`);
      rowSelector.collapse('hide');

      self._curReprIdx = newReprIdx;
      rowSelector = reprList.find(`.panel.valid:eq(${self._curReprIdx}) .panel-heading`);
      rowSelector.addClass('active');
      reprList.find(`.panel.valid:eq(${self._curReprIdx}) .panel-collapse`).collapse('show');
    }
  }

  reprList.find(`.panel:eq(${index}) .panel-heading`).on('click', onActiveReprChanged);

  reprList.find(`.panel:eq(${index}) input[type=checkbox]`).bootstrapSwitch();

  reprList.find(`.panel:eq(${index}) .panel-heading .btn-visible`).on('click', () => {
    reprList.find(`.panel:eq(${index}) .panel-heading .btn-visible`).hide();
    reprList.find(`.panel:eq(${index}) .panel-heading .btn-invisible`).show();
  });

  reprList.find(`.panel:eq(${index}) .panel-heading .btn-invisible`).on('click', () => {
    reprList.find(`.panel:eq(${index}) .panel-heading .btn-invisible`).hide();
    reprList.find(`.panel:eq(${index}) .panel-heading .btn-visible`).show();
  });

  reprList.find(`.panel:eq(${index}) [data-toggle="combobox-panel"]`).on('click', function _setComboboxPanel() {
    const selectorHide = self._getPanelSelector(self._curPanelID);
    selectorHide.hide();

    self._curPanelID = this.getAttribute('data-value');
    const selectorShow = self._getPanelSelector(self._curPanelID);
    selectorShow.show();

    return false;
  });

  reprList.find(` .panel:eq(${index}) input[type=number]`).on('input', (e) => {
    const spinner = $(e.currentTarget);

    if (parseFloat(spinner.attr('min')) > parseFloat(spinner.val())) {
      spinner.val(parseFloat(spinner.attr('min')));
      spinner.change();
    }
    if (parseFloat(spinner.attr('max')) < parseFloat(spinner.val())) {
      spinner.val(parseFloat(spinner.attr('max')));
      spinner.change();
    }
  });

  reprList.find(`.panel:eq(${index}) .spinner-dec-btn`).on('click', (e) => {
    const spinnerType = e.currentTarget.getAttribute('data-value');
    const spinner = reprList.find(`.panel:eq(${index}) [data-type=${spinnerType}]`);
    if (parseFloat(spinner.attr('min')) < parseFloat(spinner.val())) {
      spinner.val((10 * spinner.val() - 10 * spinner.attr('step')) / 10);
      spinner.change();
    }
  });

  reprList.find(`.panel:eq(${index}) .spinner-inc-btn`).on('click', (e) => {
    const spinnerType = e.currentTarget.getAttribute('data-value');
    const spinner = reprList.find(`.panel:eq(${index}) [data-type=${spinnerType}]`);
    if (parseFloat(spinner.attr('max')) > parseFloat(spinner.val())) {
      spinner.val((10 * spinner.val() + 10 * spinner.attr('step')) / 10);
      spinner.change();
    }
  });
  // FIX ME!!
  reprList.find(`.panel:eq(${index}) [data-toggle=combobox-panel][data-value=miew-menu-panel-mode]`).on(
    'click',
    function () {
      const activeItem = this.firstElementChild.firstElementChild.getAttribute('data-id');
      $(`${self._menuId} a[data-value="${activeItem}"][data-toggle=mode]`).addClass('active');
    },
  );
  reprList.find(`.panel:eq(${index}) [data-toggle=combobox-panel][data-value=miew-menu-panel-color]`).on(
    'click',
    function () {
      const activeItem = this.firstElementChild.firstElementChild.getAttribute('data-id');
      $(`${self._menuId} a[data-value="${activeItem}"][data-toggle=colorer]`).addClass('active');
    },
  );
  reprList.find(`.panel:eq(${index}) [data-toggle=combobox-panel][data-value=miew-menu-panel-matpreset]`).on(
    'click',
    function () {
      const activeItem = this.firstElementChild.firstElementChild.getAttribute('data-id');
      $(`${self._menuId} a[data-value="${activeItem}"]`).addClass('active');
    },
  );

  reprList.find(`.panel:eq(${index}) [data-toggle=combobox-panel][data-value=miew-menu-panel-select-color]`).on(
    'click',
    function () {
      const activeItem = this.lastChild.firstElementChild.getAttribute('data-id');
      $(`${self._menuId} [data-toggle=selectcolor][data-value="${activeItem}"]`).addClass('active');
    },
  );

  reprList.find(`.panel:eq(${index}) [data-toggle=combobox-panel][data-value=miew-menu-panel-selection]`).on(
    'click',
    () => {
      const element = reprList.find(`.panel.valid:eq(${self._curReprIdx}) [data-value=miew-menu-panel-selection]`);
      const selectionPanel = $(`${self._menuId} [data-panel-type=miew-menu-panel-selection]`);
      selectionPanel.find('input').val(`${element[0].firstElementChild.firstElementChild.textContent} `);
      selectionPanel.find('.nav-tabs a[href="[data-tab-content=singleword]"]').tab('show');
      self._onSelectorChanged(selectionPanel);
    },
  );
};

Menu.prototype._addReprListItem = function (panel, index, repr) {
  const self = this;
  const reprList = $(`${self._menuId} [data-panel-type=miew-menu-panel-representation] .miew-repr-list`);
  const validReprN = reprList.find('.panel.valid').length;
  const newItem = createElement('div', {
    'class': 'panel panel-default valid',
  }, [
    createElement(
      'div',
      {
        'class': 'panel-heading',
        'role': 'tab',
      },
      createElement('h4', { 'class': 'panel-title' }, [
        createElement(
          'button',
          { 'class': 'btn btn-default btn-invisible' },
          createElement('span', { 'class': 'glyphicon glyphicon-unchecked' }),
        ),
        createElement(
          'button',
          { 'class': 'btn btn-default btn-visible' },
          createElement('span', { 'class': 'glyphicon glyphicon-check' }),
        ),
        createElement(
          'a',
          {
            'role': 'button',
            'data-toggle': 'collapse',
            'data-parent': '.panel-menu[data-panel-type=miew-menu-panel-representation] .miew-repr-list',
            'href': `#repr${index + 1}`,
            'aria-expanded': 'true',
            'aria-controls': `[data-number=repr-${String(index + 1)}]`,
          },
          `#${String(validReprN + 1)}: ${repr.mode.name}`,
        ),
        createElement(
          'div',
          { 'class': 'pseudo-div' },
          createElement(
            'span',
            { 'class': 'pull-right badge' },
            String(hasComplex(this._viewer) ? getNumAtomsBySelector(self._viewer, repr.selector) : '0'),
          ),
        )]),
    ),
    createElement(
      'div',
      {
        'data-number': `repr-${String(index + 1)}`,
        'class': 'panel-collapse collapse',
        'role': 'tabpanel',
        'aria-labelledby': `head-repr-${String(index + 1)}`,
      },
      createElement('ul', { 'class': 'list-group row' }, [
        createElement('li', {
          'class': 'list-group-item col-xs-12 col-sm-12',
          'data-toggle': 'combobox-panel',
          'data-value': 'miew-menu-panel-selection',
        }, [
          'Selection',
          createElement('span', { 'class': 'pull-right' }, [
            createElement('label', {
              'class': 'text-muted',
              'data-type': 'selection-target',
              'style': 'word-break: break-all',
            }, String(repr.selector)),
            createElement('span', { 'class': 'glyphicon glyphicon-menu-right' })])]),

        createElement('li', {
          'class': 'list-group-item col-xs-12 col-sm-12',
          'data-toggle': 'combobox-panel',
          'data-value': 'miew-menu-panel-mode',
        }, [
          'Mode',
          createElement('span', { 'class': 'pull-right' }, [
            createElement('span', {
              'class': 'text-muted',
              'data-id': repr.mode.id,
            }, repr.mode.shortName),
            createElement('span', { 'class': 'glyphicon glyphicon-menu-right' })])]),

        createElement('li', {
          'class': 'list-group-item col-xs-12 col-sm-12',
          'data-toggle': 'combobox-panel',
          'data-value': 'miew-menu-panel-color',
        }, [
          'Color',
          createElement('span', { 'class': 'pull-right' }, [
            createElement('span', {
              'class': 'text-muted',
              'data-id': repr.colorer.id,
            }, repr.colorer.shortName),
            createElement('span', { 'class': 'glyphicon glyphicon-menu-right' })])]),

        createElement('li', {
          'class': 'list-group-item col-xs-12 col-sm-12',
          'data-toggle': 'combobox-panel',
          'data-value': 'miew-menu-panel-select-color',
        }, [
          createElement('span', {}, 'Color name'),
          createElement('span', { 'class': 'pull-right' }, [
            createElement('a', {
              'href': '#ucolor',
              'class': 'thumbnail',
              'data-id': hexColor(0xffffff),
            }, createElement('img', {
              'src': 'images/empty_icon.png',
              'style': `background-color: ${hexColor(0xffffff)};`,
            })),
            createElement('span', { 'class': 'glyphicon glyphicon-menu-right' })])]),

        createElement('li', {
          'class': 'list-group-item col-xs-12 col-sm-12',
          'data-toggle': 'combobox-panel',
          'data-value': 'miew-menu-panel-matpreset',
        }, [
          'Material',
          createElement('span', { 'class': 'pull-right' }, [
            createElement('span', {
              'class': 'text-muted',
              'data-id': repr.materialPreset.id,
            }, repr.materialPreset.shortName),
            createElement('span', { 'class': 'glyphicon glyphicon-menu-right' })])]),
        createElement('li', {
          'class': 'list-group-item col-xs-12 col-sm-12',
          'data-type': 'surf-param-rad',
        }, [
          'Radius scale',
          createElement('span', { 'class': 'input-group pull-right' }, [
            createElement(
              'span',
              {
                'class': 'input-group-addon spinner-dec-btn',
                'data-toggle': 'spinner',
                'data-value': 'rad',
              },
              createElement('span', { 'class': 'glyphicon glyphicon-minus' }),
            ),
            createElement('input', {
              'type': 'number',
              'class': 'form-control',
              'data-type': 'rad',
              'value': '1.0',
              'min': '0',
              'max': '2',
              'step': '0.1',
            }),
            createElement(
              'span',
              {
                'class': 'input-group-addon spinner-inc-btn',
                'data-toggle': 'spinner',
                'data-value': 'rad',
              },
              createElement('span', { 'class': 'glyphicon glyphicon-plus' }),
            )])]),
        createElement('li', {
          'class': 'list-group-item col-xs-12 col-sm-12',
          'data-type': 'surf-param-iso',
        }, [
          'Isosurface threshold',
          createElement('span', { 'class': 'input-group pull-right' }, [
            createElement(
              'span',
              {
                'class': 'input-group-addon spinner-dec-btn',
                'data-toggle': 'spinner',
                'data-value': 'iso',
              },
              createElement('span', { 'class': 'glyphicon glyphicon-minus' }),
            ),
            createElement('input', {
              'type': 'number',
              'class': 'form-control',
              'data-type': 'iso',
              'value': '0.5',
              'min': '0',
              'max': '10',
              'step': '0.5',
            }),
            createElement(
              'span',
              {
                'class': 'input-group-addon spinner-inc-btn',
                'data-toggle': 'spinner',
                'data-value': 'iso',
              },
              createElement('span', { 'class': 'glyphicon glyphicon-plus' }),
            )])]),
        createElement('li', {
          'class': 'list-group-item col-xs-12 col-sm-12',
          'data-type': 'surf-param-zclip',
        }, [
          createElement('label', {}, 'Z clipping'),
          createElement(
            'span',
            { 'class': 'pull-right' },
            createElement('input', {
              'type': 'checkbox',
              'data-dir': 'representation',
              'data-toggle': 'zClip',
              'data-size': 'mini',
              'title': 'Z clipping',
            }),
          )])]),
    )]);
  panel.appendChild(newItem);
  if (repr.mode.id === 'SA' || repr.mode.id === 'SE' || repr.mode.id === 'QS' || repr.mode.id === 'CS') {
    reprList.find(`.panel:eq(${index}) .panel-collapse [data-type=surf-param-zclip]`).show();
  } else {
    reprList.find(`.panel:eq(${index}) .panel-collapse [data-type=surf-param-zclip]`).hide();
  }

  if (repr.mode.id === 'QS') {
    reprList.find(`.panel:eq(${index}) .panel-collapse [data-type=surf-param-rad]`).show();
  } else {
    reprList.find(`.panel:eq(${index}) .panel-collapse [data-type=surf-param-rad]`).hide();
  }

  if (repr.mode.id === 'QS' || repr.mode.id === 'CS') {
    reprList.find(`.panel:eq(${index}) .panel-collapse [data-type=surf-param-iso]`).show();
  } else {
    reprList.find(`.panel:eq(${index}) .panel-collapse [data-type=surf-param-iso]`).hide();
  }

  if (repr.colorer.id === 'UN' || repr.colorer.id === 'CB') {
    const ucSelector = reprList.find(`.panel:eq(${index}) [data-value=miew-menu-panel-select-color]`);
    const ucColor = hexColor(repr.colorer.opts.color);
    ucSelector[0].firstElementChild.innerHTML = `${repr.colorer.name} color`;
    ucSelector[0].lastChild.firstElementChild.setAttribute('data-id', ucColor);
    ucSelector[0].lastChild.firstElementChild.firstElementChild.style.backgroundColor = ucColor;
    ucSelector.show();
  } else {
    reprList.find(`.panel:eq(${index}) [data-value=miew-menu-panel-select-color]`).hide();
  }

  reprList.find(`.panel:eq(${index}) input[type=checkbox]`).bootstrapSwitch('state', repr.mode.opts.zClip);
  reprList.find(`.panel:eq(${index}) [data-type=rad]`).val(repr.mode.opts.scale);
  reprList.find(`.panel:eq(${index}) [data-type=iso]`).val(repr.mode.opts.isoValue);

  // refresh opts in mode
  const modeElem = reprList.find(`.panel:eq(${index}) [data-value=miew-menu-panel-mode]`);
  modeElem.removeData('mvdata');
  modeElem.data('mvdata', repr.mode.opts);

  // refresh opts in colorer
  const colorElem = reprList.find(`.panel:eq(${index}) [data-value=miew-menu-panel-color]`);
  colorElem.removeData('mvdata');
  colorElem.data('mvdata', repr.colorer.opts);

  if (repr.mode.id === 'SA' || repr.mode.id === 'SE') {
    reprList.find(`.panel:eq(${index}) [data-type=rad]`).val(repr.mode._radScale);
  }

  if (repr.visible) {
    reprList.find(`.panel:eq(${index}) .panel-heading .btn-visible`).show();
    reprList.find(`.panel:eq(${index}) .panel-heading .btn-invisible`).hide();
  } else {
    reprList.find(`.panel:eq(${index}) .panel-heading .btn-visible`).hide();
    reprList.find(`.panel:eq(${index}) .panel-heading .btn-invisible`).show();
  }

  self._initReprListItemListeners(index);
};

Menu.prototype._getCurReprPropertyId = function (reprPropDataVal) {
  const self = this;
  const reprList = $(`${self._menuId} .panel-menu[data-panel-type=miew-menu-panel-representation] .miew-repr-list`);
  const element = reprList.find(`.panel.valid:eq(${self._curReprIdx}) [data-value="${reprPropDataVal}"]`);
  return element[0].lastChild.firstElementChild.getAttribute('data-id');
};

Menu.prototype._getCurReprSelector = function () {
  const self = this;
  const reprList = $(`${self._menuId} .panel-menu[data-panel-type=miew-menu-panel-representation] .miew-repr-list`);
  const element = reprList.find(`.panel.valid:eq(${self._curReprIdx}) [data-type=selection-target]`);
  return element[0].textContent;
};

Menu.prototype._copyCurReprListItem = function (index) {
  const self = this;
  const reprList = $(`${self._menuId} .panel-menu[data-panel-type=miew-menu-panel-representation] .miew-repr-list`);
  const curSelector = reprList.find(`.panel.valid:eq(${self._curReprIdx})`);
  curSelector.find('.panel-heading').removeClass('active');
  curSelector.find('.panel-collapse').collapse('hide');
  const id = reprList.find(`.panel.valid:eq(${self._curReprIdx}) .panel-collapse`).attr('data-number');
  const newId = id.substr(0, id.lastIndexOf('-') + 1) + (index + 1);

  curSelector.clone().appendTo(reprList);

  curSelector.find('.panel-heading').addClass('active');
  curSelector.find('.panel-collapse').collapse('show');

  let selector = reprList.find(`.panel:eq(${index})`);
  const newHtml = selector.html().replace(new RegExp(id.replace('-', '\\-'), 'g'), newId);
  selector.html(newHtml);

  selector.addClass('added');

  selector = selector.find('.panel-heading a');
  const header = selector.html();
  const validReprN = reprList.find('.panel.valid').length;
  selector.html(`#${String(validReprN)}${header.substring(header.indexOf(':'))}`);

  // recreate bootstrapswitch param (note: cloning of bootstrapswitch doesn't work)
  const zClipState = curSelector.find('[type=checkbox][data-toggle=zClip]')[0].checked;
  const qSurfParamSelector = reprList.find(`.panel:eq(${index}) [data-type=surf-param-zclip]`);
  qSurfParamSelector.empty();
  selector.find('[type=checkbox]').bootstrapSwitch('state', zClipState);
  qSurfParamSelector[0].appendChild(createElement('label', {}, 'Z clipping'));
  qSurfParamSelector[0].appendChild(createElement(
    'span',
    { 'class': 'pull-right' },
    createElement('input', {
      'type': 'checkbox',
      'data-dir': 'representation',
      'data-toggle': 'zClip',
      'data-size': 'mini',
      'title': 'Z clipping',
    }),
  ));
  reprList.find(`.panel:eq(${index}) input[type=checkbox]`).bootstrapSwitch('state', zClipState);

  const isoValue = curSelector.find('[data-type=iso]').val();
  reprList.find(`.panel:eq(${index}) [data-type=iso]`).val(isoValue);

  const radScale = curSelector.find('[data-type=rad]').val();
  reprList.find(`.panel:eq(${index}) [data-type=rad]`).val(radScale);

  self._initReprListItemListeners(index);
};

Menu.prototype._fillSourceList = function () {
  const self = this;
  const names = this._viewer.getVisuals();
  $('#miew-source-dropdown').toggle(names.length > 1);

  const curName = this._viewer.getCurrentVisual();
  const nameElement = document.getElementById('miew-source-name');
  nameElement.textContent = curName;

  function getOnSourceSelected(name) {
    return function (e) {
      self._viewer.setCurrentVisual(name);
      self._fillSourceList();
      self._initReprList();
      e.preventDefault();
    };
  }

  const listElement = document.getElementById('miew-source-list');
  const frag = document.createDocumentFragment();
  for (let i = 0, n = names.length; i < n; ++i) {
    const name = names[i];
    const link = createElement(
      'a',
      { href: '#' },
      (name !== curName) ? name : [
        createElement('b', null, name),
        createElement('span', {
          'class': 'glyphicon glyphicon-ok pull-right',
        }),
      ],
    );
    link.addEventListener('click', getOnSourceSelected(name));
    frag.appendChild(createElement('li', null, link));
  }
  listElement.innerHTML = '';
  listElement.appendChild(frag);
};

Menu.prototype._fillReprList = function () {
  const self = this;
  const reprList = $(`${self._menuId} .panel-menu[data-panel-type=miew-menu-panel-representation] .miew-repr-list`);

  reprList.empty();
  const list = reprList.get(0);
  for (let i = 0, n = self._viewer.repCount(); i < n; i++) {
    const entry = self._viewer.repGet(i);
    self._addReprListItem(list, i, entry);
  }

  $(`${self._menuId} [data-toggle=mode]`).on('click', /** @this HTMLSelectElement */ function () {
    const elements = reprList.find(`.panel.valid:eq(${self._curReprIdx}) [data-value=miew-menu-panel-mode]`);
    const itemID = this.getAttribute('data-value');
    const Mode = modes.get(itemID);
    elements[0].firstElementChild.firstElementChild.textContent = Mode.prototype.shortName;
    elements[0].firstElementChild.firstElementChild.setAttribute('data-id', itemID);

    const head = reprList.find(`.panel.valid:eq(${self._curReprIdx}) .panel-heading a`);
    const header = head.html();
    head.html(`${header.substring(0, header.indexOf(':') + 1)} ${Mode.prototype.name}`);

    const zClipParam = reprList.find(`.panel.valid:eq(${
      self._curReprIdx}) .panel-collapse [data-type=surf-param-zclip]`);
    if (itemID === 'SA' || itemID === 'SE' || itemID === 'QS' || itemID === 'CS') {
      zClipParam.show();
      const sClipSwitch = zClipParam.find('[type=checkbox][data-toggle=zClip]');
      sClipSwitch.bootstrapSwitch('state', settings.defaults.modes[itemID].zClip);
    } else {
      zClipParam.hide();
    }

    const isoParam = reprList.find(`.panel.valid:eq(${self._curReprIdx}) .panel-collapse [data-type=surf-param-iso]`);
    if (itemID === 'QS' || itemID === 'CS') {
      isoParam.show();
      isoParam.find('[data-type=iso]').val(settings.defaults.modes[itemID].isoValue);
    } else {
      isoParam.hide();
    }

    const radParam = reprList.find(`.panel.valid:eq(${self._curReprIdx}) .panel-collapse [data-type=surf-param-rad]`);
    if (itemID === 'QS') {
      radParam.show();
      radParam.find('[data-type=rad]').val(settings.defaults.modes[itemID].scale);
    } else {
      radParam.hide();
    }
  });
  $(`${self._menuId} [data-toggle=colorer]`).on('click', /** @this HTMLSelectElement */ function () {
    const elements = reprList.find(`.panel.valid:eq(${self._curReprIdx}) [data-value=miew-menu-panel-color]`);
    const itemID = this.getAttribute('data-value');
    const Colorer = colorers.get(itemID);

    elements[0].firstElementChild.firstElementChild.textContent = Colorer.prototype.shortName;
    elements[0].firstElementChild.firstElementChild.setAttribute('data-id', itemID);

    if (itemID === 'UN' || itemID === 'CB') {
      const ucColorName = (itemID === 'UN') ? 'Uniform color' : 'Carbon color';
      const ucColor = (itemID === 'UN') ? settings.now.colorers.UN.color : settings.now.colorers.CB.color;
      const elem = reprList.find(`.panel:eq(${self._curReprIdx}) [data-value=miew-menu-panel-select-color]`);
      elem[0].firstElementChild.innerHTML = ucColorName;
      elem[0].lastElementChild.firstElementChild.setAttribute('data-id', hexColor(ucColor));
      elem[0].lastElementChild.firstElementChild.firstElementChild.style.backgroundColor = hexColor(ucColor);
      elem.show();
    } else {
      reprList.find(`.panel:eq(${self._curReprIdx}) [data-value=miew-menu-panel-select-color]`).hide();
    }
  });

  $(`${self._menuId} [data-toggle=material]`).on('click', /** @this HTMLSelectElement */ function () {
    const elements = reprList.find(`.panel.valid:eq(${self._curReprIdx}) [data-value=miew-menu-panel-matpreset]`);
    const itemID = this.getAttribute('data-value');
    const material = materials.get(itemID);

    elements[0].firstElementChild.firstElementChild.textContent = material.shortName;
    elements[0].firstElementChild.firstElementChild.setAttribute('data-id', itemID);
  });
};

Menu.prototype._getPanelSelector = function (type) {
  return $(`${this._menuId} .panel-menu[data-panel-type=${type}]`);
};

Menu.prototype._init = function () {
  const self = this;
  let selectorHide = null;
  let selectorShow = null;
  let newPanelId = null;

  // tooltips initialization
  $(() => {
    $(`${self._menuId} .titlebar [data-tooltip="tooltip"]`).tooltip({
      trigger: 'hover',
    });
  });

  self._xs = self._isXS();
  $(`${self._menuId} [data-value="${self._curPanelID}"]`).toggleClass('active');

  $(`${self._menuId} [data-toggle=miew-main-menu]`).on('click', function () {
    const state = this.getAttribute('data-state');
    if (state === 'on') {
      self._onMenuOn();
    } else if (state === 'off') {
      self._onMenuOff();
    }
    return false;
  });

  $(`${self._menuId} [data-toggle=miew-terminal]`).on('click', function () {
    const state = this.getAttribute('data-state');
    this.blur();
    if (state === 'on') {
      self._onTerminalOn();
      this.setAttribute('data-state', 'off');
    } else if (state === 'off') {
      self._onTerminalOff();
      this.setAttribute('data-state', 'on');
    }
    return false;
  });

  $(`${self._menuId} [data-toggle=miew-terminal]`).on('mousedown', (e) => {
    e.preventDefault();
    return false;
  });

  $(document).on('keydown', (e) => {
    if (e.keyCode === 27 && !e.isDefaultPrevented()) { // ESC
      if ($(`${self._menuId} .main-menu`).is(':visible') === true) {
        if ($(`${self._menuId} .panel-menu[data-panel-type=miew-menu-panel-main]`).is(':visible') === true) {
          if (self._curMenuItem === self._curPanelID) { // if it is regular panel or in xs it also can be main panel
            self._onMenuOff();
          } else { // if it is combbox-panel
            self._getPanelSelector(self._curPanelID).get(0).firstElementChild.firstElementChild.click();
          }
        } else { // if xs mode and not main panel
          self._getPanelSelector(self._curPanelID).get(0).firstElementChild.firstElementChild.click();
        }
      }
    }
    if (!self._terminal.is(':visible')) {
      if (e.code === 'KeyS') {
        settings.set('ao', !settings.now.ao);
      }
    }
  });

  $(`${self._menuId} [data-toggle="panel"]`).on('click', function _setPanel() {
    if (self._xs === true) {
      $(`${self._menuId} .panel-menu[data-panel-type=miew-menu-panel-main]`).hide();
    }

    selectorHide = self._getPanelSelector(self._curPanelID);
    selectorHide.hide();
    $(`${self._menuId} a[data-value="${self._curMenuItem}"]`).removeClass('active');

    self._curMenuItem = self._curPanelID = newPanelId = this.getAttribute('data-value');
    selectorShow = self._getPanelSelector(self._curPanelID);
    selectorShow.show();
    $(`${self._menuId} a[data-value="${newPanelId}"]`).addClass('active');

    return false;
  });

  $(`${self._menuId} [data-toggle="main-panel"]`).on('click', () => {
    $(`${self._menuId} .panel-menu[data-panel-type=miew-menu-panel-main]`).show();
    self._getPanelSelector(self._curPanelID).hide();
    if (self._xs) {
      $(`${self._menuId} a[data-value="${self._curMenuItem}"]`).removeClass('active');
    }
    return false;
  });

  $(`${self._menuId} [data-toggle="combobox-panel"]`).on('click', function _setComboboxPanel() {
    selectorHide = self._getPanelSelector(self._curPanelID);
    selectorHide.hide();

    self._curPanelID = newPanelId = this.getAttribute('data-value');
    selectorShow = self._getPanelSelector(self._curPanelID);
    selectorShow.show();

    return false;
  });

  $(`${self._menuId} [data-toggle="toolbar"]`).on('click', function _btnToolbarClick() {
    if (this.classList.contains('disabled')) {
      return;
    }

    this.blur();
    const toolbar = this.getAttribute('data-value');

    $(`${self._menuId} [data-toggle="toolbar"]`).each((index, element) => {
      if (element.getAttribute('data-value') !== toolbar && element.classList.contains('active')) {
        element.click();
      }
    });

    const elements = $(`${self._menuId} [data-toolbar-type=${toolbar}]`);
    if (toolbar === 'miew-menu-toolbar-resolution') {
      elements.toggle();
      this.classList.toggle('active');

      const resSelector = $(`${self._menuId} [data-toggle="resolution-immediate"]`
          + `[data-value="${settings.now.resolution}"]`);
      if (this.classList.contains('active') === true) {
        resSelector.addClass('active');
      } else {
        resSelector.removeClass('active');
      }
    } else {
      const curRep = self._viewer.rep();
      if (curRep !== null) {
        elements.toggle();
        this.classList.toggle('active');

        const type = toolbar.substr(toolbar.lastIndexOf('-') + 1, toolbar.length);
        const selector = $(`${self._menuId} [data-toggle="${type}-immediate"]`
            + `[data-value="${unarray(curRep[type])}"]`);
        if (this.classList.contains('active') === true) {
          selector.addClass('active');
        } else {
          selector.removeClass('active');
        }
      } else {
        self._viewer.logger.error('No representation');
      }
    }
  });

  self._menu.on('click', (event) => {
    if ($(event.target).hasClass('main-menu')) {
      self._onMenuOff();
    }
  });

  const dataDirSettings = $(`${self._menuId} input[type=checkbox][data-dir=settings]`);
  dataDirSettings.bootstrapSwitch();
  dataDirSettings.on(
    'switchChange.bootstrapSwitch',
    /** @this HTMLInputElement */ function () {
      const param = this.getAttribute('data-toggle');
      if (param === 'bg.color') {
        self._viewer.set('bg.color', this.checked ? 0x202020 : 0xCCCCCC);
      } else {
        self._viewer.set(param, this.checked);
      }
    },
  );

  let shifted = false;
  $(document).on('keyup keydown', (e) => {
    shifted = e.shiftKey;
  });
  function _zoomClipPlane(e) {
    if (shifted) {
      let delta = 0;
      const event = e.originalEvent;
      if (event.wheelDelta) {
        // WebKit / Opera / Explorer 9
        delta = event.wheelDelta;
      } else if (event.detail) {
        // Firefox
        delta = -event.detail * 10;
      }
      const { draft } = self._viewer.settings.now;
      self._viewer.set({
        draft: {
          clipPlaneFactor: draft.clipPlaneFactor - delta * draft.clipPlaneSpeed,
        },
      });
    }
  }
  $(document).on('mousewheel', (e) => _zoomClipPlane(e)); // Chrome
  $(document).on('DOMMouseScroll', (e) => _zoomClipPlane(e)); // Opera, Firefox

  this._initMiewEventListeners();
  this._initToolbar();

  this._initInfoPanel();
  this._initLoadPanel();
  this._initReprPanel();
  this._initRenderPanel();
  this._initToolsPanel();
  this._initSelectionPanel();
};

Menu.prototype._initMiewEventListeners = function () {
  const self = this;

  this._viewer.addEventListener('loading', () => {
    self._setTitle('Loading…');
  });

  this._viewer.addEventListener('fetching', () => {
    self._setTitle('Fetching…');
  });

  this._viewer.addEventListener('parsing', () => {
    self._setTitle('Parsing…');
  });

  this._viewer.addEventListener('rebuilding', () => {
    self._setTitle('Building geometry…');
  });

  this._viewer.addEventListener('exporting', () => {
    self._setTitle('Exporting…');
  });

  this._viewer.addEventListener('resize', () => {
    self._onResize();
  });

  this._viewer.addEventListener('fetchingDone', (e) => {
    if (e.error) {
      self._updateInfo(e.data);
    }
  });

  this._viewer.addEventListener('parsingDone', (e) => {
    self._updateInfo(e.data);
    self._fillSourceList();
    self._fillReprList();

    self.presetsPanel.actions.pdb.inputs.refresh(self);
  });

  this._viewer.addEventListener('titleChanged', (e) => {
    self._setTitle(e.data);
  });

  this._viewer.addEventListener('editModeChanged', (e) => {
    self._enableToolbar(e.data);
  });
};

Menu.prototype._initInfoPanel = function () {
  this._updateInfo();
};

Menu.prototype._initLoadPanel = function () {
  const self = this;

  $(`${self._menuId} [data-form-type=miew-menu-form-load-pdb] [data-tooltip="tooltip"]`).tooltip({
    trigger: 'hover',
  });

  $(`${self._menuId} [data-toggle="preset-pdb"]`).on('click', /** @this HTMLElement */ function (evt) {
    const path = this.getAttribute('data-value');
    const query = this.getAttribute('data-query');
    $(`${self._menuId} .panel-menu[data-panel-type=miew-menu-panel-representation] .miew-repr-list`).empty();
    self._viewer.load(path).then(() => {
      self._viewer.setOptions(query || '');
    });
    self._onMenuOff();
    evt.preventDefault();
    return false;
  });
  // empty input box on panel opening
  const elem = $(`${this._menuId} .list-group-item[data-value="miew-menu-panel-presets"]`);
  elem.on('click', () => {
    self._presetsPanelActionsPdbInputsClear(self);
  });

  this._initPresetsPanelActions();
};

Menu.prototype._initReprPanel = function () {
  const self = this;
  const reprList = $(`${self._menuId} .panel-menu[data-panel-type=miew-menu-panel-representation] .miew-repr-list`);

  $(`${self._menuId} .miew-repr-list-controls [data-btn-type=miew-menu-btn-add-repr]`).on('click', () => {
    if (self._viewer.getComplexVisualsCount() === 0) {
      return;
    }

    const index = reprList.find('.panel').length;
    if (index > 0) {
      self._copyCurReprListItem(index);
    } else {
      const Mode = modes.first;
      const Colorer = colorers.first;
      const fakeRepr = new Representation(0, new Mode(), new Colorer(), selectors.all());
      self._addReprListItem(reprList.get(0), index, fakeRepr);
      const selector = reprList.find(`.panel:eq(${index})`);
      selector.addClass('added');
    }

    const validReprN = reprList.find('.panel.valid').length;
    if (validReprN === 2) {
      $(`${self._menuId} .miew-repr-list-controls [data-btn-type=miew-menu-btn-del-repr]`).removeClass('disabled');
    } else if (validReprN === self._viewer.getMaxRepresentationCount()) {
      $(`${self._menuId} .miew-repr-list-controls [data-btn-type=miew-menu-btn-add-repr]`).addClass('disabled');
    }

    reprList.find(`.panel.valid:eq(${validReprN - 1}) .panel-heading`).click();
    self._reprListChanged = true;
  });

  $(`${self._menuId} .miew-repr-list-controls [data-btn-type=miew-menu-btn-del-repr]`).on('click', () => {
    let validReprN = reprList.find('.panel.valid').length;
    const removeIdx = self._curReprIdx;
    const removeSelector = reprList.find(`.panel.valid:eq(${removeIdx})`);
    removeSelector.addClass('deleted');
    removeSelector.hide();
    removeSelector.removeClass('valid');
    if (self._curReprIdx === validReprN - 1) {
      reprList.find(`.panel.valid:eq(${self._curReprIdx - 1}) .panel-heading`).click();
    } else {
      reprList.find(`.panel.valid:eq(${self._curReprIdx}) .panel-heading`).click();
      for (let reprIdx = self._curReprIdx; reprIdx < validReprN - 1; ++reprIdx) {
        const reprSelector = reprList.find(`.panel.valid:eq(${reprIdx}) .panel-heading a`);
        const header = reprSelector.html();
        reprSelector.html(`#${String(reprIdx + 1)}${header.substring(header.indexOf(':'))}`);
      }
    }

    validReprN = reprList.find('.panel.valid').length;
    if (validReprN === 1) {
      $(`${self._menuId} .miew-repr-list-controls [data-btn-type=miew-menu-btn-del-repr]`).addClass('disabled');
    } else if (validReprN === self._viewer.getMaxRepresentationCount() - 1) {
      $(`${self._menuId} .miew-repr-list-controls [data-btn-type=miew-menu-btn-add-repr]`).removeClass('disabled');
    }

    self._reprListChanged = true;
  });

  self._fillCombo('miew-menu-panel-mode', 'mode', 'mode', modes);
  self._fillCombo('miew-menu-panel-color', 'colorer', 'colorer', colorers);
  self._fillCombo('miew-menu-panel-matpreset', 'material', 'materialPreset', materials);
};

Menu.prototype._displayGlobalErrorDialog = function (title, message) {
  const self = this;
  const dialog = $(`${self._menuId} .miew-menu-modals [data-modal-type=miew-menu-modal-global-error]`);
  const titleElement = dialog.find('.modal-title').get(0);
  const bodyElement = dialog.find('.modal-body').get(0);
  $(titleElement).html(title);
  $(bodyElement).html(message || 'Some error occured.');
  dialog.modal({
    keyboard: true,
  }, 'show');
};

Menu.prototype.presetsPanel = {
  inputs: {
    main: null,
  },
  actions: {
    pdb: {
      load: null,
      inputs: {
        clear: null,
        refresh: null,
        file: null,
        text: null,
      },
    },
  },
};

Menu.prototype._presetsPanelActionsPdbInputsRefresh = function (self) {
  const loadPdbButton = $(`${self._menuId} .presets-panel-action[data-presets-panel-action=pdb-load]`);
  const clearInputsButton = $(`${self._menuId} .presets-panel-action[data-presets-panel-action=pdb-inputs-clear]`);

  const mainTextInput = $($('[data-form-type=miew-menu-form-load-pdb] input[type=text][data-pdb-url-type=main]')
    .get(0));
  const mainErrorAlert = $($('[data-form-type=miew-menu-form-load-pdb] .alert-danger[data-pdb-url-type=main]')
    .get(0));
  const mainWarningAlert = $($('[data-form-type=miew-menu-form-load-pdb] .alert-warning[data-pdb-url-type=main]')
    .get(0));

  const extractExtension = function (name) {
    let parts = name.toLowerCase().split('/');
    let lastPart = parts[parts.length - 1];
    parts = lastPart.split('\\');
    lastPart = parts[parts.length - 1];
    parts = lastPart.split('.');
    if (parts.length === 1) {
      return ''; // not "file.ext" format
    }
    return parts[parts.length - 1];
  };

  let mainAlertText = null;

  const displayFormError = function (error) {
    if (error) {
      mainErrorAlert.html(error);
      mainErrorAlert.removeClass('hidden');
    } else {
      mainErrorAlert.html(error);
      mainErrorAlert.addClass('hidden');
    }
  };
  const displayFormWarning = function (warning) {
    if (warning) {
      mainWarningAlert.html(warning);
      mainWarningAlert.removeClass('hidden');
    } else {
      mainWarningAlert.html(warning);
      mainWarningAlert.addClass('hidden');
    }
  };

  self.presetsPanel.inputs.isCorrect = false;
  if (!self.presetsPanel.inputs || !self.presetsPanel.inputs.main) {
    loadPdbButton.addClass('disabled');
    clearInputsButton.addClass('hidden');

    mainTextInput.val('');
    mainTextInput.removeAttr('disabled');

    displayFormError(null);
    displayFormWarning(null);
  } else {
    if (self.presetsPanel.inputs.main) {
      let mainExtension;
      if (self.presetsPanel.inputs.main instanceof File) {
        mainTextInput.val(self.presetsPanel.inputs.main.name);
        mainTextInput.attr('disabled', 'disabled');
        mainExtension = extractExtension(self.presetsPanel.inputs.main.name);
      } else {
        mainTextInput.removeAttr('disabled');
        mainExtension = extractExtension(self.presetsPanel.inputs.main);
      }

      const extensions = parsers.keys('extensions').sort();
      const extRegExp = new RegExp(`^(${extensions.map((ext) => ext.substr(1)).join('|')})$`);
      const extString = extensions.join(', ');

      if (self.presetsPanel.inputs.main instanceof File && !mainExtension.match(extRegExp)) {
        self.presetsPanel.inputs.mainIsCorrect = false;
        self.presetsPanel.inputs.isCorrect = false;
        mainAlertText = `Only the following filename extensions are supported: ${extString}`;
      } else {
        self.presetsPanel.inputs.mainIsCorrect = true;
        self.presetsPanel.inputs.isCorrect = false;
      }
    }
    self.presetsPanel.inputs.isCorrect = true;

    if (self.presetsPanel.inputs.isCorrect) {
      loadPdbButton.removeClass('disabled');
    } else {
      loadPdbButton.addClass('disabled');
    }
    if (self.presetsPanel.inputs.main) {
      clearInputsButton.removeClass('hidden');
    } else {
      clearInputsButton.addClass('hidden');
    }
    displayFormError(mainAlertText);
  }
};

Menu.prototype._presetsPanelActionsPdbInputsClear = function (self) {
  self.presetsPanel.inputs = {
    main: null,
  };
  self.presetsPanel.actions.pdb.inputs.refresh(self);
};

Menu.prototype._presetsPanelActionsPdbLoad = function (self) {
  self._onMenuOff();
  if (self.presetsPanel.inputs) {
    self._viewer.load(self.presetsPanel.inputs.main);
  }
  self.presetsPanel.actions.pdb.inputs.clear(self);
};

Menu.prototype._presetsPanelActionsPdbInputsFile = function (self, element) {
  const urlType = $(element).data('pdb-url-type');
  const textInput = $(`[data-form-type=miew-menu-form-load-pdb] input[type=text][data-pdb-url-type=${urlType}]`).get(0);
  if ($(element).val()) {
    const { files } = $(element)[0];
    if (files.length > 0) {
      self.presetsPanel.inputs[urlType] = files[0];
      $(textInput).val(files[0].name);
      $(textInput).attr('disabled', 'disabled');
    }
  }
  $(element).val('');
  self.presetsPanel.actions.pdb.inputs.refresh(self);
};

Menu.prototype._presetsPanelActionsPdbInputsText = function (self, element, event) {
  const urlType = $(element).data('pdb-url-type');
  self.presetsPanel.inputs[urlType] = $(element).val();
  self.presetsPanel.actions.pdb.inputs.refresh(self);
  if (event && event.type === 'keyup' && event.keyCode === 13 && self.presetsPanel.inputs.isCorrect) {
    self.presetsPanel.actions.pdb.load(self);
  }
};

Menu.prototype._initPresetsPanelActions = function () {
  const self = this;

  self.presetsPanel.actions.pdb.inputs.refresh = self._presetsPanelActionsPdbInputsRefresh; // check input box?
  self.presetsPanel.actions.pdb.inputs.clear = self._presetsPanelActionsPdbInputsClear; // "Cancel" button
  self.presetsPanel.actions.pdb.inputs.file = self._presetsPanelActionsPdbInputsFile; // "Open file" button
  self.presetsPanel.actions.pdb.inputs.text = self._presetsPanelActionsPdbInputsText; // URL text input
  self.presetsPanel.actions.pdb.load = self._presetsPanelActionsPdbLoad; // "Load" button

  self.presetsPanel.actions.pdb.inputs.refresh(self);

  const mainBackButton = $(`${self._menuId} [data-panel-type=miew-menu-panel-presets] button.main-back-button`);
  const presetsBackButton = $(`${self._menuId} [data-panel-type=miew-menu-panel-presets] button.presets-back-button`);
  mainBackButton.removeClass('hidden');
  presetsBackButton.addClass('hidden');

  const findAction = function (parent, path) {
    if (!parent) {
      return null;
    }
    if (path.length === 1) {
      return parent[path[0]];
    }
    const current = path[0];
    path.splice(0, 1);
    return findAction(parent[current], path);
  };

  $(document).on('click input propertychange paste keyup change', '.presets-panel-action', function (event) {
    if ($(this).hasClass('disabled')) {
      return false;
    }
    if ($(this).data('presets-panel-action')) {
      let supportedEvents = $(this).data('presets-panel-events');
      if (supportedEvents) {
        supportedEvents = supportedEvents.split(',');
        if (supportedEvents.indexOf(event.type.toLowerCase()) === -1) {
          return true;
        }
      }
      const actionPath = $(this).data('presets-panel-action').split('-');
      const action = findAction(self.presetsPanel.actions, actionPath);
      if (action) {
        action(self, this, event);
        return event.type.toLowerCase() === 'paste';
      }
    }
    return true;
  });
};

Menu.prototype._initPresetsPanel = function () {
  this.presetsPanel.actions.pdb.inputs.refresh(this);
};

Menu.prototype._initRenderPanel = function () {
  const self = this;

  $(`${self._menuId} [data-toggle=resolution]`).on('click', /** @this HTMLSelectElement */ function () {
    const elements = $(`${self._menuId} [data-value=miew-menu-panel-resolution]`);
    const itemID = this.getAttribute('data-value');

    const prevActive = settings.now.resolution;
    $(`${self._menuId} [data-value="${prevActive}"]`).removeClass('active');

    elements[0].firstElementChild.firstElementChild.textContent = this.textContent;
    settings.set('resolution', itemID);
    $(`${self._menuId} [data-value="${itemID}"]`).addClass('active');

    $(`${self._menuId} button[data-value=miew-menu-panel-render]`).click();
  });

  this._fillCombo('miew-menu-panel-palette', 'palette', 'palette', palettes);
  $(`${self._menuId} [data-toggle=palette]`).on('click', /** @this HTMLSelectElement */ function () {
    const elements = $(`${self._menuId} .list-group-item[data-value=miew-menu-panel-palette]`);
    const itemID = this.getAttribute('data-value');
    const palette = palettes.get(itemID);

    elements[0].firstElementChild.firstElementChild.textContent = palette ? palette.name : 'Unknown';

    self._fillSelectionColorCombo(itemID);

    // Here should be palettes colors mapping
    /* var ucSelector = $(self._menuId + ' .panel-menu[data-panel-type=miew-menu-panel-representation]' +
       '.miew-repr-list [data-value=miew-menu-panel-uniform-color]');
      var ucColor = hexColor(palettes.get(itemID).colors[0]);
      ucSelector.find('.thumbnail').attr('data-id', ucColor);
      ucSelector.find('img').css('background-color', ucColor); */
  });
};

Menu.prototype._initToolsPanel = function () {
  const self = this;
  $(`${self._menuId} .miew-menu-modals [data-modal-type=miew-menu-modal-url]`).on('shown.bs.modal', () => {
    const root = $(`${self._menuId} .miew-menu-modals [data-modal-type=miew-menu-modal-url] .modal-body`)[0].firstChild;
    const content = root.nodeValue;
    if (document.createRange) {
      const rng = document.createRange();
      rng.setStart(root, 0);
      rng.setEnd(root, content.length);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(rng);
    }
  });

  $(`${self._menuId} .miew-menu-modals [data-modal-type=miew-menu-modal-url]`).on('keydown', (e) => {
    if (e.keyCode === 27) { // ESC
      e.preventDefault();
    }
  });

  $(`${self._menuId} [data-toggle=miew-menu-tools]`).on('click', function () {
    const type = this.getAttribute('data-value');
    switch (type) {
      case 'dssp':
        self._viewer.dssp();
        self._onMenuOff();
        break;
      case 'reset-view':
        self._viewer.resetView();
        self._initReprList();
        self._onMenuOff();
        break;
      case 'screenshot':
        self._viewer.screenshotSave();
        self._onMenuOff();
        break;
      case 'get-url': {
        const selector = $(`${self._menuId} .miew-menu-modals [data-modal-type=miew-menu-modal-url]`);
        selector.find('.modal-body')[0].textContent = self._viewer.getURL({ settings: true, view: true });
        selector.modal({
          keyboard: true,
        }, 'show');
        break;
      }
      case 'get-script': {
        const selector = $(`${self._menuId} .miew-menu-modals [data-modal-type=miew-menu-modal-script]`);
        selector.find('.modal-body')[0].innerHTML = self._viewer.getScript().replace(/(?:\r\n|\r|\n)/g, '<br />');
        selector.modal({
          keyboard: true,
        }, 'show');
        break;
      }
      case 'fbx-export':
        self._viewer.save({ fileType: 'fbx' });
        self._onMenuOff();
        break;
      case 'save-settings':
        self._viewer.saveSettings();
        self._onMenuOff();
        break;
      case 'restore-settings':
        self._viewer.restoreSettings();
        self._onMenuOff();
        break;
      case 'reset-settings':
        self._viewer.resetSettings();
        self._onMenuOff();
        break;
      default:
        self._onMenuOff();
    }
    return false;
  });
};

Menu.prototype._onSelectorChanged = function (selectionPanel) {
  const line = selectionPanel.find('input').get(0).value.trim() || 'all';
  const div = selectionPanel.find('.alert-danger').get(0);
  const parsed = selectors.parse(line);
  const selector = selectionPanel.find('[data-btn-type=miew-menu-btn-apply-sel]');
  if (parsed.error) {
    selector.addClass('disabled');
    div.style.display = 'block';
    div.textContent = parsed.error;
  } else {
    selector.removeClass('disabled');
    div.style.display = 'none';
    div.textContent = '';
  }
};

function getAtomNames(viewer) {
  const visual = viewer._getComplexVisual();
  return visual ? visual.getComplex().getAtomNames() : 0;
}

function getElements(viewer) {
  const visual = viewer._getComplexVisual();
  return visual ? visual.getComplex().getElements() : 0;
}

function getResidueNames(viewer) {
  const visual = viewer._getComplexVisual();
  return visual ? visual.getComplex().getResidueNames() : 0;
}

function getChainNames(viewer) {
  const visual = viewer._getComplexVisual();
  return visual ? visual.getComplex().getChainNames() : 0;
}

function getAltLocNames(viewer) {
  const visual = viewer._getComplexVisual();
  return visual ? visual.getComplex().getAltLocNames() : 0;
}

Menu.prototype._initSelectionPanel = function () {
  const self = this;
  const selectionPanel = $(`${self._menuId} [data-panel-type=miew-menu-panel-selection]`);

  function fillSingleWords() {
    const frag = document.createDocumentFragment();
    let newItem;
    const group = selectionPanel.find('[data-tab-content=singleword]').get(0);
    let i;
    let n;

    for (i = 0, n = self._singleWordsPrimary.length; i < n; i++) {
      const wordPrimary = self._singleWordsPrimary[i];
      newItem = createElement(
        'a',
        {
          'href': '#',
          'class': 'list-group-item frequent',
          'data-toggle': 'selection-input',
          'data-value': `${wordPrimary} `,
        },
        wordPrimary,
      );
      frag.appendChild(newItem);
    }

    self._singleWords.sort();
    for (i = 0, n = self._singleWords.length; i < n; i++) {
      const word = self._singleWords[i];
      if (self._singleWordsPrimary.indexOf(word) !== -1) {
        continue;
      }
      newItem = createElement(
        'a',
        {
          'href': '#',
          'class': 'list-group-item',
          'data-toggle': 'selection-input',
          'data-value': `${word} `,
        },
        word,
      );
      frag.appendChild(newItem);
    }

    group.firstElementChild.appendChild(frag);
  }

  function fillKeyWords() {
    const frag = document.createDocumentFragment();
    let newItem;
    const group = selectionPanel.find('[data-tab-content=keyword]').get(0);
    for (let i = 0, n = self._keyWordsPrimary.length; i < n; i++) {
      const wordPrimary = self._keyWordsPrimary[i];
      newItem = createElement(
        'a',
        {
          'href': '#',
          'class': 'list-group-item frequent keyword-item',
          'data-toggle': 'selection-input',
          'data-value': `${wordPrimary} `,
        },
        wordPrimary,
      );
      frag.appendChild(newItem);
    }

    group.firstElementChild.appendChild(frag);
  }

  fillSingleWords();
  fillKeyWords();

  const element = selectionPanel.find('input').get(0);
  element.addEventListener('input', () => this._onSelectorChanged(selectionPanel));
  element.addEventListener('change', () => this._onSelectorChanged(selectionPanel));

  selectionPanel.find('.help-block a').on('click', (e) => {
    const el = selectionPanel.find('input').get(0);
    el.value = e.target.textContent;
    self._onSelectorChanged(selectionPanel);
    return false;
  });

  selectionPanel.find('[data-toggle=selection-input]').on('click', (e) => {
    const text = e.target.getAttribute('data-value');
    const elements = $(`${self._menuId} .panel-menu[data-panel-type=miew-menu-panel-selection] input`);
    elements.val(elements.val() + text);
    self._onSelectorChanged(selectionPanel);
  });

  selectionPanel.find('.calc .delete').on('click', function () {
    const elements = selectionPanel.find('input');
    const type = this.getAttribute('data-delete-type');
    switch (type) {
      case 'clear':
        elements.val('');
        break;
      case 'backspace':
        elements.val(elements.val().slice(0, -1));
        break;
      default:
    }
    self._onSelectorChanged(selectionPanel);
  });

  $(`${self._menuId} .keyword-item`).on('click', (e) => {
    const selector = selectionPanel.find('[data-tab-content=value] div');
    selector.empty();
    selector.off('click', '.value[data-toggle=selection-input]');
    const frag = document.createDocumentFragment();
    let newItem;
    const group = selectionPanel.find('[data-tab-content=value]').get(0);
    const key = e.target.getAttribute('data-value').slice(0, -1);
    let values = [];

    if (hasComplex(self._viewer)) {
      switch (key) {
        case 'name':
          values = getAtomNames(self._viewer);
          break;
        case 'type':
        case 'elem':
          values = getElements(self._viewer);
          break;
        case 'residue':
          values = getResidueNames(self._viewer);
          break;
        case 'chain':
          values = getChainNames(self._viewer);
          break;
        case 'altloc':
          values = getAltLocNames(self._viewer);
          break;
        default:
          values = ['1', '2', '3', '4', '5']; // dummy values
          break;
      }
    }

    for (let i = 0, n = values.length; i < n; i++) {
      const val = values[i];
      newItem = createElement(
        'a',
        {
          'href': '#',
          'class': 'list-group-item value',
          'data-toggle': 'selection-input',
          'data-value': val,
        },
        val,
      );
      frag.appendChild(newItem);
    }
    group.firstElementChild.appendChild(frag);
    selectionPanel.find('.nav-tabs a[href="[data-tab-content=value]"]').tab('show');

    $(`${self._menuId} .value[data-toggle=selection-input]`).on('click', (event) => {
      const text = utils.correctSelectorIdentifier(event.target.getAttribute('data-value'));
      const elements = selectionPanel.find('input');
      elements.val(elements.val() + text);
      self._onSelectorChanged(selectionPanel);
    });
  });

  selectionPanel.find('[data-btn-type=miew-menu-btn-apply-sel]').on('click', /** @this HTMLElement */ () => {
    if (!selectionPanel.find('[data-btn-type=miew-menu-btn-apply-sel]').hasClass('disabled')) {
      const line = selectionPanel.find('input').val().trim() || 'all';
      const elements = $(`${self._menuId} [data-panel-type=miew-menu-panel-representation] .miew-repr-list `
          + `.panel.valid:eq(${self._curReprIdx}) .panel-collapse [data-value=miew-menu-panel-selection]`);
      elements[0].firstElementChild.firstElementChild.textContent = line;

      const badge = $(`${self._menuId} [data-panel-type=miew-menu-panel-representation] .miew-repr-list `
          + `.panel.valid:eq(${self._curReprIdx}) .panel-heading .badge`);
        // update number of atoms included by selector
      const parsed = selectors.parse(line);
      const numAtoms = getNumAtomsBySelector(self._viewer, parsed.selector);
      badge[0].textContent = String(numAtoms);

      selectionPanel.get(0).firstElementChild.firstElementChild.click();
    }
  });
};

Menu.prototype._initToolbar = function () {
  const self = this;

  const frag = document.createDocumentFragment();
  let newItem;

  function fillToolbar(type, name, option, entityList) {
    const toolbar = $(`${self._menuId} [data-toolbar-type=${type}]`).get(0);
    const list = entityList.all;
    for (let i = 0, n = list.length; i < n; i++) {
      let entry = list[i];
      entry = entry.prototype || entry; // entry may be Class or Object
      newItem = createElement('a', {
        'href': '#',
        'class': 'thumbnail',
        'data-toggle': name,
        'data-value': entry.id,
      }, [
        createElement('div', {
          'class': 'toolbar-thumb',
          'style': `background:url(images/${name.substring(0, name.indexOf('-'))}/${entry.id}.png)`,
        }),
        createElement(
          'div',
          {
            'class': 'caption text-center',
          },
          createElement(
            'small',
            {},
            entry.shortName,
          ),
        )]);
      frag.appendChild(newItem);
    }
    toolbar.lastElementChild.lastElementChild.appendChild(frag);
  }

  fillToolbar('miew-menu-toolbar-mode', 'mode-immediate', 'mode', modes);
  fillToolbar('miew-menu-toolbar-colorer', 'colorer-immediate', 'colorer', colorers);

  // Update mode selector names and add event listeners
  $(`${self._menuId} [data-toggle="mode-immediate"]`).each((index, element) => {
    const id = element.getAttribute('data-value');
    element.addEventListener('click', (event) => {
      $(`${self._menuId} [data-value="${unarray(self._viewer.rep().mode)}"]`).removeClass('active');
      $(`${self._menuId} [data-value=miew-menu-toolbar-mode]`).click();
      self._viewer.rep({ mode: id });
      event.preventDefault();
      self._fixKeyboard();
    });
  });

  // Update colorer selector names and add event listeners
  $(`${self._menuId} [data-toggle="colorer-immediate"]`).each((index, element) => {
    const id = element.getAttribute('data-value');
    element.addEventListener('click', (event) => {
      $(`${self._menuId} [data-value="${unarray(self._viewer.rep().colorer)}"]`).removeClass('active');
      $(`${self._menuId} [data-value=miew-menu-toolbar-colorer]`).click();
      self._viewer.rep({ colorer: id });
      event.preventDefault();
      self._fixKeyboard();
    });
  });

  // Update resolution selector names and add event listeners
  $(`${self._menuId} [data-toggle="resolution-immediate"]`).each((index, element) => {
    const id = element.getAttribute('data-value');
    element.addEventListener('click', (event) => {
      $(`${self._menuId} [data-value="${settings.now.resolution}"]`).removeClass('active');
      settings.set('resolution', id);
      $(`${self._menuId} [data-value=miew-menu-toolbar-resolution]`).click();
      self._viewer.rebuildAll();
      event.preventDefault();
      self._fixKeyboard();
    });
  });

  $(`${self._menuId} .titlebar [data-toggle=panel]`).on('click', () => {
    self._onMenuOn();
  });

  $(`${self._menuId} .toolbar`).on('click', (event) => {
    const target = $(event.target);
    if (target.is('.toolbar')) {
      const type = target.attr('data-toolbar-type');
      $(`${self._menuId} [data-value="${type}"]`).click();
      self._fixKeyboard();
    }
  });
};

Menu.prototype._initReprList = function () {
  this._fillReprList();
  this._curReprIdx = this._viewer.repCurrent();
  $(`${this._menuId} .panel-menu[data-panel-type=miew-menu-panel-representation] .miew-repr-list .panel.valid:eq(${
    this._curReprIdx}) .panel-heading`).addClass('active');

  $(`${this._menuId} .panel-menu[data-panel-type=miew-menu-panel-representation] .miew-repr-list .panel.valid:eq(${
    this._curReprIdx}) .panel-collapse`).collapse('show');

  if (this._viewer.repCount() > 1) {
    $(`${this._menuId} .miew-repr-list-controls [data-btn-type=miew-menu-btn-del-repr]`).removeClass('disabled');
  } else {
    $(`${this._menuId} .miew-repr-list-controls [data-btn-type=miew-menu-btn-del-repr]`).addClass('disabled');
  }
  if (this._viewer.repCount() < this._viewer.getMaxRepresentationCount()) {
    $(`${this._menuId} .miew-repr-list-controls [data-btn-type=miew-menu-btn-add-repr]`).removeClass('disabled');
  } else {
    $(`${this._menuId} .miew-repr-list-controls [data-btn-type=miew-menu-btn-add-repr]`).addClass('disabled');
  }
};

Menu.prototype._updateResolutionCombo = function () {
  this._removeActiveFromCombo('resolution');

  const elements = $(`${this._menuId} [data-value=miew-menu-panel-resolution]`);
  const resSelector = $(`${this._menuId} [data-toggle=resolution][data-value="${settings.now.resolution}"]`);

  elements[0].firstElementChild.firstElementChild.textContent = resSelector.text();
  resSelector.addClass('active');
};

Menu.prototype.setBlur = function (enable) {
  const container = this._viewer._container;
  if (enable) {
    container.classList.add('blur');
  } else {
    container.classList.remove('blur');
  }
};

Menu.prototype.show = function (panelID, menuItem) {
  const self = this;

  this.setBlur(true);
  this._titlebar.hide();

  const selectorHide = self._getPanelSelector(self._curPanelID);
  selectorHide.hide();
  $(`${self._menuId} a[data-value="${self._curMenuItem}"]`).removeClass('active');

  self._curPanelID = panelID;
  self._curMenuItem = menuItem;
  if (this._xs === false) {
    const selectorShow = self._getPanelSelector(self._curPanelID);
    selectorShow.show();
    $(`${self._menuId} a[data-value="${menuItem}"]`).addClass('active');
  }

  // Prepare a copy of settings to fill
  settings.checkpoint();

  self._updateDisplayOptions('miew-menu-panel-palette', 'palette', palettes);
  self._fillSelectionColorCombo(settings.get('palette'));

  self._fillSourceList();
  self._initReprList();

  self._updateResolutionCombo();

  $(`${self._menuId} input[type=checkbox][data-dir=settings]`).each((index, element) => {
    const param = element.getAttribute('data-toggle');
    if (param === 'bg.color') {
      $(`${self._menuId} [data-toggle="${param}"]`).bootstrapSwitch('state', settings.get(param) === 0x202020);
    } else {
      $(`${self._menuId} [data-toggle="${param}"]`).bootstrapSwitch('state', settings.get(param));
    }
  });

  // renew currently opened mode-, colorer-, matpreset- combobox panel (need, when they were changed from toolbar)
  if (self._curPanelID.indexOf('selection') !== -1
    || self._curPanelID.indexOf('mode') !== -1
    || self._curPanelID.indexOf('color') !== -1
    || self._curPanelID.indexOf('matpreset') !== -1) {
    const reprList = $(`${self._menuId} [data-panel-type=miew-menu-panel-representation] .miew-repr-list`);
    const comboPanel = reprList.find(`.panel:eq(${self._curReprIdx}) [data-value="${self._curPanelID}"]`);
    if (comboPanel) {
      comboPanel.click(); // call update of active item, getting value from current reprList
    }
  }

  $(`${self._menuId} .panel-menu[data-panel-type=miew-menu-panel-main]`).show();
  this._menu.show();
};

Menu.prototype.showTerminal = function () {
  this._terminal.show();
  this._terminalWindow.focus();
  this._term.resize();
};

Menu.prototype._removeActiveFromCombo = function (comboName) {
  const selector = $(`${this._menuId} [data-toggle=${comboName}].active`);
  selector.removeClass('active');
};

Menu.prototype.hide = function () {
  // Clear resolution setting display because it might be changed
  const resSelector = $(`${this._menuId} [data-toggle=resolution][data-value="${settings.now.resolution}"]`);
  resSelector.removeClass('active');

  // Clear active items in currently opened mode- o colorer- combobox panel, because they might be changed
  if (this._curPanelID.indexOf('mode') !== -1) {
    this._removeActiveFromCombo('mode');
  } else if (this._curPanelID.indexOf('color') !== -1) {
    this._removeActiveFromCombo('colorer');
  } else if (this._curPanelID.indexOf('matpreset') !== -1) {
    this._removeActiveFromCombo('material');
  }

  // Resume rendering
  this.setBlur(false);
  this._titlebar.show();

  this._menu.hide();
};

Menu.prototype.hideTerminal = function () {
  this._terminal.hide();
  this._terminalWindow.focus(false);
};

Menu.prototype._hideToolbarPanel = function () {
  const toolbar = $(`${this._menuId} [data-toggle="toolbar"].active`);
  toolbar.trigger('click');
};

Menu.prototype._onMenuOn = function () {
  // Stop rendering to lower CPU load
  this._viewer.halt();
  $(`${this._menuId} .overlay`).hide();
  this._reprListChanged = false;
  this._initPresetsPanel();
  this._hideToolbarPanel();
  // Show the panel
  this.show(this._curPanelID, this._curMenuItem);
};

Menu.prototype._onTerminalOn = function () {
  $(`${this._menuId} .overlay`).hide();
  this._viewer.enableHotKeys(false);
  this._hideToolbarPanel();
  this.showTerminal();
};

Menu.prototype._onMenuOff = function () {
  this._updateReprList();

  // Apply changed settings
  if (this._reprListChanged) {
    this._viewer.repGet().needsRebuild = true;
  }

  this.hide();
  this._viewer.run();
  $(`${this._menuId} .overlay`).show();
  this._fixKeyboard();
};

Menu.prototype._onTerminalOff = function () {
  this.hideTerminal();
  this._viewer.enableHotKeys(true);
  $(`${this._menuId} .overlay`).show();
  this._fixKeyboard();
};

Menu.prototype._fixKeyboard = function () {
  // do IFRAME related hack // NOTE: embedding the demo is not recommended/supported anymore
  if (window !== window.top) {
    const parentDocument = window.top.document;
    let button = parentDocument.querySelector('button');
    if (!button) {
      const body = parentDocument.querySelector('body');
      if (body) {
        button = parentDocument.createElement('button');
        button.style.visibility = 'hidden';
        body.appendChild(button);
        button = parentDocument.querySelector('button');
      }
    }
    if (!button) {
      throw new Error('Some input element should be defined in parent frame. Hidden one is ok.');
    }
    button.focus();
  }
};

Menu.prototype.showOverlay = function () {
  this._titlebar.show();
};

Menu.prototype.hideOverlay = function () {
  this._titlebar.hide();
};

Menu.prototype._isXS = function () {
  const nWideWidth = 768;
  return document.documentElement.clientWidth < nWideWidth;
};

Menu.prototype._updateDisplayOptions = function (id, name, entityList) {
  let entry = entityList.get(settings.get(name)) || entityList.first;
  entry = entry.prototype || entry;
  $(`${this._menuId} .list-group-item[data-value="${
    id}"]`)[0].firstElementChild.firstElementChild.textContent = entry.name;
};

Menu.prototype._setTitle = function (title) {
  $(`${this._menuId} [data-field="title"]`).text(title);
};

Menu.prototype._updateInfo = function (dataSource) {
  if (dataSource && dataSource.id !== 'Complex') {
    return;
  }
  const complex = dataSource;

  const body = $('.panel-menu[data-panel-type=miew-menu-panel-info]').children('.panel-body')[0];

  // remove all existing text
  const parent = body;
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }

  const frag = document.createDocumentFragment();
  if (!complex) {
    frag.appendChild(createElement('p', null, 'No data loaded yet.'));
    body.appendChild(frag);
    return;
  }

  const { metadata } = complex;
  const h1 = createElement('h1', null, `${metadata.id || complex.name || 'Unknown data'} `);
  if (metadata.classification) {
    h1.appendChild(createElement('small', null, `/ ${metadata.classification}`));
  }
  frag.appendChild(h1);

  if (metadata.title) {
    frag.appendChild(createElement('p', null, metadata.title.join(' ')));
  }

  frag.appendChild(createElement('hr'));

  function _createRow(name, value) {
    return createElement('tr', null, [
      createElement('td', null, name),
      createElement('td', { 'class': 'text-center' }, String(value)),
    ]);
  }

  frag.appendChild(createElement('table', { 'class': 'table' }, [
    createElement(
      'thead',
      null,
      createElement('tr', null, [
        createElement('th', { 'class': 'col-xs-10' }, 'Statistics'),
        createElement('th', { 'class': 'col-xs-2 text-center' }, 'Value'),
      ]),
    ),
    createElement('tbody', null, [
      _createRow('Atoms', complex.getAtomCount()),
      _createRow('Bonds', complex.getBondCount()),
      _createRow('Residues', complex.getResidueCount()),
      _createRow('Chains', complex.getChainCount()),
      _createRow('Molecules', complex.getMoleculeCount()),
    ]),
  ]));

  frag.appendChild(createElement('hr'));
  // add molecule info
  const molecules = complex.getMolecules();
  const molList = createElement('ol');
  for (let i = 0; i < molecules.length; i++) {
    molList.appendChild(createElement('li', null, molecules[i].name));
  }
  frag.appendChild(createElement('table', { 'class': 'table' }, [
    createElement(
      'thead',
      null,
      createElement('tr', null, [
        createElement('th', { 'class': 'col-xs-10' }, 'Molecules'),
      ]),
    ),
    createElement('tbody', null, createElement('tr', null, createElement('td', null, molList))),
  ]));

  body.appendChild(frag);
};

Menu.prototype._onResize = function () {
  if (this._xs === false && this._isXS() === true) {
    this._xs = true;
    $(`${this._menuId} .panel-menu[data-panel-type=miew-menu-panel-main]`).hide();
  }
  if (this._xs === true && this._isXS() === false) {
    this._xs = false;
    $(`${this._menuId} .panel-menu[data-panel-type=miew-menu-panel-main]`).show();
    $(`${this._menuId} a[data-value="${this._curMenuItem}"]`).addClass('active');
    this._getPanelSelector(this._curPanelID).show();
  }
  if (this._term) {
    this._term.resize();
  }
};

Menu.prototype._updateReprList = function () {
  const self = this;

  function _createOptionsFromMVData(index, property, element, itemId) {
    const curRep = self._viewer.repGet(index);
    if (curRep[property].id !== itemId) {
      $(element).removeData();
      return itemId;
    }
    const opts = $(element).data().mvdata;
    if (typeof opts === 'undefined' || _.isEmpty(opts)) {
      return itemId;
    }
    const diff = utils.objectsDiff(opts, settings.now[`${property}s`][itemId]);
    if (_.isEmpty(diff)) {
      return itemId;
    }
    return [itemId, diff];
  }

  const removeIdxList = [];
  let selector = null;
  let modeItem = null;
  let colorerItem = null;
  let matPresetItem = null;
  let ucColorItem = null;
  let modeId = null;
  let colorerId = null;
  let matPresetId = null;
  let isDeleted = null;
  let isAdded = null;
  let isVisible = null;
  let zClip = null;
  let isoValue = null;
  let radScale = null;
  let ucColor = null;
  let repr = null;

  function _fillModeOptionsFromMenu() {
    // change mode's zClip flag if applicable
    if (('zClip' in repr.mode.opts) && repr.mode.opts.zClip !== zClip) {
      repr.mode.opts.zClip = zClip;
      repr.needsRebuild = true;
    }

    // change mode's radius scale flag if applicable
    if (('scale' in repr.mode.opts) && repr.mode.opts.scale !== radScale) {
      repr.mode.opts.scale = radScale;
      repr.needsRebuild = true;
    }

    // change mode's isosurface value flag if applicable
    if (('isoValue' in repr.mode.opts) && repr.mode.opts.isoValue !== isoValue) {
      repr.mode.opts.isoValue = isoValue;
      repr.needsRebuild = true;
    }
  }

  $(`${self._menuId} [data-panel-type=miew-menu-panel-representation] `
      + '.miew-repr-list .panel').each((index, element) => {
    isDeleted = $(element).hasClass('deleted');
    isAdded = $(element).hasClass('added');

    if (!(isDeleted && isAdded)) {
      isVisible = ($(element).find('.panel-heading .btn-visible').css('display') !== 'none');
      selector = $(element).find('[data-type=selection-target]')[0].textContent;
      modeItem = $(element).find('[data-value=miew-menu-panel-mode]')[0];
      colorerItem = $(element).find('[data-value=miew-menu-panel-color]')[0];
      matPresetItem = $(element).find('[data-value=miew-menu-panel-matpreset]')[0];
      ucColorItem = $(element).find('[data-value=miew-menu-panel-select-color]')[0];
      modeId = modeItem.firstElementChild.firstElementChild.getAttribute('data-id');
      colorerId = colorerItem.firstElementChild.firstElementChild.getAttribute('data-id');
      matPresetId = matPresetItem.firstElementChild.firstElementChild.getAttribute('data-id');
      ucColor = stringColorToHex(ucColorItem.lastChild.firstElementChild.getAttribute('data-id'));

      zClip = $(element).find('[type=checkbox][data-toggle=zClip]')[0].checked;
      radScale = parseFloat($(element).find('[data-type=rad]').val());
      isoValue = parseFloat($(element).find('[data-type=iso]').val());

      if (isDeleted) {
        removeIdxList.push(index);
      } else if (isAdded) {
        const idx = self._viewer.repAdd({
          selector,
          mode: modeId,
          colorer: colorerId,
        });
        if (idx >= 0) {
          repr = self._viewer.repGet(idx);

          _fillModeOptionsFromMenu();

          if (colorerId === 'UN' || colorerId === 'CB') {
            repr.colorer.opts.color = ucColor;
          }
          repr.setMaterialPreset(materials.get(matPresetId));

          if (repr.visible !== isVisible) {
            self._viewer.setNeedRender();
          }
          repr.show(isVisible);
        }
      } else {
        const modeParams = _createOptionsFromMVData(index, 'mode', modeItem, modeId);
        const colorerParams = _createOptionsFromMVData(index, 'colorer', colorerItem, colorerId);
        index = self._viewer.repCurrent(index);
        self._viewer.rep(index, {
          selector, mode: modeParams, colorer: colorerParams, material: matPresetId,
        });

        repr = self._viewer.repGet();
        // change uniform colorer's color if applicable
        if (colorerId === 'UN' || colorerId === 'CB') {
          if (repr.colorer.opts.color !== ucColor) {
            repr.needsRebuild = true;
            repr.colorer.opts.color = ucColor;
          }
        }

        _fillModeOptionsFromMenu();

        if (repr.visible !== isVisible) {
          self._viewer.setNeedRender();
        }
        repr.show(isVisible);
      }
    }
  });

  // works only if representation order has not been changed in menu
  const len = removeIdxList.length;
  for (let idx = len - 1; idx > -1; --idx) {
    self._viewer.repRemove(removeIdxList[idx]);
  }
  self._viewer.repCurrent(self._curReprIdx);
};

Menu.prototype._enableToolbar = function (enable) {
  const self = this;
  if (enable) {
    $(`${self._menuId} [data-toggle=toolbar]`).removeClass('disabled');
  } else {
    $(`${self._menuId} [data-toggle=toolbar]`).addClass('disabled');
  }
};

export default Menu;
