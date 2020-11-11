import _ from 'lodash';
import logger from './utils/logger';

const browserType = {
  DEFAULT: 0,
  SAFARI: 1,
};
//----------------------------------------------------------------------------
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
  const encode = (code) => String.fromCharCode(parseInt(code.substr(1), 16));
  return encodeURIComponent(text).replace(excludeExp, encode).replace(/%20/g, '+');
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

  const query = url.substring(url.indexOf('?') + 1);
  const search = /([^&=]+)=?([^&]*)/g;
  const result = [];
  let match;

  while ((match = search.exec(query)) !== null) { // eslint-disable-line no-cond-assign
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
  const result = {};
  const a = getUrlParameters(url);
  for (let i = 0; i < a.length; ++i) {
    const [key, value] = a[i];
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
  const symbolList = [];

  for (let i = 0, n = symbolStr.length; i < n; ++i) {
    symbolList[symbolList.length] = symbolStr[i].charCodeAt(0).toString(16);
  }

  const listStr = symbolList.join('|');

  return new RegExp(`%(?:${listStr})`, 'gi');
}

//----------------------------------------------------------------------------
// Create HTML element

function createElement(tag, attrs, content) {
  const element = document.createElement(tag);
  let i;
  let n;
  if (attrs) {
    const keys = Object.keys(attrs);
    for (i = 0, n = keys.length; i < n; ++i) {
      const key = keys[i];
      element.setAttribute(key, attrs[key]);
    }
  }
  if (content) {
    if (!(content instanceof Array)) {
      content = [content];
    }
    for (i = 0, n = content.length; i < n; ++i) {
      const child = content[i];
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof HTMLElement) {
        element.appendChild(child);
      }
    }
  }
  return element;
}

//----------------------------------------------------------------------------
// Easy inheritance

/**
 * Derive the class from the base.
 * @param cls {function} - Class (constructor) to derive.
 * @param base {function} - Class (constructor) to derive from.
 * @param members {object=} - Optional instance members to add.
 * @param statics {object=} - Optional static class members to add.
 * @returns {function} Original class.
 */
function deriveClass(cls, base, members, statics) {
  cls.prototype = _.assign(Object.create(base.prototype), { constructor: cls }, members);
  if (statics) {
    _.assign(cls, statics);
  }
  return cls;
}

//----------------------------------------------------------------------------
// Deep prototyping

function deriveDeep(obj, needZeroOwnProperties) {
  let res = obj;
  let i;
  let n;
  if (obj instanceof Array) {
    res = new Array(obj.length);
    for (i = 0, n = obj.length; i < n; ++i) {
      res[i] = deriveDeep(obj[i]);
    }
  } else if (obj instanceof Object) {
    res = Object.create(obj);
    const keys = Object.keys(obj);
    for (i = 0, n = keys.length; i < n; ++i) {
      const key = keys[i];
      const value = obj[key];
      const copy = deriveDeep(value);
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

//----------------------------------------------------------------------------
// Colors

function hexColor(color) {
  const hex = (`0000000${color.toString(16)}`).substr(-6);
  return `#${hex}`;
}

//----------------------------------------------------------------------------
// Debug tracing

function DebugTracer(namespace) {
  let enabled = false;

  this.enable = function (on) {
    enabled = on;
  };

  let indent = 0;
  const methods = Object.keys(namespace);

  function wrap(method_, name_) {
    return function (...args) {
      const spaces = DebugTracer.spaces.substr(0, indent * 2);
      if (enabled) {
        logger.debug(`${spaces + name_} {`);
      }
      indent++;
      const result = method_.apply(this, args); // eslint-disable-line no-invalid-this
      indent--;
      if (enabled) {
        logger.debug(`${spaces}} // ${name_}`);
      }
      return result;
    };
  }

  for (let i = 0, n = methods.length; i < n; ++i) {
    const name = methods[i];
    const method = namespace[name];
    if (method instanceof Function && name !== 'constructor') {
      namespace[name] = wrap(method, name);
    }
  }
}

DebugTracer.spaces = '                                                                                          ';

class OutOfMemoryError extends Error {
  constructor(message) {
    super();
    this.name = 'OutOfMemoryError';
    this.message = message;
  }
}

function allocateTyped(TypedArrayName, size) {
  let result = null;
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

//----------------------------------------------------------------------------
// Float array conversion

function bytesToBase64(/** ArrayBuffer */ buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function bytesFromBase64(/** string */ str) {
  const binary = window.atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < bytes.length; ++i) {
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

// NOTE: this is 1-level comparison
function compareOptionsWithDefaults(opts, defOpts) {
  const optsStr = [];
  if (defOpts && opts) {
    const keys = Object.keys(opts);
    for (let p = 0; p < keys.length; ++p) {
      const key = keys[p];
      const value = opts[key];
      // TODO add processing for tree structure
      if (!(value instanceof Object) && typeof defOpts[key] !== 'undefined' && defOpts[key] !== value) {
        optsStr.push(`${key}:${value}`);
      }
    }
    if (optsStr.length > 0) {
      return `!${optsStr.join()}`;
    }
  }
  return '';
}

function isAlmostPlainObject(o) {
  if (_.isPlainObject(o)) {
    return true;
  }
  const proto = o && Object.getPrototypeOf(o);
  return !!proto && !proto.hasOwnProperty('constructor') && isAlmostPlainObject(proto);
}

/**
 * Build an object that contains properties (and subproperties) of `src` different from those
 * in `dst`. Objects are parsed recursively, other values (including arrays) are compared for
 * equality using `_.isEqual()`.
 * @param {!object} src - a new object to compare, may contain changed or new properties
 * @param {!object} dst - an old reference object
 */
function objectsDiff(src, dst) {
  const diff = {};
  _.forIn(src, (srcValue, key) => {
    const dstValue = dst[key];
    if (isAlmostPlainObject(srcValue) && isAlmostPlainObject(dstValue)) {
      const deepDiff = objectsDiff(srcValue, dstValue);
      if (!_.isEmpty(deepDiff)) {
        diff[key] = deepDiff;
      }
    } else if (!_.isEqual(srcValue, dstValue)) {
      diff[key] = srcValue;
    }
  });
  return diff;
}

function forInRecursive(object, callback) {
  function iterateThrough(obj, prefix) {
    _.forIn(obj, (value, key) => {
      const newPref = prefix + (prefix.length > 0 ? '.' : '');
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
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}

function unquoteString(value) {
  if (!_.isString(value)) {
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
  throw new SyntaxError('Incorrect string format, can\'t unqute it');
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
  const parts = url.split(/[:;,]/);
  const partsCount = parts.length;
  if (partsCount >= 3 && parts[partsCount - 2] === 'base64') {
    return new Blob([bytesFromBase64(parts[partsCount - 1])]);
  }
  return null;
}

function getBrowser() {
  if (navigator.vendor && navigator.vendor.indexOf('Apple') > -1
    && navigator.userAgent
    && navigator.userAgent.indexOf('CriOS') === -1
    && navigator.userAgent.indexOf('FxiOS') === -1) {
    return browserType.SAFARI;
  }
  return browserType.DEFAULT;
}

function shotOpen(url) {
  if (typeof window !== 'undefined') {
    window.open().document.write(`<body style="margin:0"><img src="${url}" /></body>`);
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
    const link = document.createElement('a');
    link.download = filename;
    link.innerHTML = 'download';
    link.href = window.URL.createObjectURL(dataUrlToBlob(dataUrl));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function download(data, filename, type) {
  const blobData = new Blob([data]);

  if (!filename) {
    filename = ['data', +new Date()].join('');
  }

  if (!type) {
    filename += blobData.type || '.bin';
  } else {
    filename += `.${type}`;
  }

  if (typeof window !== 'undefined' && window.navigator && window.navigator.msSaveBlob) {
    window.navigator.msSaveBlob(blobData, filename);
  } else if (typeof document !== 'undefined') {
    const link = document.createElement('a');
    link.download = filename;
    link.innerHTML = 'download';
    link.href = window.URL.createObjectURL(blobData);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function copySubArrays(src, dst, indices, itemSize) {
  for (let i = 0, n = indices.length; i < n; ++i) {
    for (let j = 0; j < itemSize; ++j) {
      dst[i * itemSize + j] = src[indices[i] * itemSize + j];
    }
  }
}

function shallowCloneNode(node) {
  const newNode = node.cloneNode(true);
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

/**
 * Concatenates two TypedArray. Doesn't check null refs o type equality
 * Attention! It must be use very rarely because requires memory reallocation every time. Use MergeTypedArraysUnsafe to
 * unite array of subarrays.
 * @param{TypedArray} first  - destination array
 * @param{TypedArray} second - source array
 * @returns{TypedArray} resulting concatenated array
 */
function concatTypedArraysUnsafe(first, second) {
  const result = new first.constructor(first.length + second.length);
  result.set(first);
  result.set(second, first.length);
  return result;
}

/**
 * Merges array of TypedArray into TypedArray. Doesn't check null refs o type equality
 * @param{array} array  - source array of subarrays
 * @returns{TypedArray} resulting merged array
 */
function mergeTypedArraysUnsafe(array) {
  if (array.length <= 0) {
    return null;
  }
  // count the size
  const size = array.reduce((acc, cur) => acc + cur.length, 0);
  // create combined array
  const result = new array[0].constructor(size);
  for (let i = 0, start = 0; i < array.length; i++) {
    const count = array[i].length;
    result.set(array[i], start);
    start += count;
  }
  return result;
}

//----------------------------------------------------------------------------
// Exports

export default {
  browserType,
  encodeQueryComponent,
  decodeQueryComponent,
  getUrlParameters,
  getUrlParametersAsDict,
  resolveURL,
  generateRegExp,
  createElement,
  deriveClass,
  deriveDeep,
  hexColor,
  DebugTracer,
  OutOfMemoryError,
  allocateTyped,
  bytesFromBase64,
  bytesToBase64,
  arrayFromBase64,
  arrayToBase64,
  compareOptionsWithDefaults,
  objectsDiff,
  forInRecursive,
  enquoteString,
  unquoteString,
  getBrowser,
  shotOpen,
  shotDownload,
  copySubArrays,
  shallowCloneNode,
  correctSelectorIdentifier,
  getFileExtension,
  splitFileName,
  download,
  concatTypedArraysUnsafe,
  mergeTypedArraysUnsafe,
};
