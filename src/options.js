

import _ from 'lodash';
import settings from './settings';
import utils from './utils';
import logger from './utils/logger';

var repIndex = 0;

function asBoolean(value) {
  return !(!value || value === '0' || (_.isString(value) && value.toLowerCase() === 'false'));
}

var adapters = {
  'string': String,
  'number': Number,
  'boolean': asBoolean,
};

  // Level 1 assignment symbol
var cL1Ass = '=';

var cOptsSep = '!';
// Level 2 (options) assignment symbol
var cL2Ass = ':';
// Level 2 (options) separator symbol
var cLSep  = ',';

var cCommonIgnoreSymbols = '$;@/?';
/**
 * We may (and should) leave as is for better readability:
 *
 *        $ , ; : @ / ?
 */
/**
 * Generate regular expression for symbols excluded for first level encryption
 */
function getLevel1ExcludedExpr() {
  var cLevel1Ignores = ':,';
  return utils.generateRegExp(cCommonIgnoreSymbols + cLevel1Ignores);
}

/**
 * Generate regular expression for symbols excluded for first level encryption
 * (options, etc, ..)
 */
function getLevel2ExcludedExpr() {
  var cLevel2Ignores = ' ';
  return utils.generateRegExp(cCommonIgnoreSymbols + cLevel2Ignores);
}

var cL1ExclExpr = getLevel1ExcludedExpr();
function encodeQueryComponentL1(value) {
  return utils.encodeQueryComponent(value, cL1ExclExpr);
}

var cL2ExclExpr = getLevel2ExcludedExpr();
function encodeQueryComponentL2(value) {
  return utils.encodeQueryComponent(value, cL2ExclExpr);
}

function ensureRepList(opts) {
  var reps = opts.reps;
  if (!reps) {
    var presets = settings.now.presets;
    var preset = opts.preset || settings.now.preset;
    reps = presets[preset];
    if (!reps) {
      logger.warn('Unknown preset "' + preset + '"');
      preset = Object.keys(presets)[0];
      reps = presets[preset]; // fall back to any preset
    }
    opts.preset = preset;
    opts.reps = utils.deriveDeep(reps, true);
  }
}

function ensureRepAssign(opts, prop, value) {
  ensureRepList(opts);
  var rep = opts.reps[repIndex];
  // prop specified twice therefore start new rep by cloning the current
  if (rep.hasOwnProperty(prop)) {
    if (++repIndex >= opts.reps.length) {
      opts.reps[repIndex] = utils.deriveDeep(rep, true);
    }
  }
  if (value !== undefined) {
    opts.reps[repIndex][prop] = value;
  }
}

function addObject(opts, params, options) {
  if (opts._objects === undefined) {
    opts._objects = [];
  }

  var newObj = {
    type: options[0],
    params: params
  };

  if (options[1] !== undefined) {
    newObj.opts = options[1];
  }

  opts._objects[opts._objects.length] = newObj;
}

function parseParams(str, params) {
  var sep = str.indexOf(',');
  if (sep >= 0) {
    params.push(str.substr(sep + 1).split(','));
    return str.substr(0, sep);
  }
  // keep this untouched if no params were extracted
  return str;
}

function extractArgs(input, defaultsDict, params) {
  if (input) {
    var bang = input.indexOf(cOptsSep);
    var inputVal = parseParams(input.substr(0, bang >= 0 ? bang : undefined), params);
    if (bang >= 0) {
      var args = input.substr(bang + 1).split(cLSep);
      input = inputVal;
      if (defaultsDict) {
        var defaults = defaultsDict[input];
        var opts = utils.deriveDeep(defaults, true);
        args.forEach(function(arg) {
          var pair = arg.split(cL2Ass, 2);
          var key = decodeURIComponent(pair[0]), value = decodeURIComponent(pair[1]);
          var adapter = adapters[typeof _.get(defaults, key)];
          if (adapter) {
            _.set(opts, key, adapter(value));
          } else {
            logger.warn('Unknown argument "' + key + '" for option "' + input + '"');
          }
        });
        if (Object.keys(opts).length > 0) {
          input = [input, opts];
        }
      }
    } else {
      input = inputVal;
    }
  }
  return input;
}

var actions = {

  //////////////////////////////////////////////////////////////////////////////
  // Options

  'l': 'load', 'load': String,
  't': 'type', 'type': String,
  'v': 'view', 'view': String,
  'u': 'unit', 'unit': Number,
  'menu': asBoolean,

  //////////////////////////////////////////////////////////////////////////////
  // Commands

  'o': 'object', 'object': function(value, opts) {
    var params = [];
    var options = extractArgs(value, settings.defaults.objects, params);
    if (!Array.isArray(options)) {
      options = [options];
    }
    addObject(opts, params[0], options);
  },

  'p': 'preset', 'preset': function(value, opts) {
    opts.preset = value;
    opts.reps = null;
    ensureRepList(opts);
  },

  'r': 'rep', 'rep': function(value, opts) {
    ensureRepList(opts);
    repIndex = Number(value);
    // clamp the index to one greater than the last
    repIndex = repIndex <= opts.reps.length ? (repIndex < 0 ? 0 : repIndex) : opts.reps.length;
    // create a new rep if it is adjacent to the existing ones
    if (repIndex === opts.reps.length) {
      // if there is no rep to derive from, derive from the first rep of the default
      opts.reps[repIndex] = repIndex > 0 ? utils.deriveDeep(opts.reps[repIndex - 1], true) :
        utils.deriveDeep(settings.defaults.presets.default[0], true);
    }
  },

  's': 'select', 'select':  function(value, opts) {
    ensureRepAssign(opts, 'selector', value);
  },

  'm': 'mode', 'mode': function(value, opts) {
    ensureRepAssign(opts, 'mode', extractArgs(value, settings.defaults.modes));
  },

  'c': 'color', 'color':  function(value, opts) {
    ensureRepAssign(opts, 'colorer', extractArgs(value, settings.defaults.colorers));
  },

  'mt': 'material', 'material':  function(value, opts) {
    ensureRepAssign(opts, 'material', extractArgs(value, settings.defaults.materials));
  },

  'dup': function(value, opts) {
    ensureRepList(opts);
    var reps = opts.reps;
    var rep = reps[repIndex];
    if (++repIndex >= reps.length) {
      reps[repIndex] = utils.deriveDeep(rep, true);
    }
  },

  //////////////////////////////////////////////////////////////////////////////
  // Settings shortcuts

  'ar': 'autoResolution',

  //////////////////////////////////////////////////////////////////////////////
  // Deprecated

  'background': 'theme',
};

function _fromArray(entries) {
  repIndex = 0;

  var opts = {};
  for (var i = 0, n = entries.length; i < n; ++i) {
    var /** string[] */ entry = entries[i];
    var /** string? */ key = entry[0];
    var /** string? */ value = entry[1];
    var /** function|string? */ action = actions[key];

    // unwind shortcuts and aliases
    while (_.isString(action)) {
      key = action;
      action = actions[key];
    }

    // either set a property or use specialized parser
    if (!action) {
      var adapter = adapters[typeof _.get(settings.defaults, key)];
      if (adapter) {
        _.set(opts, 'settings.' + key, adapter(value));
      } else {
        logger.warn('Unknown option "' + key + '"');
      }
    } else if (_.isFunction(action)) {
      var result = action(value, opts);
      if (result !== undefined) {
        opts[key] = result;
      }
    }
  }

  return opts;
}

function fromAttr(attr) {
  return _fromArray(utils.getUrlParameters('?' + (attr || ''))); // TODO: We need different processing for attrs.
}

function fromURL(url) {
  return _fromArray(utils.getUrlParameters(url));
}

function _processOptsForURL(opts) {
  var str = [];
  var i = 0;
  utils.forInRecursive(opts, function(value, key) {
    str[i++] = encodeQueryComponentL2(key) + cL2Ass + encodeQueryComponentL2(value);
  });
  return str.join(cLSep);
}

function _processArgsForURL(args) {
  if (!_.isArray(args)) {
    return args;
  }
  return args[0] + (args.length < 2 ? '' : cOptsSep + _processOptsForURL(args[1]));
}

function _processObjForURL(objOpts) {
  if (!objOpts || !objOpts.type) {
    return undefined;
  }
  var res = objOpts.type;
  if (_.isArray(objOpts.params) && objOpts.params.length > 0) {
    res += ',' + objOpts.params.join(',');
  }
  if (objOpts.opts) {
    res += cOptsSep + _processOptsForURL(objOpts.opts);
  }
  return res;
}

function toURL(opts) {
  var stringList = [];
  var idx = 0;

  function checkAndAdd(prefix, value) {
    if (value !== null && value !== undefined) {
      stringList[idx++] = encodeQueryComponentL1(prefix) +
                            cL1Ass + encodeQueryComponentL1(value);
    }
  }

  function addReps(repList) {
    if (!repList) {
      return;
    }
    for (var i = 0, n = repList.length; i < n; ++i) {
      if (_.isEmpty(repList[i])) {
        continue;
      }
      checkAndAdd('r', i);
      checkAndAdd('s', repList[i].selector);
      checkAndAdd('m', _processArgsForURL(repList[i].mode));
      checkAndAdd('c', _processArgsForURL(repList[i].colorer));
      checkAndAdd('mt', _processArgsForURL(repList[i].material));
    }
  }

  function addObjects(objList) {
    if (!objList) {
      return;
    }
    for (var i = 0, n = objList.length; i < n; ++i) {
      checkAndAdd('o', _processObjForURL(objList[i]));
    }
  }

  checkAndAdd('l', opts.load);
  checkAndAdd('u', opts.unit);
  checkAndAdd('p', opts.preset);
  addReps(opts.reps);
  addObjects(opts._objects);

  checkAndAdd('v', opts.view);

  utils.forInRecursive(opts.settings, function(value, key) {
    // I heard these lines in the whispers of the Gods
    // Handle preset setting in reps
    if (key === 'preset') { // TODO: remove 'preset' from settings, implement autodetection
      return;
    }
    checkAndAdd(key, value);
  });

  var url = '';
  if (typeof window !== 'undefined') {
    var location = window.location;
    url = location.protocol + '//' + location.host + location.pathname;
  }
  if (stringList.length > 0) {
    url += '?' + stringList.join('&');
  }

  return url;
}

function _processOptsForScript(opts) {
  var str = [];
  var i = 0;
  utils.forInRecursive(opts, function(value, key) {
    str[i++] = key + '=' + utils.enquoteString(value);
  });
  return str.join(' ');
}

function _processArgsForScript(args) {
  if (!_.isArray(args)) {
    return args;
  }
  return args[0] + (args.length < 2 ? '' : ' ' + _processOptsForScript(args[1]));
}

function _processObjForScript(objOpts) {
  if (!objOpts || !objOpts.type) {
    return undefined;
  }
  var res = objOpts.type;
  if (_.isArray(objOpts.params) && objOpts.params.length > 0) {
    res += ' ' + objOpts.params.map(utils.enquoteString).join(' ');
  }
  if (objOpts.opts) {
    res += ' ' + _processOptsForScript(objOpts.opts);
  }
  return res;
}

function _processRepsForScript(rep, index) {
  var repString = [];
  var strIdx = 0;
  function localAdd(prefix, value) {
    if (value !== null && value !== undefined) {
      repString[strIdx++] = prefix + value;
    }
  }
  if (_.isEmpty(rep)) {
    return null;
  }
  localAdd('', index);
  localAdd('s=', utils.enquoteString(rep.selector));
  localAdd('m=', _processArgsForScript(rep.mode));
  localAdd('c=', _processArgsForScript(rep.colorer));
  localAdd('mt=', _processArgsForScript(rep.material));
  return repString.join(' ');
}

function toScript(opts) {
  var commandsList = [];
  var idx = 0;
  function checkAndAdd(command, value) {
    if (value !== null && value !== undefined) {
      commandsList[idx++] = command + ' ' + value;
    }
  }

  function addReps(repList) {
    if (!repList) {
      return;
    }

    for (var i = 0, n = repList.length; i < n; ++i) {
      checkAndAdd('rep', _processRepsForScript(repList[i], i));
    }

  }

  function addObjects(objList) {
    if (!objList) {
      return;
    }
    for (var i = 0, n = objList.length; i < n; ++i) {
      checkAndAdd('', _processObjForScript(objList[i]));
    }
  }

  checkAndAdd('set', 'autobuild false');
  checkAndAdd('load', opts.load);
  checkAndAdd('unit', opts.unit);
  checkAndAdd('preset', opts.preset);
  addReps(opts.reps);
  addObjects(opts._objects);

  utils.forInRecursive(opts.settings, function(value, key) {
    // I heard these lines in the whispers of the Gods
    // Handle preset setting in reps
    if (key === 'preset') {
      return;
    }
    checkAndAdd('set ' + key, value);
  });
  checkAndAdd('view', opts.view);

  // this is kind of hack
  checkAndAdd('set', 'autobuild true');
  return commandsList.join('\n');
}

export default {
  fromURL: fromURL,
  fromAttr: fromAttr,
  adapters: adapters,
  toURL: toURL,
  toScript: toScript
};

