/**
 * This module contains class for logging.
 * Returns an instance of a logger that have already been created.
 * Allows users to log messages for five different levels,
 * enable console output and catch signal on each message.
 */
import _ from 'lodash';
import EventDispatcher from './EventDispatcher';

const priorities = {
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
  this._priority = priorities.warn;
}

Logger.prototype = Object.create(EventDispatcher.prototype);
Logger.prototype.constructor = Logger;

/**
 * Create new clean instance of the logger.
 * @returns {Logger}
 */
Logger.prototype.instantiate = function () {
  return new Logger();
};

function verify(number) {
  if (!_.isNumber(number)) {
    throw new Error('Wrong log level specified!');
  }
  return number;
}

/**
 * @property {string} current threshold for signals and console output.
 * @name Logger#level
 */
Object.defineProperty(Logger.prototype, 'level', {
  get() {
    return _.findKey(priorities, (value) => value === this._priority);
  },
  set(level) {
    this._priority = verify(priorities[level]);
  },
});

/**
 * Returns the list of all possible level values.
 * @returns {Array}
 */
Logger.prototype.levels = function () {
  return Object.keys(priorities);
};

/**
 * Add new message with specified level.
 * @param {string} level - level of the message, must be one of the
 * {'debug' | 'info' | 'report' | 'warn' | 'error'}
 * @param {string} message
 */
Logger.prototype.message = function (level, message) {
  const priority = verify(priorities[level]);
  this._message(priority, message);
};

/**
 * Shortcut for message('debug', ...);
 * @param message
 */
Logger.prototype.debug = function (message) {
  this._message(priorities.debug, message);
};

/**
 * Shortcut for message('info', ...);
 * @param message
 */
Logger.prototype.info = function (message) {
  this._message(priorities.info, message);
};

/**
 * Shortcut for message('report', ...);
 * @param message
 */
Logger.prototype.report = function (message) {
  this._message(priorities.report, message);
};

/**
 * Shortcut for message('warn', ...);
 * @param message
 */
Logger.prototype.warn = function (message) {
  this._message(priorities.warn, message);
};

/**
 * Shortcut for message('error', ...);
 * @param message
 */
Logger.prototype.error = function (message) {
  this._message(priorities.error, message);
};

/**
 * Add new message with specified priority.
 * @param {number} priority - priority of the message
 * @param {string} message
 * @private
 */
Logger.prototype._message = function (priority, message) {
  if (priority < this._priority) {
    return;
  }
  const level = _.findKey(priorities, (value) => value === priority);
  message = String(message);
  if (this.console) {
    const output = `miew:${level}: ${message}`;
    if (level === 'error') {
      console.error(output); // NOSONAR
    } else if (level === 'warn') {
      console.warn(output); // NOSONAR
    } else {
      console.log(output); // NOSONAR
    }
  }
  this.dispatchEvent({ type: 'message', level, message });
};

export default new Logger();
