/**
 * This class introduces the simplest event system.
 */

import { remove, find, forEach, omitBy } from 'lodash'

function isUndefOrEqual(param, value) {
  return !param || param === value
}

/**
 * Creates empty dispatcher.
 *
 * @exports EventDispatcher
 * @constructor
 */
function EventDispatcher() {
  this._handlers = {}
}

/**
 * Binds callback on specific event type. Optional `context` parameter
 * could be used as 'this' for the `callback`.
 * @param {string}   type       Event name.
 * @param {function} callback   Callback function.
 * @param {Object}   [context] 'This' object for the callback.
 */
EventDispatcher.prototype.addEventListener = function (
  type,
  callback,
  context
) {
  let handlers = this._handlers[type]

  if (!handlers) {
    this._handlers[type] = []
    handlers = this._handlers[type]
  }

  const params = [callback, context]
  function _checkPar(par) {
    return par[0] === params[0] && par[1] === params[1]
  }

  if (find(handlers, _checkPar) === undefined) {
    handlers.push(params)
  }
}

/**
 * Removes a previously-bound callback function from an object.
 * If no `context` is specified, all versions of the `callback` with different
 * contexts will be removed.
 * If no `callback` is specified, all callbacks of the `type` will be removed.
 * If no `type` is specified, callbacks for all events will be removed.
 * @param {?string}  [type]      Event type.
 * @param {function} [callback]  Callback function.
 * @param {Object}   [context]  'This' object for the callback.
 */
EventDispatcher.prototype.removeEventListener = function (
  type,
  callback,
  context
) {
  const self = this
  forEach(self._handlers, (handler, ev) => {
    remove(
      handler,
      (values) =>
        isUndefOrEqual(type, ev) &&
        isUndefOrEqual(callback, values[0]) &&
        isUndefOrEqual(context, values[1] || self)
    )
  })

  this._handlers = omitBy(self._handlers, (handler) => handler.length === 0)
}

/**
 * Makes all the callbacks for the specific `event` to trigger.
 * @param {Object} event      Event.
 * @param {string} event.type Type of the event.
 */
EventDispatcher.prototype.dispatchEvent = function (event) {
  const self = this

  forEach(this._handlers[event.type], (callback) => {
    const context = callback[1] || self
    callback[0].apply(context, [event])
  })
}

export default EventDispatcher
