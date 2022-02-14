declare namespace _default {
    export { browserType };
    export { encodeQueryComponent };
    export { decodeQueryComponent };
    export { getUrlParameters };
    export { getUrlParametersAsDict };
    export { resolveURL };
    export { generateRegExp };
    export { createElement };
    export { deriveClass };
    export { deriveDeep };
    export { hexColor };
    export { DebugTracer };
    export { OutOfMemoryError };
    export { allocateTyped };
    export { bytesFromBase64 };
    export { bytesToBase64 };
    export { arrayFromBase64 };
    export { arrayToBase64 };
    export { compareOptionsWithDefaults };
    export { objectsDiff };
    export { forInRecursive };
    export { enquoteString };
    export { unquoteString };
    export { getBrowser };
    export { shotOpen };
    export { shotDownload };
    export { copySubArrays };
    export { shallowCloneNode };
    export { correctSelectorIdentifier };
    export { getFileExtension };
    export { splitFileName };
    export { download };
    export { concatTypedArraysUnsafe };
    export { mergeTypedArraysUnsafe };
}
export default _default;
declare namespace browserType {
    const DEFAULT: number;
    const SAFARI: number;
}
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
declare function encodeQueryComponent(text: string, excludeExp: string): string;
/**
 * Unescape dangerous chars in a query string component.
 *
 * @param {string} text - encoded key or value
 * @returns {string} decoded string
 * @see {@link encodeQueryComponent}
 */
declare function decodeQueryComponent(text: string): string;
/**
 * Parse URL and extract an array of parameters.
 * @param {string?} url - URL or query string to parse
 * @returns {Array} array of (key, value) pairs.
 */
declare function getUrlParameters(url: string | null): any[];
/**
 * Parse URL and extract an array of parameters as a hash.
 * @param {string?} url - URL or query string to parse
 * @returns {Object}
 */
declare function getUrlParametersAsDict(url: string | null): any;
declare function resolveURL(str: any): any;
/**
 * Generates regular expression object that includes all symbols
 * listed in the argument
 * @param symbolStr {string} - String containing characters list.
 * @returns {RegExp} - Regular expression.
 */
declare function generateRegExp(symbolStr: string): RegExp;
declare function createElement(tag: any, attrs: any, content: any): any;
/**
 * Derive the class from the base.
 * @param cls {function} - Class (constructor) to derive.
 * @param base {function} - Class (constructor) to derive from.
 * @param members {object=} - Optional instance members to add.
 * @param statics {object=} - Optional static class members to add.
 * @returns {function} Original class.
 */
declare function deriveClass(cls: Function, base: Function, members?: object | undefined, statics?: object | undefined): Function;
declare function deriveDeep(obj: any, needZeroOwnProperties: any): any;
declare function hexColor(color: any): string;
declare function DebugTracer(namespace: any): void;
declare class DebugTracer {
    constructor(namespace: any);
    enable: (on: any) => void;
}
declare namespace DebugTracer {
    const spaces: string;
}
declare class OutOfMemoryError extends Error {
    constructor(message: any);
}
declare function allocateTyped(TypedArrayName: any, size: any): any;
declare function bytesFromBase64(str: any): ArrayBufferLike;
declare function bytesToBase64(buffer: any): string;
declare function arrayFromBase64(str: any, TypedArrayClass: any): any[];
declare function arrayToBase64(array: any, TypedArrayClass: any): string;
declare function compareOptionsWithDefaults(opts: any, defOpts: any): string;
/**
 * Build an object that contains properties (and subproperties) of `src` different from those
 * in `dst`. Objects are parsed recursively, other values (including arrays) are compared for
 * equality using `isEqual()`.
 * @param {!object} src - a new object to compare, may contain changed or new properties
 * @param {!object} dst - an old reference object
 */
declare function objectsDiff(src: object, dst: object): {};
declare function forInRecursive(object: any, callback: any): void;
declare function enquoteString(value: any): any;
declare function unquoteString(value: any): any;
declare function getBrowser(): number;
declare function shotOpen(url: any): void;
declare function shotDownload(dataUrl: any, filename: any): void;
declare function copySubArrays(src: any, dst: any, indices: any, itemSize: any): void;
declare function shallowCloneNode(node: any): any;
declare function correctSelectorIdentifier(value: any): any;
declare function getFileExtension(fileName: any): any;
declare function splitFileName(fileName: any): any[];
declare function download(data: any, filename: any, type: any): void;
/**
 * Concatenates two TypedArray. Doesn't check null refs o type equality
 * Attention! It must be use very rarely because requires memory reallocation every time. Use MergeTypedArraysUnsafe to
 * unite array of subarrays.
 * @param{TypedArray} first  - destination array
 * @param{TypedArray} second - source array
 * @returns{TypedArray} resulting concatenated array
 */
declare function concatTypedArraysUnsafe(first: TypedArray, second: TypedArray): TypedArray;
/**
 * Merges array of TypedArray into TypedArray. Doesn't check null refs o type equality
 * @param{array} array  - source array of subarrays
 * @returns{TypedArray} resulting merged array
 */
declare function mergeTypedArraysUnsafe(array: any[]): TypedArray;
