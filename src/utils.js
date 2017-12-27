

import _ from 'lodash';
import logger from './utils/logger';

////////////////////////////////////////////////////////////////////////////
// Timer

function Timer() {
  this.startTime = 0;
  this.oldTime = 0;
  this.elapsedTime = 0;
  this.running = false;
}

Timer.now = (function() {
  var p = typeof window !== 'undefined' && window.performance;
  return (p && p.now) ? p.now.bind(p) : Date.now;
})();

Timer.prototype = {
  constructor: Timer,

  start: function() {
    this.startTime = Timer.now();
    this.oldTime = this.startTime;
    this.running = true;
  },

  stop: function() {
    this.getElapsedTime();
    this.running = false;
  },

  getElapsedTime: function() {
    this.update();
    return this.elapsedTime;
  },

  update: function() {
    var delta = 0;
    if (this.running) {
      var newTime = Timer.now();
      delta = 0.001 * (newTime - this.oldTime);
      this.oldTime = newTime;
      this.elapsedTime += delta;
    }

    return delta;
  },
};

////////////////////////////////////////////////////////////////////////////
// Query string

/**
 * Escape only dangerous chars in a query string component, use a plus instead of a space.
 *
 * [RFC 3986](https://tools.ietf.org/html/rfc3986) allows the following chars in the query (see 3.4):
 *
 *       A-Z a-z 0-9 - _ . ~ ! $ & ' ( ) * + , ; = : @ / ?
 *
 * For query string elements we need to escape ampersand, equal sign, and plus,
 * but encodeURIComponent() function encodes anything except for the following:
 *
 *       A-Z a-z 0-9 - _ . ~ ! ' ( ) *
 *
 * @param {string} text - key or value to encode
 * @param {string} excludeExp - regexp for symbols to exclude from encoding
 * @returns {string} encoded string
 */
function encodeQueryComponent(text, excludeExp) {
  return encodeURIComponent(text).replace(excludeExp, function(code) {
    return String.fromCharCode(parseInt(code.substr(1), 16));
  }).replace(/%20/g, '+');
}

/**
 * Unescape dangerous chars in a query string component.
 *
 * @param {string} text - encoded key or value
 * @returns {string} decoded string
 * @see {@link encodeQueryComponent}
 */
function decodeQueryComponent(text) {
  return decodeURIComponent(text.replace(/\+/g, ' '));
}

/**
 * Parse URL and extract an array of parameters.
 * @param {string?} url - URL or query string to parse
 * @returns {Array} array of (key, value) pairs.
 */
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

/**
 * Parse URL and extract an array of parameters as a hash.
 * @param {string?} url - URL or query string to parse
 * @returns {Object}
 */
function getUrlParametersAsDict(url) {
  var result = {};
  var a = getUrlParameters(url);
  for (var i = 0; i < a.length; ++i) {
    result[a[i][0]] = a[i][1];
  }
  return result;
}

function resolveURL(str) {
  if (typeof URL !== 'undefined') {
    try {
      if (typeof window !== 'undefined') {
        return new URL(str, window.location).href;
      } else {
        return new URL(str).href;
      }
    } catch (error) {
      // IE 11 has a URL object with no constructor available so just try a different approach instead
    }
  }
  if (typeof document !== 'undefined') {
    const anchor = document.createElement('a');
    anchor.href = str;
    return anchor.href;
  }
  return str;
}

/**
 * Generates regular expression object that includes all symbols
 * listed in the argument
 * @param symbolStr {string} - String containing characters list.
 * @returns {RegExp} - Regular expression.
 */
function generateRegExp(symbolStr) {
  var symbolList = [];

  for (var i = 0, n = symbolStr.length; i < n; ++i) {
    symbolList[symbolList.length] = symbolStr[i].charCodeAt(0).toString(16);
  }

  var listStr = symbolList.join('|');

  return new RegExp('%(?:' + listStr + ')', 'gi');
}

////////////////////////////////////////////////////////////////////////////
// Create HTML element

function createElement(tag, attrs, content) {
  var element = document.createElement(tag);
  var i, n;
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

////////////////////////////////////////////////////////////////////////////
// Easy inheritance

/**
 * Derive the class from the base.
 * @param cls {function} - Class (constructor) to derive.
 * @param base {function} - Class (constructor) to derive from.
 * @param members {object=} - Optional members to add.
 * @returns {function} Original class.
 */
function deriveClass(cls, base, members) {
  cls.prototype = _.assign(Object.create(base.prototype), {constructor: cls}, members);
  return cls;
}

////////////////////////////////////////////////////////////////////////////
// Deep prototyping

function deriveDeep(obj, needZeroOwnProperties) {
  var res = obj;
  var i, n;
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

////////////////////////////////////////////////////////////////////////////
// Colors

function hexColor(color) {
  var hex = ('0000000' + color.toString(16)).substr(-6);
  return '#' + hex;
}

////////////////////////////////////////////////////////////////////////////
// Debug tracing

function DebugTracer(namespace) {
  var enabled = false;

  this.enable = function(on) {
    enabled = on;
  };

  var indent = 0;
  var methods = Object.keys(namespace);

  function wrap(method_, name_) {
    return function() {
      var spaces = DebugTracer.spaces.substr(0, indent * 2);
      if (enabled) {
        logger.debug(spaces + name_ + ' {');
      }
      indent++;
      var result = method_.apply(this, arguments); // eslint-disable-line no-invalid-this
      indent--;
      if (enabled) {
        logger.debug(spaces + '} // ' + name_);
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

function OutOfMemoryError(message) {
  Error.call(this);
  this.name = 'OutOfMemoryError';
  this.message = message;
}

OutOfMemoryError.prototype = Object.create(Error.prototype);

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

////////////////////////////////////////////////////////////////////////////
// Float array conversion

function bytesToBase64(/** ArrayBuffer */ buffer) {
  var bytes = new Uint8Array(buffer);
  var binary = '';
  for (var i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function bytesFromBase64(/** string */ str) {
  var binary = window.atob(str);
  var bytes = new Uint8Array(binary.length);
  for (var i = 0; i < bytes.length; ++i) {
    bytes[i] = binary[i].charCodeAt(0);
  }
  return bytes.buffer;
}

function arrayToBase64(/** number[] */ array, /** function */ TypedArrayClass) {
  return bytesToBase64(new TypedArrayClass(array).buffer);
}

function arrayFromBase64(/** string */ str, /** function */ TypedArrayClass) {
  return Array.prototype.slice.call(new TypedArrayClass(bytesFromBase64(str)));
}

//NOTE: this is 1-level comparison
function compareOptionsWithDefaults(opts, defOpts) {
  var optsStr = [];
  if (defOpts && opts) {
    var keys = Object.keys(opts);
    for (var p = 0; p < keys.length; ++p) {
      var key = keys[p];
      var value = opts[key];
      // TODO add processing for tree structure
      if (!(value instanceof Object) && typeof defOpts[key] !== 'undefined' && defOpts[key] !== value) {
        optsStr.push(key + ':' + value);
      }
    }
    if (optsStr.length > 0) {
      return '!' + optsStr.join();
    }
  }
  return '';
}

/**
 * Returns objects that contains difference in values for all defined fields of left and right
 * @param left
 * @param right
 */
function objectsDiff(left, right) {
  var diff = {};
  _.forIn(left, function(value, key) {
    if (value instanceof Object) {
      var smallDiff = objectsDiff(value, right[key]);
      if (!_.isEmpty(smallDiff)) {
        diff[key] = smallDiff;
      }
    } else if (!right || right[key] === undefined || right[key] !== value) {
      diff[key] = value;
    }
  });
  return diff;
}

function forInRecursive(object, callback) {
  function iterateThrough(obj, prefix) {
    _.forIn(obj, function(value, key) {
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
  if (_.isString(value)) {
    return '"' + value.replace(/"/g, '\\"') + '"';
  }
  return value;
}

function getFileExtension(fileName) {
  return fileName.slice((Math.max(0, fileName.lastIndexOf('.')) || Infinity));
}

function splitFileName(fileName) {
  const ext = getFileExtension(fileName);
  const name = fileName.slice(0, fileName.length - ext.length);
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

function shotOpen(url) {
  if (typeof window !== 'undefined') {
    window.open().document.write('<body style="margin:0"><img src="' + url + '" /></body>');
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
  // .style property is readonly, so "newNode.style = node.style;" won't work (and we don't need it, right?)
  return newNode;
}

const unquotedStringRE = /^[a-zA-Z0-9_]*$/;
const enquoteHelper = ['"', '', '"'];

// verify and correct if needed selctor identifier
function correctSelectorIdentifier(value) {
  if (unquotedStringRE.test(value)) {
    return value;
  }
  // quote incorrect identifier
  enquoteHelper[1] = value;
  return enquoteHelper.join('');
}

export function registerInList(list, value) {
  if (!list.includes(value)) {
    list.push(value);
  }
}

export function unregisterFromList(list, value) {
  const pos = list.indexOf(value);
  if (pos !== -1) {
    list.splice(pos, 1);
  }
}

export function registerInDict(dict, keys, value) {
  keys.forEach((key) => {
    key = key.toLowerCase();
    const list = dict[key] = dict[key] || [];
    if (!list.includes(value)) {
      list.push(value);
    }
  });
}

export function unregisterFromDict(dict, keys, value) {
  keys.forEach((key) => {
    key = key.toLowerCase();
    const list = dict[key];
    if (list) {
      const pos = list.indexOf(value);
      if (pos !== -1) {
        list.splice(pos, 1);
      }
      if (list.length === 0) {
        delete dict[key];
      }
    }
  });
}

////////////////////////////////////////////////////////////////////////////
// Exports

export default {
  Timer: Timer,
  encodeQueryComponent: encodeQueryComponent,
  decodeQueryComponent: decodeQueryComponent,
  getUrlParameters: getUrlParameters,
  getUrlParametersAsDict: getUrlParametersAsDict,
  resolveURL,
  generateRegExp: generateRegExp,
  createElement: createElement,
  deriveClass: deriveClass,
  deriveDeep: deriveDeep,
  hexColor: hexColor,
  DebugTracer: DebugTracer,
  OutOfMemoryError: OutOfMemoryError,
  allocateTyped: allocateTyped,
  bytesFromBase64 : bytesFromBase64,
  bytesToBase64 : bytesToBase64,
  arrayFromBase64 : arrayFromBase64,
  arrayToBase64 : arrayToBase64,
  compareOptionsWithDefaults: compareOptionsWithDefaults,
  objectsDiff: objectsDiff,
  forInRecursive: forInRecursive,
  enquoteString: enquoteString,
  shotOpen: shotOpen,
  shotDownload: shotDownload,
  copySubArrays: copySubArrays,
  shallowCloneNode: shallowCloneNode,
  correctSelectorIdentifier: correctSelectorIdentifier,
  getFileExtension,
  splitFileName,
};
