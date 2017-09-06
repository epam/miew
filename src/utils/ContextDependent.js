

import settings from '../settings';
import logger from './logger';
function makeContextDependent(prototype) {
  Object.defineProperties(prototype, {
    logger: {
      get: function() {
        return this.context && this.context.logger ? this.context.logger : logger;
      }
    },
    settings: {
      get: function() {
        return this.context && this.context.settings ? this.context.settings : settings;
      }
    }
  });
}

export default makeContextDependent;

