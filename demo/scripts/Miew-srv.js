/* global PRESET_SERVER:false */


//////////////////////////////////////////////////////////////////////////////
import $ from 'jquery';
import _ from 'lodash';
import Miew from 'Miew';


var
  settings = Miew.settings,
  selectors = Miew.chem.selectors,
  JSONConverter = Miew.JSONConverter;

settings.setPluginOpts('srv', {
  url: typeof PRESET_SERVER !== 'undefined' && PRESET_SERVER || '/restapi/',
});

/* FIXME This is a hacky solution */
function resetSettings() {
  var plugins = _.cloneDeep(settings.now.plugins);
  settings.reset();
  _.merge(settings.now.plugins, plugins);
}

//////////////////////////////////////////////////////////////////////////////

// ATTENTION! Exactly this address is used in gulpfile.js, don't forget to change there too.
function getBaseUrl() {
  return settings.now.plugins.srv.url;
}
var LOCAL_DEBUG = true;

function srvNormalizeSource(source) {
  // special translation for local data files
  if (typeof source === 'string') {
    if (source.match(/^[0-9A-Z]{4}$/i)) {
      // normalize if PDBID
      source = source.toUpperCase();
    } else if (source.match(/^data\/[0-9A-Z]{4}\.pdb$/i)) {
      // extract PDBID for cached files
      source = source.substr(5, 4).toUpperCase();
    } else {
      // otherwise use neat hack to restore the full url (https://gist.github.com/jlong/2428561)
      var ref = document.createElement('a');
      ref.href = source;
      source = ref.href;
    }
  }
  return source;
}

Miew.prototype.srvPluginRegister = function() {
  this.addEventListener('load', (event) => {
    const opts = event && event.options;
    this._srvTopologyFile = opts && opts.topologyFile ? opts.topologyFile : null;
    this._srvAnimationFile = opts && opts.animationFile ? opts.animationFile : null;
    this._srvPreset = opts && opts.preset ? opts.preset : null;

    const source = event.source;
    if (source instanceof File && source.name.match(/.man$/i)) {
      this._srvAnimSource = srvNormalizeSource(source);
    } else {
      this._srvTopoSource = srvNormalizeSource(source);
    }
    if (opts && opts.mdFile) {
      this._srvAnimSource = opts.mdFile;
    }
  });
};

Miew.registeredPlugins.push(Miew.prototype.srvPluginRegister);

Miew.prototype.srvTopologyAll = function(done, fail) {
  var self = this;
  var request = $.get(getBaseUrl() + 'topology/all', function(result) {
    if (result && result.status === 'OK' && result.payload) {
      self._topologyList = result.payload;
    } else {
      self._topologyList = [];
    }
  });

  var state = 'DONE';
  var message = null;

  return request.fail(function() {
    self._topologyList = [];
    state = 'FAILED';
    message = 'HTTP Request failed';
  }).always(function() {
    if (state === 'FAILED' && typeof fail === 'function') {
      fail(message);
    } else if (typeof done === 'function') {
      done(self._topologyList);
    }
  });
};

Miew.prototype.srvTopologyFilter = function(criteria, done, fail) {
  var self = this;
  var filterFn = function(list) {
    if (typeof done === 'function') {
      done(_.filter(list, function(item) {
        return item.name.toLowerCase().indexOf(criteria.toLowerCase()) === 0;
      }));
    }
  };
  if (!self._topologyList) {
    self.srvTopologyAll(filterFn, fail);
  } else {
    filterFn(self._topologyList);
  }
};

Miew.prototype.srvTopologyFind = function(name, done, fail) {
  if (!name) {
    done(null);
    return;
  }
  var self = this;
  var filterFn = function(list) {
    if (typeof done === 'function') {
      done(_.filter(list, function(item) {
        return item.name.toLowerCase() === name.toLowerCase() || item.source.toLowerCase() === name.toLowerCase();
      }));
    }
  };
  if (!self._topologyList) {
    self.srvTopologyAll(filterFn, fail);
  } else {
    filterFn(self._topologyList);
  }
};

Miew.prototype.srvTopologyGetById = function(id, done, fail) {
  if (!id) {
    done(null);
    return;
  }
  var self = this;
  var filterFn = function(list) {
    var filterResult = _.filter(list, function(item) {
      return +(item.id) === +id;
    });
    if (filterResult && filterResult.length === 1 && typeof done === 'function') {
      done(filterResult[0]);
    } else if ((!filterResult || filterResult.length !== 1) && typeof fail === 'function') {
      fail('Topology not found');
    }
  };
  if (!self._topologyList) {
    self.srvTopologyAll(filterFn, fail);
  } else {
    filterFn(self._topologyList);
  }
};

Miew.prototype.srvCurrentTopologyIsRegistered = function(registered, notRegistered, onFail) {
  if (this._srvTopoSource && !this._srvTopologyFile) {
    var extractFileNameWithExtension = function(name) {
      var parts = name.toUpperCase().split('/');
      var lastPart = parts[parts.length - 1];
      parts = lastPart.split('\\');
      lastPart = parts[parts.length - 1];
      parts = lastPart.split('.');
      if (parts.length === 1) {
        return parts[0]; // PDB ID
      }
      return parts[parts.length - 2] + '.' + parts[parts.length - 1];
    };
    var fName = extractFileNameWithExtension(this._srvTopoSource instanceof File ?
      this._srvTopoSource.name : this._srvTopoSource);
    this.srvTopologyFind(fName, function(findResult) {
      if (findResult && findResult.length > 0) {
        registered(fName, findResult[0]);
      } else {
        notRegistered(fName);
      }
    }, onFail);
  } else if (this._srvTopologyFile) {
    registered(this._srvTopologyFile.name, this._srvTopologyFile);
  } else {
    notRegistered();
  }
};

Miew.prototype.srvTopologyRegister = function(done, fail) {
  if (typeof READONLY_SERVER !== 'undefined' && READONLY_SERVER) {
    return;
  }

  var self = this;

  var topoSource = self._srvTopoSource;
  var animSource = self._srvAnimSource;

  var onDone = function(success, state, message) {
    if (LOCAL_DEBUG) {
      var desc = state + (self._srvTopologyFile ? ' at #' + String(self._srvTopologyFile.id) : '') +
          (message ? ' : ' + message : '');
      self.logger.report(desc);
    }
    if (success) {
      self.srvPresetCreate('Default preset', done, fail);
    } else if (typeof fail === 'function') {
      fail(message);
    }
  };

  var notRegisteredFn = function() {
    var request;
    if (topoSource instanceof File) {
      // upload file contents via FormData
      request = $.ajax({
        type: 'POST',
        url: getBaseUrl() + 'file/upload',
        data: (function() {
          var form = new FormData();
          form.append('topologyFile', topoSource);
          if (animSource) {
            form.append('mdFile', animSource);
          }
          return form;
        }()),
        processData: false,
        contentType: false,
        cache: false,
      });
    } else {
      // send just a file reference
      request = $.post(getBaseUrl() + 'file/upload', {
        topologyFile: topoSource
      });
    }
    return request.done(function(result) {
      var message = result && result.message ? result.message : null;
      if (result && result.status === 'OK' && result.payload && result.payload.pdbFile) {
        self._srvTopologyFile = result.payload.pdbFile;
        self._srvAnimationFile = result.payload.mdFile;
        if (self._topologyList) {
          self._topologyList.push(self._srvTopologyFile);
        }
        onDone(true, 'REGISTERED', message);
      } else {
        onDone(false, 'FAILED', message);
      }
    }).fail(function() {
      self._srvTopologyFile = null;
      self._srvAnimationFile = null;
      onDone(false, 'FAILED', 'HTTP Request failed');
    });
  };

  var registeredFn = function(name) {
    onDone(false, 'FAILED', name + ' is already registered');
  };

  var onFail = function(message) {
    onDone(false, 'FAILED', message);
  };

  self.srvCurrentTopologyIsRegistered(registeredFn, notRegisteredFn, onFail);
};

Miew.prototype.srvTopologyConvert = function(topologyFile, mdFile, done) {
  if (typeof READONLY_SERVER !== 'undefined' && READONLY_SERVER) {
    return null;
  }

  var request = $.ajax({
    type: 'POST',
    url: getBaseUrl() + 'file/convert',
    data: (function() {
      var form = new FormData();
      form.append('topologyFile', topologyFile);
      form.append('mdFile', mdFile);
      return form;
    }()),
    processData: false,
    contentType: false,
    cache: false,
  });

  return request.done(function(result) {
    var success = true;
    var message = null;
    var data = result;
    if (result.status && result.status === 'ERROR') {
      message = result.message;
      success = false;
    }
    done(success, data, message);
  }).fail(function() {
    done(false, null, 'HTTP Request failed');
  });
};

Miew.prototype.srvTopologyDelete = function(id, force, done, fail) {
  if (typeof READONLY_SERVER !== 'undefined' && READONLY_SERVER) {
    return;
  }

  var self = this;
  var onTopologyFound = function(topology) {
    var request = $.ajax({
      type: 'DELETE',
      url: getBaseUrl() + 'topology/' + topology.id + '?force=' + (force ? 'true' : 'false'),
      contentType: '',
      data: ''
    });
    return request.done(function(result) {
      var responseMessage = result && result.message ? result.message : null;
      var success = false;
      if (result && result.status === 'OK') {
        success = true;
        var listElement = self._topologyList.filter(function(x) {
          return x.id === +id;
        })[0];
        if (listElement) {
          var index = self._topologyList.indexOf(listElement);
          if (index >= 0) {
            self._topologyList.splice(index, 1);
          }
        }
        if (self._srvTopologyFile && self._srvTopologyFile.id === +id) {
          self._srvTopologyFile = null;
        }
      }
      if (success && typeof done === 'function') {
        done(responseMessage);
      } else if (!success && typeof fail === 'function') {
        fail(responseMessage);
      }
    }).fail(function() {
      if (typeof fail === 'function') {
        fail('HTTP Request failed');
      }
    });
  };
  self.srvTopologyGetById(id, onTopologyFound, fail);
};

Miew.prototype.srvQuery = function(done, fail) {
  var self = this;
  var onDone = function(topology, state, message) {
    self._srvTopologyFile = topology;
    if (LOCAL_DEBUG) {
      var desc = state + (topology ? ' at #' + String(topology.id) : '') +
          (message ? ' : ' + message : '');
      self.logger.debug(desc);
    }
    if (topology && typeof done === 'function') {
      done(topology);
    } else if (!topology && typeof fail === 'function') {
      fail(message);
    }
  };
  var registered = function(name, topology) {
    onDone(topology, 'REGISTERED', null);
  };
  var notRegistered = function() {
    onDone(null, 'MISSING', null);
  };
  var onFail = function(message) {
    onDone(null, 'FAILURE', message);
  };
  this.srvCurrentTopologyIsRegistered(registered, notRegistered, onFail);
};

Miew.prototype.srvPresetList = function(pdbId, done, fail) {
  var presetsList = [];
  var error = null;
  var request = $.get(getBaseUrl() + 'preset/pdb/' + pdbId, function(result) {
    if (result && result.status === 'OK' && result.payload) {
      presetsList = result.payload;
    }
  });

  return request.fail(function() {
    presetsList = [];
    error = 'HTTP Request failed';
  }).always(function() {
    if (!error && typeof done === 'function') {
      done(presetsList);
    } else if (error && typeof fail === 'function') {
      fail(error);
    }
  });
};

Miew.prototype.srvPresetGetById = function(id, done, fail) {
  var preset = null;
  var error = null;
  var request = $.get(getBaseUrl() + 'preset/' + id, function(result) {
    if (result && result.status === 'OK' && result.payload) {
      preset = result.payload;
    }
  });

  return request.fail(function() {
    preset = null;
    error = 'HTTP Request failed';
  }).always(function() {
    if (preset && typeof done === 'function') {
      done(preset);
    } else if (!preset && typeof fail === 'function') {
      if (error) {
        fail(error);
      } else {
        fail('Preset not found');
      }
    }
  });
};

Miew.prototype.srvPresetRename = function(id, newName, done, fail) {
  if (typeof READONLY_SERVER !== 'undefined' && READONLY_SERVER) {
    return;
  }

  var presetFoundFn = function(preset) {
    var request = $.ajax({
      type: 'POST',
      url: getBaseUrl() + 'preset',
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify({
        id: preset.id,
        name: newName,
        expression: preset.expression,
        pdbFile: {
          id: preset.pdbFile.id
        }
      })
    });
    return request.done(function(result) {
      var responseMessage = result && result.message ? result.message : null;
      var success = false;
      if (result && result.status === 'OK') {
        success = true;
      }
      if (success && typeof done === 'function') {
        done(responseMessage);
      } else if (!success && typeof fail === 'function') {
        fail(responseMessage);
      }
    }).fail(function() {
      if (typeof fail === 'function') {
        fail('HTTP Request failed');
      }
    });
  };
  this.srvPresetGetById(id, presetFoundFn, fail);
};

Miew.prototype.srvPresetUpdate = function(id, done, fail) {
  if (typeof READONLY_SERVER !== 'undefined' && READONLY_SERVER) {
    return;
  }

  var self = this;
  var presetFoundFn = function(preset) {
    // generate preset data from the current state
    var opts = self.getState({settings: true, view: true});
    delete opts.load;

    // convert selector strings to JSON
    if (opts.reps) {
      for (var i = 0, n = opts.reps.length; i < n; ++i) {
        var rep = opts.reps[i];
        if (rep.hasOwnProperty('selector')) {
          rep.selector = selectors.parse(rep.selector).selector;
          if (rep.selector.toJSON) {
            rep.selector = rep.selector.toJSON();
          }
        }
        if (rep.hasOwnProperty('mode') &&
            Array.isArray(rep.mode) &&
            rep.mode[1].hasOwnProperty('subset')) {
          var selector = selectors.parse(rep.mode[1].subset).selector;
          if (selector.toJSON) {
            rep.mode[1].subset = selector.toJSON();
          }
        }
      }
    }

    preset.expression = JSON.stringify(opts);

    var request = $.ajax({
      type: 'POST',
      url: getBaseUrl() + 'preset',
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify({
        id: preset.id,
        name: preset.name,
        expression: preset.expression,
        pdbFile: {
          id: preset.pdbFile.id
        }
      })
    });

    return request.done(function(result) {
      var responseMessage = result && result.message ? result.message : null;
      var success = false;
      if (result && result.status === 'OK') {
        success = true;
      }
      if (success && typeof done === 'function') {
        done(responseMessage);
      } else if (!success && typeof fail === 'function') {
        fail(responseMessage);
      }
    }).fail(function() {
      if (typeof fail === 'function') {
        fail('HTTP Request failed');
      }
    });
  };
  if (id === null && self._srvPreset) {
    this.srvPresetGetById(self._srvPreset.id, presetFoundFn, fail);
  } else if (id !== null) {
    this.srvPresetGetById(id, presetFoundFn, fail);
  } else {
    fail('No preset for update');
  }
};

Miew.prototype.srvPresetCreate = function(name, done, fail) {
  if (typeof READONLY_SERVER !== 'undefined' && READONLY_SERVER) {
    return null;
  }

  // generate preset data from the current state
  var opts = this.getState({settings: true, view: true});
  delete opts.load;

  // convert selector strings to JSON
  if (opts.reps) {
    for (var i = 0, n = opts.reps.length; i < n; ++i) {
      var rep = opts.reps[i];
      if (rep.hasOwnProperty('selector')) {
        rep.selector = selectors.parse(rep.selector).selector;
        if (rep.selector.toJSON) {
          rep.selector = rep.selector.toJSON();
        }
      }
      if (rep.hasOwnProperty('mode') &&
          Array.isArray(rep.mode) &&
          rep.mode[1].hasOwnProperty('subset')) {
        var selector = selectors.parse(rep.mode[1].subset).selector;
        if (selector.toJSON) {
          rep.mode[1].subset = selector.toJSON();
        }
      }
    }
  }

  var self = this;

  var onDone = function(id, state, message) {
    if (LOCAL_DEBUG) {
      var desc = state + (id !== -1 ? ' at #' + String(id) : '') +
          (message ? ' : ' + message : '');
      self.logger.debug(desc);
    }
    if (id !== -1 && typeof done === 'function') {
      done(message);
    } else if (id === -1 && typeof fail === 'function') {
      fail(message);
    }
  };

  var request;
  if (!this._srvTopologyFile) {
    // skip if not correctly initialized yet
    request = $.Deferred().reject().promise(); // eslint-disable-line new-cap
  } else {
    var jsonData = {
      name: name,
      expression: JSON.stringify(opts),
      pdbFile: {
        id: this._srvTopologyFile.id
      },
    };
    if (this._srvAnimationFile) {
      jsonData.mdFile = {id: this._srvAnimationFile.id};
    }
    request = $.ajax({
      type: 'POST',
      url: getBaseUrl() + 'preset',
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify(jsonData)
    });
  }

  return request.done(function(result) {
    var responseMessage = result && result.message ? result.message : null;
    var responseState = 'FAILURE';
    var id = -1;
    if (result && result.status === 'OK') {
      responseState = 'ADDED';
      id = result.payload ? result.payload.id : -1;
    }
    onDone(id, responseState, responseMessage);
  }).fail(function() {
    onDone(-1, 'FAILURE', 'HTTP Request failed');
  });
};

Miew.prototype.srvPresetApply = function(id, done, fail) {
  var self = this;
  var onPresetFoundFn = function(preset) {
    resetSettings();
    if (!self._srvTopologyFile || self._srvTopologyFile.id !== preset.pdbFile.id) {
      self.reset();
      self._opts.reps = null;
      self.applyPreset('empty'); // FIXME: Quick hack to solve double rebuild problem
      self.load(getBaseUrl() + 'topology/' + preset.pdbFile.id + '/download', {
        fileType: 'pdb',
        sourceType: 'url',
        fileName: preset.pdbFile.path,
        topologyFile: preset.pdbFile,
        animationFile: preset.mdFile,
        preset: preset
      });
      return;
    }
    self._srvPreset = preset;
    // load electron density if available
    if (preset.elDensityFile) {
      self.loadEd(getBaseUrl() + 'edensity/' + preset.elDensityFile.id + '/download');
    } else {
      self.resetEd();
    }
    // rebuild options for miew
    var opts = JSON.parse(preset.expression);
    // choose miew "preset" for base options
    var miewPreset;
    if (opts.hasOwnProperty('preset') && typeof settings.now.presets[opts.preset] !== 'undefined') {
      miewPreset = settings.now.presets[opts.preset];
    } else {
      miewPreset = settings.now.presets.default;
    }
    // build miew representations list
    if (opts.reps) {
      var converter = new JSONConverter();
      for (var i = 0, n = opts.reps.length; i < n; ++i) {
        var rep = opts.reps[i];
        var miewPresetRep = miewPreset[Math.min(i, miewPreset.length - 1)];
        rep.colorer = rep.colorer || miewPresetRep.colorer;
        rep.mode = rep.mode || miewPresetRep.mode;
        rep.material = rep.material || miewPresetRep.material;
        if (rep.hasOwnProperty('selector')) {
          rep.selector = converter.createSelectorFromNode(rep.selector);
        } else {
          rep.selector = miewPresetRep.selector;
        }
        if (rep.hasOwnProperty('mode') &&
            Array.isArray(rep.mode) &&
            rep.mode[1].hasOwnProperty('subset')) {
          var selector = converter.createSelectorFromNode(rep.mode[1].subset);
          if (selector !== null) {
            rep.mode[1].subset = selector.toString();
          }
        }
      }
    }

    if (!opts.reps && opts.hasOwnProperty('preset') && typeof settings.now.presets[opts.preset] !== 'undefined') {
      opts.reps = miewPreset;
    }
    // set new representations to miew
    if (self._complexVisual) {
      self._complexVisual.getComplex().resetAtomMask(0);
    }
    self.setOptions(opts);
    if (preset.mdFile) {
      self._startMdAnimation(preset.mdFile, preset.pdbFile);
    }
    if (typeof done === 'function') {
      done('Preset applied');
    } else {
      self.dispatchEvent({type: 'presetApplyFinished', msg: 'Preset applied'});
    }
  };

  if (typeof id === 'object') {
    // do not request preset from server if it's already retrieved, apply immediately
    onPresetFoundFn(id);
  } else {
    self.srvPresetGetById(id, onPresetFoundFn, fail);
  }
};

Miew.prototype.srvPresetDelete = function(id, done, fail) {
  if (typeof READONLY_SERVER !== 'undefined' && READONLY_SERVER) {
    return null;
  }

  var request = $.ajax({
    type: 'DELETE',
    url: getBaseUrl() + 'preset/' + id,
    contentType: '',
    data: ''
  });

  return request.done(function(result) {
    var responseMessage = result && result.message ? result.message : null;
    var success = result && result.status === 'OK';
    if (success && typeof done === 'function') {
      done(responseMessage);
    } else if (!success && typeof fail === 'function') {
      fail(responseMessage);
    }
  }).fail(function() {
    if (typeof fail === 'function') {
      fail('HTTP Request failed');
    }
  });
};

Miew.prototype.srvScenarioAdd = function(id, name, script, done, fail) {
  if (typeof READONLY_SERVER !== 'undefined' && READONLY_SERVER) {
    return null;
  }

  var self = this;
  var onDone = function(idLocal, state, message) {
    if (LOCAL_DEBUG) {
      var desc = state + (idLocal !== -1 ? ' at #' + String(idLocal) : '') +
          (message ? ' : ' + message : '');
      self.logger.debug(desc);
    }
    if (idLocal !== -1 && typeof done === 'function') {
      done(idLocal, message);
    } else if (idLocal === -1 && typeof fail === 'function') {
      fail(message);
    }
  };

  var jsonData = {
    'name': name,
    'script' : script
  };

  if (id >= 0) {
    jsonData.id = id;
  }

  var request = $.ajax({
    type: 'POST',
    url: getBaseUrl() + 'scenario',
    contentType: 'application/json; charset=utf-8',
    data: JSON.stringify(jsonData)
  });

  return request.done(function(result) {
    var responseMessage = result && result.message ? result.message : null;
    var responseState = 'FAILURE';
    var idLocal = -1;
    if (result && result.status === 'OK') {
      responseState = 'ADDED';
      idLocal = result.payload ? result.payload.id : -1;
    }
    onDone(idLocal, responseState, responseMessage);
  }).fail(function() {
    onDone(-1, 'FAILURE', 'HTTP Request failed');
  });
};

Miew.prototype.srvScenarioDelete = function(id, done, fail) {
  if (typeof READONLY_SERVER !== 'undefined' && READONLY_SERVER) {
    return null;
  }

  var request = $.ajax({
    type: 'DELETE',
    url: getBaseUrl() + 'scenario/?scenarioId=' + id,
    contentType: '',
    data: ''
  });

  return request.done(function(result) {
    var responseMessage = result && result.message ? result.message : null;
    var success = result && result.status === 'OK';
    if (success && typeof done === 'function') {
      done(responseMessage);
    } else if (!success && typeof fail === 'function') {
      fail(responseMessage);
    }
  }).fail(function() {
    if (typeof fail === 'function') {
      fail('HTTP Request failed');
    }
  });
};

Miew.prototype.srvScenarioList = function(done, fail) {
  var scenarioList = [];
  var error = null;
  var request = $.get(getBaseUrl() + 'scenario', function(result) {
    if (result && result.status === 'OK' && result.payload) {
      scenarioList = result.payload;
    }
  });

  return request.fail(function() {
    scenarioList = [];
    error = 'HTTP Request failed';
  }).always(function() {
    if (!error && typeof done === 'function') {
      done(scenarioList);
    } else if (error && typeof fail === 'function') {
      fail(error);
    }
  });
};

Miew.prototype.srvStreamMdFn = function(mdFile, pdbFile) {
  var streamRegisteredMdFn = function(params, done, fail) {
    var everyFrame = params && params.everyFrame !== undefined ? params.everyFrame : 1;
    var recalculateSecondaryStructure = params && params.recalculateSecondaryStructure !== undefined ?
      params.recalculateSecondaryStructure : 0;
    var start = params && params.start !== undefined ? params.start : null;
    var end = params && params.end !== undefined ? params.end : null;
    var requestUrl = getBaseUrl() +
        'md/' + mdFile.id +
        '/download?pdbId=' + pdbFile.id +
        '&everyFrame=' + everyFrame +
        '&recalculateSecondaryStructure=' + recalculateSecondaryStructure;
    if (start) {
      requestUrl += '&start=' + start;
    }
    if (end) {
      requestUrl += '&end=' + end;
    }

    var xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.onerror = function(error) {
      if (typeof fail === 'function') {
        fail(error);
      }
    };
    xhr.onload = function() {
      if (xhr.status === 200) {
        if (typeof done === 'function') {
          done(xhr.response);
        }
      } else if (typeof fail === 'function') {
        fail('HTTP Request error');
      }
    };
    xhr.open('GET', requestUrl, true);
    xhr.send();
  };

  var streamNotRegisteredMdFn = function(params, done, fail) {
    var everyFrame = params && params.everyFrame !== undefined ? params.everyFrame : 1;
    var recalculateSecondaryStructure = params && params.recalculateSecondaryStructure !== undefined ?
      params.recalculateSecondaryStructure : 0;
    var start = params && params.start !== undefined ? params.start : null;
    var end = params && params.end !== undefined ? params.end : null;

    var form = new FormData();
    form.append('topologyFile', pdbFile);
    form.append('mdFile', mdFile);
    form.append('everyFrame', everyFrame);
    form.append('recalculateSecondaryStructure', recalculateSecondaryStructure);
    form.append('start', start);
    form.append('end', end);

    var xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.onerror = function(error) {
      if (typeof fail === 'function') {
        fail(error);
      }
    };
    xhr.onload = function() {
      if (xhr.status === 200) {
        if (typeof done === 'function') {
          done(xhr.response);
        }
      } else if (typeof fail === 'function') {
        fail('HTTP Request error');
      }
    };
    xhr.open('POST', getBaseUrl() + 'md/stream', true);
    xhr.send(form);
  };

  if (typeof mdFile === 'string' && pdbFile instanceof File) {
    return streamNotRegisteredMdFn;
  } else {
    return streamRegisteredMdFn;
  }
};

