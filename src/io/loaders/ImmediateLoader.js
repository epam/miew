

import Loader from './Loader';

export default class ImmediateLoader extends Loader {
  constructor(source, options) {
    super(source, options);
  }

  load(callback) {
    const self = this;
    setTimeout(()=>{
      try {
        callback.ready(self._source);
      } catch (err) {
        callback.error(err);
      }
    }, 0);
  }

  static canLoad(source, options) {
    return typeof source !== 'undefined' && typeof options !== 'undefined' && options.sourceType === 'immediate';
  }
}

