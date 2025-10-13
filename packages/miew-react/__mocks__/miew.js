export default class Miew {
  constructor(options) {
    this.options = options;
    // Allow controlling behavior through options for testing
    this.shouldInitFail = options?.__test__shouldInitFail;
    this.shouldMiewThrow = options?.__test__shouldMiewThrow;
    this.shouldInitThrow = options?.__test__shouldInitThrow;
    this.miewThrowErrorMessage = options?.__test__miewThrowErrorMessage || 'Miew throws';
    this.initThrowErrorMessage = options?.__test__initThrowErrorMessage || 'Init throws';

    // Throw in constructor if requested
    if (this.shouldMiewThrow) {
      throw new Error(this.miewThrowErrorMessage);
    }
  }

  init() {
    if (this.shouldInitThrow) {
      throw new Error(this.initThrowErrorMessage);
    }
    return !this.shouldInitFail;
  }

  term() {
    // Mock cleanup
  }

  run() {
    // Mock run
  }

  load() {
    return Promise.resolve('molecule');
  }
}
