import _ from 'lodash';
import settings from './settings';
import utils from './utils';
import logger from './utils/logger';

let repIndex = 0;

function asBoolean(value) {
  return !(!value || value === '0' || (_.isString(value) && value.toLowerCase() === 'false'));
}

const adapters = {
  string: String,
  number: Number,
  boolean: asBoolean,
};

// Level 1 assignment symbol
const cL1Ass = '=';

const cOptsSep = '!';
// Level 2 (options) assignment symbol
const cL2Ass = ':';
// Level 2 (options) separator symbol
const cLSep = ',';

const cCommonIgnoreSymbols = '$;@/?';
/**
 * We may (and should) leave as is for better readability:
 *
 *        $ , ; : @ / ?
 */
/**
 * Generate regular expression for symbols excluded for first level encryption
 */
function getLevel1ExcludedExpr() {
  const cLevel1Ignores = ':,';
  return utils.generateRegExp(cCommonIgnoreSymbols + cLevel1Ignores);
}

/**
 * Generate regular expression for symbols excluded for first level encryption
 * (options, etc, ..)
 */
function getLevel2ExcludedExpr() {
  const cLevel2Ignores = ' ';
  return utils.generateRegExp(cCommonIgnoreSymbols + cLevel2Ignores);
}

const cL1ExclExpr = getLevel1ExcludedExpr();
function encodeQueryComponentL1(value) {
  return utils.encodeQueryComponent(value, cL1ExclExpr);
}

const cL2ExclExpr = getLevel2ExcludedExpr();
function encodeQueryComponentL2(value) {
  return utils.encodeQueryComponent(value, cL2ExclExpr);
}

function ensureRepList(opts) {
  let { reps } = opts;
  if (!reps) {
    const { presets } = settings.now;
    let preset = opts.preset || settings.now.preset;
    reps = presets[preset];
    if (!reps) {
      logger.warn(`Unknown preset "${preset}"`);
      [preset] = Object.keys(presets);
      reps = presets[preset]; // fall back to any preset
    }
    opts.preset = preset;
    opts.reps = utils.deriveDeep(reps, true);
  }
}

function ensureRepAssign(opts, prop, value) {
  ensureRepList(opts);
  const rep = opts.reps[repIndex];
  // prop specified twice therefore start new rep by cloning the current
  if (rep.hasOwnProperty(prop)) {
    repIndex = opts.reps.length;
    opts.reps[repIndex] = utils.deriveDeep(rep, true);
  }
  if (value !== undefined) {
    opts.reps[repIndex][prop] = value;
  }
}

function addObject(opts, params, options) {
  if (opts._objects === undefined) {
    opts._objects = [];
  }

  const [type, newOpts] = options;
  const newObj = {
    type,
    params,
  };

  if (newOpts !== undefined) {
    newObj.opts = newOpts;
  }

  opts._objects[opts._objects.length] = newObj;
}

function parseParams(str, params) {
  const sep = str.indexOf(',');
  if (sep >= 0) {
    params.push(str.substr(sep + 1).split(','));
    return str.substr(0, sep);
  }
  // keep this untouched if no params were extracted
  return str;
}

function extractArgs(input, defaultsDict, params) {
  if (input) {
    const bang = input.indexOf(cOptsSep);
    const inputVal = parseParams(input.substr(0, bang >= 0 ? bang : undefined), params);
    if (bang >= 0) {
      const args = input.substr(bang + 1).split(cLSep);
      input = inputVal;
      if (defaultsDict) {
        const defaults = defaultsDict[input];
        const opts = utils.deriveDeep(defaults, true);
        args.forEach((arg) => {
          const pair = arg.split(cL2Ass, 2);
          const key = decodeURIComponent(pair[0]);
          const value = decodeURIComponent(pair[1]);
          const adapter = adapters[typeof _.get(defaults, key)];
          if (adapter) {
            _.set(opts, key, adapter(value));
          } else {
            logger.warn(`Unknown argument "${key}" for option "${input}"`);
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

const actions = {

  l: 'load',
  load: String,
  t: 'type',
  type: String,
  v: 'view',
  view: String,
  u: 'unit',
  unit: Number,
  menu: asBoolean,

  // Commands

  o: 'object',
  object(value, opts) {
    const params = [];
    let options = extractArgs(value, settings.defaults.objects, params);
    if (!Array.isArray(options)) {
      options = [options];
    }
    addObject(opts, params[0], options);
  },

  p: 'preset',
  preset(value, opts) {
    opts.preset = value;
    opts.reps = null;
    ensureRepList(opts);
  },

  r: 'rep',
  rep(value, opts) {
    ensureRepList(opts);
    repIndex = Number(value);
    // clamp the index to one greater than the last
    repIndex = repIndex <= opts.reps.length ? (repIndex < 0 ? 0 : repIndex) : opts.reps.length;
    // create a new rep if it is adjacent to the existing ones
    if (repIndex === opts.reps.length) {
      // if there is no rep to derive from, derive from the first rep of the default
      opts.reps[repIndex] = repIndex > 0 ? utils.deriveDeep(opts.reps[repIndex - 1], true)
        : utils.deriveDeep(settings.defaults.presets.default[0], true);
    }
  },

  s: 'select',
  select(value, opts) {
    ensureRepAssign(opts, 'selector', value);
  },

  m: 'mode',
  mode(value, opts) {
    ensureRepAssign(opts, 'mode', extractArgs(value, settings.defaults.modes));
  },

  c: 'color',
  color(value, opts) {
    ensureRepAssign(opts, 'colorer', extractArgs(value, settings.defaults.colorers));
  },

  mt: 'material',
  material(value, opts) {
    ensureRepAssign(opts, 'material', extractArgs(value, settings.defaults.materials));
  },

  dup(value, opts) {
    ensureRepList(opts);
    const { reps } = opts;
    const rep = reps[repIndex];
    repIndex = reps.length;
    reps[repIndex] = utils.deriveDeep(rep, true);
  },

  // Settings shortcuts

  ar: 'autoResolution',
};

function _fromArray(entries) {
  repIndex = 0;

  const opts = {};
  for (let i = 0, n = entries.length; i < n; ++i) {
    const /** string[] */ entry = entries[i];
    let /** string? */ key = entry[0];
    const /** string? */ value = entry[1];
    let /** function|string? */ action = actions[key];

    // unwind shortcuts and aliases
    while (_.isString(action)) {
      key = action;
      action = actions[key];
    }

    // either set a property or use specialized parser
    if (!action) {
      const adapter = adapters[typeof _.get(settings.defaults, key)];
      if (adapter) {
        _.set(opts, `settings.${key}`, adapter(value));
      } else {
        logger.warn(`Unknown option "${key}"`);
      }
    } else if (_.isFunction(action)) {
      const result = action(value, opts);
      if (result !== undefined) {
        opts[key] = result;
      }
    }
  }

  return opts;
}

function fromAttr(attr) {
  return _fromArray(utils.getUrlParameters(`?${attr || ''}`));
}

function fromURL(url) {
  return _fromArray(utils.getUrlParameters(url));
}

function _processOptsForURL(opts) {
  const str = [];
  let i = 0;
  utils.forInRecursive(opts, (value, key) => {
    str[i++] = encodeQueryComponentL2(key) + cL2Ass + encodeQueryComponentL2(value);
  });
  return str.join(cLSep);
}

function _processArgsForURL(args) {
  if (!_.isArray(args)) {
    return args;
  }
  if (args.length < 2) {
    return args[0];
  }
  return `${args[0]}${cOptsSep}${_processOptsForURL(args[1])}`;
}

function _processObjForURL(objOpts) {
  if (!objOpts || !objOpts.type) {
    return undefined;
  }
  let res = objOpts.type;
  if (_.isArray(objOpts.params) && objOpts.params.length > 0) {
    res += `,${objOpts.params.join(',')}`;
  }
  if (objOpts.opts) {
    res += cOptsSep + _processOptsForURL(objOpts.opts);
  }
  return res;
}

function toURL(opts) {
  const stringList = [];
  let idx = 0;

  function checkAndAdd(prefix, value) {
    if (value !== null && value !== undefined) {
      stringList[idx++] = encodeQueryComponentL1(prefix)
                            + cL1Ass + encodeQueryComponentL1(value);
    }
  }

  function addReps(repList) {
    if (!repList) {
      return;
    }
    for (let i = 0, n = repList.length; i < n; ++i) {
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
    for (let i = 0, n = objList.length; i < n; ++i) {
      checkAndAdd('o', _processObjForURL(objList[i]));
    }
  }

  checkAndAdd('l', opts.load);
  checkAndAdd('u', opts.unit);
  checkAndAdd('p', opts.preset);
  addReps(opts.reps);
  addObjects(opts._objects);

  checkAndAdd('v', opts.view);

  utils.forInRecursive(opts.settings, (value, key) => {
    // I heard these lines in the whispers of the Gods
    // Handle preset setting in reps
    if (key === 'preset') {
      return;
    }
    checkAndAdd(key, value);
  });

  let url = '';
  if (typeof window !== 'undefined') {
    const { location } = window;
    url = `${location.protocol}//${location.host}${location.pathname}`;
  }
  if (stringList.length > 0) {
    url += `?${stringList.join('&')}`;
  }

  return url;
}

function _processOptsForScript(opts) {
  const str = [];
  let i = 0;
  utils.forInRecursive(opts, (value, key) => {
    str[i++] = `${key}=${utils.enquoteString(value)}`;
  });
  return str.join(' ');
}

function _processArgsForScript(args) {
  if (!_.isArray(args)) {
    return args;
  }
  if (args.length < 2) {
    return args[0];
  }
  return `${args[0]} ${_processOptsForScript(args[1])}`;
}

function _processObjForScript(objOpts) {
  if (!objOpts || !objOpts.type) {
    return undefined;
  }
  let res = objOpts.type;
  if (_.isArray(objOpts.params) && objOpts.params.length > 0) {
    res += ` ${objOpts.params.map(utils.enquoteString).join(' ')}`;
  }
  if (objOpts.opts) {
    res += ` ${_processOptsForScript(objOpts.opts)}`;
  }
  return res;
}

function _processRepsForScript(rep, index) {
  const repString = [];
  let strIdx = 0;
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
  const commandsList = [];
  let idx = 0;
  function checkAndAdd(command, value, saveQuotes) {
    if (value !== null && value !== undefined) {
      const quote = (typeof value === 'string' && saveQuotes) ? '"' : '';
      commandsList[idx++] = `${command} ${quote}${value}${quote}`.trim();
    }
  }

  function addReps(repList) {
    if (!repList) {
      return;
    }

    for (let i = 0, n = repList.length; i < n; ++i) {
      checkAndAdd('rep', _processRepsForScript(repList[i], i));
    }
  }

  function addObjects(objList) {
    if (!objList) {
      return;
    }
    for (let i = 0, n = objList.length; i < n; ++i) {
      checkAndAdd('', _processObjForScript(objList[i]));
    }
  }

  checkAndAdd('set', 'autobuild false');
  checkAndAdd('load', opts.load, true);
  checkAndAdd('unit', opts.unit);
  checkAndAdd('preset', opts.preset);
  addReps(opts.reps);
  addObjects(opts._objects);

  utils.forInRecursive(opts.settings, (value, key) => {
    // I heard these lines in the whispers of the Gods
    // Handle preset setting in reps
    if (key === 'preset') {
      return;
    }
    checkAndAdd(`set ${key}`, value, true);
  });
  checkAndAdd('view', opts.view);
  checkAndAdd('set', 'autobuild true');
  return commandsList.join('\n');
}

export default {
  fromURL,
  fromAttr,
  adapters,
  toURL,
  toScript,
};
