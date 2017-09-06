

import utils from '../../utils';
import Mode from './Mode';

function TraceMode(opts) {
  Mode.call(this, opts);
}

utils.deriveClass(TraceMode, Mode, {
  id: 'TR',
  name: 'Trace',
  shortName: 'Trace',
  depGroups: ['TraceChains'],
});

TraceMode.prototype.calcStickRadius = function() {
  return this.opts.radius;
};

export default TraceMode;

