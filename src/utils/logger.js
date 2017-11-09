

/**
 * This module contains class for logging.
 * Returns an instance of a logger that have already been created.
 * Allows users to log messages for five different levels,
 * enable console output and catch signal on each message.
 */
import _ from 'lodash';
import EventDispatcher from './EventDispatcher';

var logLevels = {
  debug: 0,
  info: 1,
  report: 2,
  warn: 3,
  error: 4,
};

/**
 * Create new Logger.
 *
 * @exports Logger
 * @extends EventDispatcher
 * @constructor
 */
function Logger() {
  EventDispatcher.call(this);
  /** Boolean flag that toggles output to browser console.
   * @type {boolean}
   */
  this.console = false;
  this._level = logLevels.warn;
}

Logger.prototype = Object.create(EventDispatcher.prototype);
Logger.prototype.constructor = Logger;

/**
 * Create new clean instance of the logger.
 * @returns {Logger}
 */
Logger.prototype.instantiate = function() {
  return new Logger();
};

/**
 * @property {string} current threshold for signals and console output.
 * @name Logger#level
 */
Object.defineProperty(Logger.prototype, 'level', {
  get: function() {
    var self = this;
    return _.findKey(logLevels, function(lvl) { return lvl === self._level; });
  },
  set: function(strValue) {
    var lvlVal = logLevels[strValue];
    if (!_.isNumber(lvlVal)) {
      throw new Error('Wrong log level specified!');
    }
    this._level = lvlVal;
  }
});

/**
 * Returns the list of all possible level values.
 * @returns {Array}
 */
Logger.prototype.levels = function() {
  return Object.keys(logLevels);
};

/**
 * Add new message with specified level.
 * @param {string} level - level of the message, must be one of the
 * {'debug' | 'info' | 'report' | 'warn' | 'error'}
 * @param {string} message
 */
Logger.prototype.message = function(level, message) {
  var lvlVal = logLevels[level];
  if (!_.isNumber(lvlVal)) {
    throw new Error('Wrong log level specified!');
  }
  this._message(lvlVal, message);
};

/**
 * Shortcut for message('debug', ...);
 * @param message
 */
Logger.prototype.debug = function(message) {
  this._message(logLevels.debug, message);
};

/**
 * Shortcut for message('info', ...);
 * @param message
 */
Logger.prototype.info = function(message) {
  this._message(logLevels.info, message);
};

/**
 * Shortcut for message('report', ...);
 * @param message
 */
Logger.prototype.report = function(message) {
  this._message(logLevels.report, message);
};

/**
 * Shortcut for message('warn', ...);
 * @param message
 */
Logger.prototype.warn = function(message) {
  this._message(logLevels.warn, message);
};

/**
 * Shortcut for message('error', ...);
 * @param message
 */
Logger.prototype.error = function(message) {
  this._message(logLevels.error, message);
};

/**
 * Add new message with specified level.
 * @param {number} levelVal - level of the message
 * @param {string} message
 * @private
 */
Logger.prototype._message = function(levelVal, message) {
  if (levelVal < this._level) {
    return;
  }
  var level = _.findKey(logLevels, function(lvl) { return lvl === levelVal; });
  message = String(message);
  if (this.console) {
    const output = `miew:${level}: ${message}`;
    if (level === 'error') {
      console.error(output); // NOSONAR
    } else if (level === 'warning') {
      console.warn(output); // NOSONAR
    } else {
      console.log(output); // NOSONAR
    }
  }
  this.dispatchEvent({type: 'message', level: level, message: message});
};

export default new Logger();

