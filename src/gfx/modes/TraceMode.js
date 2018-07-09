

import Mode from './Mode';

class TraceMode extends Mode {
  constructor(opts) {
    super(opts);
  }

  calcStickRadius() {
    return this.opts.radius;
  }
}

TraceMode.id = 'TR';
TraceMode.prototype.id = 'TR';
TraceMode.prototype.name = 'Trace';
TraceMode.prototype.shortName = 'Trace';
TraceMode.prototype.depGroups = ['TraceChains'];

export default TraceMode;

