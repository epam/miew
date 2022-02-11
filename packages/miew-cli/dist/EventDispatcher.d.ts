export default EventDispatcher;
/**
 * Creates empty dispatcher.
 *
 * @exports EventDispatcher
 * @constructor
 */
declare function EventDispatcher(): void;
declare class EventDispatcher {
    _handlers: {};
    /**
     * Binds callback on specific event type. Optional `context` parameter
     * could be used as 'this' for the `callback`.
     * @param {string}   type       Event name.
     * @param {function} callback   Callback function.
     * @param {Object}   [context] 'This' object for the callback.
     */
    addEventListener(type: string, callback: Function, context?: any): void;
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
    removeEventListener(type?: string | null | undefined, callback?: Function | undefined, context?: any): void;
    /**
     * Makes all the callbacks for the specific `event` to trigger.
     * @param {Object} event      Event.
     * @param {string} event.type Type of the event.
     */
    dispatchEvent(event: {
        type: string;
    }): void;
}
