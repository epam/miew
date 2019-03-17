import Mode from './Mode';

class TraceMode extends Mode {
  static id = 'TR';

  calcStickRadius() {
    return this.opts.radius;
  }
}

TraceMode.prototype.id = 'TR';
TraceMode.prototype.name = 'Trace';
TraceMode.prototype.shortName = 'Trace';
TraceMode.prototype.depGroups = ['TraceChains'];

export default TraceMode;
