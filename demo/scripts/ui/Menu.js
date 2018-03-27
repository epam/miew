

import $ from 'jquery';
import _ from 'lodash';
import Miew from 'Miew';
import menuHtml from '../../menu.html';
import 'bootstrap';
import 'bootstrap-switch';
import 'jquery.terminal';

var
  selectors = Miew.chem.selectors,
  modes = Miew.modes,
  colorers = Miew.colorers,
  palettes = Miew.palettes,
  materials = Miew.materials,
  settings = Miew.settings,
  utils = Miew.utils,
  Representation = Miew.gfx.Representation,
  fbxExport = Miew.gfx.fbxExport;

var
  createElement = utils.createElement,
  hexColor = utils.hexColor;

function stringColorToHex(color) {
  var hexString = '0x' + color.substr(-6);
  return parseInt(hexString, 16);
}

function unarray(x) {
  if (x instanceof Array) {
    x = x[0];
  }
  return x;
}

function Menu(/** Node */ container, /** Miew */ viewer) {
  // Add proper DOM elements
  _.forEach($.parseHTML(menuHtml), (element) => container.parentNode.appendChild(element));

  // Save some objects for future reference
  this._viewer = viewer;
  this._menuId = '#miew-menu';
  this._titlebar = $(this._menuId + ' .titlebar');
  this._menu = $(this._menuId + ' .main-menu');
  this._curPanelID = 'miew-menu-panel-info';
  this._curMenuItem = 'miew-menu-panel-info';
  this._xs = false;
  this._curReprIdx = 0;

  this._menu.find('.PACKAGE_VERSION').text(Miew.VERSION);

  //FIX ME!
  this._singleWordsPrimary = [
    'all', 'none', 'water', 'hetatm', 'protein', 'basic', 'acidic', 'charged',
    'polar', 'nonpolar', 'aromatic', 'nucleic', 'purine', 'pyrimidine', 'polarh', 'nonpolarh'
  ];
  this._singleWords = [
    'all', 'none', 'water', 'hetatm', 'protein', 'basic', 'acidic', 'charged',
    'polar', 'nonpolar', 'aromatic', 'nucleic', 'purine', 'pyrimidine', 'polarh', 'nonpolarh'
  ];
  this._keyWordsPrimary = ['serial', 'name', 'elem', 'residue', 'sequence', 'chain', 'altloc'];

  this._init();
  this._initializeTerminal();
}

Menu.prototype._initializeTerminal = function() {
  var self = this;
  var res = null;
  var urlSubString = '';
  var element = $('#miew-menu [data-btn-type=miew-menu-btn-browse-file] input');

  function onChangeEventListener() {
    if ($(element).val()) {
      var files = $(element)[0].files;
      if (files.length > 0) {
        var opts;
        if (res !== null) {
          opts = {mdFile: res[1]};
        }
        self._viewer.load(files[0], opts);
      }
    }
    urlSubString = '';
    $(element).val('');
  }

  element.change(onChangeEventListener);

  this._terminal = $(this._menuId + ' .miew-terminal');
  this._terminalWindow = this._terminal.find('.terminal-window');
  this._terminalWindow.on('click', () =>  this._hideToolbarPanel());
  this._terminalWindow.terminal(
    function(command, term) {
      if (self._viewer) {
        command = command.trim();
        var loadStr = command.split(/\s+/);

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
          self._viewer.script(command, function(str) {
            term.echo(str);
          }, function(str) {
            term.error(str);
          });
        }
      } else {
        term.error('Miew is not initialized.');
      }
    },
    {
      greetings: 'Miew - 3D Molecular Viewer\nCopyright © 2015-2018 EPAM Systems, Inc.\n',
      prompt: 'miew> ',
      name: 'miew',
      scrollOnEcho: true,
      height: '100%',
      keydown: function(event, _term) {
        if (event.keyCode === 192) { //skip '~'
          return false;
        }

        return undefined;
      },
      onInit: function(term) {
        if (self._viewer) {
          var colors = {
            'error': '#f00',
            'warn': '#990',
            'report': '#1a9cb0',
          };
          var onLogMessage = function(e) {
            var msg = e.message.replace(/]/g, '\\]');
            term.echo('[[b;' + (colors[e.level] || '#666') + ';]' + msg + ']');
          };
          self._viewer.logger.addEventListener('message', onLogMessage);
        }
      }
    }
  );
};

Menu.prototype._fillUniformColorCombo = function(paletteID) {
  var self = this;
  var frag = document.createDocumentFragment();
  var colorList = (palettes.get(paletteID) || palettes.any).namedColorsArray;

  var comboboxPanel = $(self._menuId + ' [data-panel-type=miew-menu-panel-uniform-color]');
  for (var i = 0, n = colorList.length; i < n; i++) {
    var color = hexColor(colorList[i][1]);
    var newItem = createElement('div', {
      'class':       'col-xs-2 col-sm-2',
      'data-toggle': 'uniformcolor',
      'data-value':  color
    }, [
      createElement(
        'a', {
          'href' : '#',
          'class': 'thumbnail',
          'style': 'text-align:center;'
        },
        createElement('img', {
          'src': 'images/empty_icon.png',
          'style': 'background-color: ' + color + ';',
          'data-tooltip': 'tooltip',
          'data-placement': 'bottom',
          'title': colorList[i][0],
        })
      ),
    ]);
    frag.appendChild(newItem);
  }
  $(comboboxPanel.get(0).lastElementChild.firstElementChild).empty();
  comboboxPanel.get(0).lastElementChild.firstElementChild.appendChild(frag);

  $(self._menuId + ' [data-toggle=uniformcolor]').on('click', /** @this HTMLSelectElement */ function() {
    var prevActive = self._getCurReprPropertyId('miew-menu-panel-uniform-color');
    $(self._menuId + ' [data-value="' + prevActive + '"]').removeClass('active');
    comboboxPanel.get(0).firstElementChild.firstElementChild.click();
    var elements = $(self._menuId + ' [data-panel-type=miew-menu-panel-representation] .miew-repr-list ' +
        '.panel.valid:eq(' + self._curReprIdx + ') [data-value=miew-menu-panel-uniform-color]');
    var newColor = this.getAttribute('data-value');
    elements[0].firstElementChild.firstElementChild.setAttribute('data-id', newColor);
    elements[0].firstElementChild.firstElementChild.firstElementChild.style.backgroundColor = newColor;
  });

  comboboxPanel.find('.panel-heading:first-of-type button:first-of-type').on('click', function() {
    var activeItem = self._getCurReprPropertyId('miew-menu-panel-uniform-color');
    $(self._menuId + ' [data-toggle=uniformcolor][data-value="' + activeItem + '"]').removeClass('active');
  });
};

Menu.prototype._fillCombo = function(type, name, path, module) {
  var self = this;
  var frag = document.createDocumentFragment();
  var newItem;

  var comboboxPanel = $(self._menuId + ' [data-panel-type=' + type + ']').get(0);
  for (var i = 0, n = module.list.length; i < n; i++) {
    var entry = module.list[i];
    entry = entry.prototype || entry;  // entry may be Class or Object
    newItem = createElement('a', {
      'href':        '#',
      'class':       'list-group-item',
      'data-toggle': name,
      'data-value':  entry.id
    }, [
      createElement(
        'div', {'class': 'media-left'},
        createElement('img', {
          'class': 'media-object',
          'src': 'images/' + name + '/' + entry.id + '.png',
          'width': '48',
          'height': '48'
        })
      ),
      createElement('div', {
        'class': 'media-body media-middle',
      }, entry.name)
    ]);
    frag.appendChild(newItem);
  }
  comboboxPanel.lastElementChild.firstElementChild.appendChild(frag);

  $(self._menuId + ' [data-toggle=' + name + ']').on('click', /** @this HTMLSelectElement */ function() {
    var itemID = this.getAttribute('data-value');
    var prevActive;
    if (type === 'miew-menu-panel-palette') {
      prevActive = settings.get(path);
      settings.set(path, itemID);
    } else {
      prevActive = self._getCurReprPropertyId(type);
    }
    $(self._menuId + ' [data-value="' + prevActive + '"]').removeClass('active');
    comboboxPanel.firstElementChild.firstElementChild.click();
  });

  $(self._menuId + ' [data-toggle=combobox-panel][data-value="' + type + '"]').on(
    'click',
    /** @this HTMLSelectElement */ function() {
      var activeItem;
      if (type === 'miew-menu-panel-palette') {
        activeItem = settings.get(path);
      } else {
        activeItem = self._getCurReprPropertyId(type);
      }
      $(self._menuId + ' a[data-value="' + activeItem + '"]').addClass('active');
    }
  );

  $(self._menuId + ' [data-panel-type=' + type + '] .panel-heading:first-of-type button:first-of-type').on(
    'click',
    function() {
      var activeItem;
      if (type === 'miew-menu-panel-palette') {
        activeItem = settings.get(path);
      } else {
        activeItem = self._getCurReprPropertyId(type);
      }
      $(self._menuId + ' a[data-value="' + activeItem + '"]').removeClass('active');
    }
  );
};

Menu.prototype._initReprListItemListeners = function(index) {
  var self = this;
  var reprList = $(self._menuId + ' [data-panel-type=miew-menu-panel-representation] .miew-repr-list');

  function onActiveReprChanged(event) {
    var newReprIdx = reprList.find('.panel.valid').index($(event.currentTarget).parent());
    var btnSelector =  reprList.find('.panel.valid:eq(' + newReprIdx + ') .panel-heading .btn span');
    if (event.target !== btnSelector[0] && event.target !== btnSelector[1]) {
      var rowSelector = reprList.find('.panel.valid:eq(' + self._curReprIdx + ') .panel-heading');
      rowSelector.removeClass('active');
      rowSelector = reprList.find('.panel.valid:eq(' + self._curReprIdx + ') .panel-collapse');
      rowSelector.collapse('hide');

      self._curReprIdx = newReprIdx;
      rowSelector = reprList.find('.panel.valid:eq(' + self._curReprIdx + ') .panel-heading');
      rowSelector.addClass('active');
      reprList.find('.panel.valid:eq(' + self._curReprIdx + ') .panel-collapse').collapse('show');
    }
  }

  reprList.find('.panel:eq(' + index + ') .panel-heading').on('click', onActiveReprChanged);

  reprList.find('.panel:eq(' + index + ') input[type=checkbox]').bootstrapSwitch();


  reprList.find('.panel:eq(' + index + ') .panel-heading .btn-visible').on('click', function() {
    reprList.find('.panel:eq(' + index + ') .panel-heading .btn-visible').hide();
    reprList.find('.panel:eq(' + index + ') .panel-heading .btn-invisible').show();
  });

  reprList.find('.panel:eq(' + index + ') .panel-heading .btn-invisible').on('click', function() {
    reprList.find('.panel:eq(' + index + ') .panel-heading .btn-invisible').hide();
    reprList.find('.panel:eq(' + index + ') .panel-heading .btn-visible').show();
  });

  reprList.find('.panel:eq(' + index + ') [data-toggle="combobox-panel"]').on('click', function _setComboboxPanel() {
    var selectorHide = self._getPanelSelector(self._curPanelID);
    selectorHide.hide();

    self._curPanelID = this.getAttribute('data-value');
    var selectorShow = self._getPanelSelector(self._curPanelID);
    selectorShow.show();

    return false;
  });

  reprList.find(' .panel:eq(' + index + ') input[type=number]').on('input', function(e) {
    var spinner = $(e.currentTarget);

    if (parseFloat(spinner.attr('min')) > parseFloat(spinner.val())) {
      spinner.val(parseFloat(spinner.attr('min')));
      spinner.change();
    }
    if (parseFloat(spinner.attr('max')) < parseFloat(spinner.val())) {
      spinner.val(parseFloat(spinner.attr('max')));
      spinner.change();
    }
  });

  reprList.find('.panel:eq(' + index + ') .spinner-dec-btn').on('click', function(e) {
    var spinnerType = e.currentTarget.getAttribute('data-value');
    var spinner = reprList.find('.panel:eq(' + index + ') [data-type=' + spinnerType + ']');
    if (parseFloat(spinner.attr('min')) < parseFloat(spinner.val())) {
      spinner.val((10 * spinner.val() - 10 * spinner.attr('step')) / 10);
      spinner.change();
    }
  });

  reprList.find('.panel:eq(' + index + ') .spinner-inc-btn').on('click', function(e) {
    var spinnerType = e.currentTarget.getAttribute('data-value');
    var spinner = reprList.find('.panel:eq(' + index + ') [data-type=' + spinnerType + ']');
    if (parseFloat(spinner.attr('max')) > parseFloat(spinner.val())) {
      spinner.val((10 * spinner.val() + 10 * spinner.attr('step')) / 10);
      spinner.change();
    }
  });
  //FIX ME!!
  reprList.find('.panel:eq(' + index + ') [data-toggle=combobox-panel][data-value=miew-menu-panel-mode]').on(
    'click',
    function() {
      var activeItem = this.firstElementChild.firstElementChild.getAttribute('data-id');
      $(self._menuId + ' a[data-value="' + activeItem + '"][data-toggle=mode]').addClass('active');
    }
  );
  reprList.find('.panel:eq(' + index + ') [data-toggle=combobox-panel][data-value=miew-menu-panel-color]').on(
    'click',
    function() {
      var activeItem = this.firstElementChild.firstElementChild.getAttribute('data-id');
      $(self._menuId + ' a[data-value="' + activeItem + '"][data-toggle=colorer]').addClass('active');
    }
  );
  reprList.find('.panel:eq(' + index + ') [data-toggle=combobox-panel][data-value=miew-menu-panel-matpreset]').on(
    'click',
    function() {
      var activeItem = this.firstElementChild.firstElementChild.getAttribute('data-id');
      $(self._menuId + ' a[data-value="' + activeItem + '"]').addClass('active');
    }
  );

  reprList.find('.panel:eq(' + index + ') [data-toggle=combobox-panel][data-value=miew-menu-panel-uniform-color]').on(
    'click',
    function() {
      var activeItem = this.firstElementChild.firstElementChild.getAttribute('data-id');
      $(self._menuId + ' [data-toggle=uniformcolor][data-value="' + activeItem + '"]').addClass('active');
    }
  );

  reprList.find('.panel:eq(' + index + ') [data-toggle=combobox-panel][data-value=miew-menu-panel-selection]').on(
    'click',
    function() {
      var element = reprList.find('.panel.valid:eq(' + self._curReprIdx + ') [data-value=miew-menu-panel-selection]');
      var selectionPanel = $(self._menuId + ' [data-panel-type=miew-menu-panel-selection]');
      selectionPanel.find('input').val(element[0].firstElementChild.firstElementChild.textContent + ' ');
      selectionPanel.find('.nav-tabs a[href="[data-tab-content=singleword]"]').tab('show');
      self._onSelectorChanged(selectionPanel);
    }
  );

};

Menu.prototype._addReprListItem = function(panel, index, repr) {
  var self = this;
  var reprList = $(self._menuId + ' [data-panel-type=miew-menu-panel-representation] .miew-repr-list');
  var validReprN = reprList.find('.panel.valid').length;
  var newItem = createElement('div', {
    'class': 'panel panel-default valid'
  }, [
    createElement(
      'div', {
        'class': 'panel-heading',
        'role': 'tab'
      },
      createElement('h4', {'class': 'panel-title'}, [
        createElement(
          'button', {'class': 'btn btn-default btn-invisible'},
          createElement('span', {'class': 'glyphicon glyphicon-unchecked'})
        ),
        createElement(
          'button', {'class': 'btn btn-default btn-visible'},
          createElement('span', {'class': 'glyphicon glyphicon-check'})
        ),
        createElement(
          'a', {
            'role'         : 'button',
            'data-toggle'  : 'collapse',
            'data-parent'  : '.panel-menu[data-panel-type=miew-menu-panel-representation] .miew-repr-list',
            'href'         : `#repr${index + 1}`,
            'aria-expanded' : 'true',
            'aria-controls' : '[data-number=repr-' + String(index + 1) + ']'
          },
          '#' + String(validReprN + 1) + ': ' + repr.mode.name
        ),
        createElement(
          'div', {'class' : 'pseudo-div'},
          createElement(
            'span', {'class': 'pull-right badge'},
            String(hasComplex(this._viewer) ? getNumAtomsBySelector(self._viewer, repr.selector) : '0')
          )
        )])
    ),
    createElement(
      'div', {
        'data-number': 'repr-' + String(index + 1),
        'class' : 'panel-collapse collapse',
        'role' : 'tabpanel',
        'aria-labelledby' : 'head-repr-' + String(index + 1)
      },
      createElement('ul', {'class' :  'list-group row'}, [
        createElement('li', {
          'class' :  'list-group-item col-xs-12 col-sm-12',
          'data-toggle' : 'combobox-panel',
          'data-value' : 'miew-menu-panel-selection'
        }, [
          'Selection',
          createElement('span', {'class' : 'pull-right'}, [
            createElement('label', {
              'class' : 'text-muted',
              'data-type' : 'selection-target',
              'style' : 'word-break: break-all'
            }, String(repr.selector)),
            createElement('span', {'class' : 'glyphicon glyphicon-menu-right'})])]),
        createElement('li', {
          'class' :  'list-group-item col-xs-12 col-sm-12',
          'data-toggle' : 'combobox-panel',
          'data-value' : 'miew-menu-panel-mode'
        }, [
          'Mode',
          createElement('span', {'class' : 'pull-right'}, [
            createElement('span', {
              'class' : 'text-muted',
              'data-id': repr.mode.id
            }, repr.mode.shortName),
            createElement('span', {'class' : 'glyphicon glyphicon-menu-right'})])]),
        createElement('li', {
          'class' :  'list-group-item col-xs-12 col-sm-12',
          'data-toggle' : 'combobox-panel',
          'data-value' : 'miew-menu-panel-color'
        }, [
          'Color',
          createElement('span', {'class' : 'pull-right'}, [
            createElement('span', {
              'class' : 'text-muted',
              'data-id': repr.colorer.id
            }, repr.colorer.shortName),
            createElement('span', {'class' : 'glyphicon glyphicon-menu-right'})])]),
        createElement('li', {
          'class' :  'list-group-item col-xs-12 col-sm-12',
          'data-toggle' : 'combobox-panel',
          'data-value' : 'miew-menu-panel-uniform-color'
        }, [
          'Uniform color',
          createElement('span', {'class' : 'pull-right'}, [
            createElement('a', {
              'href' : '#ucolor',
              'class' : 'thumbnail',
              'data-id': hexColor(settings.now.colorers.UN.color)
            }, createElement('img', {
              'src' : 'images/empty_icon.png',
              'style' : 'background-color: ' + hexColor(settings.now.colorers.UN.color) + ';'
            })),
            createElement('span', {'class' : 'glyphicon glyphicon-menu-right'})])]),
        createElement('li', {
          'class' :  'list-group-item col-xs-12 col-sm-12',
          'data-toggle' : 'combobox-panel',
          'data-value' : 'miew-menu-panel-matpreset'
        }, [
          'Material',
          createElement('span', {'class' : 'pull-right'}, [
            createElement('span', {
              'class' : 'text-muted',
              'data-id': repr.materialPreset.id
            }, repr.materialPreset.shortName),
            createElement('span', {'class' : 'glyphicon glyphicon-menu-right'})])]),
        createElement('li', {
          'class' : 'list-group-item col-xs-12 col-sm-12',
          'data-type' : 'surf-param-rad'
        }, [
          'Radius scale',
          createElement('span', {'class' : 'input-group pull-right'}, [
            createElement(
              'span', {
                'class': 'input-group-addon spinner-dec-btn',
                'data-toggle': 'spinner',
                'data-value': 'rad'
              },
              createElement('span', {'class': 'glyphicon glyphicon-minus'})
            ),
            createElement('input', {
              'type': 'number',
              'class': 'form-control',
              'data-type': 'rad',
              'value': '1.0',
              'min': '0',
              'max': '2',
              'step': '0.1'
            }),
            createElement(
              'span', {
                'class': 'input-group-addon spinner-inc-btn',
                'data-toggle': 'spinner',
                'data-value': 'rad'
              },
              createElement('span', {'class': 'glyphicon glyphicon-plus'})
            )])]),
        createElement('li', {
          'class' : 'list-group-item col-xs-12 col-sm-12',
          'data-type' : 'surf-param-iso'
        }, [
          'Isosurface threshold',
          createElement('span', {'class' : 'input-group pull-right'}, [
            createElement(
              'span', {
                'class': 'input-group-addon spinner-dec-btn',
                'data-toggle': 'spinner',
                'data-value': 'iso'
              },
              createElement('span', {'class': 'glyphicon glyphicon-minus'})
            ),
            createElement('input', {
              'type': 'number',
              'class': 'form-control',
              'data-type': 'iso',
              'value': '0.5',
              'min': '0',
              'max': '10',
              'step': '0.5'
            }),
            createElement(
              'span', {
                'class': 'input-group-addon spinner-inc-btn',
                'data-toggle': 'spinner',
                'data-value': 'iso'
              },
              createElement('span', {'class': 'glyphicon glyphicon-plus'})
            )])]),
        createElement('li', {
          'class': 'list-group-item col-xs-12 col-sm-12',
          'data-type': 'surf-param-zclip'
        }, [
          createElement('label', {}, 'Z clipping'),
          createElement(
            'span', {'class': 'pull-right'},
            createElement('input', {
              'type': 'checkbox',
              'data-dir': 'representation',
              'data-toggle': 'zClip',
              'data-size': 'mini',
              'title': 'Z clipping'
            })
          )])])
    )]);
  panel.appendChild(newItem);
  if (repr.mode.id === 'SA' || repr.mode.id === 'SE' || repr.mode.id === 'QS' || repr.mode.id === 'CS') {
    reprList.find('.panel:eq(' + index + ') .panel-collapse [data-type=surf-param-zclip]').show();
  } else {
    reprList.find('.panel:eq(' + index + ') .panel-collapse [data-type=surf-param-zclip]').hide();
  }

  if (repr.mode.id === 'QS') {
    reprList.find('.panel:eq(' + index + ') .panel-collapse [data-type=surf-param-rad]').show();
  } else {
    reprList.find('.panel:eq(' + index + ') .panel-collapse [data-type=surf-param-rad]').hide();
  }

  if (repr.mode.id === 'QS' || repr.mode.id === 'CS') {
    reprList.find('.panel:eq(' + index + ') .panel-collapse [data-type=surf-param-iso]').show();
  } else {
    reprList.find('.panel:eq(' + index + ') .panel-collapse [data-type=surf-param-iso]').hide();
  }

  if (repr.colorer.id === 'UN') {
    var ucSelector = reprList.find('.panel:eq(' + index + ') [data-value=miew-menu-panel-uniform-color]');
    var ucColor = hexColor(repr.colorer.opts.color);
    ucSelector.show();
    ucSelector[0].firstElementChild.firstElementChild.setAttribute('data-id', ucColor);
    ucSelector[0].firstElementChild.firstElementChild.firstElementChild.style.backgroundColor = ucColor;
  } else {
    reprList.find('.panel:eq(' + index + ') [data-value=miew-menu-panel-uniform-color]').hide();
  }

  reprList.find('.panel:eq(' + index + ') input[type=checkbox]').bootstrapSwitch('state', repr.mode.opts.zClip);
  reprList.find('.panel:eq(' + index + ') [data-type=rad]').val(repr.mode.opts.scale);
  reprList.find('.panel:eq(' + index + ') [data-type=iso]').val(repr.mode.opts.isoValue);

  // refresh opts in mode
  var modeElem = reprList.find('.panel:eq(' + index + ') [data-value=miew-menu-panel-mode]');
  modeElem.removeData('mvdata');
  modeElem.data('mvdata', repr.mode.opts);

  // refresh opts in colorer
  var colorElem = reprList.find('.panel:eq(' + index + ') [data-value=miew-menu-panel-color]');
  colorElem.removeData('mvdata');
  colorElem.data('mvdata', repr.colorer.opts);

  if (repr.mode.id === 'SA' || repr.mode.id === 'SE') {
    reprList.find('.panel:eq(' + index + ') [data-type=rad]').val(repr.mode._radScale);
  }

  if (repr.visible) {
    reprList.find('.panel:eq(' + index + ') .panel-heading .btn-visible').show();
    reprList.find('.panel:eq(' + index + ') .panel-heading .btn-invisible').hide();
  } else {
    reprList.find('.panel:eq(' + index + ') .panel-heading .btn-visible').hide();
    reprList.find('.panel:eq(' + index + ') .panel-heading .btn-invisible').show();
  }

  self._initReprListItemListeners(index);
};

Menu.prototype._getCurReprPropertyId = function(reprPropDataVal) {
  var self = this;
  var reprList = $(self._menuId + ' .panel-menu[data-panel-type=miew-menu-panel-representation] .miew-repr-list');
  var element = reprList.find('.panel.valid:eq(' + self._curReprIdx + ') [data-value="' + reprPropDataVal + '"]');
  return element[0].firstElementChild.firstElementChild.getAttribute('data-id');
};

Menu.prototype._getCurReprSelector = function() {
  var self = this;
  var reprList = $(self._menuId + ' .panel-menu[data-panel-type=miew-menu-panel-representation] .miew-repr-list');
  var element =  reprList.find('.panel.valid:eq(' + self._curReprIdx + ') [data-type=selection-target]');
  return element[0].textContent;
};

Menu.prototype._copyCurReprListItem = function(index) {
  var self = this;
  var reprList = $(self._menuId + ' .panel-menu[data-panel-type=miew-menu-panel-representation] .miew-repr-list');
  var curSelector = reprList.find('.panel.valid:eq(' + self._curReprIdx + ')');
  curSelector.find('.panel-heading').removeClass('active');
  curSelector.find('.panel-collapse').collapse('hide');
  var id = reprList.find('.panel.valid:eq(' + self._curReprIdx + ') .panel-collapse').attr('data-number');
  var newId = id.substr(0, id.lastIndexOf('-') + 1) + (index + 1);

  curSelector.clone().appendTo(reprList);

  curSelector.find('.panel-heading').addClass('active');
  curSelector.find('.panel-collapse').collapse('show');

  var selector = reprList.find('.panel:eq(' + index + ')');
  var newHtml = selector.html().replace(new RegExp(id.replace('-', '\\-'), 'g'), newId);
  selector.html(newHtml);

  selector.addClass('added');

  selector = selector.find('.panel-heading a');
  var header = selector.html();
  var validReprN = reprList.find('.panel.valid').length;
  selector.html('#' + String(validReprN) + header.substring(header.indexOf(':')));

  // recreate bootstrapswitch param (note: cloning of bootstrapswitch doesn't work)
  var zClipState = curSelector.find('[type=checkbox][data-toggle=zClip]')[0].checked;
  var qSurfParamSelector = reprList.find('.panel:eq(' + index + ') [data-type=surf-param-zclip]');
  qSurfParamSelector.empty();
  selector.find('[type=checkbox]').bootstrapSwitch('state', zClipState);
  qSurfParamSelector[0].appendChild(createElement('label', {}, 'Z clipping'));
  qSurfParamSelector[0].appendChild(createElement(
    'span', {'class': 'pull-right'},
    createElement('input', {
      'type': 'checkbox',
      'data-dir': 'representation',
      'data-toggle': 'zClip',
      'data-size': 'mini',
      'title': 'Z clipping'
    })
  ));
  reprList.find('.panel:eq(' + index + ') input[type=checkbox]').bootstrapSwitch('state', zClipState);

  const isoValue = curSelector.find('[data-type=iso]').val();
  reprList.find('.panel:eq(' + index + ') [data-type=iso]').val(isoValue);

  const radScale = curSelector.find('[data-type=rad]').val();
  reprList.find('.panel:eq(' + index + ') [data-type=rad]').val(radScale);

  self._initReprListItemListeners(index);
};

Menu.prototype._fillSourceList = function() {
  var self = this;
  var names = this._viewer.getVisuals();
  $('#miew-source-dropdown').toggle(names.length > 1);

  var curName = this._viewer.getCurrentVisual();
  var nameElement = document.getElementById('miew-source-name');
  nameElement.textContent = curName;

  function getOnSourceSelected(name) {
    return function(e) {
      self._viewer.setCurrentVisual(name);
      self._fillSourceList();
      self._initReprList();
      e.preventDefault();
    };
  }

  var listElement = document.getElementById('miew-source-list');
  var frag = document.createDocumentFragment();
  for (var i = 0, n = names.length; i < n; ++i) {
    var name = names[i];
    var link = createElement(
      'a', {href: '#'},
      (name !== curName) ? name : [
        createElement('b', null, name),
        createElement('span', {
          'class': 'glyphicon glyphicon-ok pull-right'
        }),
      ]
    );
    link.addEventListener('click', getOnSourceSelected(name));
    frag.appendChild(createElement('li', null, link));
  }
  listElement.innerHTML = '';
  listElement.appendChild(frag);
};

Menu.prototype._fillReprList = function() {
  const self = this;
  const reprList = $(self._menuId + ' .panel-menu[data-panel-type=miew-menu-panel-representation] .miew-repr-list');

  reprList.empty();
  const list = reprList.get(0);
  for (let i = 0, n = self._viewer.repCount(); i < n; i++) {
    const entry = self._viewer.repGet(i);
    self._addReprListItem(list, i, entry);
  }

  $(self._menuId + ' [data-toggle=mode]').on('click', /** @this HTMLSelectElement */ function() {
    const elements =  reprList.find('.panel.valid:eq(' + self._curReprIdx + ') [data-value=miew-menu-panel-mode]');
    const itemID = this.getAttribute('data-value');
    const Mode = modes.get(itemID);
    elements[0].firstElementChild.firstElementChild.textContent = Mode.prototype.shortName;
    elements[0].firstElementChild.firstElementChild.setAttribute('data-id', itemID);

    const head = reprList.find('.panel.valid:eq(' + self._curReprIdx + ') .panel-heading a');
    const header = head.html();
    head.html(header.substring(0, header.indexOf(':') + 1) + ' ' + Mode.prototype.name);

    const zClipParam = reprList.find('.panel.valid:eq(' +
      self._curReprIdx + ') .panel-collapse [data-type=surf-param-zclip]');
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
  $(self._menuId + ' [data-toggle=colorer]').on('click', /** @this HTMLSelectElement */ function() {
    const elements = reprList.find('.panel.valid:eq(' + self._curReprIdx + ') [data-value=miew-menu-panel-color]');
    const itemID = this.getAttribute('data-value');
    const Colorer = colorers.get(itemID);

    elements[0].firstElementChild.firstElementChild.textContent = Colorer.prototype.shortName;
    elements[0].firstElementChild.firstElementChild.setAttribute('data-id', itemID);

    if (itemID === 'UN') {
      reprList.find('.panel:eq(' + self._curReprIdx + ') [data-value=miew-menu-panel-uniform-color]').show();
    } else {
      reprList.find('.panel:eq(' + self._curReprIdx + ') [data-value=miew-menu-panel-uniform-color]').hide();
    }
  });

  $(self._menuId + ' [data-toggle=material]').on('click', /** @this HTMLSelectElement */ function() {
    const elements = reprList.find('.panel.valid:eq(' + self._curReprIdx + ') [data-value=miew-menu-panel-matpreset]');
    const itemID = this.getAttribute('data-value');
    const material = materials.get(itemID);

    elements[0].firstElementChild.firstElementChild.textContent = material.shortName;
    elements[0].firstElementChild.firstElementChild.setAttribute('data-id', itemID);
  });

};

Menu.prototype._getPanelSelector = function(type) {
  return $(this._menuId + ' .panel-menu[data-panel-type=' + type + ']');
};

Menu.prototype._init = function() {
  var self = this;
  var selectorHide = null;
  var selectorShow = null;
  var newPanelId = null;

  //tooltips initialization
  $(function() {
    $(self._menuId + ' .titlebar [data-tooltip="tooltip"]').tooltip({
      trigger : 'hover'
    });
  });

  self._xs = self._isXS();
  $(self._menuId + ' [data-value="' + self._curPanelID + '"]').toggleClass('active');


  $(self._menuId + ' [data-toggle=miew-main-menu]').on('click', function() {
    var state = this.getAttribute('data-state');
    if (state === 'on') {
      self._onMenuOn();
      return false;
    }
    if (state === 'off') {
      self._onMenuOff();
      return false;
    }
    return false;
  });

  $(self._menuId + ' [data-toggle=miew-terminal]').on('click', function() {
    var state = this.getAttribute('data-state');
    this.blur();
    if (state === 'on') {
      self._onTerminalOn();
      this.setAttribute('data-state', 'off');
      return false;
    }
    if (state === 'off') {
      self._onTerminalOff();
      this.setAttribute('data-state', 'on');
      return false;
    }
    return false;
  });

  $(self._menuId + ' [data-toggle=miew-terminal]').on('mousedown', function(e) {
    e.preventDefault();
    return false;
  });

  $(document).on('keydown', function(e) {
    if (e.keyCode === 27 && !e.isDefaultPrevented()) { // ESC
      if ($(self._menuId + ' .main-menu').is(':visible') === true) {
        if ($(self._menuId + ' .panel-menu[data-panel-type=miew-menu-panel-main]').is(':visible') === true) {
          if (self._curMenuItem === self._curPanelID) { //if it is regular panel or in xs it also can be main panel
            self._onMenuOff();
          } else { //if it is combbox-panel
            self._getPanelSelector(self._curPanelID).get(0).firstElementChild.firstElementChild.click();
          }
        } else { // if xs mode and not main panel
          self._getPanelSelector(self._curPanelID).get(0).firstElementChild.firstElementChild.click();
        }
      }
    }
  });

  $(self._menuId + ' [data-toggle="panel"]').on('click', function _setPanel() {
    if (self._xs === true) {
      $(self._menuId + ' .panel-menu[data-panel-type=miew-menu-panel-main]').hide();
    }

    selectorHide = self._getPanelSelector(self._curPanelID);
    selectorHide.hide();
    $(self._menuId + ' a[data-value="' + self._curMenuItem + '"]').removeClass('active');

    self._curMenuItem = self._curPanelID = newPanelId = this.getAttribute('data-value');
    selectorShow = self._getPanelSelector(self._curPanelID);
    selectorShow.show();
    $(self._menuId + ' a[data-value="' + newPanelId + '"]').addClass('active');

    return false;
  });

  $(self._menuId + ' [data-toggle="main-panel"]').on('click', function _btnBackMenuClick() {
    $(self._menuId + ' .panel-menu[data-panel-type=miew-menu-panel-main]').show();
    self._getPanelSelector(self._curPanelID).hide();
    if (self._xs) {
      $(self._menuId + ' a[data-value="' + self._curMenuItem + '"]').removeClass('active');
    }
    return false;
  });

  $(self._menuId + ' [data-toggle="combobox-panel"]').on('click', function _setComboboxPanel() {


    selectorHide = self._getPanelSelector(self._curPanelID);
    selectorHide.hide();

    self._curPanelID = newPanelId = this.getAttribute('data-value');
    selectorShow = self._getPanelSelector(self._curPanelID);
    selectorShow.show();

    return false;
  });

  $(self._menuId + ' [data-toggle="toolbar"]').on('click', function _btnToolbarClick() {
    if (this.classList.contains('disabled')) {
      return;
    }

    this.blur();
    var toolbar = this.getAttribute('data-value');

    $(self._menuId + ' [data-toggle="toolbar"]').each(function(index, element) {
      if (element.getAttribute('data-value') !== toolbar && element.classList.contains('active')) {
        element.click();
      }
    });

    var elements = $(self._menuId + ' [data-toolbar-type=' + toolbar + ']');
    elements.toggle();
    this.classList.toggle('active');

    if (toolbar === 'miew-menu-toolbar-resolution') {
      var resSelector = $(self._menuId + ' [data-toggle="resolution-immediate"]' +
          '[data-value="' + settings.now.resolution + '"]');
      if (this.classList.contains('active') === true) {
        resSelector.addClass('active');
      } else {
        resSelector.removeClass('active');
      }
    } else {
      var type = toolbar.substr(toolbar.lastIndexOf('-') + 1, toolbar.length);
      var selector = $(self._menuId + ' [data-toggle="' + type + '-immediate"]' +
          '[data-value="' + unarray(self._viewer.rep()[type]) + '"]');
      if (this.classList.contains('active') === true) {
        selector.addClass('active');
      } else {
        selector.removeClass('active');
      }
    }
  });

  self._menu.on('click', function(event) {
    if ($(event.target).hasClass('main-menu')) {
      self._onMenuOff();
    }
  });

  $(self._menuId + ' input[type=checkbox][data-dir=settings]').bootstrapSwitch();
  $(self._menuId + ' input[type=checkbox][data-dir=settings]').on(
    'switchChange.bootstrapSwitch',
    /** @this HTMLInputElement */ function() {
      var param = this.getAttribute('data-toggle');
      if (param === 'theme') {
        self._viewer.set('theme', this.checked ? 'dark' : 'light');
      } else {
        self._viewer.set(param, this.checked);
      }
    }
  );

  var shifted = false;
  $(document).on('keyup keydown', function(e) {
    shifted = e.shiftKey;
  });
  $(document).on('mousewheel', function(e) {
    if (shifted) {
      var draft = self._viewer.settings.now.draft;
      self._viewer.set({
        draft: {
          clipPlaneFactor: draft.clipPlaneFactor - e.originalEvent.wheelDelta * draft.clipPlaneSpeed
        }
      });
    }
  });

  this._initMiewEventListeners();
  this._initToolbar();

  this._initInfoPanel();
  this._initLoadPanel();
  this._initReprPanel();
  this._initRenderPanel();
  this._initToolsPanel();
  this._initSelectionPanel();
  this._initMdPlayerControls();
};

Menu.prototype._initMiewEventListeners = function() {
  var self = this;

  this._viewer.addEventListener('load', function() {
    self._setTitle('Loading…');
    self._setMdPlayerState();
  });

  this._viewer.addEventListener('parse', function() {
    self._setTitle('Parsing…');
  });

  this._viewer.addEventListener('convert', function() {
    self._setTitle('Converting…');
  });

  this._viewer.addEventListener('rebuild', function() {
    self._setTitle('Building geometry…');
  });

  this._viewer.addEventListener('profile', function() {
    self._setTitle('Profiling…');
  });

  this._viewer.addEventListener('resize', function() {
    self._onResize();
  });

  this._viewer.addEventListener('parsingFinished', function(e) {
    self._updateInfo(e.data);
    self._fillSourceList();
    self._fillReprList();
  });

  this._viewer.addEventListener('titleChanged', function(e) {
    self._setTitle(e.data);
  });

  this._viewer.addEventListener('mdPlayerStateChanged', function(e) {
    self._setMdPlayerState(e.state);
  });

  this._viewer.addEventListener('editModeChanged', function(e) {
    self._enableToolbar(e.data);
  });

  this._viewer.addEventListener('onParseError', function() {
    self.presetsPanel.actions.pdb.inputs.refresh(self);
  });

  this._viewer.addEventListener('onParseDone', function() {
    self.presetsPanel.actions.pdb.inputs.refresh(self);
  });
};

Menu.prototype._initInfoPanel = function() {
  this._updateInfo();
};

Menu.prototype._initLoadPanel = function() {
  var self = this;

  $(self._menuId + ' [data-form-type=miew-menu-form-load-pdb] [data-tooltip="tooltip"]').tooltip({
    trigger : 'hover'
  });

  $(self._menuId + ' [data-toggle="preset-pdb"]').on('click', /** @this HTMLElement */ function() {
    var path = this.getAttribute('data-value');
    $(self._menuId + ' .panel-menu[data-panel-type=miew-menu-panel-representation] .miew-repr-list').empty();
    self._viewer.load(path);
    self._onMenuOff();
    return false;
  });

  this._initPresetsPanelActions();
};

Menu.prototype._initReprPanel = function() {
  var self = this;
  var reprList = $(self._menuId + ' .panel-menu[data-panel-type=miew-menu-panel-representation] .miew-repr-list');

  $(self._menuId + ' .miew-repr-list-controls [data-btn-type=miew-menu-btn-add-repr]').on('click', function() {
    var index =  reprList.find('.panel').length;
    if (index > 0) {
      self._copyCurReprListItem(index);
    } else {
      var fakeRepr = new Representation(0, modes.create(), colorers.create(), selectors.all());
      self._addReprListItem(reprList.get(0), index, fakeRepr);
      var selector = reprList.find('.panel:eq(' + index + ')');
      selector.addClass('added');
    }

    var validReprN = reprList.find('.panel.valid').length;
    if (validReprN === 2) {
      $(self._menuId + ' .miew-repr-list-controls [data-btn-type=miew-menu-btn-del-repr]').removeClass('disabled');
    } else if (validReprN === self._viewer.getMaxRepresentationCount()) {
      $(self._menuId + ' .miew-repr-list-controls [data-btn-type=miew-menu-btn-add-repr]').addClass('disabled');
    }

    reprList.find('.panel.valid:eq(' + (validReprN - 1) + ') .panel-heading').click();
    self._reprListChanged = true;
  });

  $(self._menuId + ' .miew-repr-list-controls [data-btn-type=miew-menu-btn-del-repr]').on('click', function() {
    var validReprN = reprList.find('.panel.valid').length;
    var removeIdx = self._curReprIdx;
    var removeSelector = reprList.find('.panel.valid:eq(' + removeIdx + ')');
    removeSelector.addClass('deleted');
    removeSelector.hide();
    removeSelector.removeClass('valid');
    if (self._curReprIdx === validReprN - 1) {
      reprList.find('.panel.valid:eq(' + (self._curReprIdx - 1) + ') .panel-heading').click();
    } else {
      reprList.find('.panel.valid:eq(' + (self._curReprIdx) + ') .panel-heading').click();
      for (var reprIdx = self._curReprIdx; reprIdx < validReprN - 1; ++reprIdx) {
        var reprSelector = reprList.find('.panel.valid:eq(' + reprIdx + ') .panel-heading a');
        var header = reprSelector.html();
        reprSelector.html('#' + String(reprIdx + 1) + header.substring(header.indexOf(':')));
      }
    }

    validReprN = reprList.find('.panel.valid').length;
    if (validReprN === 1) {
      $(self._menuId + ' .miew-repr-list-controls [data-btn-type=miew-menu-btn-del-repr]').addClass('disabled');
    } else if (validReprN === self._viewer.getMaxRepresentationCount() - 1) {
      $(self._menuId + ' .miew-repr-list-controls [data-btn-type=miew-menu-btn-add-repr]').removeClass('disabled');
    }

    self._reprListChanged = true;
  });

  self._fillCombo('miew-menu-panel-mode', 'mode', 'mode', modes);
  self._fillCombo('miew-menu-panel-color', 'colorer', 'colorer', colorers);
  self._fillCombo('miew-menu-panel-matpreset', 'material', 'materialPreset', materials);
};

Menu.prototype._displayGlobalErrorDialog = function(title, message) {
  var self = this;
  var dialog = $(self._menuId + ' .miew-menu-modals [data-modal-type=miew-menu-modal-global-error]');
  var titleElement = dialog.find('.modal-title').get(0);
  var bodyElement = dialog.find('.modal-body').get(0);
  $(titleElement).html(title);
  $(bodyElement).html(message || 'Some error occured.');
  dialog.modal({
    keyboard: true
  }, 'show');
};

Menu.prototype.presetsPanel = {
  pdbList: {
    filteredItems: [],
    pageSize: 10,
    currentPageIndex: 0,
    totalPagesCount: null,
    pagination: {
      minimumItemsCount: 5
    }
  },
  presetsList: {
    pdb: null,
    items: []
  },
  inputs: {
    main: null,
    sub: null
  },
  actions: {
    pdb: {
      list: {
        page: null,
        refresh: null,
        search: null,
        display: null,
        select: null
      },
      load: null,
      register: null,
      remove: {
        ask: null,
        confirm: null
      },
      inputs: {
        clear: null,
        refresh: null,
        file: null,
        text: null
      }
    },
    preset: {
      list: {
        refresh: null,
        display: null
      },
      apply: null,
      rename: {
        ask: null,
        confirm: null
      },
      update: null,
      remove: {
        ask: null,
        confirm: null
      },
      input: {
        clear: null,
        refresh: null
      },
      create: null
    },
    navigate: {
      back: null
    }
  }
};

Menu.prototype._presetsPanelDisplayPdbProgress = function(display) {
  var self = this;
  var progress = $(self._menuId + ' .miew-presets-panel-progress');
  if (display) {
    progress.removeClass('hidden');
  } else {
    progress.addClass('hidden');
  }
};

Menu.prototype._presetsPanelDisplayPresetsProgress = function(display) {
  var self = this;
  var progress = $(self._menuId + ' .miew-presets-sub-panel-progress');
  var refreshBtn = $(self._menuId + ' .presets-panel-action[data-presets-panel-action=preset-list-refresh]');
  var subPanelAlertArea = $(self._menuId + ' .miew-menu-form-presets .alert-warning');
  if (display) {
    progress.removeClass('hidden');
    refreshBtn.addClass('hidden');
    subPanelAlertArea.hide();
  } else {
    progress.addClass('hidden');
    refreshBtn.removeClass('hidden');
  }
};

Menu.prototype._presetsPanelActionsPdbInputsRefresh = function(self) {
  var loadPdbButton = $(self._menuId + ' .presets-panel-action[data-presets-panel-action=pdb-load]');
  var clearInputsButton = $(self._menuId + ' .presets-panel-action[data-presets-panel-action=pdb-inputs-clear]');
  var registerTopologyButton = $(self._menuId + ' .presets-panel-action[data-presets-panel-action=pdb-register]');

  var mainTextInput = $($('[data-form-type=miew-menu-form-load-pdb] input[type=text][data-pdb-url-type=main]')
    .get(0));
  var mainErrorAlert = $($('[data-form-type=miew-menu-form-load-pdb] .alert-danger[data-pdb-url-type=main]')
    .get(0));
  var mainWarningAlert = $($('[data-form-type=miew-menu-form-load-pdb] .alert-warning[data-pdb-url-type=main]')
    .get(0));

  var subFormTitle = $($('[data-form-type=miew-menu-form-load-pdb] .control-label[data-pdb-url-type=sub]')
    .get(0));
  var subTextInput = $($('[data-form-type=miew-menu-form-load-pdb] input[type=text][data-pdb-url-type=sub]')
    .get(0));
  var subForm = $($('[data-form-type=miew-menu-form-load-pdb] div[data-pdb-url-type=sub]')
    .get(0));
  var subErrorAlert = $($('[data-form-type=miew-menu-form-load-pdb] .alert-danger[data-pdb-url-type=sub]')
    .get(0));
  var subWarningAlert = $($('[data-form-type=miew-menu-form-load-pdb] .alert-warning[data-pdb-url-type=sub]')
    .get(0));

  var extractExtension = function(name) {
    var parts = name.toLowerCase().split('/');
    var lastPart = parts[parts.length - 1];
    parts = lastPart.split('\\');
    lastPart = parts[parts.length - 1];
    parts = lastPart.split('.');
    if (parts.length === 1) {
      return ''; // not "file.ext" format
    }
    return parts[parts.length - 1];
  };

  var mainAlertText = null;
  var subAlertText = null;

  var displaySubForm = function(visible) {
    if (visible) {
      subFormTitle.removeClass('hidden');
      subForm.removeClass('hidden');
    } else {
      subFormTitle.addClass('hidden');
      subForm.addClass('hidden');
    }
  };
  var displayFormError = function(form, error) {
    if (form === 'main') {
      if (error) {
        mainErrorAlert.html(error);
        mainErrorAlert.removeClass('hidden');
      } else {
        mainErrorAlert.html(error);
        mainErrorAlert.addClass('hidden');
      }
    } else if (error) {
      subErrorAlert.html(error);
      subErrorAlert.removeClass('hidden');
    } else {
      subErrorAlert.html(error);
      subErrorAlert.addClass('hidden');
    }
  };
  var displayFormWarning = function(form, warning) {
    if (form === 'main') {
      if (warning) {
        mainWarningAlert.html(warning);
        mainWarningAlert.removeClass('hidden');
      } else {
        mainWarningAlert.html(warning);
        mainWarningAlert.addClass('hidden');
      }
    } else if (warning) {
      subWarningAlert.html(warning);
      subWarningAlert.removeClass('hidden');
    } else {
      subWarningAlert.html(warning);
      subWarningAlert.addClass('hidden');
    }
  };

  var topologyNotRegistered = function(name) {
    registerTopologyButton.removeClass('disabled');
    registerTopologyButton.html('Add \'' + name + '\' to server');
  };

  var topologyRegistered = function(name) {
    registerTopologyButton.addClass('disabled');
    if (name) {
      registerTopologyButton.html(name + ' already registered at server');
    } else {
      registerTopologyButton.html('Add current file to server');
    }
  };

  self._viewer.srvCurrentTopologyIsRegistered(topologyRegistered, topologyNotRegistered);

  self.presetsPanel.inputs.isCorrect = false;
  if (!self.presetsPanel.inputs || !self.presetsPanel.inputs.main) {
    loadPdbButton.addClass('disabled');
    clearInputsButton.addClass('hidden');

    mainTextInput.val('');
    mainTextInput.removeAttr('disabled');
    subTextInput.val('');
    subTextInput.removeAttr('disabled');

    displaySubForm(false);
    displayFormError('main', null);
    displayFormError('sub', null);
    displayFormWarning('main', null);
    displayFormWarning('sub', null);
  } else {
    if (self.presetsPanel.inputs.main) {
      var mainExtension;
      if (self.presetsPanel.inputs.main instanceof File) {
        mainTextInput.val(self.presetsPanel.inputs.main.name);
        mainTextInput.attr('disabled', 'disabled');
        mainExtension = extractExtension(self.presetsPanel.inputs.main.name);
      } else {
        mainTextInput.removeAttr('disabled');
        mainExtension = extractExtension(self.presetsPanel.inputs.main);
      }

      const extensions = ['pdb', 'ent', 'cif', 'mmcif', 'mmtf', 'cml', 'json', 'ccp4'].sort();
      const extRegExp = new RegExp('^(' + extensions.join('|') + ')$');
      const extString = extensions.map(ext => `.${ext}`).join(', ');

      if (mainExtension.match(/^(top|prmtop)$/)) {
        self.presetsPanel.inputs.mainIsAMBER = true;
        self.presetsPanel.inputs.mainIsCorrect = true;
      } else if (self.presetsPanel.inputs.main instanceof File && !mainExtension.match(extRegExp)) {
        self.presetsPanel.inputs.mainIsAMBER = false;
        self.presetsPanel.inputs.mainIsCorrect = false;
        self.presetsPanel.inputs.isCorrect = false;
        self.presetsPanel.inputs.sub = null;
        mainAlertText = `Only the following filename extensions are supported: ${extString}`;
      } else {
        self.presetsPanel.inputs.mainIsAMBER = false;
        self.presetsPanel.inputs.mainIsCorrect = true;
        self.presetsPanel.inputs.isCorrect = false;
        self.presetsPanel.inputs.sub = null;
      }
    }
    displaySubForm(self.presetsPanel.inputs.mainIsAMBER);
    if (!self.presetsPanel.inputs.mainIsAMBER) {
      subTextInput.val('');
      subTextInput.removeAttr('disabled');
      self.presetsPanel.inputs.subIsCorrect = true;
      self.presetsPanel.inputs.isCorrect = true;
    } else if (self.presetsPanel.inputs.sub) {
      var subExtension;
      if (self.presetsPanel.inputs.sub instanceof File) {
        subTextInput.val(self.presetsPanel.inputs.sub.name);
        subTextInput.attr('disabled', 'disabled');
        subExtension = extractExtension(self.presetsPanel.inputs.sub.name);
      } else {
        subTextInput.removeAttr('disabled');
        subExtension = extractExtension(self.presetsPanel.inputs.sub);
      }

      if (subExtension === 'nc') {
        self.presetsPanel.inputs.subIsCorrect = true;
        self.presetsPanel.inputs.isCorrect = true;
      } else {
        self.presetsPanel.inputs.subIsCorrect = false;
        self.presetsPanel.inputs.isCorrect = false;
        subAlertText = 'Only .nc files are supported.';
      }
    } else {
      self.presetsPanel.inputs.subIsCorrect = false;
      self.presetsPanel.inputs.isCorrect = false;
    }

    if (self.presetsPanel.inputs.isCorrect) {
      loadPdbButton.removeClass('disabled');
    } else {
      loadPdbButton.addClass('disabled');
    }
    if (self.presetsPanel.inputs.main || self.presetsPanel.inputs.sub) {
      clearInputsButton.removeClass('hidden');
    } else {
      clearInputsButton.addClass('hidden');
    }
    displayFormError('main', mainAlertText);
    displayFormError('sub', subAlertText);
  }
};

Menu.prototype._presetsPanelActionsPdbInputsClear = function(self) {
  self.presetsPanel.inputs = {
    main: null,
    sub: null
  };
  self.presetsPanel.actions.pdb.inputs.refresh(self);
};

Menu.prototype._presetsPanelActionsPdbRegister = function(self) {
  var completeFn = function() {
    self._presetsPanelDisplayPdbProgress(false);
  };
  var doneFn = function() {
    completeFn();
    self._initPresetsPanel();
  };
  var failFn = function(message) {
    completeFn();
    self._displayGlobalErrorDialog('Error creating preset', message);
  };
  self._viewer.srvCurrentTopologyIsRegistered(function(name) {
    self._displayGlobalErrorDialog('Error registering PDB', 'Cannot register ' + name);
  }, function() {
    self._presetsPanelDisplayPdbProgress(true);
    self._viewer.srvTopologyRegister(doneFn, failFn);
    self.presetsPanel.actions.pdb.inputs.refresh(self);
  });
};

Menu.prototype._presetsPanelActionsPdbLoad = function(self) {
  self._onMenuOff();
  if (self.presetsPanel.inputs && !self.presetsPanel.inputs.mainIsAMBER) {
    self._viewer.load(self.presetsPanel.inputs.main);
  } else {
    self._viewer.load(self.presetsPanel.inputs.main, {mdFile: self.presetsPanel.inputs.sub});
  }
  self.presetsPanel.actions.pdb.inputs.clear(self);
};

Menu.prototype._presetsPanelActionsPdbInputsFile = function(self, element) {
  var urlType = $(element).data('pdb-url-type');
  var textInput =
      $('[data-form-type=miew-menu-form-load-pdb] input[type=text][data-pdb-url-type=' + urlType + ']').get(0);
  if ($(element).val()) {
    var files = $(element)[0].files;
    if (files.length > 0) {
      self.presetsPanel.inputs[urlType] = files[0];
      $(textInput).val(files[0].name);
      $(textInput).attr('disabled', 'disabled');
    }
  }
  $(element).val('');
  self.presetsPanel.actions.pdb.inputs.refresh(self);
};

Menu.prototype._presetsPanelActionsPdbInputsText = function(self, element, event) {
  var urlType = $(element).data('pdb-url-type');
  self.presetsPanel.inputs[urlType] = $(element).val();
  self.presetsPanel.actions.pdb.inputs.refresh(self);
  if (event && event.type === 'change' && self.presetsPanel.inputs.isCorrect) {
    self.presetsPanel.actions.pdb.load(self);
  }
};

Menu.prototype._presetsPanelActionsPdbRemoveAsk = function(self, element) {
  var pdbId = element.getAttribute('data-pdb-id');
  var pdbName = element.getAttribute('data-pdb-name');
  var selector = $(self._menuId + ' .miew-menu-modals [data-modal-type=miew-menu-modal-remove-pdb]');
  var body = selector.find('.modal-body').get(0);
  var action = selector.find('button.presets-panel-action[data-presets-panel-action="pdb-remove-confirm"]').get(0);
  var forceDeleteCheckbox = selector.find('#pdb-force-delete').get(0);
  forceDeleteCheckbox.checked = false;
  $(body).html('Are you sure you want to delete ' + pdbName + '?');
  $(action).attr('data-pdb-id', pdbId);
  selector.modal({
    keyboard: true
  }, 'show');
};

Menu.prototype._presetsPanelActionsPdbRemoveConfirm = function(self, element) {
  var pdbId = element.getAttribute('data-pdb-id');
  var selector = $(self._menuId + ' .miew-menu-modals [data-modal-type=miew-menu-modal-remove-pdb]');
  var forceDeleteCheckbox = selector.find('#pdb-force-delete').get(0);
  self._presetsPanelDisplayPdbProgress(true);
  self._viewer.srvTopologyDelete(
    pdbId,
    forceDeleteCheckbox.checked,
    function() {
      self._presetsPanelDisplayPdbProgress(false);
      self.presetsPanel.actions.pdb.list.refresh(self, true);
    },
    function(message) {
      self._presetsPanelDisplayPdbProgress(false);
      self._displayGlobalErrorDialog('Error removing PDB', message);
    }
  );
};

Menu.prototype._presetsPanelActionsPdbListGo = function(self, element) {
  var dataPageIndex = element.getAttribute('data-page-index');
  var newIndex;
  if (dataPageIndex === 'first') {
    newIndex = 0;
  } else if (dataPageIndex === 'last') {
    newIndex = self.presetsPanel.pdbList.totalPagesCount - 1;
  } else {
    newIndex = +dataPageIndex;
  }
  if (newIndex !== self.presetsPanel.pdbList.currentPageIndex) {
    self.presetsPanel.pdbList.currentPageIndex = newIndex;
    self.presetsPanel.actions.pdb.list.display(self);
  }
};

Menu.prototype._presetsPanelActionsPdbListDisplay = function(self) {
  var itemsGroup = $(self._menuId + ' .miew-configured-pdb-list').get(0);
  $(itemsGroup).empty();
  var frag = document.createDocumentFragment();
  var i;
  var currentPageIndex = self.presetsPanel.pdbList.currentPageIndex;
  var pageSize = self.presetsPanel.pdbList.pageSize;
  var filteredItems = self.presetsPanel.pdbList.filteredItems;
  for (i = currentPageIndex * pageSize; i < Math.min(filteredItems.length, (currentPageIndex + 1) * pageSize); i++) {
    // var editActionElement = createElement('span',
    //   { 'class': 'pull-right glyphicon glyphicon-pencil miew-configured-pdb-list-item-action presets-panel-action',
    //     'data-action': 'edit',
    //     'data-presets-panel-action': 'pdb-rename',
    //     'data-pdb-id': filteredItems[i].id,
    //     'data-pdb-name': filteredItems[i].name});
    var removeActionElement = typeof READONLY_SERVER !== 'undefined' && READONLY_SERVER ? undefined :
      createElement(
        'span',
        {
          'class': 'pull-right glyphicon glyphicon-remove miew-configured-pdb-list-item-action presets-panel-action',
          'data-action': 'remove',
          'data-presets-panel-action': 'pdb-remove-ask',
          'data-pdb-id': filteredItems[i].id,
          'data-pdb-name': filteredItems[i].name
        }
      );
    var item = createElement(
      'a',
      {
        'href': '#',
        'class': 'list-group-item miew-pdb-item presets-panel-action',
        'data-pdb-id': filteredItems[i].id,
        'data-pdb-name': filteredItems[i].name,
        'data-presets-panel-action': 'pdb-list-select'
      },
      [createElement(
        'span', {},
        [filteredItems[i].name, removeActionElement]
      )]
    );
    frag.appendChild(item);
  }
  itemsGroup.appendChild(frag);

  var createPageLinkItem = function(index) {
    var textElement;
    if (index === 'first') {
      textElement = createElement('span', {'aria-hidden': true}, null);
      $(textElement).html('&laquo;');
    } else if (index === 'last') {
      textElement = createElement('span', {'aria-hidden': true}, null);
      $(textElement).html('&raquo;');
    } else {
      textElement = '' + (index + 1);
    }
    return createElement(
      'li',
      {'class': (self.presetsPanel.pdbList.currentPageIndex === index ? 'active' : '')},
      createElement(
        'a',
        {
          'data-page-index': index,
          'href': '#',
          'class': 'presets-panel-action',
          'data-presets-panel-action':'pdb-list-page'
        },
        textElement
      )
    );
  };

  var paginationControl = $(self._menuId + ' .miew-configured-pdb-list-pagination').get(0);
  $(paginationControl).empty();
  var totalPagesCount = self.presetsPanel.pdbList.totalPagesCount;
  if (!totalPagesCount || totalPagesCount <= 1) {
    return;
  }
  var pages = [];
  var paginationItemsCount = self.presetsPanel.pdbList.pagination.minimumItemsCount;
  var onSidePaginationItemsCount = Math.floor(paginationItemsCount / 2);
  var minIndex = Math.max(0, currentPageIndex - onSidePaginationItemsCount);
  var maxIndex = Math.max(currentPageIndex + onSidePaginationItemsCount, minIndex + paginationItemsCount - 1);
  maxIndex = Math.min(totalPagesCount - 1, maxIndex);
  minIndex = Math.max(0, Math.min(minIndex, maxIndex - paginationItemsCount + 1));
  if (minIndex > 0) {
    if (minIndex === 1) {
      pages.push(0);
    } else {
      pages.push('first');
    }
  }
  for (i = minIndex; i <= maxIndex; i++) {
    pages.push(i);
  }
  if (maxIndex < totalPagesCount - 1) {
    if (maxIndex === totalPagesCount - 2) {
      pages.push(totalPagesCount - 1);
    } else {
      pages.push('last');
    }
  }
  var paginationFrag = document.createDocumentFragment();
  for (i = 0; i < pages.length; i++) {
    paginationFrag.appendChild(createPageLinkItem(pages[i]));
  }
  paginationControl.appendChild(paginationFrag);
};

Menu.prototype._presetsPanelActionsPdbListRefresh = function(self, forceUpdate) {
  var searchField = $(self._menuId + ' .miew-configured-pdb-list-search-field');
  if (forceUpdate) {
    self._presetsPanelDisplayPdbProgress(true);
  }
  var onServerResponseReceived = function(filteredList) {
    self._presetsPanelDisplayPdbProgress(false);
    if (filteredList) {
      self.presetsPanel.pdbList.filteredItems = filteredList;
    } else {
      self.presetsPanel.pdbList.filteredItems = [];
    }
    self.presetsPanel.pdbList.totalPagesCount =
        Math.ceil(self.presetsPanel.pdbList.filteredItems.length /
          self.presetsPanel.pdbList.pageSize);
    self.presetsPanel.pdbList.currentPageIndex = 0;
    self.presetsPanel.actions.pdb.list.display(self);
  };
  var onFail = function() {
    self._presetsPanelDisplayPdbProgress(false);
    self.presetsPanel.pdbList.filteredItems = [];
    self.presetsPanel.pdbList.totalPagesCount = 0;
    self.presetsPanel.pdbList.currentPageIndex = 0;
    self.presetsPanel.actions.pdb.list.display(self);
  };
  if (forceUpdate) {
    self._viewer.srvTopologyAll(function() {
      self._viewer.srvTopologyFilter(searchField.val(), onServerResponseReceived, onFail);
    }, onFail);
  } else {
    self._viewer.srvTopologyFilter(searchField.val(), onServerResponseReceived, onFail);
  }
};

Menu.prototype._presetsPanelActionsPdbListSearch = function(self) {
  self.presetsPanel.actions.pdb.list.refresh(self, false);
};

Menu.prototype._presetsPanelActionsPdbListSelect = function(self, element) {
  var pdbId = +element.getAttribute('data-pdb-id');
  var pdbName = element.getAttribute('data-pdb-name');
  self.presetsPanel.presetsList.pdb = self.presetsPanel.pdbList.filteredItems.filter(function(item) {
    return item.id === pdbId;
  })[0];
  var panelTitle = $(self._menuId + ' [data-panel-type=miew-menu-panel-presets] .panel-title');
  var mainPanel = $(self._menuId + ' [data-panel-type=miew-menu-panel-presets] div.main');
  var subPanel = $(self._menuId + ' [data-panel-type=miew-menu-panel-presets] div.sub');
  var mainBackButton = $(self._menuId + ' [data-panel-type=miew-menu-panel-presets] button.main-back-button');
  var presetsBackButton = $(self._menuId + ' [data-panel-type=miew-menu-panel-presets] button.presets-back-button');
  var presetsListElement = $(self._menuId + ' .miew-menu-form-presets .list-group').get(0);
  var presetsAlertArea = $(self._menuId + ' .miew-menu-form-presets .alert-warning');
  $(presetsListElement).empty();
  panelTitle.html(pdbName);
  mainPanel.hide();
  presetsAlertArea.hide();
  subPanel.show();
  mainBackButton.addClass('hidden');
  presetsBackButton.removeClass('hidden');
  self.presetsPanel.actions.preset.input.clear(self);
  self.presetsPanel.actions.preset.list.refresh(self);
};

Menu.prototype._presetsPanelActionsPresetsListRefresh = function(self) {
  if (!self.presetsPanel.presetsList.pdb) {
    return;
  }
  var onServerResponseReceived = function(list) {
    self._presetsPanelDisplayPresetsProgress(false);
    if (list) {
      self.presetsPanel.presetsList.items = list;
    } else {
      self.presetsPanel.presetsList.items = [];
    }
    self.presetsPanel.actions.preset.list.display(self);
  };
  var onServerResponseError = function() {
    self.presetsPanel.presetsList.items = [];
    self.presetsPanel.actions.preset.list.display(self);
  };
  self._presetsPanelDisplayPresetsProgress(true);
  self._viewer.srvPresetList(self.presetsPanel.presetsList.pdb.id, onServerResponseReceived, onServerResponseError);
};

Menu.prototype._presetsPanelActionsNavigateBack = function(self) {
  var panelTitle = $(self._menuId + ' [data-panel-type=miew-menu-panel-presets] .panel-title');
  var mainPanel = $(self._menuId + ' [data-panel-type=miew-menu-panel-presets] div.main');
  var subPanel = $(self._menuId + ' [data-panel-type=miew-menu-panel-presets] div.sub');
  var mainBackButton = $(self._menuId + ' [data-panel-type=miew-menu-panel-presets] button.main-back-button');
  var presetsBackButton = $(self._menuId + ' [data-panel-type=miew-menu-panel-presets] button.presets-back-button');
  panelTitle.html('Presets');
  mainPanel.show();
  subPanel.hide();
  mainBackButton.removeClass('hidden');
  presetsBackButton.addClass('hidden');
};

Menu.prototype._presetsPanelActionsPresetApply = function(self, element) {
  self._onMenuOff();
  self._viewer.srvPresetApply(+element.getAttribute('data-preset-id'));
};

Menu.prototype._presetsPanelActionsPresetRenameAsk = function(self, element) {
  var presetId = element.getAttribute('data-preset-id');
  var presetName = element.getAttribute('data-preset-name');
  var selector = $(self._menuId + ' .miew-menu-modals [data-modal-type=miew-menu-modal-rename-preset]');
  var input = selector.find('.modal-body input').get(0);
  var action = selector.find('button.presets-panel-action[data-presets-panel-action="preset-rename-confirm"]').get(0);
  $(input).val(presetName);
  $(action).attr('data-preset-id', presetId);
  selector.modal({
    keyboard: true
  }, 'show');
  selector.on(
    'shown.bs.modal',
    function() {
      var root = $(this).find('.modal-body input')[0];
      root.focus();
      root.select();
    }
  );
};

Menu.prototype._presetsPanelActionsPresetRenameConfirm = function(self, element) {
  var presetId = +element.getAttribute('data-preset-id');
  var modal = $(element).closest('[data-modal-type=miew-menu-modal-rename-preset]');
  var input = modal.find('.modal-body input').get(0);
  var newName = $(input).val();
  self._presetsPanelDisplayPresetsProgress(true);
  self._viewer.srvPresetRename(presetId, newName, function() {
    self._presetsPanelDisplayPresetsProgress(false);
    self.presetsPanel.actions.preset.list.refresh(self);
  }, function(error) {
    self._presetsPanelDisplayPresetsProgress(false);
    self._displayGlobalErrorDialog('Error renaming preset', error);
  });
};

Menu.prototype._presetsPanelActionsPresetUpdate = function(self, element) {
  self._updateReprList();
  var presetId = +element.getAttribute('data-preset-id');
  self._presetsPanelDisplayPresetsProgress(true);
  self._viewer.srvPresetUpdate(presetId, function() {
    self._presetsPanelDisplayPresetsProgress(false);
  }, function(message) {
    self._presetsPanelDisplayPresetsProgress(false);
    self._displayGlobalErrorDialog('Error updating preset', message);
  });
};

Menu.prototype._presetsPanelActionsPresetRemoveAsk = function(self, element) {
  var presetId = element.getAttribute('data-preset-id');
  var presetName = element.getAttribute('data-preset-name');
  var selector = $(self._menuId + ' .miew-menu-modals [data-modal-type=miew-menu-modal-remove-preset]');
  var body = selector.find('.modal-body').get(0);
  var action = selector.find('button.presets-panel-action[data-presets-panel-action="preset-remove-confirm"]').get(0);
  $(body).html('Are you sure you want to delete \'' + presetName + '\'?');
  $(action).attr('data-preset-id', presetId);
  selector.modal({
    keyboard: true
  }, 'show');
};

Menu.prototype._presetsPanelActionsPresetRemoveConfirm = function(self, element) {
  var presetId = element.getAttribute('data-preset-id');
  self._presetsPanelDisplayPresetsProgress(true);

  var onCompleteFn = function() {
    self._presetsPanelDisplayPresetsProgress(false);
  };

  self._viewer.srvPresetDelete(presetId, function() {
    onCompleteFn();
    self.presetsPanel.actions.preset.list.refresh(self);
  }, function(message) {
    onCompleteFn();
    self._displayGlobalErrorDialog('Error removing preset', message);
  });
};

Menu.prototype._presetsPanelActionsPresetsListDisplay = function(self) {
  var listElement = $(self._menuId + ' .miew-menu-form-presets .list-group').get(0);
  var alertArea = $(self._menuId + ' .miew-menu-form-presets .alert-warning');
  $(listElement).empty();
  if (self.presetsPanel.presetsList.items.length === 0) {
    alertArea.show();
  } else {
    alertArea.hide();
  }

  var frag = document.createDocumentFragment();
  var newItem;
  var preset;
  for (var i = 0; i < self.presetsPanel.presetsList.items.length; i++) {
    preset = self.presetsPanel.presetsList.items[i];

    var editPresetActionElement = createElement(
      'span',
      {
        'class': 'glyphicon glyphicon-pencil miew-configured-pdb-list-item-action presets-panel-action',
        'data-presets-panel-action': 'preset-rename-ask',
        'data-preset-id': preset.id,
        'data-preset-name': preset.name
      }
    );
    var updatePresetActionElement = createElement(
      'span',
      {
        'class': 'glyphicon glyphicon-floppy-save miew-configured-pdb-list-item-action presets-panel-action',
        'data-presets-panel-action': 'preset-update',
        'data-preset-id': preset.id,
        'data-preset-name': preset.name
      }
    );
    var removePresetActionElement = createElement(
      'span',
      {
        'class': 'glyphicon glyphicon-remove miew-configured-pdb-list-item-action presets-panel-action',
        'data-presets-panel-action': 'preset-remove-ask',
        'data-preset-id': preset.id,
        'data-preset-name': preset.name
      }
    );

    var presetActionsElement = typeof READONLY_SERVER !== 'undefined' && READONLY_SERVER ? undefined :
      createElement(
        'div',
        {
          'class': 'pull-right'
        }, [editPresetActionElement, updatePresetActionElement, removePresetActionElement]
      );

    var mdFileIcon = null;

    if (preset.mdFile) {
      mdFileIcon = createElement(
        'span',
        {
          'class':'glyphicon glyphicon-play-circle',
          'style': 'margin-left:5px'
        }, null
      );
    }

    newItem = createElement(
      'a',
      {
        'class': 'list-group-item presets-panel-action',
        'href': '#',
        'data-preset-id': preset.id,
        'data-presets-panel-action': 'preset-apply'
      }, [createElement('span', {}, preset.name), mdFileIcon, presetActionsElement]
    );
    frag.appendChild(newItem);
  }
  listElement.appendChild(frag);
};

Menu.prototype._presetsPanelActionsPresetInputClear = function(self) {
  var newPresetNameInput = $(self._menuId + ' input[data-input-type="miew-menu-input-new-preset-name"]').get(0);
  $(newPresetNameInput).val('');
  self.presetsPanel.actions.preset.input.refresh(self);
};

Menu.prototype._presetsPanelActionsPresetInputRefresh = function(self) {
  var newPresetNameInput = $(self._menuId + ' input[data-input-type="miew-menu-input-new-preset-name"]').get(0);
  var newPresetButton = $(self._menuId + ' .presets-panel-action[data-presets-panel-action="preset-create"]').get(0);
  var newPresetAlert = $(self._menuId + ' div[data-label-type="miew-label-add-new-preset-info"]').get(0);
  if (!self._viewer._srvTopologyFile || !self.presetsPanel.presetsList.pdb ||
      self._viewer._srvTopologyFile.id !== self.presetsPanel.presetsList.pdb.id) {
    $(newPresetButton).addClass('disabled');
    $(newPresetNameInput).attr('disabled', 'disabled');
    $(newPresetAlert).show();
  } else if ($(newPresetNameInput).val() && $(newPresetNameInput).val().length > 0) {
    $(newPresetButton).removeClass('disabled');
    $(newPresetNameInput).removeAttr('disabled');
    $(newPresetAlert).hide();
  } else {
    $(newPresetButton).addClass('disabled');
    $(newPresetNameInput).removeAttr('disabled');
    $(newPresetAlert).hide();
  }
};

Menu.prototype._presetsPanelActionsPresetCreate = function(self) {
  var newPresetNameInput = $(self._menuId +
      ' input.presets-panel-action[data-presets-panel-action="preset-input-refresh"]').get(0);
  $(newPresetNameInput).addClass('disabled');
  self._presetsPanelDisplayPresetsProgress(true);

  var onComplete = function() {
    self._presetsPanelDisplayPresetsProgress(false);
    self.presetsPanel.actions.preset.input.clear(self);
    $(newPresetNameInput).removeClass('disabled');
  };

  self._viewer.srvPresetCreate($(newPresetNameInput).val(), function() {
    onComplete();
    self.presetsPanel.actions.preset.list.refresh(self);
  }, function(message) {
    onComplete();
    self._displayGlobalErrorDialog('Error creating preset', message);
  });
};

Menu.prototype._initPresetsPanelActions = function() {
  var self = this;

  self.presetsPanel.actions.pdb.inputs.refresh = self._presetsPanelActionsPdbInputsRefresh;
  self.presetsPanel.actions.pdb.inputs.clear = self._presetsPanelActionsPdbInputsClear;
  self.presetsPanel.actions.pdb.inputs.file = self._presetsPanelActionsPdbInputsFile;
  self.presetsPanel.actions.pdb.inputs.text = self._presetsPanelActionsPdbInputsText;
  self.presetsPanel.actions.pdb.register = self._presetsPanelActionsPdbRegister;
  self.presetsPanel.actions.pdb.load = self._presetsPanelActionsPdbLoad;
  self.presetsPanel.actions.pdb.remove.ask = self._presetsPanelActionsPdbRemoveAsk;
  self.presetsPanel.actions.pdb.remove.confirm = self._presetsPanelActionsPdbRemoveConfirm;
  self.presetsPanel.actions.pdb.list.refresh = self._presetsPanelActionsPdbListRefresh;
  self.presetsPanel.actions.pdb.list.page = self._presetsPanelActionsPdbListGo;
  self.presetsPanel.actions.pdb.list.display = self._presetsPanelActionsPdbListDisplay;
  self.presetsPanel.actions.pdb.list.search = self._presetsPanelActionsPdbListSearch;
  self.presetsPanel.actions.pdb.list.select = self._presetsPanelActionsPdbListSelect;
  self.presetsPanel.actions.navigate.back = self._presetsPanelActionsNavigateBack;
  self.presetsPanel.actions.preset.list.refresh = self._presetsPanelActionsPresetsListRefresh;
  self.presetsPanel.actions.preset.list.display = self._presetsPanelActionsPresetsListDisplay;
  self.presetsPanel.actions.preset.apply = self._presetsPanelActionsPresetApply;
  self.presetsPanel.actions.preset.rename.ask = self._presetsPanelActionsPresetRenameAsk;
  self.presetsPanel.actions.preset.rename.confirm = self._presetsPanelActionsPresetRenameConfirm;
  self.presetsPanel.actions.preset.update = self._presetsPanelActionsPresetUpdate;
  self.presetsPanel.actions.preset.remove.ask = self._presetsPanelActionsPresetRemoveAsk;
  self.presetsPanel.actions.preset.remove.confirm = self._presetsPanelActionsPresetRemoveConfirm;
  self.presetsPanel.actions.preset.input.refresh = self._presetsPanelActionsPresetInputRefresh;
  self.presetsPanel.actions.preset.input.clear = self._presetsPanelActionsPresetInputClear;
  self.presetsPanel.actions.preset.create = self._presetsPanelActionsPresetCreate;

  self.presetsPanel.actions.pdb.inputs.refresh(self);

  var subPanel = $(self._menuId + ' [data-panel-type=miew-menu-panel-presets] div.sub');
  var mainBackButton = $(self._menuId + ' [data-panel-type=miew-menu-panel-presets] button.main-back-button');
  var presetsBackButton = $(self._menuId + ' [data-panel-type=miew-menu-panel-presets] button.presets-back-button');
  subPanel.hide();
  mainBackButton.removeClass('hidden');
  presetsBackButton.addClass('hidden');

  var findAction = function(parent, path) {
    if (!parent) {
      return null;
    }
    if (path.length === 1) {
      return parent[path[0]];
    } else {
      var current = path[0];
      path.splice(0, 1);
      return findAction(parent[current], path);
    }
  };

  $(document).on('click input propertychange paste change', '.presets-panel-action', function(event) {
    if ($(this).hasClass('disabled')) {
      return false;
    }
    if ($(this).data('presets-panel-action')) {
      var supportedEvents = $(this).data('presets-panel-events');
      if (supportedEvents) {
        supportedEvents = supportedEvents.split(',');
        if (supportedEvents.indexOf(event.type.toLowerCase()) === -1) {
          return true;
        }
      }
      var actionPath = $(this).data('presets-panel-action').split('-');
      var action = findAction(self.presetsPanel.actions, actionPath);
      if (action) {
        action(self, this, event);
        return event.type.toLowerCase() === 'paste';
      }
    }
    return true;
  });
};

Menu.prototype._initPresetsPanel = function() {
  var self = this;
  self.presetsPanel.actions.pdb.list.refresh(self, true);
  self.presetsPanel.actions.pdb.inputs.refresh(self);
  self.presetsPanel.actions.preset.list.refresh(self);
  self.presetsPanel.actions.preset.input.refresh(self);
};

Menu.prototype._initRenderPanel = function() {
  var self = this;

  $(self._menuId + ' [data-toggle=resolution]').on('click', /** @this HTMLSelectElement */ function() {
    var elements = $(self._menuId + ' [data-value=miew-menu-panel-resolution]');
    var itemID = this.getAttribute('data-value');

    var prevActive = settings.now.resolution;
    $(self._menuId + ' [data-value="' + prevActive + '"]').removeClass('active');

    elements[0].firstElementChild.firstElementChild.textContent = this.textContent;
    settings.set('resolution', itemID);
    $(self._menuId + ' [data-value="' + itemID + '"]').addClass('active');

    $(self._menuId + ' button[data-value=miew-menu-panel-render]').click();
  });

  this._fillCombo('miew-menu-panel-palette', 'palette', 'palette', palettes);
  $(self._menuId + ' [data-toggle=palette]').on('click', /** @this HTMLSelectElement */ function() {
    var elements = $(self._menuId + ' .list-group-item[data-value=miew-menu-panel-palette]');
    var itemID = this.getAttribute('data-value');

    elements[0].firstElementChild.firstElementChild.textContent = (palettes.get(itemID) || palettes.any).name;
    self._fillUniformColorCombo(itemID);
    //Here should be palettes colors mapping
    /*var ucSelector = $(self._menuId + ' .panel-menu[data-panel-type=miew-menu-panel-representation]' +
       '.miew-repr-list [data-value=miew-menu-panel-uniform-color]');
      var ucColor = hexColor(palettes.get(itemID).colors[0]);
      ucSelector.find('.thumbnail').attr('data-id', ucColor);
      ucSelector.find('img').css('background-color', ucColor);*/
  });

};

Menu.prototype._initToolsPanel = function() {
  var self = this;
  $(self._menuId + ' .miew-menu-modals [data-modal-type=miew-menu-modal-url]').on('shown.bs.modal', function() {
    var root = $(self._menuId + ' .miew-menu-modals [data-modal-type=miew-menu-modal-url] .modal-body')[0].firstChild;
    var content = root.nodeValue;
    if (document.createRange) {
      var rng = document.createRange();
      rng.setStart(root, 0);
      rng.setEnd(root, content.length);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(rng);
    }
  });

  $(self._menuId + ' .miew-menu-modals [data-modal-type=miew-menu-modal-url]').on('keydown', function(e) {
    if (e.keyCode === 27) { //ESC
      e.preventDefault();
    }
  });

  $(self._menuId + ' [data-toggle=miew-menu-tools]').on('click', function() {
    const type = this.getAttribute('data-value');
    let visual;
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
    case 'get-url':
      var selector = $(self._menuId + ' .miew-menu-modals [data-modal-type=miew-menu-modal-url]');
      selector.find('.modal-body')[0].textContent = self._viewer.getURL({settings: true, view: true});
      selector.modal({
        keyboard: true
      }, 'show');
      break;
    case 'get-script':
      selector = $(self._menuId + ' .miew-menu-modals [data-modal-type=miew-menu-modal-script]');
      selector.find('.modal-body')[0].innerHTML = self._viewer.getScript().replace(/(?:\r\n|\r|\n)/g, '<br />');
      selector.modal({
        keyboard: true
      }, 'show');
      break;
    case 'fbx-export':
      visual = self._viewer._getComplexVisual();
      fbxExport(visual._complex, visual._reprList, false);
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

Menu.prototype._onSelectorChanged = function(selectionPanel) {
  const line = selectionPanel.find('input').get(0).value.trim() || 'all';
  const div = selectionPanel.find('.alert-danger').get(0);
  const parsed = selectors.parse(line);
  const selector =  selectionPanel.find('[data-btn-type=miew-menu-btn-apply-sel]');
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

function hasComplex(viewer) {
  let bHaveComplexes = false;
  viewer._forEachComplexVisual(function() {
    bHaveComplexes = true;
  });
  return bHaveComplexes;
}

function getNumAtomsBySelector(viewer, selector) {
  const visual = viewer._getComplexVisual();
  return visual ? visual.getComplex().getNumAtomsBySelector(selector) : -1;
}

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


Menu.prototype._initSelectionPanel = function() {
  var self = this;
  var selectionPanel = $(self._menuId + ' [data-panel-type=miew-menu-panel-selection]');

  function fillSingleWords() {
    var frag = document.createDocumentFragment();
    var newItem;
    var group = selectionPanel.find('[data-tab-content=singleword]').get(0);
    var i, n;

    for (i = 0, n = self._singleWordsPrimary.length; i < n; i++) {
      var wordPrimary = self._singleWordsPrimary[i];
      newItem = createElement(
        'a', {
          'href': '#',
          'class': 'list-group-item frequent',
          'data-toggle': 'selection-input',
          'data-value': wordPrimary + ' '
        },
        wordPrimary
      );
      frag.appendChild(newItem);
    }

    self._singleWords.sort();
    for (i = 0, n = self._singleWords.length; i < n; i++) {
      var word = self._singleWords[i];
      if (self._singleWordsPrimary.indexOf(word) !== -1) {
        continue;
      }
      newItem = createElement(
        'a', {
          'href':        '#',
          'class':       'list-group-item',
          'data-toggle': 'selection-input',
          'data-value':  word + ' '
        },
        word
      );
      frag.appendChild(newItem);
    }

    group.firstElementChild.appendChild(frag);
  }

  function fillKeyWords() {
    var frag = document.createDocumentFragment();
    var newItem;
    var group = selectionPanel.find('[data-tab-content=keyword]').get(0);
    for (var i = 0, n = self._keyWordsPrimary.length; i < n; i++) {
      var wordPrimary = self._keyWordsPrimary[i];
      newItem = createElement(
        'a', {
          'href':        '#',
          'class':       'list-group-item frequent keyword-item',
          'data-toggle': 'selection-input',
          'data-value':  wordPrimary + ' '
        },
        wordPrimary
      );
      frag.appendChild(newItem);
    }

    group.firstElementChild.appendChild(frag);
  }

  fillSingleWords();
  fillKeyWords();

  var element = selectionPanel.find('input').get(0);
  element.addEventListener('input', () => this._onSelectorChanged(selectionPanel));
  element.addEventListener('change', () => this._onSelectorChanged(selectionPanel));

  selectionPanel.find('.help-block a').on('click', function(e) {
    var el = selectionPanel.find('input').get(0);
    el.value = e.target.textContent;
    self._onSelectorChanged(selectionPanel); // FIXME
    return false;
  });

  selectionPanel.find('[data-toggle=selection-input]').on('click', function(e) {
    var text = e.target.getAttribute('data-value');
    var elements = $(self._menuId + ' .panel-menu[data-panel-type=miew-menu-panel-selection] input');
    elements.val(elements.val() + text);
    self._onSelectorChanged(selectionPanel);
  });

  selectionPanel.find('.calc .delete').on('click', function() {
    var elements = selectionPanel.find('input');
    var type = this.getAttribute('data-delete-type');
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

  $(self._menuId + ' .keyword-item').on('click', function(e) {
    var selector = selectionPanel.find('[data-tab-content=value] div');
    selector.empty();
    selector.off('click', '.value[data-toggle=selection-input]');
    var frag = document.createDocumentFragment();
    var newItem;
    var group = selectionPanel.find('[data-tab-content=value]').get(0);
    var key = e.target.getAttribute('data-value').slice(0, -1);
    var values = [];

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

    for (var i = 0, n = values.length; i < n; i++) {
      var val = values[i];
      newItem = createElement(
        'a', {
          'href':        '#',
          'class':       'list-group-item value',
          'data-toggle': 'selection-input',
          'data-value':  val
        },
        val
      );
      frag.appendChild(newItem);
    }
    group.firstElementChild.appendChild(frag);
    selectionPanel.find('.nav-tabs a[href="[data-tab-content=value]"]').tab('show');

    $(self._menuId + ' .value[data-toggle=selection-input]').on('click', function(event) {
      const text = utils.correctSelectorIdentifier(event.target.getAttribute('data-value'));
      const elements = selectionPanel.find('input');
      elements.val(elements.val() + text);
      self._onSelectorChanged(selectionPanel);
    });
  });

  selectionPanel.find('[data-btn-type=miew-menu-btn-apply-sel]').on('click', /** @this HTMLElement */ function() {
    if (!selectionPanel.find('[data-btn-type=miew-menu-btn-apply-sel]').hasClass('disabled')) {
      var line = selectionPanel.find('input').val().trim() || 'all';
      var elements = $(self._menuId + ' [data-panel-type=miew-menu-panel-representation] .miew-repr-list ' +
          '.panel.valid:eq(' + self._curReprIdx + ') .panel-collapse [data-value=miew-menu-panel-selection]');
      elements[0].firstElementChild.firstElementChild.textContent = line;

      var badge = $(self._menuId + ' [data-panel-type=miew-menu-panel-representation] .miew-repr-list ' +
          '.panel.valid:eq(' + self._curReprIdx + ') .panel-heading .badge');
        // update number of atoms included by selector
      var parsed = selectors.parse(line);
      var numAtoms = getNumAtomsBySelector(self._viewer, parsed.selector);
      badge[0].textContent = String(numAtoms);

      selectionPanel.get(0).firstElementChild.firstElementChild.click();
    }
  });
};

Menu.prototype._initToolbar = function() {
  var self = this;

  var frag = document.createDocumentFragment();
  var newItem;

  function fillToolbar(type, name, option, module) {
    var toolbar = $(self._menuId + ' [data-toolbar-type=' + type + ']').get(0);
    for (var i = 0, n = module.list.length; i < n; i++) {
      var entry = module.list[i];
      entry = entry.prototype || entry;  // entry may be Class or Object
      newItem = createElement('a', {
        'href':        '#',
        'class':       'thumbnail',
        'data-toggle': name,
        'data-value':  entry.id
      }, [
        createElement('div', {
          'class': 'toolbar-thumb',
          'style': 'background:url(images/' + name.substring(0, name.indexOf('-')) + '/' + entry.id + '.png)'
        }),
        createElement(
          'div', {
            'class': 'caption text-center',
          },
          createElement(
            'small', {},
            entry.shortName
          )
        )]);
      frag.appendChild(newItem);
    }
    toolbar.lastElementChild.lastElementChild.appendChild(frag);
  }

  fillToolbar('miew-menu-toolbar-mode', 'mode-immediate', 'mode', modes);
  fillToolbar('miew-menu-toolbar-colorer', 'colorer-immediate', 'colorer', colorers);

  // Update mode selector names and add event listeners
  $(self._menuId + ' [data-toggle="mode-immediate"]').each(function(index, element) {
    var id = element.getAttribute('data-value');
    element.addEventListener('click', function(event) {
      $(self._menuId + ' [data-value="' + unarray(self._viewer.rep().mode) + '"]').removeClass('active');
      $(self._menuId + ' [data-value=miew-menu-toolbar-mode]').click();
      self._viewer.rep({mode: id});
      event.preventDefault();
      self._fixKeyboard();
    });
  });

  // Update colorer selector names and add event listeners
  $(self._menuId + ' [data-toggle="colorer-immediate"]').each(function(index, element) {
    var id = element.getAttribute('data-value');
    element.addEventListener('click', function(event) {
      $(self._menuId + ' [data-value="' + unarray(self._viewer.rep().colorer) + '"]').removeClass('active');
      $(self._menuId + ' [data-value=miew-menu-toolbar-colorer]').click();
      self._viewer.rep({colorer: id});
      event.preventDefault();
      self._fixKeyboard();
    });
  });

  // Update resolution selector names and add event listeners
  $(self._menuId + ' [data-toggle="resolution-immediate"]').each(function(index, element) {
    var id = element.getAttribute('data-value');
    element.addEventListener('click', function(event) {
      $(self._menuId + ' [data-value="' + settings.now.resolution + '"]').removeClass('active');
      settings.set('resolution', id);
      $(self._menuId + ' [data-value=miew-menu-toolbar-resolution]').click();
      self._viewer.rebuildAll();
      event.preventDefault();
      self._fixKeyboard();
    });
  });

  $(self._menuId + ' .titlebar [data-toggle=panel]').on('click', function() {
    self._onMenuOn();
  });

  $(self._menuId + ' .toolbar').on('click', function(event) {
    var target = $(event.target);
    if (target.is('.toolbar')) {
      var type = target.attr('data-toolbar-type');
      $(self._menuId + ' [data-value="' + type + '"]').click();
      self._fixKeyboard();
    }
  });

};

Menu.prototype._initReprList = function() {
  this._fillReprList();
  this._curReprIdx = this._viewer.repCurrent();
  $(this._menuId + ' .panel-menu[data-panel-type=miew-menu-panel-representation] .miew-repr-list .panel.valid:eq(' +
    this._curReprIdx + ') .panel-heading').addClass('active');

  $(this._menuId + ' .panel-menu[data-panel-type=miew-menu-panel-representation] .miew-repr-list .panel.valid:eq(' +
    this._curReprIdx + ') .panel-collapse').collapse('show');

  if (this._viewer.repCount() > 1) {
    $(this._menuId + ' .miew-repr-list-controls [data-btn-type=miew-menu-btn-del-repr]').removeClass('disabled');
  } else {
    $(this._menuId + ' .miew-repr-list-controls [data-btn-type=miew-menu-btn-del-repr]').addClass('disabled');
  }
  if (this._viewer.repCount() < this._viewer.getMaxRepresentationCount()) {
    $(this._menuId + ' .miew-repr-list-controls [data-btn-type=miew-menu-btn-add-repr]').removeClass('disabled');
  } else {
    $(this._menuId + ' .miew-repr-list-controls [data-btn-type=miew-menu-btn-add-repr]').addClass('disabled');
  }
};

Menu.prototype._updateResolutionCombo = function() {
  this._removeActiveFromCombo('resolution');

  const elements = $(this._menuId + ' [data-value=miew-menu-panel-resolution]');
  const resSelector = $(this._menuId + ' [data-toggle=resolution][data-value="' + settings.now.resolution + '"]');

  elements[0].firstElementChild.firstElementChild.textContent = resSelector.text();
  resSelector.addClass('active');
};

Menu.prototype.setBlur = function(enable) {
  const container = this._viewer._container;
  if (enable) {
    container.classList.add('blur');
  } else {
    container.classList.remove('blur');
  }
};

Menu.prototype.show = function(panelID, menuItem) {
  var self = this;

  this.setBlur(true);
  this._titlebar.hide();

  var selectorHide = self._getPanelSelector(self._curPanelID);
  selectorHide.hide();
  $(self._menuId + ' a[data-value="' + self._curMenuItem + '"]').removeClass('active');

  self._curPanelID = panelID;
  self._curMenuItem = menuItem;
  if (this._xs === false) {
    var selectorShow = self._getPanelSelector(self._curPanelID);
    selectorShow.show();
    $(self._menuId + ' a[data-value="' + menuItem + '"]').addClass('active');
  }

  // Prepare a copy of settings to fill
  settings.checkpoint();

  self._updateDisplayOptions('miew-menu-panel-palette', 'palette', palettes);
  self._fillUniformColorCombo(settings.get('palette'));

  self._fillSourceList();
  self._initReprList();

  self._updateResolutionCombo();

  $(self._menuId + ' input[type=checkbox][data-dir=settings]').each(function(index, element) {
    var param = element.getAttribute('data-toggle');
    if (param === 'theme') {
      $(self._menuId + ' [data-toggle="' + param + '"]').bootstrapSwitch('state', settings.get(param) === 'dark');
    } else {
      $(self._menuId + ' [data-toggle="' + param + '"]').bootstrapSwitch('state', settings.get(param));
    }
  });

  // renew currently opened mode-, colorer-, matpreset- combobox panel (need, when they were changed from toolbar)
  if (self._curPanelID.indexOf('mode') !== -1 ||
    self._curPanelID.indexOf('color') !== -1 ||
    self._curPanelID.indexOf('matpreset') !== -1) {
    const reprList = $(self._menuId + ' [data-panel-type=miew-menu-panel-representation] .miew-repr-list');
    const comboPanel = reprList.find('.panel:eq(' + self._curReprIdx + ') [data-value="' + self._curPanelID + '"]');
    if (comboPanel) {
      comboPanel.click(); // call update of active item, getting value from current reprList
    }
  }

  $(self._menuId + ' .panel-menu[data-panel-type=miew-menu-panel-main]').show();
  this._menu.show();
};

Menu.prototype.showTerminal = function() {
  this._terminal.show();
  this._terminalWindow.focus();
};

Menu.prototype._removeActiveFromCombo = function(comboName) {
  const selector =  $(this._menuId + ` [data-toggle=${comboName}].active`);
  if (selector) {
    selector.removeClass('active');
  }
};

Menu.prototype.hide = function() {
  // Clear resolution setting display because it might be changed
  var resSelector = $(this._menuId + ' [data-toggle=resolution][data-value="' + settings.now.resolution + '"]');
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

Menu.prototype.hideTerminal = function() {
  this._terminal.hide();
  this._terminalWindow.focus(false);
};

Menu.prototype._hideToolbarPanel = function() {
  const toolbar = $(this._menuId + ' [data-toggle="toolbar"].active');
  if (toolbar) {
    toolbar.click();
  }
};

Menu.prototype._onMenuOn = function() {
  // Stop rendering to lower CPU load
  this._viewer.halt();
  $(this._menuId + ' .overlay').hide();
  this._reprListChanged = false;
  this._initPresetsPanel();
  this._hideToolbarPanel();
  // Show the panel
  this.show(this._curPanelID, this._curMenuItem);
};

Menu.prototype._onTerminalOn = function() {
  $(this._menuId + ' .overlay').hide();
  this._viewer.enableHotKeys(false);
  this._hideToolbarPanel();
  this.showTerminal();
};

Menu.prototype._onMenuOff = function() {
  this._updateReprList();

  function contain(array, elements) {
    if (elements instanceof Array) {
      return elements.some(function(value) {
        return array.indexOf(value) >= 0;
      });
    } else {
      return array.indexOf(elements) >= 0;
    }
  }

  // Apply changed settings
  var changedKeys = settings.changed();
  var rebuild = this._reprListChanged ||  // TODO: list has changed, not rep!?
      contain(changedKeys, ['resolution', 'palette']);
  var rebuildAll = contain(changedKeys, ['resolution', 'palette']);
  var rerender = contain(changedKeys, ['theme', 'axes', 'fxaa', 'fog', 'ao']);

  if (rebuild) {
    if (rebuildAll) {
      // TODO: isn't it a rebuildAll() call?
      for (var idx = 0, reprCount = this._viewer.repCount(); idx < reprCount; ++idx) {
        this._viewer.repGet(idx).needsRebuild = true;
      }
    } else {
      this._viewer.repGet().needsRebuild = true;
    }
    this._viewer.rebuild(); // TODO: implicit rebuild is enough
  }

  if (contain(changedKeys, 'fps')) {
    $('#stats').toggle(settings.now.fps);
  }

  if (contain(changedKeys, 'theme')) {
    var viewer = this._viewer;
    viewer._onThemeChanged();
  }

  if (rerender) {
    this._viewer.setNeedRender();
  }

  this.hide();
  this._viewer.run();
  $(this._menuId + ' .overlay').show();
  this._fixKeyboard();
};

Menu.prototype._onTerminalOff = function() {
  this.hideTerminal();
  this._viewer.enableHotKeys(true);
  $(this._menuId + ' .overlay').show();
  this._fixKeyboard();
};

Menu.prototype._fixKeyboard = function() {
  //do IFRAME related hack
  if (window !== window.top) {
    var parentDocument = window.top.document;
    var button = parentDocument.querySelector('button');
    if (!button) {
      var body = parentDocument.querySelector('body');
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

Menu.prototype.showOverlay = function() {
  this._titlebar.show();
};

Menu.prototype.hideOverlay = function() {
  this._titlebar.hide();
};

Menu.prototype._isXS = function() {
  var nWideWidth = 768;
  return document.documentElement.clientWidth < nWideWidth;
};

Menu.prototype._updateDisplayOptions = function(id, name, module) {
  var entry = module.get(settings.get(name)) || module.any;
  entry = entry.prototype || entry;
  $(this._menuId + ' .list-group-item[data-value="' +
      id + '"]')[0].firstElementChild.firstElementChild.textContent = entry.name;
};

Menu.prototype._setTitle = function(title) {
  $(this._menuId + ' [data-field="title"]').text(title);
};

Menu.prototype._setMdPlayerState = function(state) {
  var playBtn = $(this._menuId + ' [data-btn-type="md-player-play"]');
  var pauseBtn = $(this._menuId + ' [data-btn-type="md-player-pause"]');
  var loadingIndicator = $(this._menuId + ' [data-btn-type="md-player-loading"]');
  if (state) {
    if (state.isPlaying) {
      playBtn.hide();
      pauseBtn.show();
    } else {
      playBtn.show();
      pauseBtn.hide();
    }
    if (state.isLoading) {
      loadingIndicator.show();
    } else {
      loadingIndicator.hide();
    }
  } else {
    playBtn.hide();
    pauseBtn.hide();
    loadingIndicator.hide();
  }
};

Menu.prototype._initMdPlayerControls = function() {
  var playBtn = $(this._menuId + ' [data-btn-type="md-player-play"]');
  var pauseBtn = $(this._menuId + ' [data-btn-type="md-player-pause"]');
  var self = this;
  playBtn.on('click', function() {
    self._viewer._continueAnimation();
  });
  pauseBtn.on('click', function() {
    self._viewer._pauseAnimation();
  });
  this._setMdPlayerState();
};

Menu.prototype._updateInfo = function(dataSource) {
  if (dataSource && dataSource.id !== 'Complex') {
    return;
  }
  var complex = dataSource;

  var body = $('.panel-menu[data-panel-type=miew-menu-panel-info]').children('.panel-body')[0];

  // remove all existing text
  var parent = body;
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }

  var frag = document.createDocumentFragment();
  if (!complex) {
    frag.appendChild(createElement('p', null, 'No data loaded yet.'));
    body.appendChild(frag);
    return;
  }

  var metadata = complex.metadata;
  var h1 = createElement('h1', null, (metadata.id || complex.name || 'Unknown data') + ' ');
  if (metadata.classification) {
    h1.appendChild(createElement('small', null, '/ ' + metadata.classification));
  }
  frag.appendChild(h1);

  if (metadata.title) {
    frag.appendChild(createElement('p', null, metadata.title.join(' ')));
  }

  frag.appendChild(createElement('hr'));

  function _createRow(name, value) {
    return createElement('tr', null, [
      createElement('td', null, name),
      createElement('td', {'class': 'text-center'}, String(value)),
    ]);
  }

  frag.appendChild(createElement('table', {'class': 'table'}, [
    createElement(
      'thead', null,
      createElement('tr', null, [
        createElement('th', {'class': 'col-xs-10'}, 'Statistics'),
        createElement('th', {'class': 'col-xs-2 text-center'}, 'Value'),
      ])
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
  var molecules = complex.getMolecules();
  var molList = createElement('ol');
  for (var i = 0; i < molecules.length; i++) {
    molList.appendChild(createElement('li', null, molecules[i]._name));
  }
  frag.appendChild(createElement('table', {'class': 'table'}, [
    createElement(
      'thead', null,
      createElement('tr', null, [
        createElement('th', {'class': 'col-xs-10'}, 'Molecules'),
      ])
    ),
    createElement('tbody', null, createElement('tr', null, createElement('td', null, molList))),
  ]));

  body.appendChild(frag);
};

Menu.prototype._onResize = function() {
  if (this._xs === false && this._isXS() === true) {
    this._xs = true;
    $(this._menuId + ' .panel-menu[data-panel-type=miew-menu-panel-main]').hide();
  }
  if (this._xs === true && this._isXS() === false) {
    this._xs = false;
    $(this._menuId + ' .panel-menu[data-panel-type=miew-menu-panel-main]').show();
    $(this._menuId + ' a[data-value="' + this._curMenuItem + '"]').addClass('active');
    this._getPanelSelector(this._curPanelID).show();
  }
};

Menu.prototype._updateReprList = function() {
  var self = this;

  function _createOptionsFromMVData(index, property, element, itemId) {
    var curRep = self._viewer.repGet(index);
    if (curRep[property].id !== itemId) {
      $(element).removeData();
      return itemId;
    }
    var opts = $(element).data().mvdata;
    if (typeof opts === 'undefined' || _.isEmpty(opts)) {
      return itemId;
    }
    var diff = utils.objectsDiff(opts, settings.now[property + 's'][itemId]);
    if (_.isEmpty(diff)) {
      return itemId;
    }
    return [itemId, diff];
  }

  var removeIdxList = [];
  var selector = null;
  var modeItem = null;
  var colorerItem = null;
  var matPresetItem = null;
  var uniColorItem = null;
  var modeId = null;
  var colorerId = null;
  var matPresetId = null;
  var isDeleted = null;
  var isAdded = null;
  var isVisible = null;
  var zClip = null;
  var isoValue = null;
  var radScale = null;
  var uniColor = null;
  var repr = null;

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

  $(self._menuId + ' [data-panel-type=miew-menu-panel-representation] ' +
      '.miew-repr-list .panel').each(function(index, element) {
    isDeleted = $(element).hasClass('deleted');
    isAdded = $(element).hasClass('added');

    if (!(isDeleted && isAdded)) {
      isVisible = ($(element).find('.panel-heading .btn-visible').css('display') !== 'none');
      selector = $(element).find('[data-type=selection-target]')[0].textContent;
      modeItem = $(element).find('[data-value=miew-menu-panel-mode]')[0];
      colorerItem = $(element).find('[data-value=miew-menu-panel-color]')[0];
      matPresetItem = $(element).find('[data-value=miew-menu-panel-matpreset]')[0];
      uniColorItem = $(element).find('[data-value=miew-menu-panel-uniform-color]')[0];
      modeId = modeItem.firstElementChild.firstElementChild.getAttribute('data-id');
      colorerId = colorerItem.firstElementChild.firstElementChild.getAttribute('data-id');
      matPresetId = matPresetItem.firstElementChild.firstElementChild.getAttribute('data-id');
      uniColor = stringColorToHex(uniColorItem.firstElementChild.firstElementChild.getAttribute('data-id'));
      zClip = $(element).find('[type=checkbox][data-toggle=zClip]')[0].checked;
      radScale = parseFloat($(element).find('[data-type=rad]').val());
      isoValue = parseFloat($(element).find('[data-type=iso]').val());

      if (isDeleted) {
        removeIdxList.push(index);
      } else if (isAdded) {
        var idx = self._viewer.repAdd({
          selector: selector,
          mode: modeId,
          colorer: colorerId
        });
        if (idx >= 0) {
          repr = self._viewer.repGet(idx);

          _fillModeOptionsFromMenu();

          if (colorerId === 'UN') {
            repr.colorer.opts.color = uniColor;
          }
          repr.setMaterialPreset(materials.get(matPresetId));

          if (repr.visible !== isVisible) {
            self._viewer.setNeedRender();
          }
          repr.show(isVisible);
        }
      } else {

        var modeParams = _createOptionsFromMVData(index, 'mode', modeItem, modeId);
        var colorerParams = _createOptionsFromMVData(index, 'colorer', colorerItem, colorerId);
        index = self._viewer.repCurrent(index);
        self._viewer.rep(index, {
          selector: selector, mode: modeParams, colorer: colorerParams, material: matPresetId
        });

        repr = self._viewer.repGet();
        // change uniform colorer's color if applicable
        if (colorerId === 'UN') {
          if (repr.colorer.opts.color !== uniColor) {
            // FIXME: set color through shader uniform without rebuild
            repr.needsRebuild = true;
            repr.colorer.opts.color = uniColor;
          }
        }

        _fillModeOptionsFromMenu();

        //repr.setMode(repr.mode.id);

        if (repr.visible !== isVisible) {
          self._viewer.setNeedRender();
        }
        repr.show(isVisible);
      }
    }
  });

  //works only if representation order has not been changed in menu
  var len = removeIdxList.length;
  for (var idx = len - 1; idx > -1; --idx) {
    self._viewer.repRemove(removeIdxList[idx]);
  }
  self._viewer.repCurrent(self._curReprIdx);
};

Menu.prototype._enableToolbar = function(enable) {
  var self = this;
  if (enable) {
    $(self._menuId + ' [data-toggle=toolbar]').removeClass('disabled');
  } else {
    $(self._menuId + ' [data-toggle=toolbar]').addClass('disabled');
  }
};

export default Menu;

