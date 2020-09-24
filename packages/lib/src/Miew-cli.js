import _ from 'lodash';
import Miew from './Miew';
import { parser as parsercli } from './utils/MiewCLIParser';
import clihelp from './utils/MiewCLIHelp';
import logger from './utils/logger';
import utils from './utils';

const {
  chem: { selectors },
  modes,
  colorers,
  materials,
  palettes,
  options,
  settings,
} = Miew;

function None() {
}

const NULL = (function () {
  const obj = new None();
  return function () {
    return obj;
  };
}());

class RepresentationMap {
  constructor() {
    this.representationMap = {};
    this.representationID = {};
  }

  get(strId) {
    return this.representationMap[strId] || this.representationID[strId] || '<no name>';
  }

  add(strId, index) {
    if (strId === -1) {
      return 'Can not create representation: there is no data';
    }

    if (index !== undefined) {
      if (!this.representationMap.hasOwnProperty(strId)) {
        this.representationMap[strId.toString()] = index;
        this.representationID[index] = strId.toString();
      } else {
        return 'This name has already existed, registered without name';
      }
    }
    return `Representation ${strId} successfully added`;
  }

  remove(index) {
    if (index && this.representationID.hasOwnProperty(index)) {
      delete this.representationMap[this.representationID[index]];
      delete this.representationID[index];
    }

    const sortedKeys = Object.keys(this.representationID).sort();
    for (const i in sortedKeys) {
      if (sortedKeys.hasOwnProperty(i)) {
        const id = sortedKeys[i];
        if (id > index) {
          this.representationID[id - 1] = this.representationID[id];
          this.representationMap[this.representationID[id]] -= 1;
          delete this.representationID[id];
        }
      }
    }
  }

  clear() {
    this.representationMap = {};
    this.representationID = {};
  }
}

const representationsStorage = new RepresentationMap();

function keyRemap(key) {
  const keys = {
    s: 'selector',
    m: 'mode',
    c: 'colorer',
    mt: 'material',
    mode: 'modes',
    color: 'colorers',
    colorer: 'colorers',
    select: 'selector',
    material: 'materials',
    selector: 'selector',
  };
  const ans = keys[key];
  return ans === undefined ? key : ans;
}

class CLIUtils {
  list(miew, repMap, key) {
    let ret = '';
    if (miew && repMap !== undefined) {
      if (key === undefined || key === '-e') {
        const count = miew.repCount();

        for (let i = 0; i < count; i++) {
          ret += this.listRep(miew, repMap, i, key);
        }
      }
    }
    return ret;
  }

  listRep(miew, repMap, repIndex, key) {
    let ret = '';
    const rep = miew.repGet(repIndex);
    if (!rep) {
      logger.warn(`Rep ${repIndex} does not exist!`);
      return ret;
    }
    const index = repIndex;
    const repName = repMap.get(index);

    const { mode, colorer } = rep;
    const selectionStr = rep.selectorString;
    const material = rep.materialPreset;

    ret += `#${index} : ${mode.name}${repName === '<no name>' ? '' : `, ${repName}`}\n`;

    if (key !== undefined) {
      ret += `    selection : "${selectionStr}"\n`;
      ret += `    mode      : (${mode.id}), ${mode.name}\n`;
      ret += `    colorer   : (${colorer.id}), ${colorer.name}\n`;
      ret += `    material  : (${material.id}), ${material.name}\n`;
    }

    return ret;
  }

  listSelector(miew, context) {
    let ret = '';

    for (const k in context) {
      if (context.hasOwnProperty(k)) {
        ret += `${k} : "${context[k]}"\n`;
      }
    }

    return ret;
  }

  listObjs(miew) {
    const objs = miew._objects;

    if (!objs || !Array.isArray(objs) || objs.length === 0) {
      return 'There are no objects on the scene';
    }

    const strList = [];
    for (let i = 0, n = objs.length; i < n; ++i) {
      strList[i] = `${i}: ${objs[i].toString()}`;
    }

    return strList.join('\n');
  }

  joinHelpStr(helpData) {
    if (helpData instanceof Array) {
      return helpData.join('\n');
    }
    return helpData;
  }

  help(path) {
    if (_.isUndefined(path)) {
      return `${this.joinHelpStr(clihelp.$help)}\n${_.slice(_.sortBy(_.keys(clihelp)), 1).join(', ')}\n`;
    }

    const helpItem = _.get(clihelp, path);
    return _.isUndefined(helpItem) ? this.help() : `${this.joinHelpStr(helpItem.$help)}\n`;
  }

  load(miew, arg) {
    if (miew === undefined || arg === undefined || arg === '-f') {
      return;
    }
    miew.awaitWhileCMDisInProcess();
    const finish = () => miew.finishAwaitingCMDInProcess();
    miew.load(arg).then(finish, finish);
  }

  checkArg(key, arg, modificate) {
    if (key !== undefined && arg !== undefined) {
      if (keyRemap(key) === 'selector') {
        const res = selectors.parse(arg);

        if (res.error !== undefined) {
          const selExc = { message: res.error };
          throw selExc;
        }

        if (modificate !== undefined && modificate) {
          return res.selector;
        }
        return arg;
      }

      const modificators = {
        colorers,
        modes,
        materials,
      };

      let modificator = key;
      let temp;
      while (modificator !== temp) {
        temp = modificator;
        modificator = keyRemap(temp);
      }

      if (modificators[modificator].get(arg) === undefined) {
        const exc = { message: `${arg} is not existed in ${modificator}` };
        throw exc;
      }
      return arg;
    }
    return NULL;
  }

  propagateProp(path, arg) {
    if (path !== undefined) {
      let argExc = {};
      const adapter = options.adapters[typeof _.get(settings.defaults, path)];
      if (adapter === undefined) {
        const pathExc = { message: `${path} is not existed` };
        throw pathExc;
      }

      if ((path.endsWith('.color') || path.endsWith('.baseColor')
        || path.endsWith('.EL.carbon')) && typeof arg !== 'number') {
        arg = palettes.get(settings.now.palette).getNamedColor(arg);
      }

      if (path.endsWith('.fg') || path.endsWith('.bg')) {
        if (typeof arg !== 'number') {
          const val = palettes.get(settings.now.palette).getNamedColor(arg, true);
          if (val !== undefined) {
            arg = `0x${val.toString(16)}`;
          }
        } else {
          arg = `0x${arg.toString(16)}`;
        }
      }

      if (path.endsWith('.template')) {
        arg = arg.replace(/\\n/g, '\n');// NOSONAR
      }

      if (arg !== undefined && adapter(arg) !== arg && adapter(arg) !== (arg > 0)) {
        argExc = { message: `${path} must be a "${typeof _.get(settings.defaults, path)}"` };
        throw argExc;
      }
    }
    return arg;
  }

  unquoteString(value) {
    return utils.unquoteString(value);
  }
}
// repIndexOrRepMap could be RepresentationMap or index

const utilFunctions = new CLIUtils();

function CreateObjectPair(a, b) {
  const obj = {};
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
  const values = this._values;
  values[values.length] = value;
  return this;
};

ArgList.prototype.remove = function (value) {
  const values = this._values;
  const index = values.indexOf(value);
  if (index >= 0) {
    values.splice(index, 1);
  }
  return this;
};

ArgList.prototype.toJSO = function (cliUtils, cmd, arg) {
  const res = {};

  const list = this._values;
  for (let i = 0, n = list.length; i < n; ++i) {
    _.set(res, list[i].id, cliUtils.propagateProp(`${keyRemap(cmd)}.${arg}.${list[i].id}`, list[i].val));
  }

  return res;
};

function Arg(_id, _val) {
  this.id = _id;
  this.val = _val;
}

const cliutils = Object.create({});

cliutils.Arg = Arg;
cliutils.ArgList = ArgList;

cliutils.miew = null;
cliutils.echo = null;
cliutils.representations = representationsStorage;
cliutils.utils = utilFunctions;

cliutils._ = _;
cliutils.CreateObjectPair = CreateObjectPair;
cliutils.keyRemap = keyRemap;
cliutils.Context = selectors.Context;
cliutils.ClearContext = selectors.ClearContext;

cliutils.NULL = NULL;

cliutils.notimplemented = function () {
  return this.NULL;
};

Miew.prototype.script = function (script, _printCallback, _errorCallback) {
  parsercli.yy.miew = this;
  parsercli.yy.echo = _printCallback;
  parsercli.yy.error = _errorCallback;
  if (this.cmdQueue === undefined) {
    this.cmdQueue = [];
  }

  if (this.commandInAction === undefined) {
    this.commandInAction = false;
  }

  this.cmdQueue = this.cmdQueue.concat(script.split('\n'));
};

Miew.prototype.awaitWhileCMDisInProcess = function () {
  this.commandInAction = true;
};

Miew.prototype.finishAwaitingCMDInProcess = function () {
  this.commandInAction = false;
};

Miew.prototype.isScriptingCommandAvailable = function () {
  return this.commandInAction !== undefined
         && !this.commandInAction
         && this.cmdQueue !== undefined
         && this.cmdQueue.length > 0;
};

Miew.prototype.callNextCmd = function () {
  if (this.isScriptingCommandAvailable()) {
    const cmd = this.cmdQueue.shift();

    const res = {};
    res.success = false;
    try {
      parsercli.parse(cmd);
      res.success = true;
    } catch (e) {
      res.error = e.message;
      parsercli.yy.error(res.error);
      this.finishAwaitingCMDInProcess();
    }
    return res;
  }
  return '';
};

parsercli.yy = cliutils;
// workaround for incorrect JISON parser generator for AMD module
parsercli.yy.parseError = parsercli.parseError;
