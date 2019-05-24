import _ from 'lodash';
import makeContextDependent from './makeContextDependent';

const MAX_COOKIE_LEN = 4000;
const COUNT_SUFFIX = 'Cnt';

function _chunkString(string, chunkLen) {
  const l = string.length;
  const chunks = [];
  for (let c = 0, lc = 0; lc < l; c++, lc += chunkLen) {
    chunks[c] = string.slice(lc, lc + chunkLen);
  }
  return chunks;
}

/**
 * Create new context dependent Cookie holder object.
 * @param context
 * @param {Object} opts - options
 * @param {string} opts.path - cookie path
 * @constructor
 */
function Cookies(context, opts) {
  this.context = context;
  this._opts = _.merge({
    path: '/',
  }, opts);
}

makeContextDependent(Cookies.prototype);

/**
 * Remove cookie by the name.
 * @param key
 */
Cookies.prototype.removeCookie = function (key) {
  const cntKey = this._toCount(key);
  let cntVal = this._getSimpleCookie(cntKey);
  if (!cntVal) {
    this._removeSimpleCookie(key);
    return;
  }
  this._removeSimpleCookie(cntKey);
  cntVal = parseInt(cntVal, 10);
  for (let i = 0; i < cntVal; ++i) {
    this._removeSimpleCookie(key + i);
  }
};

/**
 * Set new cookie value. Automatically splits
 * values that are too large into multiple cookies.
 * @param key
 * @param value
 */
Cookies.prototype.setCookie = function (key, value) {
  this.removeCookie(key);
  value = encodeURIComponent(value);
  const values = _chunkString(value, MAX_COOKIE_LEN - key.length - 1);
  const cntVal = values.length;
  if (cntVal === 1) {
    this._setSimpleCookie(key, value);
    return;
  }
  const cntKey = this._toCount(key);
  this._setSimpleCookie(cntKey, cntVal.toString());
  for (let i = 0; i < cntVal; ++i) {
    this._setSimpleCookie(key + i, values[i]);
  }
};

/**
 * Obtain the value of a compound cookie.
 * @param key
 */
Cookies.prototype.getCookie = function (key) {
  const cntKey = this._toCount(key);
  let cntVal = this._getSimpleCookie(cntKey);
  if (!cntVal) {
    return this._getSimpleCookie(key);
  }
  cntVal = parseInt(cntVal, 10);
  const value = [];
  for (let i = 0; i < cntVal; ++i) {
    value[i] = this._getSimpleCookie(key + i);
  }
  return value.join('');
};

Cookies.prototype._toCount = function (key) {
  return key + COUNT_SUFFIX;
};

Cookies.prototype._removeSimpleCookie = function (key) {
  document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
};

Cookies.prototype._getExpirationDate = function () {
  const today = new Date();
  const EXP_PERIOD_YEARS = 10;
  today.setFullYear(today.getFullYear() + EXP_PERIOD_YEARS);
  return today;
};

Cookies.prototype._setSimpleCookie = function (key, value) {
  document.cookie = `${key}=${value
  };expires=${this._getExpirationDate().toUTCString()
  };path=${this._opts.path}`;
};

Cookies.prototype._getSimpleCookie = function (key) {
  const matches = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`));
  return matches ? decodeURIComponent(matches[1]) : '';
};

Cookies.prototype._exists = function (key) {
  return document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`));
};

export default Cookies;
