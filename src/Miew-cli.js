import _ from 'lodash';
import Miew from './Miew';
import {parser as parsercli} from './utils/MiewCLIParser';
import clihelp from './utils/MiewCLIHelp';
import JSONConverter from './utils/JSONtoSelectorConverter';
import logger from './utils/logger';


var
  selectors = Miew.chem.selectors,
  modes = Miew.modes,
  colorers = Miew.colorers,
  materials = Miew.materials,
  palettes = Miew.palettes,
  options = Miew.options,
  settings = Miew.settings;

function None() {
}

var NULL = (function() {
  var obj = new None();
  return function() {
    return obj;
  };
})();

function RepresentationMap() {
  this.representationMap = {};
  this.representationID = {};
}
RepresentationMap.prototype.get = function(strId) {
  return this.representationMap[strId] || this.representationID[strId] || '<no name>';
};

RepresentationMap.prototype.add = function(strId, index) {
  if (index !== undefined) {
    if (!this.representationMap.hasOwnProperty(strId)) {
      this.representationMap[strId.toString()] = index;
      this.representationID[index] = strId.toString();
    } else {
      return 'This name has already existed, registered without name';
    }
  }
  return 'Representation ' + strId + ' successfully added';
};

RepresentationMap.prototype.remove = function(index) {
  if (index && this.representationID.hasOwnProperty(index)) {
    delete this.representationMap[this.representationID[index]];
    delete this.representationID[index];
  }

  var sortedKeys = Object.keys(this.representationID).sort();
  for (var i in sortedKeys) {
    if (sortedKeys.hasOwnProperty(i)) {
      var id = sortedKeys[i];
      if (id > index) {
        this.representationID[id - 1] = this.representationID[id];
        this.representationMap[this.representationID[id]] -= 1;
        delete this.representationID[id];
      }
    }
  }
};

RepresentationMap.prototype.clear = function() {
  this.representationMap = {};
  this.representationID = {};
};
var representationsStorage = new RepresentationMap();

function CLIUtils() {
}
//repIndexOrRepMap could be RepresentationMap or index
CLIUtils.prototype.list = function(miew, repMap, key) {
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
};

CLIUtils.prototype.listRep = function(miew, repMap, repIndex, key) {
  let ret = '';
  const rep = miew.repGet(repIndex);
  if (!rep) {
    logger.warn(`Rep ${repIndex} does not exist!`);
    return ret;
  }
  const index = repIndex;
  const repName = repMap.get(index);

  const mode = rep.mode;
  const selectionStr = rep.selectorString;
  const colorer = rep.colorer;
  const material = rep.materialPreset;

  ret += '#' + index + ' : ' + mode.name + (repName === '<no name>' ? '' : repName) + '\n';

  if (key !== undefined) {
    ret += '    selection : "' + selectionStr + '"\n';
    ret += '    mode      : (' + mode.id + '), ' + mode.name + '\n';
    ret += '    colorer   : (' + colorer.id + '), ' + colorer.name + '\n';
    ret += '    material  : (' + material.id + '), ' + material.name + '\n';
  }

  return ret;
};

CLIUtils.prototype.listSelector = function(miew, context) {
  var ret = '';

  for (var k in context) {
    if (context.hasOwnProperty(k)) {
      ret += k + ' : "' + context[k] + '"\n';
    }
  }

  return ret;
};

CLIUtils.prototype.listObjs = function(miew) {
  var objs = miew._objects;

  if (!objs || !Array.isArray(objs) || objs.length === 0) {
    return 'There are no objects on the scene';
  }

  var strList = [];
  for (var i = 0, n = objs.length; i < n; ++i) {
    strList[i] = '' + i + ': ' + objs[i].toString();
  }

  return strList.join('\n');
};

CLIUtils.prototype.joinHelpStr = function(helpData) {
  if (helpData instanceof Array) {
    return helpData.join('\n');
  }
  return helpData;
};

CLIUtils.prototype.help = function(path) {
  if (_.isUndefined(path)) {
    return this.joinHelpStr(clihelp.$help) + '\n' + _.slice(_.sortBy(_.keys(clihelp)), 1).join(', ') + '\n';
  }

  var helpItem = _.get(clihelp, path);
  return _.isUndefined(helpItem) ? this.help() : this.joinHelpStr(helpItem.$help) + '\n';
};

CLIUtils.prototype.load = function(miew, arg) {
  if (miew === undefined || arg === undefined || arg === '-f') {
    return;
  }
  miew.awaitWhileCMDisInProcess();
  const finish = () => miew.finishAwaitingCMDInProcess();
  miew.load(arg).then(finish, finish);
};

CLIUtils.prototype.checkArg = function(key, arg, modificate) {
  if (key !== undefined && arg !== undefined) {
    if (keyRemap(key) === 'selector') {
      const res = selectors.parse(arg);

      if (res.error !== undefined) {
        const selExc = {message: res.error};
        throw selExc;
      }

      if (modificate !== undefined && modificate) {
        return res.selector;
      }
      return arg;
    }

    const modificators = {
      'colorers' : colorers,
      'modes' : modes,
      'materials' : materials,
    };

    let modificator = key, temp;
    while (modificator !== temp) {
      temp = modificator;
      modificator = keyRemap(temp);
    }

    if (modificators[modificator].get(arg) === undefined) {
      const exc = {message: arg + ' is not existed in ' + modificator};
      throw exc;
    }
    return arg;
  }
  return NULL;
};

CLIUtils.prototype.propagateProp = function(path, arg) {
  if (path !== undefined) {
    let argExc = {};
    const adapter = options.adapters[typeof _.get(settings.defaults, path)];
    if (adapter === undefined) {
      const pathExc = {message: path + ' is not existed'};
      throw pathExc;
    }

    if ((path.endsWith('.color') || path.endsWith('.baseColor') ||
             path.endsWith('.EL.carbon')) && typeof arg !== 'number') {
      arg = palettes.get(settings.now.palette).getNamedColor(arg);
    }

    if (path.endsWith('.fg') || path.endsWith('.bg')) {
      if (typeof arg !== 'number') {
        const val = palettes.get(settings.now.palette).getNamedColor(arg, true);
        if (val !== undefined) {
          arg = '0x' + val.toString(16);
        }
      } else {
        arg = '0x' + arg.toString(16);
      }
    }

    if (path.endsWith('.template')) {
      arg = arg.replace(/\\n/g, '\n');//NOSONAR
    }

    if (arg !== undefined && adapter(arg) !== arg && adapter(arg) !== (arg > 0)) {
      argExc = {message: path + ' must be a "' + (typeof _.get(settings.defaults, path)) + '"'};
      throw argExc;
    }

    if (path === 'theme') {
      const possibleThemes = Object.keys(settings.defaults.themes);
      let isValid = false;
      for (let i = 0; i < possibleThemes.length; i++) {
        if (arg === possibleThemes[i]) {
          isValid = true;
          break;
        }
      }
      if (!isValid) {
        argExc = {message: `${path} must be one of [${possibleThemes}]`};
        throw argExc;
      }
    }
  }
  return arg;
};
var utilFunctions = new CLIUtils();

function SRVScenarioItem(_pdbID, _presetId, _delay, _description) {
  this.pdbId = -1;
  this.presetId = -1;
  this.delay = -1;
  this.description = '';

  if (_pdbID !== undefined) {
    this.pdbId = _pdbID;
  }

  if (_presetId !== undefined) {
    this.presetId = _presetId;
  }

  if (_delay !== undefined) {
    this.delay = _delay;
  }

  if (_description !== undefined) {
    this.description = _description;
  }

  return this;
}

function SRVScenarioScript() {
  this.scenarioId = -1;
  this.data = [];

  return this;
}

SRVScenarioScript.prototype.addItem = function(id, item) {
  this.scenarioId = id;
  this.data.push(item);
};

function SRVScenarioContext(_name) {
  this.id = -1;
  this.name = _name;
  this.script = new SRVScenarioScript();

  return this;
}

function SRVProxy() {
  this.isOnApllyPresetEventInitialized = false;
  this.scenarioContext = new SRVScenarioContext();
}

SRVProxy.prototype.requestScenarioID = function(miew, name, done, fail) {
  const self = this;

  function doneFindScenario(scenarioList) {
    if (scenarioList instanceof Array) {
      var availableItems = _.filter(scenarioList, function(item) {
        return item.name !== undefined &&
              item.name.toLowerCase() === name.toLowerCase() ||
              item.id === Number(name);
      });
      if (availableItems.length < 1) {
        if (fail !== undefined) {
          fail('File not found');
        }
        self.finish(miew);
      } else if (availableItems.length > 1) {
        if (fail !== undefined) {
          fail('There are two or more files, please specify one by file_id');
        }
        self.finish(miew);
      } else if (done !== undefined) {
        done(availableItems[0].id);
      } else {
        self.finish(miew);
      }
    } else {
      self.finish(miew);
    }
  }

  miew.awaitWhileCMDisInProcess();

  function failFindScenario(message) {
    if (message !== undefined) {
      if (fail !== undefined) {
        fail(message);
      }
    }
    self.finish(miew);
  }

  if (name !== undefined) {
    miew.srvScenarioList(doneFindScenario, failFindScenario);
  }
};

SRVProxy.prototype.requestPdbID = function(miew, path, done, fail) {
  var self = this;

  function doneFindTopology(topologyList) {
    if (topologyList instanceof Array) {
      if (topologyList.length < 1) {
        if (fail !== undefined) {
          fail('File not found');
        }
        self.finish(miew);
      } else if (topologyList.length > 1) {
        if (fail !== undefined) {
          fail('There are two or more files, please specify one by file_id');
        }
        self.finish(miew);
      } else if (done !== undefined) {
        done(topologyList[0].id);
      } else {
        self.finish(miew);
      }
    } else {
      self.finish(miew);
    }
  }

  function failFindTopology(message) {
    if (message !== undefined) {
      if (fail !== undefined) {
        fail(message);
      }
    }
    self.finish(miew);
  }

  var pathParts = path.split('/');
  miew.awaitWhileCMDisInProcess();

  if (pathParts.length !== 1) {
    if (fail !== undefined) {
      fail('Path can contain only file name or id');
    }
    self.finish(miew);
  } else {
    var pdbID = Number(pathParts[0]);
    if (!Number.isNaN(pdbID)) {
      done(pdbID);
    } else {
      miew.srvTopologyFind(pathParts[0], doneFindTopology, failFindTopology);
    }
  }
};

SRVProxy.prototype.requestPresetId = function(miew, path, done, fail) {
  var self = this;
  var pathParts = path.split('/');
  miew.awaitWhileCMDisInProcess();

  function failPdb(message) {
    if (message !== undefined) {
      if (fail !== undefined) {
        fail(message);
      }
    }
    self.finish(miew);
  }

  function donePdb(id) {
    miew.srvPresetList(id, donePresetList, failPdb);
  }

  function donePresetList(presetList) {
    if (presetList instanceof Array) {
      var availableItems = _.filter(presetList, function(item) {
        return item.name.toLowerCase() === pathParts[1].toLowerCase() || item.id === Number(pathParts[1]);
      });

      if (availableItems.length < 1) {
        if (fail !== undefined) {
          fail('Preset not found');
        }
        self.finish(miew);
      } else if (availableItems.length > 1) {
        if (fail !== undefined) {
          fail('There are two or more presets, please specify one by preset_id');
        }
        self.finish(miew);
      } else if (done !== undefined) {
        done(availableItems[0].id);
      } else {
        self.finish(miew);
      }
    } else {
      self.finish(miew);
    }
  }

  if (pathParts.length !== 2) {
    if (fail !== undefined) {
      fail('Path can has 2 levels only (pdb/preset)');
    }
    self.finish(miew);
  } else {
    this.requestPdbID(miew, pathParts[0], donePdb, failPdb);
  }
};

SRVProxy.prototype.createScenario = function(name) {
  this.scenarioContext = new SRVScenarioContext(name);
};

SRVProxy.prototype.resetScenario = function() {
  this.scenarioContext = new SRVScenarioContext();
};

SRVProxy.prototype.deleteScenario = function(miew, echo, error, name) {
  var self = this;

  this.init(miew, echo);
  miew.awaitWhileCMDisInProcess();

  function done(message) {
    if (message !== undefined) {
      echo(message);
    }
    self.finish(miew);
  }

  function fail(message) {
    if (message !== undefined) {
      error(message);
    }
    self.finish(miew);
  }

  function doWithID(id) {
    miew.srvScenarioDelete(id, done, fail);
    self.finish(miew);
  }

  if (typeof name === 'number') {
    doWithID(name);
  } else {
    this.requestScenarioID(miew, name, doWithID, fail);
  }
};

SRVProxy.prototype.listScenario = function(miew, echo, error, name) {
  var self = this;

  this.init(miew, echo);
  miew.awaitWhileCMDisInProcess();

  function done(scenarioList) {
    if (scenarioList instanceof Array) {
      var res = '';

      for (var i = 0, n = scenarioList.length; i < n; ++i) {
        var draw = name === undefined;
        var drawExpand = name === '-e' || scenarioList[i].id === Number(name) || scenarioList[i].name === name;

        if (draw || drawExpand) {
          res += 'id : ' + scenarioList[i].id + ', name : ' + scenarioList[i].name + '\n';
          if (drawExpand) {
            var data = JSON.parse(scenarioList[i].script).data;
            res += 'scenario : \n';
            for (var j = 0, m = data.length; j < m; ++j) {
              res += '    index : ' + j + '\n';
              res += '        pdbId       : ' + data[j].pdbId + '\n';
              res += '        presetId    : ' + data[j].presetId + '\n';
              res += '        delay       : ' + data[j].delay + '\n';
              res += '        description : ' + data[j].description + '\n';
            }
          }
        }
      }
      echo(res);
    }
    self.finish(miew);
  }

  function fail(message) {
    if (message !== undefined) {
      error(message);
    }
    self.finish(miew);
  }

  miew.srvScenarioList(done, fail);
};

SRVProxy.prototype.addScenarioItem = function(miew, echo, error) {
  var self = this;

  var selfArguments = arguments;

  this.init(miew, echo);
  miew.awaitWhileCMDisInProcess();

  function doneFindPdb(id) {
    if (id >= 0) {
      selfArguments[3] = id;
      self.addScenarioItem.apply(self, selfArguments);
    }
  }

  function doneFindPreset(id) {
    if (id >= 0) {
      selfArguments[4] = id;
      self.addScenarioItem.apply(self, selfArguments);
    }
  }

  function done(id, message) {
    self.scenarioContext.id = id;
    if (message !== undefined) {
      echo(message);
    }
    self.finish(miew);
  }

  function fail(message) {
    if (message !== undefined) {
      error(message);
    }
    self.finish(miew);
  }

  function doAddItem(pdbId, presetId, delay, desc) {
    self.scenarioContext.script.addItem(self.scenarioContext.id, new SRVScenarioItem(pdbId, presetId, delay, desc));
    miew.srvScenarioAdd(
      self.scenarioContext.id, self.scenarioContext.name,
      JSON.stringify(self.scenarioContext.script), done, fail
    );
  }

  if (self.scenarioContext.name === undefined) {
    fail('No scenario context created yet: use create_scenario <name>');
    self.finish(miew);
    return undefined;
  }


  if (arguments.length === 7) {
    var _pdb = arguments[3];
    var _preset = arguments[4];
    var _delay = arguments[5];
    var _desc = arguments[6];

    if (_.isString(_pdb)) {
      this.requestPdbID(miew, _pdb, doneFindPdb, fail);
    } else if (_.isString(_preset)) {
      this.requestPresetId(miew, _pdb + '/' + _preset, doneFindPreset, fail);
    } else if (typeof  _pdb === 'number' && typeof  _preset === 'number') {
      doAddItem(_pdb, _preset, _delay, _desc);
    } else {
      fail('Internal error');
      self.finish(miew);
      return undefined;
    }
  } else if (arguments.length === 5) {
    //proceed with pdb and preset id's
    error('not supported now');
    self.finish(miew);
    return undefined;
  } else {
    error('internal interpreter error');
    self.finish(miew);
    return undefined;
  }
  return undefined;
};

SRVProxy.prototype.init = function(miew, echo) {
  var self = this;

  if (!this.isOnApllyPresetEventInitialized) {
    miew.addEventListener('presetApplyFinished', function() {
      self.finish(miew);
      if (echo !== undefined) {
        echo('Preset applied');
      }
    });
    this.isOnApllyPresetEventInitialized = true;
  }
};

SRVProxy.prototype.finish = function(miew) {
  miew.finishAwaitingCMDInProcess();
};

//repIndexOrRepMap could be RepresentationMap or index
SRVProxy.prototype.fileList = function(miew, echo, error, fileId, idStarts) {
  var self = this;

  this.init(miew, echo);

  function done(list) {
    if (list !== undefined) {
      for (var i = 0; i < list.length; i++) {
        if (idStarts === undefined || list[i].name.toLowerCase().startsWith(idStarts.toLowerCase())) {
          echo(list[i].name + ', id= ' + list[i].id);
        }
      }
    }
    self.finish(miew);
  }

  function fail(message) {
    if (message !== undefined) {
      echo(message + '\n');
    }
    self.finish(miew);
  }

  miew.awaitWhileCMDisInProcess();

  if (fileId === undefined || fileId === '') {
    miew.srvTopologyAll(done, fail);
  } else {
    miew.srvPresetList(fileId, done, fail);
  }
};

SRVProxy.prototype.callSrvFunc = function(miew, echo, error, func) {
  var self = this;

  this.init(miew, echo);

  function done(message) {
    if (message !== undefined) {
      echo(message);
    }
    self.finish(miew);
  }

  function fail(message) {
    if (message !== undefined) {
      error(message);
    }
    self.finish(miew);
  }

  miew.awaitWhileCMDisInProcess();
  func =  miew[func];
  if (func !== undefined) {
    switch (arguments.length) {
    case 4:
      func.call(miew, done, fail);
      break;
    case 5:
      func.call(miew, arguments[4], done, fail);
      break;
    case 6:
      func.call(miew, arguments[4], arguments[5], done, fail);
      break;
    case 7:
      func.call(miew, arguments[4], arguments[5], arguments[6], done, fail);
      break;
    default:
      this.finish(miew);
    }
  } else {
    this.finish(miew);
  }
};

SRVProxy.prototype.coroutineWithPresetPath = function(miew, echo, error, path, callBack, arg) {
  var self = this;

  this.init(miew, echo);

  miew.awaitWhileCMDisInProcess();
  var pathParts = path.split('/');

  function done(message) {
    if (message !== undefined) {
      echo(message);
    }
    self.finish(miew);
  }

  function donePresetList(presetList) {
    if (presetList instanceof Array) {
      var availableItems = _.filter(presetList, function(item) {
        return item.name.toLowerCase() === pathParts[1].toLowerCase() || item.id === Number(pathParts[1]);
      });

      if (availableItems.length < 1) {
        error('Preset not found');
        self.finish(miew);
      } else if (availableItems.length > 1) {
        error('There are two or more presets, please specify one by preset_id');
        self.finish(miew);
      } else if (arg === undefined) {
        callBack.call(miew, availableItems[0].id, done, fail);
      } else {
        callBack.call(miew, availableItems[0].id, arg, done, fail);
      }
    } else {
      self.finish(miew);
    }
  }

  function doneFindTopology(topologyList) {
    if (topologyList instanceof Array) {
      if (topologyList.length < 1) {
        error('File not found');
        self.finish(miew);
      } else if (topologyList.length > 1) {
        error('There are two or more files, please specify one by file_id');
        self.finish(miew);
      } else {
        miew.srvPresetList(topologyList[0].id, donePresetList, fail);
      }
    } else {
      self.finish(miew);
    }
  }

  function fail(message) {
    if (message !== undefined) {
      error(message);
    }
    self.finish(miew);
  }


  if (pathParts.length !== 2) {
    error('Path can has 2 levels only (pdb/preset)');
    self.finish(miew);
  } else {
    miew.srvTopologyFind(pathParts[0], doneFindTopology, fail);
  }
};

SRVProxy.prototype.coroutineWithFileName = function(miew, echo, error, name, callBack) {
  var self = this;
  var selfArguments = arguments;

  this.init(miew);

  miew.awaitWhileCMDisInProcess();
  var pathParts = name.split('/');

  function done(message) {
    if (message !== undefined) {
      echo(message);
    }
    self.finish(miew);
  }

  function doneFindTopology(topologyList) {
    if (topologyList instanceof Array) {
      if (topologyList.length < 1) {
        error('File not found');
      } else if (topologyList.length > 1) {
        error('There are two or more files, please specify one by file_id');
      } else {
        switch (selfArguments.length) {
        case 5:
          callBack.call(miew, topologyList[0].id, done, fail);
          break;
        case 6:
          callBack.call(miew, topologyList[0].id, selfArguments[5], done, fail);
          break;
        case 9:
          callBack.call(selfArguments[5], selfArguments[6], selfArguments[7], selfArguments[8], topologyList[0].id);
          break;
        case 10:
          callBack.call(
            selfArguments[5], selfArguments[6], selfArguments[7],
            selfArguments[8], topologyList[0].id, selfArguments[9]
          );
          break;
        default:
          self.finish(miew);
        }
      }
    }

    self.finish(miew);
  }

  function fail(message) {
    if (message !== undefined) {
      error(message);
    }
    self.finish(miew);
  }

  if (pathParts.length !== 1) {
    error('Path can contain only file name or id');
    self.finish(miew);
  } else {
    miew.srvTopologyFind(pathParts[0], doneFindTopology, fail);
  }
};

var srvFunctions = new SRVProxy();

function CreateObjectPair(a, b) {
  var obj = {};
  obj[a] = b;
  return obj;
}

function keyRemap(key) {
  var keys = {
    s:  'selector',
    m:  'mode',
    c:  'colorer',
    mt: 'material',
    mode: 'modes',
    color: 'colorers',
    colorer: 'colorers',
    select : 'selector',
    material: 'materials',
    selector: 'selector',
  };
  var ans = keys[key];
  return ans === undefined ? key : ans;
}

function ArgList(arg) {
  if (arg instanceof this.constructor) {
    return arg;
  } else if (arg instanceof Array) {
    this._values = arg.slice(0);
  } else if (arg) {
    this._values = [arg];
  } else {
    this._values = [];
  }
}

ArgList.prototype.append = function(value) {
  var values = this._values;
  values[values.length] = value;
  return this;
};

ArgList.prototype.remove = function(value) {
  var values = this._values;
  var index = values.indexOf(value);
  if (index >= 0) {
    values.splice(index, 1);
  }
  return this;
};

ArgList.prototype.toJSO = function(utils, cmd, arg) {
  var res = {};

  var list = this._values;
  for (var i = 0, n = list.length; i < n; ++i) {
    _.set(res, list[i].id, utils.propagateProp(keyRemap(cmd) + '.' + arg + '.' + list[i].id, list[i].val));
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
cliutils.srv   = srvFunctions;

cliutils._ = _;
cliutils.CreateObjectPair = CreateObjectPair;
cliutils.keyRemap = keyRemap;
cliutils.Context = selectors.Context;
cliutils.ClearContext = selectors.ClearContext;

cliutils.NULL = NULL;

cliutils.notimplemented = function() {
  return this.NULL;
};

Miew.prototype.script = function(script, _printCallback, _errorCallback) {
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

Miew.prototype.awaitWhileCMDisInProcess = function() {
  this.commandInAction = true;
};

Miew.prototype.finishAwaitingCMDInProcess = function() {
  this.commandInAction = false;
};

Miew.prototype.isScriptingCommandAvailable = function() {
  return this.commandInAction !== undefined
        && !this.commandInAction
        && this.cmdQueue !== undefined
        && this.cmdQueue.length > 0;
};

Miew.prototype.callNextCmd = function() {
  if (this.isScriptingCommandAvailable()) {
    var cmd = this.cmdQueue.shift();

    var res = {};
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

Miew.JSONConverter = JSONConverter;

parsercli.yy = cliutils;
// FIXME: workaround for incorrect JISON parser generator for AMD module
parsercli.yy.parseError = parsercli.parseError;

