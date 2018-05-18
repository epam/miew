import Loader from './Loader';

export default class ImmediateLoader extends Loader {
  constructor(source, options) {
    super(source, options);
  }

  loadAsync() {
    return Promise.resolve(this._source);
  }

  /** @deprecated */
  static canLoad(source, options) {
    return typeof source !== 'undefined' && typeof options !== 'undefined' && options.sourceType === 'immediate';
  }

  static canProbablyLoad(_source) {
    return false;
  }
}

ImmediateLoader.types = ['immediate'];
