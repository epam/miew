declare var _default: Logger;
export default _default;
/**
 * Create new Logger.
 *
 * @exports Logger
 * @extends EventDispatcher
 * @constructor
 */
declare function Logger(): void;
declare class Logger {
    /** Boolean flag that toggles output to browser console.
     * @type {boolean}
     */
    console: boolean;
    _priority: number;
    constructor: typeof Logger;
    /**
     * Create new clean instance of the logger.
     * @returns {Logger}
     */
    instantiate(): Logger;
    set level(arg: string | undefined);
    get level(): string | undefined;
    /**
     * Returns the list of all possible level values.
     * @returns {Array}
     */
    levels(): any[];
    /**
     * Add new message with specified level.
     * @param {string} level - level of the message, must be one of the
     * {'debug' | 'info' | 'report' | 'warn' | 'error'}
     * @param {string} message
     */
    message(level: string, message: string): void;
    /**
     * Shortcut for message('debug', ...);
     * @param message
     */
    debug(message: any): void;
    /**
     * Shortcut for message('info', ...);
     * @param message
     */
    info(message: any): void;
    /**
     * Shortcut for message('report', ...);
     * @param message
     */
    report(message: any): void;
    /**
     * Shortcut for message('warn', ...);
     * @param message
     */
    warn(message: any): void;
    /**
     * Shortcut for message('error', ...);
     * @param message
     */
    error(message: any): void;
    private _message;
}
