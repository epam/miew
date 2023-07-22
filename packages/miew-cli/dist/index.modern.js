/** 3D Molecular Viewer v0.0.1
Copyright (c) 2015-2023 EPAM Systems, Inc. */

import { Miew } from 'miew';
import { find, forEach, remove, omitBy, findKey, isNumber, assign, forIn, isEmpty, isEqual, isString, isPlainObject, isUndefined, slice, sortBy, keys, get, set } from 'lodash';

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, basedir, module) {
	return module = {
		path: basedir,
		exports: {},
		require: function (path, base) {
			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
		}
	}, fn(module, module.exports), module.exports;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var _typeof_1 = createCommonjsModule(function (module) {
function _typeof(obj) {
  "@babel/helpers - typeof";
  return (module.exports = _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports), _typeof(obj);
}
module.exports = _typeof, module.exports.__esModule = true, module.exports["default"] = module.exports;
});
var _typeof = getDefaultExportFromCjs(_typeof_1);

var classCallCheck = createCommonjsModule(function (module) {
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
module.exports = _classCallCheck, module.exports.__esModule = true, module.exports["default"] = module.exports;
});
var _classCallCheck = getDefaultExportFromCjs(classCallCheck);

var createClass = createCommonjsModule(function (module) {
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}
module.exports = _createClass, module.exports.__esModule = true, module.exports["default"] = module.exports;
});
var _createClass = getDefaultExportFromCjs(createClass);

var parser = function () {
  var o = function o(k, v, _o, l) {
    for (_o = _o || {}, l = k.length; l--; _o[k[l]] = v) {
    }
    return _o;
  },
      $V0 = [1, 60],
      $V1 = [1, 62],
      $V2 = [1, 63],
      $V3 = [1, 65],
      $V4 = [1, 66],
      $V5 = [1, 67],
      $V6 = [1, 68],
      $V7 = [1, 69],
      $V8 = [1, 80],
      $V9 = [1, 72],
      $Va = [1, 73],
      $Vb = [1, 74],
      $Vc = [1, 75],
      $Vd = [1, 99],
      $Ve = [1, 76],
      $Vf = [1, 100],
      $Vg = [1, 79],
      $Vh = [1, 51],
      $Vi = [1, 81],
      $Vj = [1, 82],
      $Vk = [1, 84],
      $Vl = [1, 83],
      $Vm = [1, 85],
      $Vn = [1, 96],
      $Vo = [1, 97],
      $Vp = [1, 98],
      $Vq = [1, 86],
      $Vr = [1, 87],
      $Vs = [1, 64],
      $Vt = [1, 70],
      $Vu = [1, 71],
      $Vv = [1, 77],
      $Vw = [1, 78],
      $Vx = [1, 53],
      $Vy = [1, 54],
      $Vz = [1, 55],
      $VA = [1, 61],
      $VB = [1, 88],
      $VC = [1, 89],
      $VD = [1, 90],
      $VE = [1, 91],
      $VF = [1, 92],
      $VG = [1, 93],
      $VH = [1, 94],
      $VI = [1, 95],
      $VJ = [1, 101],
      $VK = [1, 102],
      $VL = [1, 103],
      $VM = [1, 104],
      $VN = [1, 105],
      $VO = [1, 56],
      $VP = [1, 57],
      $VQ = [1, 58],
      $VR = [1, 59],
      $VS = [1, 115],
      $VT = [1, 111],
      $VU = [1, 114],
      $VV = [1, 112],
      $VW = [1, 113],
      $VX = [1, 118],
      $VY = [1, 117],
      $VZ = [1, 134],
      $V_ = [1, 149],
      $V$ = [1, 150],
      $V01 = [1, 157],
      $V11 = [5, 6, 7, 9, 13, 14, 15, 17, 18, 19, 20, 23, 25, 26, 27, 30, 33, 34, 35, 37, 38, 41, 43, 45, 46, 49, 52, 54, 55, 56, 58, 59, 62, 64, 65, 66, 70, 72, 74, 77, 78, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 101],
      $V21 = [5, 6, 7, 9, 13, 14, 15, 17, 18, 19, 20, 23, 25, 26, 27, 30, 33, 34, 35, 37, 38, 41, 43, 45, 46, 49, 52, 54, 55, 56, 58, 59, 62, 64, 65, 66, 70, 71, 72, 74, 77, 78, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 101],
      $V31 = [5, 6, 7, 9, 13, 15, 17, 18, 19, 20, 23, 25, 26, 27, 30, 33, 34, 37, 38, 41, 43, 45, 46, 49, 52, 54, 55, 56, 58, 59, 62, 64, 65, 66, 70, 72, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95],
      $V41 = [5, 70, 72],
      $V51 = [5, 74],
      $V61 = [71, 101];
  var parser = {
    trace: function trace() {},
    yy: {},
    symbols_: {
      error: 2,
      Program: 3,
      Command: 4,
      EOF: 5,
      RESET: 6,
      BUILD: 7,
      ALL: 8,
      HELP: 9,
      Path: 10,
      MOTM: 11,
      OneArgCommand: 12,
      GET: 13,
      STRING: 14,
      SET: 15,
      Value: 16,
      SET_SAVE: 17,
      SET_RESTORE: 18,
      SET_RESET: 19,
      PRESET: 20,
      AddRepresentation: 21,
      EditRepresentation: 22,
      REMOVE: 23,
      RepresentationReference: 24,
      HIDE: 25,
      SHOW: 26,
      LIST: 27,
      EXPAND_KEY: 28,
      SELECTOR_KEY: 29,
      SELECT: 30,
      AS: 31,
      WordAll: 32,
      SELECTOR: 33,
      WITHIN: 34,
      NUMBER: 35,
      OF: 36,
      MATERIAL: 37,
      IDENTIFIER: 38,
      ModeCMD: 39,
      ColorCMD: 40,
      VIEW: 41,
      BASE_64: 42,
      UNIT: 43,
      DSSP: 44,
      SCALE: 45,
      ROTATE: 46,
      AxesList: 47,
      TRANSLATE: 48,
      CENTER: 49,
      GetURLBranch: 50,
      Screenshot: 51,
      LINE: 52,
      ArgList: 53,
      LISTOBJ: 54,
      REMOVEOBJ: 55,
      URL: 56,
      VIEW_KEY: 57,
      SCREENSHOT: 58,
      LOAD: 59,
      Url: 60,
      FILE_KEY: 61,
      ADD: 62,
      Description: 63,
      REP: 64,
      MODE: 65,
      COLOR: 66,
      Descriptor: 67,
      RepresentationOwnProperty: 68,
      RepresentationOwnPropertyOpts: 69,
      DESC_KEY: 70,
      '=': 71,
      DESC_KEY_OPTS: 72,
      AxesArg: 73,
      DESC_KEY_AXES: 74,
      Arg: 75,
      PathWoDescKey: 76,
      HEX: 77,
      BOOL: 78,
      Word: 79,
      CommandSetWoDESC_KEY: 80,
      DescKeys: 81,
      CLEAR: 82,
      FILE_LIST: 83,
      FILE_REGISTER: 84,
      FILE_DELETE: 85,
      PRESET_ADD: 86,
      PRESET_DELETE: 87,
      PRESET_UPDATE: 88,
      PRESET_RENAME: 89,
      PRESET_OPEN: 90,
      CREATE_SCENARIO: 91,
      RESET_SCENARIO: 92,
      DELETE_SCENARIO: 93,
      ADD_SCENARIO_ITEM: 94,
      LIST_SCENARIO: 95,
      PDB_KEY: 96,
      DELAY_KEY: 97,
      PRST_KEY: 98,
      DESCRIPTION_KEY: 99,
      CommandSet: 100,
      '.': 101,
      PresetPath: 102,
      '/': 103,
      HexOrNumber: 104,
      $accept: 0,
      $end: 1
    },
    terminals_: {
      2: 'error',
      5: 'EOF',
      6: 'RESET',
      7: 'BUILD',
      8: 'ALL',
      9: 'HELP',
      11: 'MOTM',
      13: 'GET',
      14: 'STRING',
      15: 'SET',
      17: 'SET_SAVE',
      18: 'SET_RESTORE',
      19: 'SET_RESET',
      20: 'PRESET',
      23: 'REMOVE',
      25: 'HIDE',
      26: 'SHOW',
      27: 'LIST',
      28: 'EXPAND_KEY',
      29: 'SELECTOR_KEY',
      30: 'SELECT',
      31: 'AS',
      33: 'SELECTOR',
      34: 'WITHIN',
      35: 'NUMBER',
      36: 'OF',
      37: 'MATERIAL',
      38: 'IDENTIFIER',
      41: 'VIEW',
      42: 'BASE_64',
      43: 'UNIT',
      44: 'DSSP',
      45: 'SCALE',
      46: 'ROTATE',
      48: 'TRANSLATE',
      49: 'CENTER',
      52: 'LINE',
      54: 'LISTOBJ',
      55: 'REMOVEOBJ',
      56: 'URL',
      57: 'VIEW_KEY',
      58: 'SCREENSHOT',
      59: 'LOAD',
      61: 'FILE_KEY',
      62: 'ADD',
      64: 'REP',
      65: 'MODE',
      66: 'COLOR',
      70: 'DESC_KEY',
      71: '=',
      72: 'DESC_KEY_OPTS',
      74: 'DESC_KEY_AXES',
      77: 'HEX',
      78: 'BOOL',
      82: 'CLEAR',
      83: 'FILE_LIST',
      84: 'FILE_REGISTER',
      85: 'FILE_DELETE',
      86: 'PRESET_ADD',
      87: 'PRESET_DELETE',
      88: 'PRESET_UPDATE',
      89: 'PRESET_RENAME',
      90: 'PRESET_OPEN',
      91: 'CREATE_SCENARIO',
      92: 'RESET_SCENARIO',
      93: 'DELETE_SCENARIO',
      94: 'ADD_SCENARIO_ITEM',
      95: 'LIST_SCENARIO',
      96: 'PDB_KEY',
      97: 'DELAY_KEY',
      98: 'PRST_KEY',
      99: 'DESCRIPTION_KEY',
      101: '.',
      103: '/'
    },
    productions_: [0, [3, 2], [3, 1], [4, 1], [4, 1], [4, 2], [4, 1], [4, 2], [4, 1], [4, 1], [4, 2], [4, 2], [4, 3], [4, 3], [4, 1], [4, 1], [4, 1], [4, 1], [4, 2], [4, 1], [4, 1], [4, 2], [4, 2], [4, 2], [4, 2], [4, 1], [4, 2], [4, 2], [4, 2], [4, 4], [4, 2], [4, 6], [4, 2], [4, 1], [4, 1], [4, 1], [4, 2], [4, 2], [4, 1], [4, 2], [4, 1], [4, 2], [4, 2], [4, 2], [4, 1], [4, 2], [4, 1], [4, 1], [4, 3], [4, 3], [4, 4], [4, 4], [4, 1], [4, 2], [50, 1], [50, 2], [50, 2], [50, 3], [50, 3], [51, 1], [51, 2], [51, 3], [12, 2], [12, 2], [12, 2], [21, 1], [21, 2], [21, 2], [21, 3], [22, 2], [22, 3], [39, 2], [39, 3], [40, 2], [40, 3], [24, 1], [24, 1], [63, 1], [63, 2], [63, 3], [63, 4], [67, 1], [67, 1], [67, 2], [68, 3], [69, 3], [47, 1], [47, 2], [73, 2], [53, 1], [53, 2], [75, 3], [16, 1], [16, 1], [16, 1], [16, 1], [16, 1], [79, 1], [79, 1], [32, 1], [32, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [80, 1], [81, 1], [81, 1], [81, 1], [81, 1], [81, 1], [81, 1], [81, 1], [100, 1], [100, 1], [76, 1], [76, 3], [76, 3], [10, 1], [10, 1], [10, 3], [10, 3], [10, 3], [60, 1], [102, 1], [102, 3], [104, 1], [104, 1]],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate
    , $$
    , _$
    ) {
      var $0 = $$.length - 1;
      switch (yystate) {
        case 1:
          return $$[$0 - 1];
        case 3:
          this.$ = yy.miew.reset(false);
          yy.ClearContext();
          yy.miew.resetReps('empty');
          break;
        case 4:
          this.$ = yy.miew.rebuild();
          break;
        case 5:
          this.$ = yy.miew.rebuildAll();
          yy.miew.rebuild();
          break;
        case 6:
          this.$ = yy.echo(yy.utils.help().toString());
          break;
        case 7:
          this.$ = yy.echo(yy.utils.help($$[$0]).toString());
          break;
        case 8:
          this.$ = yy.miew.motm();
          break;
        case 10:
        case 11:
          this.$ = yy.utils.propagateProp($$[$0]);
          yy.echo(yy.miew.get($$[$0]).toString());
          break;
        case 12:
        case 13:
          this.$ = yy.miew.set($$[$0 - 1], yy.utils.propagateProp($$[$0 - 1], $$[$0]));
          break;
        case 14:
          this.$ = yy.miew.saveSettings();
          break;
        case 15:
          this.$ = yy.miew.restoreSettings();
          break;
        case 16:
          this.$ = yy.miew.resetSettings();
          break;
        case 17:
          this.$ = yy.miew.resetReps();
          break;
        case 18:
          this.$ = yy.miew.applyPreset($$[$0]);
          break;
        case 21:
          this.$ = yy.miew.repRemove($$[$0]);
          yy.representations.remove($$[$0]);
          break;
        case 22:
          this.$ = yy.miew.repHide($$[$0]);
          break;
        case 23:
          this.$ = yy.miew.repHide($$[$0], false);
          break;
        case 24:
          this.$ = yy.echo(yy.utils.listRep(yy.miew, yy.representations, $$[$0], '-e'));
          break;
        case 25:
          this.$ = yy.echo(yy.utils.list(yy.miew, yy.representations));
          break;
        case 26:
          this.$ = yy.echo(yy.utils.list(yy.miew, yy.representations, $$[$0]));
          break;
        case 27:
          this.$ = yy.echo(yy.utils.listSelector(yy.miew, yy.Context));
          break;
        case 28:
          this.$ = yy.miew.select(yy.utils.checkArg($$[$0 - 1].toLowerCase(), $$[$0], true));
          break;
        case 29:
          this.$ = yy.Context[$$[$0].toLowerCase()] = yy.utils.checkArg($$[$0 - 3].toLowerCase(), $$[$0 - 2], true);
          yy.miew.select(yy.Context[$$[$0].toLowerCase()]);
          break;
        case 30:
          this.$ = yy.miew.rep(yy.miew.repCurrent(), {
            selector: yy.utils.checkArg($$[$0 - 1].toLowerCase(), $$[$0])
          });
          break;
        case 31:
          this.$ = yy.Context[$$[$0].toLowerCase()] = yy.miew.within(yy.utils.checkArg('select', $$[$0 - 2], true), Number($$[$0 - 4]));
          break;
        case 32:
          this.$ = yy.miew.rep(yy.miew.repCurrent(), {
            material: yy.utils.checkArg($$[$0 - 1].toLowerCase(), $$[$0].toUpperCase())
          });
          break;
        case 35:
          this.$ = yy.echo(yy.miew.view());
          break;
        case 36:
        case 37:
          this.$ = yy.miew.view($$[$0]);
          break;
        case 38:
          this.$ = yy.echo(yy.miew.changeUnit());
          break;
        case 39:
          this.$ = yy.echo(yy.miew.changeUnit($$[$0]));
          break;
        case 40:
          this.$ = yy.miew.dssp();
          break;
        case 41:
          this.$ = yy.miew.scale($$[$0]);
          break;
        case 42:
          for (var i = 0, n = $$[$0].length; i < n; i++) {
            yy.miew.rotate($$[$0][i]['x'] * Math.PI / 180.0, $$[$0][i]['y'] * Math.PI / 180.0, $$[$0][i]['z'] * Math.PI / 180.0);
          }
          break;
        case 43:
          for (var i = 0, n = $$[$0].length; i < n; i++) {
            yy.miew.translate($$[$0][i]['x'] || 0, $$[$0][i]['y'] || 0, $$[$0][i]['z'] || 0);
          }
          break;
        case 44:
          this.$ = yy.miew.center();
          break;
        case 45:
          this.$ = yy.miew.center($$[$0]);
          break;
        case 48:
        case 49:
          this.$ = yy.miew.addObject({
            type: 'line',
            params: [$$[$0 - 1], $$[$0]]
          }, true);
          break;
        case 50:
        case 51:
          this.$ = yy.miew.addObject({
            type: 'line',
            params: [$$[$0 - 2], $$[$0 - 1]],
            opts: $$[$0].toJSO(yy.utils, 'objects', 'line')
          }, true);
          break;
        case 52:
          this.$ = yy.echo(yy.utils.listObjs(yy.miew));
          break;
        case 53:
          this.$ = yy.miew.removeObject($$[$0]);
          break;
        case 54:
          this.$ = yy.echo(yy.miew.getURL({
            view: false,
            settings: false
          }));
          break;
        case 55:
          this.$ = yy.echo(yy.miew.getURL({
            view: false,
            settings: true
          }));
          break;
        case 56:
          this.$ = yy.echo(yy.miew.getURL({
            view: true,
            settings: false
          }));
          break;
        case 57:
        case 58:
          this.$ = yy.echo(yy.miew.getURL({
            view: true,
            settings: true
          }));
          break;
        case 59:
          this.$ = yy.miew.screenshotSave();
          break;
        case 60:
          this.$ = yy.miew.screenshotSave('', Number($$[$0]));
          break;
        case 61:
          this.$ = yy.miew.screenshotSave('', Number($$[$0 - 1]), Number($$[$0]));
          break;
        case 62:
        case 63:
        case 64:
          this.$ = yy.utils.load(yy.miew, $$[$0]);
          yy.representations.clear();
          break;
        case 65:
          this.$ = yy.echo(yy.representations.add(yy.miew.repAdd()));
          break;
        case 66:
          this.$ = yy.echo(yy.representations.add($$[$0], yy.miew.repAdd()));
          break;
        case 67:
          this.$ = yy.echo(yy.representations.add(yy.miew.repAdd($$[$0])));
          break;
        case 68:
          this.$ = yy.echo(yy.representations.add($$[$0 - 1], yy.miew.repAdd($$[$0])));
          break;
        case 69:
          this.$ = yy.miew.rep($$[$0]);
          yy.miew.repCurrent($$[$0]);
          break;
        case 70:
          this.$ = yy.miew.rep($$[$0 - 1], $$[$0]);
          yy.miew.repCurrent($$[$0 - 1]);
          break;
        case 71:
          this.$ = yy.miew.rep(yy.miew.repCurrent(), {
            mode: yy.utils.checkArg($$[$0 - 1].toLowerCase(), $$[$0].toUpperCase())
          });
          break;
        case 72:
          this.$ = yy.miew.rep(yy.miew.repCurrent(), {
            mode: new Array(yy.utils.checkArg($$[$0 - 2].toLowerCase(), $$[$0 - 1].toUpperCase()), $$[$0].toJSO(yy.utils, $$[$0 - 2], $$[$0 - 1].toUpperCase()))
          });
          break;
        case 73:
          this.$ = yy.miew.rep(yy.miew.repCurrent(), {
            colorer: yy.utils.checkArg($$[$0 - 1].toLowerCase(), $$[$0].toUpperCase())
          });
          break;
        case 74:
          this.$ = yy.miew.rep(yy.miew.repCurrent(), {
            colorer: new Array(yy.utils.checkArg($$[$0 - 2].toLowerCase(), $$[$0 - 1].toUpperCase()), $$[$0].toJSO(yy.utils, $$[$0 - 2], $$[$0 - 1].toUpperCase()))
          });
          break;
        case 75:
          this.$ = Number(yy.representations.get($$[$0]));
          break;
        case 76:
        case 92:
          this.$ = Number($$[$0]);
          break;
        case 77:
          this.$ = $$[$0];
          break;
        case 78:
          this.$ = yy.assign($$[$0 - 1], $$[$0]);
          break;
        case 79:
          this.$ = yy.assign($$[$0 - 2], $$[$0 - 1], $$[$0]);
          break;
        case 80:
          this.$ = yy.assign($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0]);
          break;
        case 81:
        case 82:
          this.$ = yy.CreateObjectPair($$[$0].key, $$[$0].val);
          break;
        case 83:
          this.$ = yy.CreateObjectPair($$[$0 - 1].key, new Array($$[$0 - 1].val, $$[$0].toJSO(yy.utils, $$[$0 - 1].key, $$[$0 - 1].val)));
          break;
        case 84:
        case 85:
          this.$ = Object.create({
            key: yy.keyRemap($$[$0 - 2]),
            val: yy.utils.checkArg($$[$0 - 2], $$[$0])
          });
          break;
        case 86:
          this.$ = [$$[$0]];
          break;
        case 87:
          this.$ = $$[$0 - 1].concat($$[$0]);
          break;
        case 88:
          this.$ = yy.CreateObjectPair($$[$0 - 1].toLowerCase(), Number($$[$0]));
          break;
        case 89:
          this.$ = new yy.ArgList($$[$0]);
          break;
        case 90:
          this.$ = $$[$0 - 1].append($$[$0]);
          break;
        case 91:
          this.$ = new yy.Arg($$[$0 - 2], $$[$0]);
          break;
        case 93:
          this.$ = parseInt($$[$0]);
          break;
        case 94:
          this.$ = JSON.parse($$[$0]);
          break;
        case 95:
        case 96:
          this.$ = String($$[$0]);
          break;
        case 157:
        case 158:
        case 161:
        case 162:
        case 163:
          this.$ = $$[$0 - 2] + $$[$0 - 1] + $$[$0];
          break;
        case 166:
          this.$ = $$[$0 - 2] = $$[$0 - 2] + $$[$0 - 1] + $$[$0];
          break;
      }
    },
    table: [{
      3: 1,
      4: 2,
      5: [1, 3],
      6: [1, 4],
      7: [1, 5],
      9: [1, 6],
      11: [1, 7],
      12: 8,
      13: [1, 9],
      15: [1, 10],
      17: [1, 11],
      18: [1, 12],
      19: [1, 13],
      20: [1, 14],
      21: 15,
      22: 16,
      23: [1, 17],
      25: [1, 18],
      26: [1, 19],
      27: [1, 20],
      30: [1, 21],
      33: [1, 22],
      34: [1, 23],
      37: [1, 24],
      39: 25,
      40: 26,
      41: [1, 27],
      43: [1, 28],
      44: [1, 29],
      45: [1, 30],
      46: [1, 31],
      48: [1, 32],
      49: [1, 33],
      50: 34,
      51: 35,
      52: [1, 36],
      54: [1, 37],
      55: [1, 38],
      56: [1, 44],
      58: [1, 45],
      59: [1, 39],
      62: [1, 40],
      64: [1, 41],
      65: [1, 42],
      66: [1, 43]
    }, {
      1: [3]
    }, {
      5: [1, 46]
    }, {
      1: [2, 2]
    }, {
      5: [2, 3]
    }, {
      5: [2, 4],
      8: [1, 47]
    }, {
      5: [2, 6],
      6: $V0,
      7: $V1,
      9: $V2,
      10: 48,
      13: $V3,
      15: $V4,
      17: $V5,
      18: $V6,
      19: $V7,
      20: $V8,
      23: $V9,
      25: $Va,
      26: $Vb,
      27: $Vc,
      30: $Vd,
      33: $Ve,
      34: $Vf,
      37: $Vg,
      38: $Vh,
      41: $Vi,
      43: $Vj,
      45: $Vk,
      46: $Vl,
      49: $Vm,
      52: $Vn,
      54: $Vo,
      55: $Vp,
      56: $Vq,
      58: $Vr,
      59: $Vs,
      62: $Vt,
      64: $Vu,
      65: $Vv,
      66: $Vw,
      70: $Vx,
      72: $Vy,
      74: $Vz,
      79: 49,
      80: 52,
      81: 50,
      82: $VA,
      83: $VB,
      84: $VC,
      85: $VD,
      86: $VE,
      87: $VF,
      88: $VG,
      89: $VH,
      90: $VI,
      91: $VJ,
      92: $VK,
      93: $VL,
      94: $VM,
      95: $VN,
      96: $VO,
      97: $VP,
      98: $VQ,
      99: $VR
    }, {
      5: [2, 8]
    }, {
      5: [2, 9]
    }, {
      6: $V0,
      7: $V1,
      9: $V2,
      10: 106,
      13: $V3,
      14: [1, 107],
      15: $V4,
      17: $V5,
      18: $V6,
      19: $V7,
      20: $V8,
      23: $V9,
      25: $Va,
      26: $Vb,
      27: $Vc,
      30: $Vd,
      33: $Ve,
      34: $Vf,
      37: $Vg,
      38: $Vh,
      41: $Vi,
      43: $Vj,
      45: $Vk,
      46: $Vl,
      49: $Vm,
      52: $Vn,
      54: $Vo,
      55: $Vp,
      56: $Vq,
      58: $Vr,
      59: $Vs,
      62: $Vt,
      64: $Vu,
      65: $Vv,
      66: $Vw,
      70: $Vx,
      72: $Vy,
      74: $Vz,
      79: 49,
      80: 52,
      81: 50,
      82: $VA,
      83: $VB,
      84: $VC,
      85: $VD,
      86: $VE,
      87: $VF,
      88: $VG,
      89: $VH,
      90: $VI,
      91: $VJ,
      92: $VK,
      93: $VL,
      94: $VM,
      95: $VN,
      96: $VO,
      97: $VP,
      98: $VQ,
      99: $VR
    }, {
      6: $V0,
      7: $V1,
      9: $V2,
      10: 108,
      13: $V3,
      14: [1, 109],
      15: $V4,
      17: $V5,
      18: $V6,
      19: $V7,
      20: $V8,
      23: $V9,
      25: $Va,
      26: $Vb,
      27: $Vc,
      30: $Vd,
      33: $Ve,
      34: $Vf,
      37: $Vg,
      38: $Vh,
      41: $Vi,
      43: $Vj,
      45: $Vk,
      46: $Vl,
      49: $Vm,
      52: $Vn,
      54: $Vo,
      55: $Vp,
      56: $Vq,
      58: $Vr,
      59: $Vs,
      62: $Vt,
      64: $Vu,
      65: $Vv,
      66: $Vw,
      70: $Vx,
      72: $Vy,
      74: $Vz,
      79: 49,
      80: 52,
      81: 50,
      82: $VA,
      83: $VB,
      84: $VC,
      85: $VD,
      86: $VE,
      87: $VF,
      88: $VG,
      89: $VH,
      90: $VI,
      91: $VJ,
      92: $VK,
      93: $VL,
      94: $VM,
      95: $VN,
      96: $VO,
      97: $VP,
      98: $VQ,
      99: $VR
    }, {
      5: [2, 14]
    }, {
      5: [2, 15]
    }, {
      5: [2, 16]
    }, {
      5: [2, 17],
      14: $VS,
      16: 110,
      35: $VT,
      38: $VU,
      77: $VV,
      78: $VW
    }, {
      5: [2, 19]
    }, {
      5: [2, 20]
    }, {
      24: 116,
      35: $VX,
      38: $VY
    }, {
      24: 119,
      35: $VX,
      38: $VY
    }, {
      24: 120,
      35: $VX,
      38: $VY
    }, {
      5: [2, 25],
      24: 121,
      28: [1, 122],
      29: [1, 123],
      35: $VX,
      38: $VY
    }, {
      14: [1, 124]
    }, {
      14: [1, 125]
    }, {
      35: [1, 126]
    }, {
      38: [1, 127]
    }, {
      5: [2, 33]
    }, {
      5: [2, 34]
    }, {
      5: [2, 35],
      14: [1, 128],
      42: [1, 129]
    }, {
      5: [2, 38],
      35: [1, 130]
    }, {
      5: [2, 40]
    }, {
      35: [1, 131]
    }, {
      47: 132,
      73: 133,
      74: $VZ
    }, {
      47: 135,
      73: 133,
      74: $VZ
    }, {
      5: [2, 44],
      14: [1, 136]
    }, {
      5: [2, 46]
    }, {
      5: [2, 47]
    }, {
      6: $V0,
      7: $V1,
      9: $V2,
      10: 138,
      13: $V3,
      14: [1, 137],
      15: $V4,
      17: $V5,
      18: $V6,
      19: $V7,
      20: $V8,
      23: $V9,
      25: $Va,
      26: $Vb,
      27: $Vc,
      30: $Vd,
      33: $Ve,
      34: $Vf,
      37: $Vg,
      38: $Vh,
      41: $Vi,
      43: $Vj,
      45: $Vk,
      46: $Vl,
      49: $Vm,
      52: $Vn,
      54: $Vo,
      55: $Vp,
      56: $Vq,
      58: $Vr,
      59: $Vs,
      62: $Vt,
      64: $Vu,
      65: $Vv,
      66: $Vw,
      70: $Vx,
      72: $Vy,
      74: $Vz,
      79: 49,
      80: 52,
      81: 50,
      82: $VA,
      83: $VB,
      84: $VC,
      85: $VD,
      86: $VE,
      87: $VF,
      88: $VG,
      89: $VH,
      90: $VI,
      91: $VJ,
      92: $VK,
      93: $VL,
      94: $VM,
      95: $VN,
      96: $VO,
      97: $VP,
      98: $VQ,
      99: $VR
    }, {
      5: [2, 52]
    }, {
      35: [1, 139]
    }, {
      14: [1, 143],
      38: [1, 141],
      60: 140,
      61: [1, 142]
    }, {
      5: [2, 65],
      38: [1, 144],
      63: 145,
      67: 146,
      68: 147,
      69: 148,
      70: $V_,
      72: $V$
    }, {
      24: 151,
      35: $VX,
      38: $VY
    }, {
      38: [1, 152]
    }, {
      38: [1, 153]
    }, {
      5: [2, 54],
      29: [1, 154],
      57: [1, 155]
    }, {
      5: [2, 59],
      35: [1, 156]
    }, {
      1: [2, 1]
    }, {
      5: [2, 5]
    }, {
      5: [2, 7],
      101: $V01
    }, o($V11, [2, 159]), o($V11, [2, 160]), o($V21, [2, 97]), o($V21, [2, 98]), o($V11, [2, 147]), o($V11, [2, 148]), o($V11, [2, 149]), o($V11, [2, 150]), o($V11, [2, 151]), o($V11, [2, 152]), o($V11, [2, 153]), o($V21, [2, 101]), o($V21, [2, 102]), o($V21, [2, 103]), o($V21, [2, 104]), o($V21, [2, 105]), o($V21, [2, 106]), o($V21, [2, 107]), o($V21, [2, 108]), o($V21, [2, 109]), o($V21, [2, 110]), o($V21, [2, 111]), o($V21, [2, 112]), o($V21, [2, 113]), o($V21, [2, 114]), o($V21, [2, 115]), o($V21, [2, 116]), o($V21, [2, 117]), o($V21, [2, 118]), o($V21, [2, 119]), o($V21, [2, 120]), o($V21, [2, 121]), o($V21, [2, 122]), o($V21, [2, 123]), o($V21, [2, 124]), o($V21, [2, 125]), o($V21, [2, 126]), o($V21, [2, 127]), o($V21, [2, 128]), o($V21, [2, 129]), o($V21, [2, 130]), o($V21, [2, 131]), o($V21, [2, 132]), o($V21, [2, 133]), o($V21, [2, 134]), o($V21, [2, 135]), o($V21, [2, 136]), o($V21, [2, 137]), o($V21, [2, 138]), o($V21, [2, 139]), o($V21, [2, 140]), o($V21, [2, 141]), o($V21, [2, 142]), o($V21, [2, 143]), o($V21, [2, 144]), o($V21, [2, 145]), o($V21, [2, 146]), {
      5: [2, 10],
      101: $V01
    }, {
      5: [2, 11]
    }, {
      14: $VS,
      16: 158,
      35: $VT,
      38: $VU,
      77: $VV,
      78: $VW,
      101: $V01
    }, {
      14: $VS,
      16: 159,
      35: $VT,
      38: $VU,
      77: $VV,
      78: $VW
    }, {
      5: [2, 18]
    }, o($V31, [2, 92]), o($V31, [2, 93]), o($V31, [2, 94]), o($V31, [2, 95]), o($V31, [2, 96]), {
      5: [2, 21]
    }, o($V41, [2, 75]), o($V41, [2, 76]), {
      5: [2, 22]
    }, {
      5: [2, 23]
    }, {
      5: [2, 24]
    }, {
      5: [2, 26]
    }, {
      5: [2, 27]
    }, {
      5: [2, 28],
      31: [1, 160]
    }, {
      5: [2, 30]
    }, {
      36: [1, 161]
    }, {
      5: [2, 32]
    }, {
      5: [2, 36]
    }, {
      5: [2, 37]
    }, {
      5: [2, 39]
    }, {
      5: [2, 41]
    }, {
      5: [2, 42],
      73: 162,
      74: $VZ
    }, o($V51, [2, 86]), {
      35: [1, 163]
    }, {
      5: [2, 43],
      73: 162,
      74: $VZ
    }, {
      5: [2, 45]
    }, {
      14: [1, 164]
    }, {
      6: $V0,
      7: $V1,
      9: $V2,
      10: 165,
      13: $V3,
      15: $V4,
      17: $V5,
      18: $V6,
      19: $V7,
      20: $V8,
      23: $V9,
      25: $Va,
      26: $Vb,
      27: $Vc,
      30: $Vd,
      33: $Ve,
      34: $Vf,
      37: $Vg,
      38: $Vh,
      41: $Vi,
      43: $Vj,
      45: $Vk,
      46: $Vl,
      49: $Vm,
      52: $Vn,
      54: $Vo,
      55: $Vp,
      56: $Vq,
      58: $Vr,
      59: $Vs,
      62: $Vt,
      64: $Vu,
      65: $Vv,
      66: $Vw,
      70: $Vx,
      72: $Vy,
      74: $Vz,
      79: 49,
      80: 52,
      81: 50,
      82: $VA,
      83: $VB,
      84: $VC,
      85: $VD,
      86: $VE,
      87: $VF,
      88: $VG,
      89: $VH,
      90: $VI,
      91: $VJ,
      92: $VK,
      93: $VL,
      94: $VM,
      95: $VN,
      96: $VO,
      97: $VP,
      98: $VQ,
      99: $VR,
      101: $V01
    }, {
      5: [2, 53]
    }, {
      5: [2, 62]
    }, {
      5: [2, 63]
    }, {
      5: [2, 64]
    }, {
      5: [2, 164]
    }, {
      5: [2, 66],
      63: 166,
      67: 146,
      68: 147,
      69: 148,
      70: $V_,
      72: $V$
    }, {
      5: [2, 67]
    }, {
      5: [2, 77],
      67: 167,
      68: 147,
      69: 148,
      70: $V_,
      72: $V$
    }, o($V41, [2, 81]), o($V41, [2, 82], {
      80: 52,
      53: 168,
      75: 169,
      76: 170,
      79: 171,
      6: $V0,
      7: $V1,
      9: $V2,
      13: $V3,
      15: $V4,
      17: $V5,
      18: $V6,
      19: $V7,
      20: $V8,
      23: $V9,
      25: $Va,
      26: $Vb,
      27: $Vc,
      30: $Vd,
      33: $Ve,
      34: $Vf,
      37: $Vg,
      38: $Vh,
      41: $Vi,
      43: $Vj,
      45: $Vk,
      46: $Vl,
      49: $Vm,
      52: $Vn,
      54: $Vo,
      55: $Vp,
      56: $Vq,
      58: $Vr,
      59: $Vs,
      62: $Vt,
      64: $Vu,
      65: $Vv,
      66: $Vw,
      82: $VA,
      83: $VB,
      84: $VC,
      85: $VD,
      86: $VE,
      87: $VF,
      88: $VG,
      89: $VH,
      90: $VI,
      91: $VJ,
      92: $VK,
      93: $VL,
      94: $VM,
      95: $VN
    }), {
      71: [1, 172]
    }, {
      71: [1, 173]
    }, {
      5: [2, 69],
      63: 174,
      67: 146,
      68: 147,
      69: 148,
      70: $V_,
      72: $V$
    }, {
      5: [2, 71],
      6: $V0,
      7: $V1,
      9: $V2,
      13: $V3,
      15: $V4,
      17: $V5,
      18: $V6,
      19: $V7,
      20: $V8,
      23: $V9,
      25: $Va,
      26: $Vb,
      27: $Vc,
      30: $Vd,
      33: $Ve,
      34: $Vf,
      37: $Vg,
      38: $Vh,
      41: $Vi,
      43: $Vj,
      45: $Vk,
      46: $Vl,
      49: $Vm,
      52: $Vn,
      53: 175,
      54: $Vo,
      55: $Vp,
      56: $Vq,
      58: $Vr,
      59: $Vs,
      62: $Vt,
      64: $Vu,
      65: $Vv,
      66: $Vw,
      75: 169,
      76: 170,
      79: 171,
      80: 52,
      82: $VA,
      83: $VB,
      84: $VC,
      85: $VD,
      86: $VE,
      87: $VF,
      88: $VG,
      89: $VH,
      90: $VI,
      91: $VJ,
      92: $VK,
      93: $VL,
      94: $VM,
      95: $VN
    }, {
      5: [2, 73],
      6: $V0,
      7: $V1,
      9: $V2,
      13: $V3,
      15: $V4,
      17: $V5,
      18: $V6,
      19: $V7,
      20: $V8,
      23: $V9,
      25: $Va,
      26: $Vb,
      27: $Vc,
      30: $Vd,
      33: $Ve,
      34: $Vf,
      37: $Vg,
      38: $Vh,
      41: $Vi,
      43: $Vj,
      45: $Vk,
      46: $Vl,
      49: $Vm,
      52: $Vn,
      53: 176,
      54: $Vo,
      55: $Vp,
      56: $Vq,
      58: $Vr,
      59: $Vs,
      62: $Vt,
      64: $Vu,
      65: $Vv,
      66: $Vw,
      75: 169,
      76: 170,
      79: 171,
      80: 52,
      82: $VA,
      83: $VB,
      84: $VC,
      85: $VD,
      86: $VE,
      87: $VF,
      88: $VG,
      89: $VH,
      90: $VI,
      91: $VJ,
      92: $VK,
      93: $VL,
      94: $VM,
      95: $VN
    }, {
      5: [2, 55],
      57: [1, 177]
    }, {
      5: [2, 56],
      29: [1, 178]
    }, {
      5: [2, 60],
      35: [1, 179]
    }, {
      6: $V0,
      7: $V1,
      9: $V2,
      13: $V3,
      15: $V4,
      17: $V5,
      18: $V6,
      19: $V7,
      20: $V8,
      23: $V9,
      25: $Va,
      26: $Vb,
      27: $Vc,
      30: $Vd,
      33: $Ve,
      34: $Vf,
      35: [1, 181],
      37: $Vg,
      38: $Vh,
      41: $Vi,
      43: $Vj,
      45: $Vk,
      46: $Vl,
      49: $Vm,
      52: $Vn,
      54: $Vo,
      55: $Vp,
      56: $Vq,
      58: $Vr,
      59: $Vs,
      62: $Vt,
      64: $Vu,
      65: $Vv,
      66: $Vw,
      70: $Vx,
      72: $Vy,
      74: $Vz,
      79: 180,
      80: 52,
      81: 182,
      82: $VA,
      83: $VB,
      84: $VC,
      85: $VD,
      86: $VE,
      87: $VF,
      88: $VG,
      89: $VH,
      90: $VI,
      91: $VJ,
      92: $VK,
      93: $VL,
      94: $VM,
      95: $VN,
      96: $VO,
      97: $VP,
      98: $VQ,
      99: $VR
    }, {
      5: [2, 12]
    }, {
      5: [2, 13]
    }, {
      6: $V0,
      7: $V1,
      9: $V2,
      13: $V3,
      15: $V4,
      17: $V5,
      18: $V6,
      19: $V7,
      20: $V8,
      23: $V9,
      25: $Va,
      26: $Vb,
      27: $Vc,
      30: $Vd,
      32: 183,
      33: $Ve,
      34: $Vf,
      37: $Vg,
      38: $Vh,
      41: $Vi,
      43: $Vj,
      45: $Vk,
      46: $Vl,
      49: $Vm,
      52: $Vn,
      54: $Vo,
      55: $Vp,
      56: $Vq,
      58: $Vr,
      59: $Vs,
      62: $Vt,
      64: $Vu,
      65: $Vv,
      66: $Vw,
      70: $Vx,
      72: $Vy,
      74: $Vz,
      79: 184,
      80: 52,
      81: 185,
      82: $VA,
      83: $VB,
      84: $VC,
      85: $VD,
      86: $VE,
      87: $VF,
      88: $VG,
      89: $VH,
      90: $VI,
      91: $VJ,
      92: $VK,
      93: $VL,
      94: $VM,
      95: $VN,
      96: $VO,
      97: $VP,
      98: $VQ,
      99: $VR
    }, {
      14: [1, 186]
    }, o($V51, [2, 87]), o($V51, [2, 88]), {
      5: [2, 48],
      6: $V0,
      7: $V1,
      9: $V2,
      13: $V3,
      15: $V4,
      17: $V5,
      18: $V6,
      19: $V7,
      20: $V8,
      23: $V9,
      25: $Va,
      26: $Vb,
      27: $Vc,
      30: $Vd,
      33: $Ve,
      34: $Vf,
      37: $Vg,
      38: $Vh,
      41: $Vi,
      43: $Vj,
      45: $Vk,
      46: $Vl,
      49: $Vm,
      52: $Vn,
      53: 187,
      54: $Vo,
      55: $Vp,
      56: $Vq,
      58: $Vr,
      59: $Vs,
      62: $Vt,
      64: $Vu,
      65: $Vv,
      66: $Vw,
      75: 169,
      76: 170,
      79: 171,
      80: 52,
      82: $VA,
      83: $VB,
      84: $VC,
      85: $VD,
      86: $VE,
      87: $VF,
      88: $VG,
      89: $VH,
      90: $VI,
      91: $VJ,
      92: $VK,
      93: $VL,
      94: $VM,
      95: $VN
    }, {
      5: [2, 49],
      6: $V0,
      7: $V1,
      9: $V2,
      13: $V3,
      15: $V4,
      17: $V5,
      18: $V6,
      19: $V7,
      20: $V8,
      23: $V9,
      25: $Va,
      26: $Vb,
      27: $Vc,
      30: $Vd,
      33: $Ve,
      34: $Vf,
      37: $Vg,
      38: $Vh,
      41: $Vi,
      43: $Vj,
      45: $Vk,
      46: $Vl,
      49: $Vm,
      52: $Vn,
      53: 188,
      54: $Vo,
      55: $Vp,
      56: $Vq,
      58: $Vr,
      59: $Vs,
      62: $Vt,
      64: $Vu,
      65: $Vv,
      66: $Vw,
      75: 169,
      76: 170,
      79: 171,
      80: 52,
      82: $VA,
      83: $VB,
      84: $VC,
      85: $VD,
      86: $VE,
      87: $VF,
      88: $VG,
      89: $VH,
      90: $VI,
      91: $VJ,
      92: $VK,
      93: $VL,
      94: $VM,
      95: $VN,
      101: $V01
    }, {
      5: [2, 68]
    }, {
      5: [2, 78],
      67: 189,
      68: 147,
      69: 148,
      70: $V_,
      72: $V$
    }, o($V41, [2, 83], {
      80: 52,
      76: 170,
      79: 171,
      75: 190,
      6: $V0,
      7: $V1,
      9: $V2,
      13: $V3,
      15: $V4,
      17: $V5,
      18: $V6,
      19: $V7,
      20: $V8,
      23: $V9,
      25: $Va,
      26: $Vb,
      27: $Vc,
      30: $Vd,
      33: $Ve,
      34: $Vf,
      37: $Vg,
      38: $Vh,
      41: $Vi,
      43: $Vj,
      45: $Vk,
      46: $Vl,
      49: $Vm,
      52: $Vn,
      54: $Vo,
      55: $Vp,
      56: $Vq,
      58: $Vr,
      59: $Vs,
      62: $Vt,
      64: $Vu,
      65: $Vv,
      66: $Vw,
      82: $VA,
      83: $VB,
      84: $VC,
      85: $VD,
      86: $VE,
      87: $VF,
      88: $VG,
      89: $VH,
      90: $VI,
      91: $VJ,
      92: $VK,
      93: $VL,
      94: $VM,
      95: $VN
    }), o($V31, [2, 89]), {
      71: [1, 191],
      101: [1, 192]
    }, o($V61, [2, 156]), {
      14: $VS,
      16: 193,
      35: $VT,
      38: $VU,
      77: $VV,
      78: $VW
    }, {
      14: $VS,
      16: 194,
      35: $VT,
      38: $VU,
      77: $VV,
      78: $VW
    }, {
      5: [2, 70]
    }, {
      5: [2, 72],
      6: $V0,
      7: $V1,
      9: $V2,
      13: $V3,
      15: $V4,
      17: $V5,
      18: $V6,
      19: $V7,
      20: $V8,
      23: $V9,
      25: $Va,
      26: $Vb,
      27: $Vc,
      30: $Vd,
      33: $Ve,
      34: $Vf,
      37: $Vg,
      38: $Vh,
      41: $Vi,
      43: $Vj,
      45: $Vk,
      46: $Vl,
      49: $Vm,
      52: $Vn,
      54: $Vo,
      55: $Vp,
      56: $Vq,
      58: $Vr,
      59: $Vs,
      62: $Vt,
      64: $Vu,
      65: $Vv,
      66: $Vw,
      75: 190,
      76: 170,
      79: 171,
      80: 52,
      82: $VA,
      83: $VB,
      84: $VC,
      85: $VD,
      86: $VE,
      87: $VF,
      88: $VG,
      89: $VH,
      90: $VI,
      91: $VJ,
      92: $VK,
      93: $VL,
      94: $VM,
      95: $VN
    }, {
      5: [2, 74],
      6: $V0,
      7: $V1,
      9: $V2,
      13: $V3,
      15: $V4,
      17: $V5,
      18: $V6,
      19: $V7,
      20: $V8,
      23: $V9,
      25: $Va,
      26: $Vb,
      27: $Vc,
      30: $Vd,
      33: $Ve,
      34: $Vf,
      37: $Vg,
      38: $Vh,
      41: $Vi,
      43: $Vj,
      45: $Vk,
      46: $Vl,
      49: $Vm,
      52: $Vn,
      54: $Vo,
      55: $Vp,
      56: $Vq,
      58: $Vr,
      59: $Vs,
      62: $Vt,
      64: $Vu,
      65: $Vv,
      66: $Vw,
      75: 190,
      76: 170,
      79: 171,
      80: 52,
      82: $VA,
      83: $VB,
      84: $VC,
      85: $VD,
      86: $VE,
      87: $VF,
      88: $VG,
      89: $VH,
      90: $VI,
      91: $VJ,
      92: $VK,
      93: $VL,
      94: $VM,
      95: $VN
    }, {
      5: [2, 57]
    }, {
      5: [2, 58]
    }, {
      5: [2, 61]
    }, o($V11, [2, 161]), o($V11, [2, 162]), o($V11, [2, 163]), {
      5: [2, 29]
    }, {
      5: [2, 99]
    }, {
      5: [2, 100]
    }, {
      31: [1, 195]
    }, {
      5: [2, 50],
      6: $V0,
      7: $V1,
      9: $V2,
      13: $V3,
      15: $V4,
      17: $V5,
      18: $V6,
      19: $V7,
      20: $V8,
      23: $V9,
      25: $Va,
      26: $Vb,
      27: $Vc,
      30: $Vd,
      33: $Ve,
      34: $Vf,
      37: $Vg,
      38: $Vh,
      41: $Vi,
      43: $Vj,
      45: $Vk,
      46: $Vl,
      49: $Vm,
      52: $Vn,
      54: $Vo,
      55: $Vp,
      56: $Vq,
      58: $Vr,
      59: $Vs,
      62: $Vt,
      64: $Vu,
      65: $Vv,
      66: $Vw,
      75: 190,
      76: 170,
      79: 171,
      80: 52,
      82: $VA,
      83: $VB,
      84: $VC,
      85: $VD,
      86: $VE,
      87: $VF,
      88: $VG,
      89: $VH,
      90: $VI,
      91: $VJ,
      92: $VK,
      93: $VL,
      94: $VM,
      95: $VN
    }, {
      5: [2, 51],
      6: $V0,
      7: $V1,
      9: $V2,
      13: $V3,
      15: $V4,
      17: $V5,
      18: $V6,
      19: $V7,
      20: $V8,
      23: $V9,
      25: $Va,
      26: $Vb,
      27: $Vc,
      30: $Vd,
      33: $Ve,
      34: $Vf,
      37: $Vg,
      38: $Vh,
      41: $Vi,
      43: $Vj,
      45: $Vk,
      46: $Vl,
      49: $Vm,
      52: $Vn,
      54: $Vo,
      55: $Vp,
      56: $Vq,
      58: $Vr,
      59: $Vs,
      62: $Vt,
      64: $Vu,
      65: $Vv,
      66: $Vw,
      75: 190,
      76: 170,
      79: 171,
      80: 52,
      82: $VA,
      83: $VB,
      84: $VC,
      85: $VD,
      86: $VE,
      87: $VF,
      88: $VG,
      89: $VH,
      90: $VI,
      91: $VJ,
      92: $VK,
      93: $VL,
      94: $VM,
      95: $VN
    }, {
      5: [2, 79],
      67: 196,
      68: 147,
      69: 148,
      70: $V_,
      72: $V$
    }, o($V31, [2, 90]), {
      14: $VS,
      16: 197,
      35: $VT,
      38: $VU,
      77: $VV,
      78: $VW
    }, {
      6: $V0,
      7: $V1,
      9: $V2,
      13: $V3,
      15: $V4,
      17: $V5,
      18: $V6,
      19: $V7,
      20: $V8,
      23: $V9,
      25: $Va,
      26: $Vb,
      27: $Vc,
      30: $Vd,
      33: $Ve,
      34: $Vf,
      35: [1, 199],
      37: $Vg,
      38: $Vh,
      41: $Vi,
      43: $Vj,
      45: $Vk,
      46: $Vl,
      49: $Vm,
      52: $Vn,
      54: $Vo,
      55: $Vp,
      56: $Vq,
      58: $Vr,
      59: $Vs,
      62: $Vt,
      64: $Vu,
      65: $Vv,
      66: $Vw,
      79: 198,
      80: 52,
      82: $VA,
      83: $VB,
      84: $VC,
      85: $VD,
      86: $VE,
      87: $VF,
      88: $VG,
      89: $VH,
      90: $VI,
      91: $VJ,
      92: $VK,
      93: $VL,
      94: $VM,
      95: $VN
    }, o($V41, [2, 84]), o($V31, [2, 85]), {
      6: $V0,
      7: $V1,
      9: $V2,
      13: $V3,
      15: $V4,
      17: $V5,
      18: $V6,
      19: $V7,
      20: $V8,
      23: $V9,
      25: $Va,
      26: $Vb,
      27: $Vc,
      30: $Vd,
      32: 200,
      33: $Ve,
      34: $Vf,
      37: $Vg,
      38: $Vh,
      41: $Vi,
      43: $Vj,
      45: $Vk,
      46: $Vl,
      49: $Vm,
      52: $Vn,
      54: $Vo,
      55: $Vp,
      56: $Vq,
      58: $Vr,
      59: $Vs,
      62: $Vt,
      64: $Vu,
      65: $Vv,
      66: $Vw,
      70: $Vx,
      72: $Vy,
      74: $Vz,
      79: 184,
      80: 52,
      81: 185,
      82: $VA,
      83: $VB,
      84: $VC,
      85: $VD,
      86: $VE,
      87: $VF,
      88: $VG,
      89: $VH,
      90: $VI,
      91: $VJ,
      92: $VK,
      93: $VL,
      94: $VM,
      95: $VN,
      96: $VO,
      97: $VP,
      98: $VQ,
      99: $VR
    }, {
      5: [2, 80]
    }, o($V31, [2, 91]), o($V61, [2, 157]), o($V61, [2, 158]), {
      5: [2, 31]
    }],
    defaultActions: {
      3: [2, 2],
      4: [2, 3],
      7: [2, 8],
      8: [2, 9],
      11: [2, 14],
      12: [2, 15],
      13: [2, 16],
      15: [2, 19],
      16: [2, 20],
      25: [2, 33],
      26: [2, 34],
      29: [2, 40],
      34: [2, 46],
      35: [2, 47],
      37: [2, 52],
      46: [2, 1],
      47: [2, 5],
      107: [2, 11],
      110: [2, 18],
      116: [2, 21],
      119: [2, 22],
      120: [2, 23],
      121: [2, 24],
      122: [2, 26],
      123: [2, 27],
      125: [2, 30],
      127: [2, 32],
      128: [2, 36],
      129: [2, 37],
      130: [2, 39],
      131: [2, 41],
      136: [2, 45],
      139: [2, 53],
      140: [2, 62],
      141: [2, 63],
      142: [2, 64],
      143: [2, 164],
      145: [2, 67],
      158: [2, 12],
      159: [2, 13],
      166: [2, 68],
      174: [2, 70],
      177: [2, 57],
      178: [2, 58],
      179: [2, 61],
      183: [2, 29],
      184: [2, 99],
      185: [2, 100],
      196: [2, 80],
      200: [2, 31]
    },
    parseError: function parseError(str, hash) {
      if (hash.recoverable) {
        this.trace(str);
      } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
      }
    },
    parse: function parse(input) {
      var self = this,
          stack = [0],
          tstack = [],
          vstack = [null],
          lstack = [],
          table = this.table,
          yytext = '',
          yylineno = 0,
          yyleng = 0,
          TERROR = 2,
          EOF = 1;
      var args = lstack.slice.call(arguments, 1);
      var lexer = Object.create(this.lexer);
      var sharedState = {
        yy: {}
      };
      for (var k in this.yy) {
        if (Object.hasOwn(this.yy, k)) {
          sharedState.yy[k] = this.yy[k];
        }
      }
      lexer.setInput(input, sharedState.yy);
      sharedState.yy.lexer = lexer;
      sharedState.yy.parser = this;
      if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
      }
      var yyloc = lexer.yylloc;
      lstack.push(yyloc);
      var ranges = lexer.options && lexer.options.ranges;
      if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
      } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
      }
      function lex() {
        var token;
        token = tstack.pop() || lexer.lex() || EOF;
        if (typeof token !== 'number') {
          if (token instanceof Array) {
            tstack = token;
            token = tstack.pop();
          }
          token = self.symbols_[token] || token;
        }
        return token;
      }
      var symbol,
          state,
          action,
          r,
          yyval = {},
          p,
          len,
          newState,
          expected;
      while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
          action = this.defaultActions[state];
        } else {
          if (symbol === null || typeof symbol == 'undefined') {
            symbol = lex();
          }
          action = table[state] && table[state][symbol];
        }
        if (typeof action === 'undefined' || !action.length || !action[0]) {
          var errStr = '';
          expected = [];
          for (p in table[state]) {
            if (this.terminals_[p] && p > TERROR) {
              expected.push("'" + this.terminals_[p] + "'");
            }
          }
          if (lexer.showPosition) {
            errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ", got '" + (this.terminals_[symbol] || symbol) + "'";
          } else {
            errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : "'" + (this.terminals_[symbol] || symbol) + "'");
          }
          this.parseError(errStr, {
            text: lexer.match,
            token: this.terminals_[symbol] || symbol,
            line: lexer.yylineno,
            loc: yyloc,
            expected: expected
          });
        }
        if (action[0] instanceof Array && action.length > 1) {
          throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
          case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            {
              yyleng = lexer.yyleng;
              yytext = lexer.yytext;
              yylineno = lexer.yylineno;
              yyloc = lexer.yylloc;
            }
            break;
          case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
              first_line: lstack[lstack.length - (len || 1)].first_line,
              last_line: lstack[lstack.length - 1].last_line,
              first_column: lstack[lstack.length - (len || 1)].first_column,
              last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
              yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
            }
            r = this.performAction.apply(yyval, [yytext, yyleng, yylineno, sharedState.yy, action[1], vstack, lstack].concat(args));
            if (typeof r !== 'undefined') {
              return r;
            }
            if (len) {
              stack = stack.slice(0, -1 * len * 2);
              vstack = vstack.slice(0, -1 * len);
              lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
          case 3:
            return true;
        }
      }
      return true;
    }
  };
  var lexer = function () {
    var lexer = {
      EOF: 1,
      parseError: function parseError(str, hash) {
        if (this.yy.parser) {
          this.yy.parser.parseError(str, hash);
        } else {
          throw new Error(str);
        }
      },
      setInput: function setInput(input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
          first_line: 1,
          first_column: 0,
          last_line: 1,
          last_column: 0
        };
        if (this.options.ranges) {
          this.yylloc.range = [0, 0];
        }
        this.offset = 0;
        return this;
      },
      input: function input() {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
          this.yylineno++;
          this.yylloc.last_line++;
        } else {
          this.yylloc.last_column++;
        }
        if (this.options.ranges) {
          this.yylloc.range[1]++;
        }
        this._input = this._input.slice(1);
        return ch;
      },
      unput: function unput(ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);
        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);
        if (lines.length - 1) {
          this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;
        this.yylloc = {
          first_line: this.yylloc.first_line,
          last_line: this.yylineno + 1,
          first_column: this.yylloc.first_column,
          last_column: lines ? (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length : this.yylloc.first_column - len
        };
        if (this.options.ranges) {
          this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
      },
      more: function more() {
        this._more = true;
        return this;
      },
      reject: function reject() {
        if (this.options.backtrack_lexer) {
          this._backtrack = true;
        } else {
          return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
            text: '',
            token: null,
            line: this.yylineno
          });
        }
        return this;
      },
      less: function less(n) {
        this.unput(this.match.slice(n));
      },
      pastInput: function pastInput() {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...' : '') + past.substr(-20).replace(/\n/g, '');
      },
      upcomingInput: function upcomingInput() {
        var next = this.match;
        if (next.length < 20) {
          next += this._input.substr(0, 20 - next.length);
        }
        return (next.substr(0, 20) + (next.length > 20 ? '...' : '')).replace(/\n/g, '');
      },
      showPosition: function showPosition() {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join('-');
        return pre + this.upcomingInput() + '\n' + c + '^';
      },
      test_match: function test_match(match, indexed_rule) {
        var token, lines, backup;
        if (this.options.backtrack_lexer) {
          backup = {
            yylineno: this.yylineno,
            yylloc: {
              first_line: this.yylloc.first_line,
              last_line: this.last_line,
              first_column: this.yylloc.first_column,
              last_column: this.yylloc.last_column
            },
            yytext: this.yytext,
            match: this.match,
            matches: this.matches,
            matched: this.matched,
            yyleng: this.yyleng,
            offset: this.offset,
            _more: this._more,
            _input: this._input,
            yy: this.yy,
            conditionStack: this.conditionStack.slice(0),
            done: this.done
          };
          if (this.options.ranges) {
            backup.yylloc.range = this.yylloc.range.slice(0);
          }
        }
        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
          this.yylineno += lines.length;
        }
        this.yylloc = {
          first_line: this.yylloc.last_line,
          last_line: this.yylineno + 1,
          first_column: this.yylloc.last_column,
          last_column: lines ? lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
          this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
          this.done = false;
        }
        if (token) {
          return token;
        } else if (this._backtrack) {
          for (var k in backup) {
            this[k] = backup[k];
          }
          return false;
        }
        return false;
      },
      next: function next() {
        if (this.done) {
          return this.EOF;
        }
        if (!this._input) {
          this.done = true;
        }
        var token, match, tempMatch, index;
        if (!this._more) {
          this.yytext = '';
          this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
          tempMatch = this._input.match(this.rules[rules[i]]);
          if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
            match = tempMatch;
            index = i;
            if (this.options.backtrack_lexer) {
              token = this.test_match(tempMatch, rules[i]);
              if (token !== false) {
                return token;
              } else if (this._backtrack) {
                match = false;
                continue;
              } else {
                return false;
              }
            } else if (!this.options.flex) {
              break;
            }
          }
        }
        if (match) {
          token = this.test_match(match, rules[index]);
          if (token !== false) {
            return token;
          }
          return false;
        }
        if (this._input === '') {
          return this.EOF;
        } else {
          return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
            text: '',
            token: null,
            line: this.yylineno
          });
        }
      },
      lex: function lex() {
        var r = this.next();
        if (r) {
          return r;
        } else {
          return this.lex();
        }
      },
      begin: function begin(condition) {
        this.conditionStack.push(condition);
      },
      popState: function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
          return this.conditionStack.pop();
        } else {
          return this.conditionStack[0];
        }
      },
      _currentRules: function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
          return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
          return this.conditions['INITIAL'].rules;
        }
      },
      topState: function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
          return this.conditionStack[n];
        } else {
          return 'INITIAL';
        }
      },
      pushState: function pushState(condition) {
        this.begin(condition);
      },
      stateStackSize: function stateStackSize() {
        return this.conditionStack.length;
      },
      options: {
        'case-insensitive': true
      },
      performAction: function anonymous(yy, yy_, $avoiding_name_collisions, YY_START) {
        switch ($avoiding_name_collisions) {
          case 0
          :
            break;
          case 1:
            return '';
          case 2:
            return '';
          case 3:
            return 42;
          case 4:
            return 35;
          case 5:
            return 77;
          case 6:
            return 78;
          case 7:
            return 78;
          case 8:
            return 8;
          case 9:
            return 6;
          case 10:
            return 82;
          case 11:
            return 7;
          case 12:
            return 9;
          case 13:
            return 59;
          case 14:
            return 13;
          case 15:
            return 15;
          case 16:
            return 17;
          case 17:
            return 18;
          case 18:
            return 19;
          case 19:
            return 20;
          case 20:
            return 11;
          case 21:
            return 62;
          case 22:
            return 64;
          case 23:
            return 23;
          case 24:
            return 25;
          case 25:
            return 26;
          case 26:
            return 27;
          case 27:
            return 30;
          case 28:
            return 34;
          case 29:
            return 33;
          case 30:
            return 65;
          case 31:
            return 66;
          case 32:
            return 37;
          case 33:
            return 41;
          case 34:
            return 43;
          case 35:
            return 52;
          case 36:
            return 54;
          case 37:
            return 55;
          case 38:
            return 46;
          case 39:
            return 48;
          case 40:
            return 45;
          case 41:
            return 49;
          case 42:
            return 56;
          case 43:
            return 58;
          case 44:
            return 44;
          case 45:
            return 83;
          case 46:
            return 84;
          case 47:
            return 85;
          case 48:
            return 86;
          case 49:
            return 87;
          case 50:
            return 88;
          case 51:
            return 89;
          case 52:
            return 90;
          case 53:
            return 91;
          case 54:
            return 92;
          case 55:
            return 93;
          case 56:
            return 94;
          case 57:
            return 95;
          case 58:
            return 70;
          case 59:
            return 70;
          case 60:
            return 72;
          case 61:
            return 72;
          case 62:
            return 74;
          case 63:
            return 74;
          case 64:
            return 74;
          case 65:
            return 31;
          case 66:
            return 36;
          case 67:
            return 96;
          case 68:
            return 97;
          case 69:
            return 98;
          case 70:
            return 99;
          case 71:
            yy_.yytext = yy.utils.unquoteString(yy_.yytext);
            return 14;
          case 72:
            return 38;
          case 73:
            return 5;
          case 74:
            return 101;
          case 75:
            return 103;
          case 76:
            return '\\';
          case 77:
            return 28;
          case 78:
            return 61;
          case 79:
            return 29;
          case 80:
            return 57;
          case 81:
            return 71;
        }
      },
      rules: [/^(?:\s+)/i, /^(?:[#].*)/i, /^(?:\/\/.*)/i, /^(?:([_A-Z0-9\/\+]+==))/i, /^(?:-?[0-9]+(\.[0-9]+)?\b)/i, /^(?:0[xX][0-9A-F]+\b)/i, /^(?:false\b)/i, /^(?:true\b)/i, /^(?:all\b)/i, /^(?:reset\b)/i, /^(?:clear\b)/i, /^(?:build\b)/i, /^(?:help\b)/i, /^(?:load\b)/i, /^(?:get\b)/i, /^(?:set\b)/i, /^(?:set_save\b)/i, /^(?:set_restore\b)/i, /^(?:set_reset\b)/i, /^(?:preset\b)/i, /^(?:motm\b)/i, /^(?:add\b)/i, /^(?:rep\b)/i, /^(?:remove\b)/i, /^(?:hide\b)/i, /^(?:show\b)/i, /^(?:list\b)/i, /^(?:select\b)/i, /^(?:within\b)/i, /^(?:selector\b)/i, /^(?:mode\b)/i, /^(?:color\b)/i, /^(?:material\b)/i, /^(?:view\b)/i, /^(?:unit\b)/i, /^(?:line\b)/i, /^(?:listobj\b)/i, /^(?:removeobj\b)/i, /^(?:rotate\b)/i, /^(?:translate\b)/i, /^(?:scale\b)/i, /^(?:center\b)/i, /^(?:url\b)/i, /^(?:screenshot\b)/i, /^(?:dssp\b)/i, /^(?:file_list\b)/i, /^(?:file_register\b)/i, /^(?:file_delete\b)/i, /^(?:preset_add\b)/i, /^(?:preset_delete\b)/i, /^(?:preset_update\b)/i, /^(?:preset_rename\b)/i, /^(?:preset_open\b)/i, /^(?:create_scenario\b)/i, /^(?:reset_scenario\b)/i, /^(?:delete_scenario\b)/i, /^(?:add_scenario_item\b)/i, /^(?:list_scenario\b)/i, /^(?:s\b)/i, /^(?:mt\b)/i, /^(?:m\b)/i, /^(?:c\b)/i, /^(?:x\b)/i, /^(?:y\b)/i, /^(?:z\b)/i, /^(?:as\b)/i, /^(?:of\b)/i, /^(?:pdb\b)/i, /^(?:delay\b)/i, /^(?:prst\b)/i, /^(?:desc\b)/i, /^(?:((?:"(?:\\.|[^\\"])*"|'(?:\\.|[^\\'])*')))/i, /^(?:([_A-Z0-9]+))/i, /^(?:$)/i, /^(?:\.)/i, /^(?:\/)/i, /^(?:\\)/i, /^(?:-e\b)/i, /^(?:-f\b)/i, /^(?:-s\b)/i, /^(?:-v\b)/i, /^(?:=)/i],
      conditions: {
        INITIAL: {
          rules: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81],
          inclusive: true
        }
      }
    };
    return lexer;
  }();
  parser.lexer = lexer;
  function Parser() {
    this.yy = {};
  }
  Parser.prototype = parser;
  parser.Parser = Parser;
  return new Parser();
}();
var MiewCLIParser = {
  parser: parser
};

var modeIdDesc = {
  $help: ['Rendering mode shortcut', '    BS - balls and sticks mode', '    LN - lines mode', '    LC - licorice mode', '    VW - van der waals mode', '    TR - trace mode', '    TU - tube mode', '    CA - cartoon mode', '    SA - isosurface mode', '    QS - quick surface mode', '    SE - solvent excluded mode', '    TX - text mode'],
  BS: {
    $help: ['   Balls and sticks', '      aromrad = <number> #aromatic radius', '      atom = <number>    #atom radius', '      bond = <number>    #bond radius', '      multibond = <bool> #use multibond', '      showarom = <bool>  #show aromatic', '      space = <number>   #space value\n']
  },
  CA: {
    $help: ['   Cartoon', '      arrow = <number>   #arrow size', '      depth = <number>   #depth of surface', '      heightSegmentsRatio = <number>', '      radius = <number>  #tube radius', '      tension = <number> #', '      width = <number>  #secondary width\n']
  },
  LN: {
    $help: ['   Lines', '      atom = <number>    #atom radius', '      chunkarom = <number>', '      multibond = <bool> #use multibond', '      showarom = <bool>  #show aromatic', '      offsarom = <number>\n']
  },
  LC: {
    $help: ['   Licorice', '      aromrad = <number> #aromatic radius', '      bond = <number>    #bond radius', '      multibond = <bool> #use multibond', '      showarom = <bool>  #show aromatic', '      space = <number>   #space value\n']
  },
  VW: {
    $help: ['   Van der Waals', '      nothing\n']
  },
  TR: {
    $help: ['   Trace', '      radius = <number>  #tube radius\n']
  },
  TU: {
    $help: ['   Tube', '      heightSegmentsRatio = <number>', '      radius = <number>  #tube radius', '      tension = <number> \n']
  },
  SA: {
    $help: ['   Surface', '      zClip = <bool> #clip z plane\n']
  },
  QS: {
    $help: ['   Quick surface', '      isoValue = <number>', '      scale = <number>', '      wireframe = <bool>', '      zClip = <bool> #clip z plane\n']
  },
  SE: {
    $help: ['   Solvent excluded surface', '      zClip = <bool> #clip z plane\n']
  },
  TX: {
    $help: ['   Text mode', '      template = <format string> string that can include "{{ id }}"', '          it will be replaced by value, id can be one of next:', '          serial, name, type, sequence, residue, chain, hetatm, water\n', '      horizontalAlign = <string> {"left", "right", "center"}', '      verticalAlign = <string> {"top", "bottom", "middle"}', '      dx = <number> #offset along x', '      dy = <number> #offset along y', '      dz = <number> #offset along z', '      fg = <string> #text color modificator', '           could be keyword, named color or hex', '      fg = <string> #back color modificator', '           could be keyword, named color or hex', '      showBg = <bool> #if set show background', '           plate under text']
  }
};
var colorDesc = {
  $help: ['Coloring mode shortcut', '    EL - color by element', '    CH - color by chain', '    SQ - color by sequence', '    RT - color by residue type', '    SS - color by secondary structure', '    UN - uniform'],
  UN: {
    $help: ['Parameters of coloring modes customization', '   Uniform', '      color = <number|color> #RGB->HEX->dec\n']
  }
};
var materialDesc = {
  $help: ['Material shortcut', '    DF - diffuse', '    TR - transparent', '    SF - soft plastic', '    PL - glossy plastic', '    ME - metal', '    GL - glass']
};
var addRepDesc = {
  $help: ['Short (packed) representation description as a set of variables', '    s=<EXPRESSION>', '        selector property', '    m=<MODE_ID>[!<PARAMETER>:<VALUE>[,...]]', '        render mode property', '    c=<COLORER_ID>[!<PARAMETER>:<VALUE>[,...]]', '        color mode property', '    mt=<MATERIAL_ID>', '        material property'],
  s: {
    $help: 'Selection expression string as it is in menu->representations->selection'
  },
  m: modeIdDesc,
  c: colorDesc,
  mt: materialDesc
};
var setGetParameterDesc = {
  $help: ['Parameters of rendering modes customization: modes', 'Parameters of colorer customization: colorers', 'Autobuild: autobuild = (<number>|<bool>)'],
  modes: modeIdDesc,
  colorers: colorDesc
};
var help = {
  $help: ['help (<cmd name>| <path to property>)', 'You can get detailed information about command options', '   using "help cmd.opt.opt.[...]"\n', '   you can use one line comments', '   everything started from (#|//) will be skipped', '   Example: >build //some comment\n', 'List of available commands:'],
  reset: {
    $help: ['Reload current object, delete all representations', '    Nothing will work until load new object']
  },
  load: {
    $help: ['load (<PDBID>|<URL>|-f [<*.NC FILE URL STRING>])', '    Load new pdb object from selected source'],
    PDBID: {
      $help: 'pdb id in remote molecule database'
    },
    URL: {
      $help: 'url to source file'
    },
    f: {
      $help: ['open file system dialog to fetch local file', 'optionally you can determine trajectory file', 'via URL for *.top model']
    }
  },
  clear: {
    $help: 'No args. Clear terminal'
  },
  add: {
    $help: ['add [<REP_NAME>] [<DESCRIPTION>]', '    Add new item to representation set with', '    default or <DESCRIPTION> params'],
    REP_NAME: {
      $help: 'Identifier string [_,a-z,A-Z,0-9] can not start from digit'
    },
    DESCRIPTION: addRepDesc
  },
  rep: {
    $help: ['rep [<REP_NAME>|<REP_INDEX>] [<DESCRIPTION>]', '    set current representation by name or index', '    edit current representation by <DESCRIPTION>'],
    REP_NAME: {
      $help: ['Identifier string [_,a-z,A-Z,0-9] can not start from digit', 'Must be declared before']
    },
    REP_INDEX: {
      $help: 'Index of available representation'
    },
    DESCRIPTION: addRepDesc
  },
  remove: {
    $help: ['remove (<REP_NAME>|<REP_INDEX>)', 'Remove representation by name or index'],
    REP_NAME: {
      $help: ['Identifier string [_,a-z,A-Z,0-9] can not start from digit', 'Must be declared before']
    },
    REP_INDEX: {
      $help: 'Index of available representation'
    }
  },
  selector: {
    $help: ['selector <EXPRESSION>', '   set selector from EXPRESSION to current representation'],
    EXPRESSION: {
      $help: 'Selection expression string as it is in menu->representations->selection'
    }
  },
  mode: {
    $help: ['mode <MODE_ID> [<PARAMETER>=<VALUE>...]', '   set rendering mode and apply parameters to current representation'],
    MODE_ID: modeIdDesc
  },
  color: {
    $help: ['color <COLORER_ID> [<PARAMETER>=<VALUE>...]', '   set colorer and apply parameters to current representation'],
    COLORER_ID: colorDesc
  },
  material: {
    $help: ['material <MATERIAL_ID>', '   set material to current representation'],
    MATERIAL_ID: materialDesc
  },
  build: {
    $help: 'build help str',
    add: {
      $help: 'build.add',
      "new": {
        $help: ['add.new', 'add.new new line 1', 'add.new new line 2', 'add.new new line 3']
      }
    },
    del: {
      $help: 'build.del'
    }
  },
  list: {
    $help: ['list [-e|-s|<REP_NAME>|<REP_INDEX>]', 'Print representations if no args print list of representations', '    -e expand list and show all representations', '    -s show all user-registered selectors', '    <REP_NAME>|<REP_INDEX> show only current representation']
  },
  hide: {
    $help: ['hide (<REP_NAME>|<REP_INDEX>)', 'Hide representation referenced in args']
  },
  show: {
    $help: ['show (<REP_NAME>|<REP_INDEX>)', 'Show representation referenced in args']
  },
  get: {
    $help: ['get <PARAMETER>', 'Print <PARAMETER> value', '    <PARAMETER> - path to option use get.PARAMETER to get more info'],
    PARAMETER: setGetParameterDesc
  },
  set: {
    $help: ['set <PARAMETER> <VALUE>', 'Set <PARAMETER> with <VALUE>', '    <PARAMETER> - path to option use set.PARAMETER to get more info'],
    PARAMETER: setGetParameterDesc
  },
  set_save: {
    $help: ['set_save', 'Save current settings to cookie']
  },
  set_restore: {
    $help: ['set_restore', 'Load and apply settings from cookie']
  },
  set_reset: {
    $help: ['set_reset', 'Reset current settings to the defaults']
  },
  preset: {
    $help: ['preset [<PRESET>]', 'Reset current representation or set preset to <PRESET>'],
    PRESET: {
      $help: ['default', 'wire', 'small', 'macro']
    }
  },
  unit: {
    $help: ['unit [<unit_id>]', 'Change current biological structure view. Zero <unit_id> value means asymmetric unit,', 'positive values set an assembly with corresponding number.', 'Being called with no parameters command prints current unit information.']
  },
  view: {
    $help: ['view [<ENCODED_VIEW>]', 'Get current encoded view or set if ENCODED_VIEW placed as argument'],
    ENCODED_VIEW: {
      $help: ['encoded view matrix string (binary code)']
    }
  },
  rotate: {
    $help: ['rotate (x|y|z) [<DEGREES>] [(x|y|z) [<DEGREES>]]...', 'Rotate scene']
  },
  scale: {
    $help: ['scale <SCALE>', 'Scale scene']
  },
  select: {
    $help: ['select <SELECTOR_STRING> [as <SELECTOR_NAME>]', 'Select atoms using selector defined in SELECTOR_STRING', '    and if SELECTOR_NAME is defined register it in viewer', '    you can use it later as a complex selector']
  },
  within: {
    $help: ['within <DISTANCE> of <SELECTOR_STRING> as <SELECTOR_NAME>', 'Build within named selector', '    DISTANCE        <number>', '    SELECTOR_STRING <string(selection language)>', '    SELECTOR_NAME   <identifier>']
  },
  url: {
    $help: ['url [-s] [-v]', 'Report URL encoded scene', '    if -s set that include settings in the URL', '    if -v set that include view in the URL']
  },
  screenshot: {
    $help: ['screenshot [<WIDTH> [<HEIGHT>]]', 'Make a screenshot of the scene', '    WIDTH  <number> in pixels', '    HEIGHT <number> in pixels, equal to WIDTH by default']
  },
  line: {
    $help: ['line <first_atom_path> <second_atom_path> [<PARAMETER>=<VALUE>]', 'Draw dashed line between two specified atoms']
  },
  removeobj: {
    $help: ['removeobj <id>', 'Remove scene object by its index. Indices could be obtained by <listobj> command']
  },
  listobj: {
    $help: ['listobj', 'Display the list of all existing scene objects']
  }
};

function isUndefOrEqual(param, value) {
  return !param || param === value;
}
function EventDispatcher() {
  this._handlers = {};
}
EventDispatcher.prototype.addEventListener = function (type, callback, context) {
  var handlers = this._handlers[type];
  if (!handlers) {
    this._handlers[type] = [];
    handlers = this._handlers[type];
  }
  var params = [callback, context];
  function _checkPar(par) {
    return par[0] === params[0] && par[1] === params[1];
  }
  if (find(handlers, _checkPar) === undefined) {
    handlers.push(params);
  }
};
EventDispatcher.prototype.removeEventListener = function (type, callback, context) {
  var self = this;
  forEach(self._handlers, function (handler, ev) {
    remove(handler, function (values) {
      return isUndefOrEqual(type, ev) && isUndefOrEqual(callback, values[0]) && isUndefOrEqual(context, values[1] || self);
    });
  });
  this._handlers = omitBy(self._handlers, function (handler) {
    return handler.length === 0;
  });
};
EventDispatcher.prototype.dispatchEvent = function (event) {
  var self = this;
  forEach(this._handlers[event.type], function (callback) {
    var context = callback[1] || self;
    callback[0].apply(context, [event]);
  });
};

var priorities = {
  debug: 0,
  info: 1,
  report: 2,
  warn: 3,
  error: 4
};
function Logger() {
  EventDispatcher.call(this);
  this.console = false;
  this._priority = priorities.warn;
}
Logger.prototype = Object.create(EventDispatcher.prototype);
Logger.prototype.constructor = Logger;
Logger.prototype.instantiate = function () {
  return new Logger();
};
function verify(number) {
  if (!isNumber(number)) {
    throw new Error('Wrong log level specified!');
  }
  return number;
}
Object.defineProperty(Logger.prototype, 'level', {
  get: function get() {
    var _this = this;
    return findKey(priorities, function (value) {
      return value === _this._priority;
    });
  },
  set: function set(level) {
    this._priority = verify(priorities[level]);
  }
});
Logger.prototype.levels = function () {
  return Object.keys(priorities);
};
Logger.prototype.message = function (level, message) {
  var priority = verify(priorities[level]);
  this._message(priority, message);
};
Logger.prototype.debug = function (message) {
  this._message(priorities.debug, message);
};
Logger.prototype.info = function (message) {
  this._message(priorities.info, message);
};
Logger.prototype.report = function (message) {
  this._message(priorities.report, message);
};
Logger.prototype.warn = function (message) {
  this._message(priorities.warn, message);
};
Logger.prototype.error = function (message) {
  this._message(priorities.error, message);
};
Logger.prototype._message = function (priority, message) {
  if (priority < this._priority) {
    return;
  }
  var level = findKey(priorities, function (value) {
    return value === priority;
  });
  message = String(message);
  if (this.console) ;
  this.dispatchEvent({
    type: 'message',
    level: level,
    message: message
  });
};
var logger = new Logger();

var setPrototypeOf = createCommonjsModule(function (module) {
function _setPrototypeOf(o, p) {
  module.exports = _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports;
  return _setPrototypeOf(o, p);
}
module.exports = _setPrototypeOf, module.exports.__esModule = true, module.exports["default"] = module.exports;
});
getDefaultExportFromCjs(setPrototypeOf);

var inherits = createCommonjsModule(function (module) {
function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  Object.defineProperty(subClass, "prototype", {
    value: Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    }),
    writable: false
  });
  if (superClass) setPrototypeOf(subClass, superClass);
}
module.exports = _inherits, module.exports.__esModule = true, module.exports["default"] = module.exports;
});
var _inherits = getDefaultExportFromCjs(inherits);

var assertThisInitialized = createCommonjsModule(function (module) {
function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return self;
}
module.exports = _assertThisInitialized, module.exports.__esModule = true, module.exports["default"] = module.exports;
});
getDefaultExportFromCjs(assertThisInitialized);

var possibleConstructorReturn = createCommonjsModule(function (module) {
var _typeof = _typeof_1["default"];
function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  } else if (call !== void 0) {
    throw new TypeError("Derived constructors may only return object or undefined");
  }
  return assertThisInitialized(self);
}
module.exports = _possibleConstructorReturn, module.exports.__esModule = true, module.exports["default"] = module.exports;
});
var _possibleConstructorReturn = getDefaultExportFromCjs(possibleConstructorReturn);

var getPrototypeOf = createCommonjsModule(function (module) {
function _getPrototypeOf(o) {
  module.exports = _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  }, module.exports.__esModule = true, module.exports["default"] = module.exports;
  return _getPrototypeOf(o);
}
module.exports = _getPrototypeOf, module.exports.__esModule = true, module.exports["default"] = module.exports;
});
var _getPrototypeOf = getDefaultExportFromCjs(getPrototypeOf);

var isNativeFunction = createCommonjsModule(function (module) {
function _isNativeFunction(fn) {
  return Function.toString.call(fn).indexOf("[native code]") !== -1;
}
module.exports = _isNativeFunction, module.exports.__esModule = true, module.exports["default"] = module.exports;
});
getDefaultExportFromCjs(isNativeFunction);

var isNativeReflectConstruct = createCommonjsModule(function (module) {
function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;
  try {
    Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}
module.exports = _isNativeReflectConstruct, module.exports.__esModule = true, module.exports["default"] = module.exports;
});
getDefaultExportFromCjs(isNativeReflectConstruct);

var construct = createCommonjsModule(function (module) {
function _construct(Parent, args, Class) {
  if (isNativeReflectConstruct()) {
    module.exports = _construct = Reflect.construct, module.exports.__esModule = true, module.exports["default"] = module.exports;
  } else {
    module.exports = _construct = function _construct(Parent, args, Class) {
      var a = [null];
      a.push.apply(a, args);
      var Constructor = Function.bind.apply(Parent, a);
      var instance = new Constructor();
      if (Class) setPrototypeOf(instance, Class.prototype);
      return instance;
    }, module.exports.__esModule = true, module.exports["default"] = module.exports;
  }
  return _construct.apply(null, arguments);
}
module.exports = _construct, module.exports.__esModule = true, module.exports["default"] = module.exports;
});
getDefaultExportFromCjs(construct);

var wrapNativeSuper = createCommonjsModule(function (module) {
function _wrapNativeSuper(Class) {
  var _cache = typeof Map === "function" ? new Map() : undefined;
  module.exports = _wrapNativeSuper = function _wrapNativeSuper(Class) {
    if (Class === null || !isNativeFunction(Class)) return Class;
    if (typeof Class !== "function") {
      throw new TypeError("Super expression must either be null or a function");
    }
    if (typeof _cache !== "undefined") {
      if (_cache.has(Class)) return _cache.get(Class);
      _cache.set(Class, Wrapper);
    }
    function Wrapper() {
      return construct(Class, arguments, getPrototypeOf(this).constructor);
    }
    Wrapper.prototype = Object.create(Class.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    return setPrototypeOf(Wrapper, Class);
  }, module.exports.__esModule = true, module.exports["default"] = module.exports;
  return _wrapNativeSuper(Class);
}
module.exports = _wrapNativeSuper, module.exports.__esModule = true, module.exports["default"] = module.exports;
});
var _wrapNativeSuper = getDefaultExportFromCjs(wrapNativeSuper);

var arrayWithHoles = createCommonjsModule(function (module) {
function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}
module.exports = _arrayWithHoles, module.exports.__esModule = true, module.exports["default"] = module.exports;
});
getDefaultExportFromCjs(arrayWithHoles);

var iterableToArrayLimit = createCommonjsModule(function (module) {
function _iterableToArrayLimit(arr, i) {
  var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _s, _e;
  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);
      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }
  return _arr;
}
module.exports = _iterableToArrayLimit, module.exports.__esModule = true, module.exports["default"] = module.exports;
});
getDefaultExportFromCjs(iterableToArrayLimit);

var arrayLikeToArray = createCommonjsModule(function (module) {
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }
  return arr2;
}
module.exports = _arrayLikeToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;
});
getDefaultExportFromCjs(arrayLikeToArray);

var unsupportedIterableToArray = createCommonjsModule(function (module) {
function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return arrayLikeToArray(o, minLen);
}
module.exports = _unsupportedIterableToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;
});
getDefaultExportFromCjs(unsupportedIterableToArray);

var nonIterableRest = createCommonjsModule(function (module) {
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
module.exports = _nonIterableRest, module.exports.__esModule = true, module.exports["default"] = module.exports;
});
getDefaultExportFromCjs(nonIterableRest);

var slicedToArray = createCommonjsModule(function (module) {
function _slicedToArray(arr, i) {
  return arrayWithHoles(arr) || iterableToArrayLimit(arr, i) || unsupportedIterableToArray(arr, i) || nonIterableRest();
}
module.exports = _slicedToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;
});
var _slicedToArray = getDefaultExportFromCjs(slicedToArray);

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var browserType = {
  DEFAULT: 0,
  SAFARI: 1
};
function encodeQueryComponent(text, excludeExp) {
  var encode = function encode(code) {
    return String.fromCharCode(parseInt(code.substr(1), 16));
  };
  return encodeURIComponent(text).replace(excludeExp, encode).replace(/%20/g, '+');
}
function decodeQueryComponent(text) {
  return decodeURIComponent(text.replace(/\+/g, ' '));
}
function getUrlParameters(url) {
  url = url || window.location.search;
  var query = url.substring(url.indexOf('?') + 1);
  var search = /([^&=]+)=?([^&]*)/g;
  var result = [];
  var match;
  while ((match = search.exec(query)) !== null) {
    result.push([decodeQueryComponent(match[1]), decodeQueryComponent(match[2])]);
  }
  return result;
}
function getUrlParametersAsDict(url) {
  var result = {};
  var a = getUrlParameters(url);
  for (var i = 0; i < a.length; ++i) {
    var _a$i = _slicedToArray(a[i], 2),
        key = _a$i[0],
        value = _a$i[1];
    result[key] = value;
  }
  return result;
}
function resolveURL(str) {
  if (typeof URL !== 'undefined') {
    try {
      if (typeof window !== 'undefined') {
        return new URL(str, window.location).href;
      }
      return new URL(str).href;
    } catch (error) {
    }
  }
  if (typeof document !== 'undefined') {
    var anchor = document.createElement('a');
    anchor.href = str;
    return anchor.href;
  }
  return str;
}
function generateRegExp(symbolStr) {
  var symbolList = [];
  for (var i = 0, n = symbolStr.length; i < n; ++i) {
    symbolList[symbolList.length] = symbolStr[i].charCodeAt(0).toString(16);
  }
  var listStr = symbolList.join('|');
  return new RegExp("%(?:".concat(listStr, ")"), 'gi');
}
function createElement(tag, attrs, content) {
  var element = document.createElement(tag);
  var i;
  var n;
  if (attrs) {
    var keys = Object.keys(attrs);
    for (i = 0, n = keys.length; i < n; ++i) {
      var key = keys[i];
      element.setAttribute(key, attrs[key]);
    }
  }
  if (content) {
    if (!(content instanceof Array)) {
      content = [content];
    }
    for (i = 0, n = content.length; i < n; ++i) {
      var child = content[i];
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof HTMLElement) {
        element.appendChild(child);
      }
    }
  }
  return element;
}
function deriveClass(cls, base, members, statics) {
  cls.prototype = assign(Object.create(base.prototype), {
    constructor: cls
  }, members);
  if (statics) {
    assign(cls, statics);
  }
  return cls;
}
function deriveDeep(obj, needZeroOwnProperties) {
  var res = obj;
  var i;
  var n;
  if (obj instanceof Array) {
    res = new Array(obj.length);
    for (i = 0, n = obj.length; i < n; ++i) {
      res[i] = deriveDeep(obj[i]);
    }
  } else if (obj instanceof Object) {
    res = Object.create(obj);
    var keys = Object.keys(obj);
    for (i = 0, n = keys.length; i < n; ++i) {
      var key = keys[i];
      var value = obj[key];
      var copy = deriveDeep(value);
      if (copy !== value) {
        res[key] = copy;
      }
    }
    if (needZeroOwnProperties && Object.keys(res).length > 0) {
      res = Object.create(res);
    }
  }
  return res;
}
function hexColor(color) {
  var hex = "0000000".concat(color.toString(16)).substr(-6);
  return "#".concat(hex);
}
function DebugTracer(namespace) {
  var enabled = false;
  this.enable = function (on) {
    enabled = on;
  };
  var indent = 0;
  var methods = Object.keys(namespace);
  function wrap(method_, name_) {
    return function () {
      var spaces = DebugTracer.spaces.substr(0, indent * 2);
      if (enabled) {
        logger.debug("".concat(spaces + name_, " {"));
      }
      indent++;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      var result = method_.apply(this, args);
      indent--;
      if (enabled) {
        logger.debug("".concat(spaces, "} // ").concat(name_));
      }
      return result;
    };
  }
  for (var i = 0, n = methods.length; i < n; ++i) {
    var name = methods[i];
    var method = namespace[name];
    if (method instanceof Function && name !== 'constructor') {
      namespace[name] = wrap(method, name);
    }
  }
}
DebugTracer.spaces = '                                                                                          ';
var OutOfMemoryError = function (_Error) {
  _inherits(OutOfMemoryError, _Error);
  var _super = _createSuper(OutOfMemoryError);
  function OutOfMemoryError(message) {
    var _this;
    _classCallCheck(this, OutOfMemoryError);
    _this = _super.call(this);
    _this.name = 'OutOfMemoryError';
    _this.message = message;
    return _this;
  }
  return _createClass(OutOfMemoryError);
}( _wrapNativeSuper(Error));
function allocateTyped(TypedArrayName, size) {
  var result = null;
  try {
    result = new TypedArrayName(size);
  } catch (e) {
    if (e instanceof RangeError) {
      throw new OutOfMemoryError(e.message);
    } else {
      throw e;
    }
  }
  return result;
}
function bytesToBase64(
buffer) {
  var bytes = new Uint8Array(buffer);
  var binary = '';
  for (var i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
function bytesFromBase64(
str) {
  var binary = window.atob(str);
  var bytes = new Uint8Array(binary.length);
  for (var i = 0; i < bytes.length; ++i) {
    bytes[i] = binary[i].charCodeAt(0);
  }
  return bytes.buffer;
}
function arrayToBase64(
array,
TypedArrayClass) {
  return bytesToBase64(new TypedArrayClass(array).buffer);
}
function arrayFromBase64(
str,
TypedArrayClass) {
  return Array.prototype.slice.call(new TypedArrayClass(bytesFromBase64(str)));
}
function compareOptionsWithDefaults(opts, defOpts) {
  var optsStr = [];
  if (defOpts && opts) {
    var keys = Object.keys(opts);
    for (var p = 0; p < keys.length; ++p) {
      var key = keys[p];
      var value = opts[key];
      if (!(value instanceof Object) && typeof defOpts[key] !== 'undefined' && defOpts[key] !== value) {
        optsStr.push("".concat(key, ":").concat(value));
      }
    }
    if (optsStr.length > 0) {
      return "!".concat(optsStr.join());
    }
  }
  return '';
}
function isAlmostPlainObject(o) {
  if (isPlainObject(o)) {
    return true;
  }
  var proto = o && Object.getPrototypeOf(o);
  return !!proto && !Object.hasOwn(proto, 'constructor') && isAlmostPlainObject(proto);
}
function objectsDiff(src, dst) {
  var diff = {};
  forIn(src, function (srcValue, key) {
    var dstValue = dst[key];
    if (isAlmostPlainObject(srcValue) && isAlmostPlainObject(dstValue)) {
      var deepDiff = objectsDiff(srcValue, dstValue);
      if (!isEmpty(deepDiff)) {
        diff[key] = deepDiff;
      }
    } else if (!isEqual(srcValue, dstValue)) {
      diff[key] = srcValue;
    }
  });
  return diff;
}
function forInRecursive(object, callback) {
  function iterateThrough(obj, prefix) {
    forIn(obj, function (value, key) {
      var newPref = prefix + (prefix.length > 0 ? '.' : '');
      if (value instanceof Object) {
        iterateThrough(value, newPref + key);
      } else if (value !== undefined) {
        callback(value, newPref + key);
      }
    });
  }
  iterateThrough(object, '');
}
function enquoteString(value) {
  if (isString(value)) {
    return "\"".concat(value.replace(/"/g, '\\"'), "\"");
  }
  return value;
}
function unquoteString(value) {
  if (!isString(value)) {
    return value;
  }
  if (value[0] === '"' && value[value.length - 1] === '"') {
    value = value.slice(1, value.length - 1);
    return value.replace(/\\"/g, '"');
  }
  if (value[0] === "'" && value[value.length - 1] === "'") {
    value = value.slice(1, value.length - 1);
    return value.replace(/\\'/g, "'");
  }
  throw new SyntaxError("Incorrect string format, can't unqute it");
}
function getFileExtension(fileName) {
  return fileName.slice(Math.max(0, fileName.lastIndexOf('.')) || Infinity);
}
function splitFileName(fileName) {
  var ext = getFileExtension(fileName);
  var name = fileName.slice(0, fileName.length - ext.length);
  return [name, ext];
}
function dataUrlToBlob(url) {
  var parts = url.split(/[:;,]/);
  var partsCount = parts.length;
  if (partsCount >= 3 && parts[partsCount - 2] === 'base64') {
    return new Blob([bytesFromBase64(parts[partsCount - 1])]);
  }
  return null;
}
function getBrowser() {
  if (navigator.vendor && navigator.vendor.indexOf('Apple') > -1 && navigator.userAgent && navigator.userAgent.indexOf('CriOS') === -1 && navigator.userAgent.indexOf('FxiOS') === -1) {
    return browserType.SAFARI;
  }
  return browserType.DEFAULT;
}
function shotOpen(url) {
  if (typeof window !== 'undefined') {
    window.open().document.write("<body style=\"margin:0\"><img src=\"".concat(url, "\" /></body>"));
  }
}
function shotDownload(dataUrl, filename) {
  if (!dataUrl || dataUrl.substr(0, 5) !== 'data:') {
    return;
  }
  if (!filename) {
    filename = ['screenshot-', +new Date(), '.png'].join('');
  }
  if (typeof window !== 'undefined' && window.navigator && window.navigator.msSaveBlob) {
    window.navigator.msSaveBlob(dataUrlToBlob(dataUrl), filename);
  } else if (typeof document !== 'undefined') {
    var link = document.createElement('a');
    link.download = filename;
    link.innerHTML = 'download';
    link.href = window.URL.createObjectURL(dataUrlToBlob(dataUrl));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
function download(data, filename, type) {
  var blobData = new Blob([data]);
  if (!filename) {
    filename = ['data', +new Date()].join('');
  }
  if (!type) {
    filename += blobData.type || '.bin';
  } else {
    filename += ".".concat(type);
  }
  if (typeof window !== 'undefined' && window.navigator && window.navigator.msSaveBlob) {
    window.navigator.msSaveBlob(blobData, filename);
  } else if (typeof document !== 'undefined') {
    var link = document.createElement('a');
    link.download = filename;
    link.innerHTML = 'download';
    link.href = window.URL.createObjectURL(blobData);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
function copySubArrays(src, dst, indices, itemSize) {
  for (var i = 0, n = indices.length; i < n; ++i) {
    for (var j = 0; j < itemSize; ++j) {
      dst[i * itemSize + j] = src[indices[i] * itemSize + j];
    }
  }
}
function shallowCloneNode(node) {
  var newNode = node.cloneNode(true);
  newNode.worldPos = node.worldPos;
  return newNode;
}
var unquotedStringRE = /^[a-zA-Z0-9_]*$/;
var enquoteHelper = ['"', '', '"'];
function correctSelectorIdentifier(value) {
  if (unquotedStringRE.test(value)) {
    return value;
  }
  enquoteHelper[1] = value;
  return enquoteHelper.join('');
}
function concatTypedArraysUnsafe(first, second) {
  var result = new first.constructor(first.length + second.length);
  result.set(first);
  result.set(second, first.length);
  return result;
}
function mergeTypedArraysUnsafe(array) {
  if (array.length <= 0) {
    return null;
  }
  var size = array.reduce(function (acc, cur) {
    return acc + cur.length;
  }, 0);
  var result = new array[0].constructor(size);
  for (var i = 0, start = 0; i < array.length; i++) {
    var count = array[i].length;
    result.set(array[i], start);
    start += count;
  }
  return result;
}
var utils = {
  browserType: browserType,
  encodeQueryComponent: encodeQueryComponent,
  decodeQueryComponent: decodeQueryComponent,
  getUrlParameters: getUrlParameters,
  getUrlParametersAsDict: getUrlParametersAsDict,
  resolveURL: resolveURL,
  generateRegExp: generateRegExp,
  createElement: createElement,
  deriveClass: deriveClass,
  deriveDeep: deriveDeep,
  hexColor: hexColor,
  DebugTracer: DebugTracer,
  OutOfMemoryError: OutOfMemoryError,
  allocateTyped: allocateTyped,
  bytesFromBase64: bytesFromBase64,
  bytesToBase64: bytesToBase64,
  arrayFromBase64: arrayFromBase64,
  arrayToBase64: arrayToBase64,
  compareOptionsWithDefaults: compareOptionsWithDefaults,
  objectsDiff: objectsDiff,
  forInRecursive: forInRecursive,
  enquoteString: enquoteString,
  unquoteString: unquoteString,
  getBrowser: getBrowser,
  shotOpen: shotOpen,
  shotDownload: shotDownload,
  copySubArrays: copySubArrays,
  shallowCloneNode: shallowCloneNode,
  correctSelectorIdentifier: correctSelectorIdentifier,
  getFileExtension: getFileExtension,
  splitFileName: splitFileName,
  download: download,
  concatTypedArraysUnsafe: concatTypedArraysUnsafe,
  mergeTypedArraysUnsafe: mergeTypedArraysUnsafe
};

var selectors = Miew.chem.selectors,
    modes = Miew.modes,
    colorers = Miew.colorers,
    materials = Miew.materials,
    palettes = Miew.palettes,
    options = Miew.options,
    settings = Miew.settings;
function None() {}
var NULL = function () {
  var obj = new None();
  return function () {
    return obj;
  };
}();
var RepresentationMap = function () {
  function RepresentationMap() {
    _classCallCheck(this, RepresentationMap);
    this.representationMap = {};
    this.representationID = {};
  }
  _createClass(RepresentationMap, [{
    key: "get",
    value: function get(strId) {
      return this.representationMap[strId] || this.representationID[strId] || '<no name>';
    }
  }, {
    key: "add",
    value: function add(strId, index) {
      if (strId === -1) {
        return 'Can not create representation: there is no data';
      }
      if (index !== undefined) {
        if (!Object.hasOwn(this.representationMap, strId)) {
          this.representationMap[strId.toString()] = index;
          this.representationID[index] = strId.toString();
        } else {
          return 'This name has already existed, registered without name';
        }
      }
      return "Representation ".concat(strId, " successfully added");
    }
  }, {
    key: "remove",
    value: function remove(index) {
      if (index && Object.hasOwn(this.representationID, index)) {
        delete this.representationMap[this.representationID[index]];
        delete this.representationID[index];
      }
      var sortedKeys = Object.keys(this.representationID).sort();
      for (var i in sortedKeys) {
        if (Object.hasOwn(sortedKeys, i)) {
          var id = sortedKeys[i];
          if (id > index) {
            this.representationID[id - 1] = this.representationID[id];
            this.representationMap[this.representationID[id]] -= 1;
            delete this.representationID[id];
          }
        }
      }
    }
  }, {
    key: "clear",
    value: function clear() {
      this.representationMap = {};
      this.representationID = {};
    }
  }]);
  return RepresentationMap;
}();
var representationsStorage = new RepresentationMap();
function keyRemap(key) {
  var keys = {
    s: 'selector',
    m: 'mode',
    c: 'colorer',
    mt: 'material',
    mode: 'modes',
    color: 'colorers',
    colorer: 'colorers',
    select: 'selector',
    material: 'materials',
    selector: 'selector'
  };
  var ans = keys[key];
  return ans === undefined ? key : ans;
}
var CLIUtils = function () {
  function CLIUtils() {
    _classCallCheck(this, CLIUtils);
  }
  _createClass(CLIUtils, [{
    key: "list",
    value: function list(miew, repMap, key) {
      var ret = '';
      if (miew && repMap !== undefined) {
        if (key === undefined || key === '-e') {
          var count = miew.repCount();
          for (var i = 0; i < count; i++) {
            ret += this.listRep(miew, repMap, i, key);
          }
        }
      }
      return ret;
    }
  }, {
    key: "listRep",
    value: function listRep(miew, repMap, repIndex, key) {
      var ret = '';
      var rep = miew.repGet(repIndex);
      if (!rep) {
        logger.warn("Rep ".concat(repIndex, " does not exist!"));
        return ret;
      }
      var index = repIndex;
      var repName = repMap.get(index);
      var mode = rep.mode,
          colorer = rep.colorer;
      var selectionStr = rep.selectorString;
      var material = rep.materialPreset;
      ret += "#".concat(index, " : ").concat(mode.name).concat(repName === '<no name>' ? '' : ", ".concat(repName), "\n");
      if (key !== undefined) {
        ret += "    selection : \"".concat(selectionStr, "\"\n");
        ret += "    mode      : (".concat(mode.id, "), ").concat(mode.name, "\n");
        ret += "    colorer   : (".concat(colorer.id, "), ").concat(colorer.name, "\n");
        ret += "    material  : (".concat(material.id, "), ").concat(material.name, "\n");
      }
      return ret;
    }
  }, {
    key: "listSelector",
    value: function listSelector(miew, context) {
      var ret = '';
      for (var k in context) {
        if (Object.hasOwn(context, k)) {
          ret += "".concat(k, " : \"").concat(context[k], "\"\n");
        }
      }
      return ret;
    }
  }, {
    key: "listObjs",
    value: function listObjs(miew) {
      var objs = miew._objects;
      if (!objs || !Array.isArray(objs) || objs.length === 0) {
        return 'There are no objects on the scene';
      }
      var strList = [];
      for (var i = 0, n = objs.length; i < n; ++i) {
        strList[i] = "".concat(i, ": ").concat(objs[i].toString());
      }
      return strList.join('\n');
    }
  }, {
    key: "joinHelpStr",
    value: function joinHelpStr(helpData) {
      if (helpData instanceof Array) {
        return helpData.join('\n');
      }
      return helpData;
    }
  }, {
    key: "help",
    value: function help$1(path) {
      if (isUndefined(path)) {
        return "".concat(this.joinHelpStr(help.$help), "\n").concat(slice(sortBy(keys(help)), 1).join(', '), "\n");
      }
      var helpItem = get(help, path);
      return isUndefined(helpItem) ? this.help() : "".concat(this.joinHelpStr(helpItem.$help), "\n");
    }
  }, {
    key: "load",
    value: function load(miew, arg) {
      if (miew === undefined || arg === undefined || arg === '-f') {
        return;
      }
      miew.awaitWhileCMDisInProcess();
      var finish = function finish() {
        return miew.finishAwaitingCMDInProcess();
      };
      miew.load(arg).then(finish, finish);
    }
  }, {
    key: "checkArg",
    value: function checkArg(key, arg, modificate) {
      if (key !== undefined && arg !== undefined) {
        if (keyRemap(key) === 'selector') {
          var res = selectors.parse(arg);
          if (res.error !== undefined) {
            var selExc = {
              message: res.error
            };
            throw selExc;
          }
          if (modificate !== undefined && modificate) {
            return res.selector;
          }
          return arg;
        }
        var modificators = {
          colorers: colorers,
          modes: modes,
          materials: materials
        };
        var modificator = key;
        var temp;
        while (modificator !== temp) {
          temp = modificator;
          modificator = keyRemap(temp);
        }
        if (modificators[modificator].get(arg) === undefined) {
          var exc = {
            message: "".concat(arg, " is not existed in ").concat(modificator)
          };
          throw exc;
        }
        return arg;
      }
      return NULL;
    }
  }, {
    key: "propagateProp",
    value: function propagateProp(path, arg) {
      if (path !== undefined) {
        var argExc = {};
        var adapter = options.adapters[_typeof(get(settings.defaults, path))];
        if (adapter === undefined) {
          var pathExc = {
            message: "".concat(path, " is not existed")
          };
          throw pathExc;
        }
        if ((path.endsWith('.color') || path.endsWith('.baseColor') || path.endsWith('.EL.carbon')) && typeof arg !== 'number') {
          arg = palettes.get(settings.now.palette).getNamedColor(arg);
        }
        if (path.endsWith('.fg') || path.endsWith('.bg')) {
          if (typeof arg !== 'number') {
            var val = palettes.get(settings.now.palette).getNamedColor(arg, true);
            if (val !== undefined) {
              arg = "0x".concat(val.toString(16));
            }
          } else {
            arg = "0x".concat(arg.toString(16));
          }
        }
        if (path.endsWith('.template')) {
          arg = arg.replace(/\\n/g, '\n');
        }
        if (arg !== undefined && adapter(arg) !== arg && adapter(arg) !== arg > 0) {
          argExc = {
            message: "".concat(path, " must be a \"").concat(_typeof(get(settings.defaults, path)), "\"")
          };
          throw argExc;
        }
      }
      return arg;
    }
  }, {
    key: "unquoteString",
    value: function unquoteString(value) {
      return utils.unquoteString(value);
    }
  }]);
  return CLIUtils;
}();
var utilFunctions = new CLIUtils();
function CreateObjectPair(a, b) {
  var obj = {};
  obj[a] = b;
  return obj;
}
function ArgList(arg) {
  if (arg instanceof this.constructor) {
    return arg;
  }
  if (arg instanceof Array) {
    this._values = arg.slice(0);
  } else if (arg) {
    this._values = [arg];
  } else {
    this._values = [];
  }
}
ArgList.prototype.append = function (value) {
  var values = this._values;
  values[values.length] = value;
  return this;
};
ArgList.prototype.remove = function (value) {
  var values = this._values;
  var index = values.indexOf(value);
  if (index >= 0) {
    values.splice(index, 1);
  }
  return this;
};
ArgList.prototype.toJSO = function (cliUtils, cmd, arg) {
  var res = {};
  var list = this._values;
  for (var i = 0, n = list.length; i < n; ++i) {
    set(res, list[i].id, cliUtils.propagateProp("".concat(keyRemap(cmd), ".").concat(arg, ".").concat(list[i].id), list[i].val));
  }
  return res;
};
function Arg(_id, _val) {
  this.id = _id;
  this.val = _val;
}
var cliutils = Object.create({});
cliutils.Arg = Arg;
cliutils.ArgList = ArgList;
cliutils.miew = null;
cliutils.echo = null;
cliutils.representations = representationsStorage;
cliutils.utils = utilFunctions;
cliutils.assign = assign;
cliutils.CreateObjectPair = CreateObjectPair;
cliutils.keyRemap = keyRemap;
cliutils.Context = selectors.Context;
cliutils.ClearContext = selectors.ClearContext;
cliutils.NULL = NULL;
cliutils.notimplemented = function () {
  return this.NULL;
};
MiewCLIParser.parser.yy = cliutils;
MiewCLIParser.parser.yy.parseError = MiewCLIParser.parser.parseError;
var getMiewWithCli = function getMiewWithCli(miewInstance) {
  var obj = Object.create(miewInstance);
  obj.script = function (script, _printCallback, _errorCallback) {
    MiewCLIParser.parser.yy.miew = obj;
    MiewCLIParser.parser.yy.echo = _printCallback;
    MiewCLIParser.parser.yy.error = _errorCallback;
    if (obj.cmdQueue === undefined) {
      obj.cmdQueue = [];
    }
    if (obj.commandInAction === undefined) {
      obj.commandInAction = false;
    }
    obj.cmdQueue = obj.cmdQueue.concat(script.split('\n'));
  };
  obj.awaitWhileCMDisInProcess = function () {
    obj.commandInAction = true;
  };
  obj.finishAwaitingCMDInProcess = function () {
    obj.commandInAction = false;
  };
  obj.isScriptingCommandAvailable = function () {
    return obj.commandInAction !== undefined && !obj.commandInAction && obj.cmdQueue !== undefined && obj.cmdQueue.length > 0;
  };
  obj.callNextCmd = function () {
    if (obj.isScriptingCommandAvailable()) {
      var cmd = obj.cmdQueue.shift();
      var res = {};
      res.success = false;
      try {
        MiewCLIParser.parser.parse(cmd);
        res.success = true;
      } catch (e) {
        res.error = e.message;
        MiewCLIParser.parser.yy.error(res.error);
        obj.finishAwaitingCMDInProcess();
      }
      return res;
    }
    return '';
  };
  obj._onUpdate = function () {
    if (obj.isScriptingCommandAvailable !== undefined && obj.isScriptingCommandAvailable() && !obj._building) {
      obj.callNextCmd();
    }
    obj._objectControls.update();
    obj._forEachComplexVisual(function (visual) {
      visual.getComplex().update();
    });
    if (settings.now.autobuild && !obj._loading.length && !obj._building && obj._needRebuild()) {
      obj.rebuild();
    }
    if (!obj._loading.length && !obj._building && !obj._needRebuild()) {
      obj._updateView();
    }
    obj._updateFog();
    if (obj._gfx.renderer.xr.enabled) {
      obj.webVR.updateMoleculeScale();
    }
  };
  return obj;
};

export { getMiewWithCli as default };
//# sourceMappingURL=index.modern.js.map
