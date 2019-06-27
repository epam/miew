import Loader from './Loader';

export default class ImmediateLoader extends Loader {
  load() {
    return new Promise((resolve) => {
      if (this._abort) {
        throw new Error('Loading aborted');
      }
      resolve(this._source);
    });
  }

  static canProbablyLoad(_source) {
    return false;
  }
}

ImmediateLoader.types = ['immediate'];
