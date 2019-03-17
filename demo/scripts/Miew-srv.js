/* global PRESET_SERVER:false READONLY_SERVER */
import $ from 'jquery';
import _ from 'lodash';
import Miew from 'Miew'; // eslint-disable-line import/no-unresolved


const {
  settings,
  JSONConverter,
  chem: { selectors },
} = Miew;

settings.setPluginOpts('srv', {
  url: (typeof PRESET_SERVER !== 'undefined' && PRESET_SERVER) || '/restapi/',
});

/* FIXME This is a hacky solution */
function resetSettings() {
  const plugins = _.cloneDeep(settings.now.plugins);
  settings.reset();
  settings.set({ plugins });
}

// ATTENTION! Exactly this address is used in gulpfile.js, don't forget to change there too.
function getBaseUrl() {
  return settings.now.plugins.srv.url;
}
const LOCAL_DEBUG = true;

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
      const ref = document.createElement('a');
      ref.href = source;
      source = ref.href;
    }
  }
  return source;
}

Miew.prototype.srvPluginRegister = function () {
  this.addEventListener('load', (event) => {
    const opts = event && event.options;
    this._srvTopologyFile = opts && opts.topologyFile ? opts.topologyFile : null;
    this._srvAnimationFile = opts && opts.animationFile ? opts.animationFile : null;
    this._srvPreset = opts && opts.preset ? opts.preset : null;

    const { source } = event;
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

Miew.prototype.srvTopologyAll = function (done, fail) {
  const self = this;
  const request = $.get(`${getBaseUrl()}topology/all`, (result) => {
    if (result && result.status === 'OK' && result.payload) {
      self._topologyList = result.payload;
    } else {
      self._topologyList = [];
    }
  });

  let state = 'DONE';
  let message = null;

  return request.fail(() => {
    self._topologyList = [];
    state = 'FAILED';
    message = 'HTTP Request failed';
  }).always(() => {
    if (state === 'FAILED' && typeof fail === 'function') {
      fail(message);
    } else if (typeof done === 'function') {
      done(self._topologyList);
    }
  });
};

Miew.prototype.srvTopologyFilter = function (criteria, done, fail) {
  const self = this;
  const filterFn = function (list) {
    if (typeof done === 'function') {
      done(_.filter(list, item => item.name.toLowerCase().indexOf(criteria.toLowerCase()) === 0));
    }
  };
  if (!self._topologyList) {
    self.srvTopologyAll(filterFn, fail);
  } else {
    filterFn(self._topologyList);
  }
};

Miew.prototype.srvTopologyFind = function (name, done, fail) {
  if (!name) {
    done(null);
    return;
  }
  const self = this;
  const filterFn = function (list) {
    if (typeof done === 'function') {
      done(_.filter(list, item => item.name.toLowerCase() === name.toLowerCase()
        || item.source.toLowerCase() === name.toLowerCase()));
    }
  };
  if (!self._topologyList) {
    self.srvTopologyAll(filterFn, fail);
  } else {
    filterFn(self._topologyList);
  }
};

Miew.prototype.srvTopologyGetById = function (id, done, fail) {
  if (!id) {
    done(null);
    return;
  }
  const self = this;
  const filterFn = function (list) {
    const filterResult = _.filter(list, item => +(item.id) === +id);
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

Miew.prototype.srvCurrentTopologyIsRegistered = function (registered, notRegistered, onFail) {
  if (this._srvTopoSource && !this._srvTopologyFile) {
    const extractFileNameWithExtension = function (name) {
      let parts = name.toUpperCase().split('/');
      let lastPart = parts[parts.length - 1];
      parts = lastPart.split('\\');
      lastPart = parts[parts.length - 1];
      parts = lastPart.split('.');
      if (parts.length === 1) {
        return parts[0]; // PDB ID
      }
      return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    };
    const fName = extractFileNameWithExtension(this._srvTopoSource instanceof File
      ? this._srvTopoSource.name : this._srvTopoSource);
    this.srvTopologyFind(fName, (findResult) => {
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

Miew.prototype.srvTopologyRegister = function (done, fail) {
  if (typeof READONLY_SERVER !== 'undefined' && READONLY_SERVER) {
    return;
  }

  const self = this;

  const topoSource = self._srvTopoSource;
  const animSource = self._srvAnimSource;

  const onDone = function (success, state, message) {
    if (LOCAL_DEBUG) {
      const desc = state + (self._srvTopologyFile ? ` at #${String(self._srvTopologyFile.id)}` : '')
          + (message ? ` : ${message}` : '');
      self.logger.report(desc);
    }
    if (success) {
      self.srvPresetCreate('Default preset', done, fail);
    } else if (typeof fail === 'function') {
      fail(message);
    }
  };

  const notRegisteredFn = function () {
    let request;
    if (topoSource instanceof File) {
      // upload file contents via FormData
      request = $.ajax({
        type: 'POST',
        url: `${getBaseUrl()}file/upload`,
        data: (function () {
          const form = new FormData();
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
      request = $.post(`${getBaseUrl()}file/upload`, {
        topologyFile: topoSource,
      });
    }
    return request.done((result) => {
      const message = result && result.message ? result.message : null;
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
    }).fail(() => {
      self._srvTopologyFile = null;
      self._srvAnimationFile = null;
      onDone(false, 'FAILED', 'HTTP Request failed');
    });
  };

  const registeredFn = function (name) {
    onDone(false, 'FAILED', `${name} is already registered`);
  };

  const onFail = function (message) {
    onDone(false, 'FAILED', message);
  };

  self.srvCurrentTopologyIsRegistered(registeredFn, notRegisteredFn, onFail);
};

Miew.prototype.srvTopologyConvert = function (topologyFile, mdFile, done) {
  if (typeof READONLY_SERVER !== 'undefined' && READONLY_SERVER) {
    return null;
  }

  const request = $.ajax({
    type: 'POST',
    url: `${getBaseUrl()}file/convert`,
    data: (function () {
      const form = new FormData();
      form.append('topologyFile', topologyFile);
      form.append('mdFile', mdFile);
      return form;
    }()),
    processData: false,
    contentType: false,
    cache: false,
  });

  return request.done((result) => {
    let success = true;
    let message = null;
    const data = result;
    if (result.status && result.status === 'ERROR') {
      ({ message } = result);
      success = false;
    }
    done(success, data, message);
  }).fail(() => {
    done(false, null, 'HTTP Request failed');
  });
};

Miew.prototype.srvTopologyDelete = function (id, force, done, fail) {
  if (typeof READONLY_SERVER !== 'undefined' && READONLY_SERVER) {
    return;
  }

  const self = this;
  const onTopologyFound = function (topology) {
    const request = $.ajax({
      type: 'DELETE',
      url: `${getBaseUrl()}topology/${topology.id}?force=${force ? 'true' : 'false'}`,
      contentType: '',
      data: '',
    });
    return request.done((result) => {
      const responseMessage = result && result.message ? result.message : null;
      let success = false;
      if (result && result.status === 'OK') {
        success = true;
        const listElement = self._topologyList.filter(x => x.id === +id)[0];
        if (listElement) {
          const index = self._topologyList.indexOf(listElement);
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
    }).fail(() => {
      if (typeof fail === 'function') {
        fail('HTTP Request failed');
      }
    });
  };
  self.srvTopologyGetById(id, onTopologyFound, fail);
};

Miew.prototype.srvQuery = function (done, fail) {
  const self = this;
  const onDone = function (topology, state, message) {
    self._srvTopologyFile = topology;
    if (LOCAL_DEBUG) {
      const desc = state + (topology ? ` at #${String(topology.id)}` : '')
          + (message ? ` : ${message}` : '');
      self.logger.debug(desc);
    }
    if (topology && typeof done === 'function') {
      done(topology);
    } else if (!topology && typeof fail === 'function') {
      fail(message);
    }
  };
  const registered = function (name, topology) {
    onDone(topology, 'REGISTERED', null);
  };
  const notRegistered = function () {
    onDone(null, 'MISSING', null);
  };
  const onFail = function (message) {
    onDone(null, 'FAILURE', message);
  };
  this.srvCurrentTopologyIsRegistered(registered, notRegistered, onFail);
};

Miew.prototype.srvPresetList = function (pdbId, done, fail) {
  let presetsList = [];
  let error = null;
  const request = $.get(`${getBaseUrl()}preset/pdb/${pdbId}`, (result) => {
    if (result && result.status === 'OK' && result.payload) {
      presetsList = result.payload;
    }
  });

  return request.fail(() => {
    presetsList = [];
    error = 'HTTP Request failed';
  }).always(() => {
    if (!error && typeof done === 'function') {
      done(presetsList);
    } else if (error && typeof fail === 'function') {
      fail(error);
    }
  });
};

Miew.prototype.srvPresetGetById = function (id, done, fail) {
  let preset = null;
  let error = null;
  const request = $.get(`${getBaseUrl()}preset/${id}`, (result) => {
    if (result && result.status === 'OK' && result.payload) {
      preset = result.payload;
    }
  });

  return request.fail(() => {
    preset = null;
    error = 'HTTP Request failed';
  }).always(() => {
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

Miew.prototype.srvPresetRename = function (id, newName, done, fail) {
  if (typeof READONLY_SERVER !== 'undefined' && READONLY_SERVER) {
    return;
  }

  const presetFoundFn = function (preset) {
    const request = $.ajax({
      type: 'POST',
      url: `${getBaseUrl()}preset`,
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify({
        id: preset.id,
        name: newName,
        expression: preset.expression,
        pdbFile: {
          id: preset.pdbFile.id,
        },
      }),
    });
    return request.done((result) => {
      const responseMessage = result && result.message ? result.message : null;
      let success = false;
      if (result && result.status === 'OK') {
        success = true;
      }
      if (success && typeof done === 'function') {
        done(responseMessage);
      } else if (!success && typeof fail === 'function') {
        fail(responseMessage);
      }
    }).fail(() => {
      if (typeof fail === 'function') {
        fail('HTTP Request failed');
      }
    });
  };
  this.srvPresetGetById(id, presetFoundFn, fail);
};

Miew.prototype.srvPresetUpdate = function (id, done, fail) {
  if (typeof READONLY_SERVER !== 'undefined' && READONLY_SERVER) {
    return;
  }

  const self = this;
  const presetFoundFn = function (preset) {
    // generate preset data from the current state
    const opts = self.getState({ settings: true, view: true });
    delete opts.load;

    // convert selector strings to JSON
    if (opts.reps) {
      for (let i = 0, n = opts.reps.length; i < n; ++i) {
        const rep = opts.reps[i];
        if (rep.hasOwnProperty('selector')) {
          rep.selector = selectors.parse(rep.selector).selector;
          if (rep.selector.toJSON) {
            rep.selector = rep.selector.toJSON();
          }
        }
        if (rep.hasOwnProperty('mode')
            && Array.isArray(rep.mode)
            && rep.mode[1].hasOwnProperty('subset')) {
          const { selector } = selectors.parse(rep.mode[1].subset);
          if (selector.toJSON) {
            rep.mode[1].subset = selector.toJSON();
          }
        }
      }
    }

    preset.expression = JSON.stringify(opts);

    const request = $.ajax({
      type: 'POST',
      url: `${getBaseUrl()}preset`,
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify({
        id: preset.id,
        name: preset.name,
        expression: preset.expression,
        pdbFile: {
          id: preset.pdbFile.id,
        },
      }),
    });

    return request.done((result) => {
      const responseMessage = result && result.message ? result.message : null;
      let success = false;
      if (result && result.status === 'OK') {
        success = true;
      }
      if (success && typeof done === 'function') {
        done(responseMessage);
      } else if (!success && typeof fail === 'function') {
        fail(responseMessage);
      }
    }).fail(() => {
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

Miew.prototype.srvPresetCreate = function (name, done, fail) {
  if (typeof READONLY_SERVER !== 'undefined' && READONLY_SERVER) {
    return null;
  }

  // generate preset data from the current state
  const opts = this.getState({ settings: true, view: true });
  delete opts.load;

  // convert selector strings to JSON
  if (opts.reps) {
    for (let i = 0, n = opts.reps.length; i < n; ++i) {
      const rep = opts.reps[i];
      if (rep.hasOwnProperty('selector')) {
        rep.selector = selectors.parse(rep.selector).selector;
        if (rep.selector.toJSON) {
          rep.selector = rep.selector.toJSON();
        }
      }
      if (rep.hasOwnProperty('mode')
          && Array.isArray(rep.mode)
          && rep.mode[1].hasOwnProperty('subset')) {
        const { selector } = selectors.parse(rep.mode[1].subset);
        if (selector.toJSON) {
          rep.mode[1].subset = selector.toJSON();
        }
      }
    }
  }

  const self = this;

  const onDone = function (id, state, message) {
    if (LOCAL_DEBUG) {
      const desc = state + (id !== -1 ? ` at #${String(id)}` : '')
          + (message ? ` : ${message}` : '');
      self.logger.debug(desc);
    }
    if (id !== -1 && typeof done === 'function') {
      done(message);
    } else if (id === -1 && typeof fail === 'function') {
      fail(message);
    }
  };

  let request;
  if (!this._srvTopologyFile) {
    // skip if not correctly initialized yet
    request = $.Deferred().reject().promise(); // eslint-disable-line new-cap
  } else {
    const jsonData = {
      name,
      expression: JSON.stringify(opts),
      pdbFile: {
        id: this._srvTopologyFile.id,
      },
    };
    if (this._srvAnimationFile) {
      jsonData.mdFile = { id: this._srvAnimationFile.id };
    }
    request = $.ajax({
      type: 'POST',
      url: `${getBaseUrl()}preset`,
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify(jsonData),
    });
  }

  return request.done((result) => {
    const responseMessage = result && result.message ? result.message : null;
    let responseState = 'FAILURE';
    let id = -1;
    if (result && result.status === 'OK') {
      responseState = 'ADDED';
      id = result.payload ? result.payload.id : -1;
    }
    onDone(id, responseState, responseMessage);
  }).fail(() => {
    onDone(-1, 'FAILURE', 'HTTP Request failed');
  });
};

Miew.prototype.srvPresetApply = function (id, done, fail) {
  const self = this;
  const onPresetFoundFn = function (preset) {
    resetSettings();
    if (!self._srvTopologyFile || self._srvTopologyFile.id !== preset.pdbFile.id) {
      self.reset();
      self._opts.reps = null;
      self.applyPreset('empty'); // FIXME: Quick hack to solve double rebuild problem
      self.load(`${getBaseUrl()}topology/${preset.pdbFile.id}/download`, {
        fileType: 'pdb',
        sourceType: 'url',
        fileName: preset.pdbFile.path,
        topologyFile: preset.pdbFile,
        animationFile: preset.mdFile,
        preset,
      });
      return;
    }
    self._srvPreset = preset;
    // load electron density if available
    if (preset.elDensityFile) {
      self.loadEd(`${getBaseUrl()}edensity/${preset.elDensityFile.id}/download`);
    } else {
      self.resetEd();
    }
    // rebuild options for miew
    const opts = JSON.parse(preset.expression);
    // choose miew "preset" for base options
    let miewPreset;
    if (opts.hasOwnProperty('preset') && typeof settings.now.presets[opts.preset] !== 'undefined') {
      miewPreset = settings.now.presets[opts.preset];
    } else {
      miewPreset = settings.now.presets.default;
    }
    // build miew representations list
    if (opts.reps) {
      const converter = new JSONConverter();
      for (let i = 0, n = opts.reps.length; i < n; ++i) {
        const rep = opts.reps[i];
        const miewPresetRep = miewPreset[Math.min(i, miewPreset.length - 1)];
        rep.colorer = rep.colorer || miewPresetRep.colorer;
        rep.mode = rep.mode || miewPresetRep.mode;
        rep.material = rep.material || miewPresetRep.material;
        if (rep.hasOwnProperty('selector')) {
          rep.selector = converter.createSelectorFromNode(rep.selector);
        } else {
          rep.selector = miewPresetRep.selector;
        }
        if (rep.hasOwnProperty('mode')
            && Array.isArray(rep.mode)
            && rep.mode[1].hasOwnProperty('subset')) {
          const selector = converter.createSelectorFromNode(rep.mode[1].subset);
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
      self.dispatchEvent({ type: 'presetApplyFinished', msg: 'Preset applied' });
    }
  };

  if (typeof id === 'object') {
    // do not request preset from server if it's already retrieved, apply immediately
    onPresetFoundFn(id);
  } else {
    self.srvPresetGetById(id, onPresetFoundFn, fail);
  }
};

Miew.prototype.srvPresetDelete = function (id, done, fail) {
  if (typeof READONLY_SERVER !== 'undefined' && READONLY_SERVER) {
    return null;
  }

  const request = $.ajax({
    type: 'DELETE',
    url: `${getBaseUrl()}preset/${id}`,
    contentType: '',
    data: '',
  });

  return request.done((result) => {
    const responseMessage = result && result.message ? result.message : null;
    const success = result && result.status === 'OK';
    if (success && typeof done === 'function') {
      done(responseMessage);
    } else if (!success && typeof fail === 'function') {
      fail(responseMessage);
    }
  }).fail(() => {
    if (typeof fail === 'function') {
      fail('HTTP Request failed');
    }
  });
};

Miew.prototype.srvScenarioAdd = function (id, name, script, done, fail) {
  if (typeof READONLY_SERVER !== 'undefined' && READONLY_SERVER) {
    return null;
  }

  const self = this;
  const onDone = function (idLocal, state, message) {
    if (LOCAL_DEBUG) {
      const desc = state + (idLocal !== -1 ? ` at #${String(idLocal)}` : '')
          + (message ? ` : ${message}` : '');
      self.logger.debug(desc);
    }
    if (idLocal !== -1 && typeof done === 'function') {
      done(idLocal, message);
    } else if (idLocal === -1 && typeof fail === 'function') {
      fail(message);
    }
  };

  const jsonData = {
    name,
    script,
  };

  if (id >= 0) {
    jsonData.id = id;
  }

  const request = $.ajax({
    type: 'POST',
    url: `${getBaseUrl()}scenario`,
    contentType: 'application/json; charset=utf-8',
    data: JSON.stringify(jsonData),
  });

  return request.done((result) => {
    const responseMessage = result && result.message ? result.message : null;
    let responseState = 'FAILURE';
    let idLocal = -1;
    if (result && result.status === 'OK') {
      responseState = 'ADDED';
      idLocal = result.payload ? result.payload.id : -1;
    }
    onDone(idLocal, responseState, responseMessage);
  }).fail(() => {
    onDone(-1, 'FAILURE', 'HTTP Request failed');
  });
};

Miew.prototype.srvScenarioDelete = function (id, done, fail) {
  if (typeof READONLY_SERVER !== 'undefined' && READONLY_SERVER) {
    return null;
  }

  const request = $.ajax({
    type: 'DELETE',
    url: `${getBaseUrl()}scenario/?scenarioId=${id}`,
    contentType: '',
    data: '',
  });

  return request.done((result) => {
    const responseMessage = result && result.message ? result.message : null;
    const success = result && result.status === 'OK';
    if (success && typeof done === 'function') {
      done(responseMessage);
    } else if (!success && typeof fail === 'function') {
      fail(responseMessage);
    }
  }).fail(() => {
    if (typeof fail === 'function') {
      fail('HTTP Request failed');
    }
  });
};

Miew.prototype.srvScenarioList = function (done, fail) {
  let scenarioList = [];
  let error = null;
  const request = $.get(`${getBaseUrl()}scenario`, (result) => {
    if (result && result.status === 'OK' && result.payload) {
      scenarioList = result.payload;
    }
  });

  return request.fail(() => {
    scenarioList = [];
    error = 'HTTP Request failed';
  }).always(() => {
    if (!error && typeof done === 'function') {
      done(scenarioList);
    } else if (error && typeof fail === 'function') {
      fail(error);
    }
  });
};

Miew.prototype.srvStreamMdFn = function (mdFile, pdbFile) {
  const streamRegisteredMdFn = function (params, done, fail) {
    const everyFrame = params && params.everyFrame !== undefined ? params.everyFrame : 1;
    const recalculateSecondaryStructure = params && params.recalculateSecondaryStructure !== undefined
      ? params.recalculateSecondaryStructure : 0;
    const start = params && params.start !== undefined ? params.start : null;
    const end = params && params.end !== undefined ? params.end : null;
    let requestUrl = `${getBaseUrl()
    }md/${mdFile.id
    }/download?pdbId=${pdbFile.id
    }&everyFrame=${everyFrame
    }&recalculateSecondaryStructure=${recalculateSecondaryStructure}`;
    if (start) {
      requestUrl += `&start=${start}`;
    }
    if (end) {
      requestUrl += `&end=${end}`;
    }

    const xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.onerror = function (error) {
      if (typeof fail === 'function') {
        fail(error);
      }
    };
    xhr.onload = function () {
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

  const streamNotRegisteredMdFn = function (params, done, fail) {
    const everyFrame = params && params.everyFrame !== undefined ? params.everyFrame : 1;
    const recalculateSecondaryStructure = params && params.recalculateSecondaryStructure !== undefined
      ? params.recalculateSecondaryStructure : 0;
    const start = params && params.start !== undefined ? params.start : null;
    const end = params && params.end !== undefined ? params.end : null;

    const form = new FormData();
    form.append('topologyFile', pdbFile);
    form.append('mdFile', mdFile);
    form.append('everyFrame', everyFrame);
    form.append('recalculateSecondaryStructure', recalculateSecondaryStructure);
    form.append('start', start);
    form.append('end', end);

    const xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.onerror = function (error) {
      if (typeof fail === 'function') {
        fail(error);
      }
    };
    xhr.onload = function () {
      if (xhr.status === 200) {
        if (typeof done === 'function') {
          done(xhr.response);
        }
      } else if (typeof fail === 'function') {
        fail('HTTP Request error');
      }
    };
    xhr.open('POST', `${getBaseUrl()}md/stream`, true);
    xhr.send(form);
  };

  if (typeof mdFile === 'string' && pdbFile instanceof File) {
    return streamNotRegisteredMdFn;
  }
  return streamRegisteredMdFn;
};
