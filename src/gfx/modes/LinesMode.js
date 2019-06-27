import Mode from './Mode';

function getRenderParams() {
  return {
    lineWidth: this.opts.lineWidth,
  };
}

class LinesMode extends Mode {
  static id = 'LN';

  constructor(opts) {
    super(opts);
    this.depGroups = this.depGroups.slice(0); // clone depGroups to prevent prototype edits
    const groups = this.depGroups;
    for (let i = 0, n = groups.length; i < n; ++i) {
      groups[i] = [groups[i], getRenderParams];
    }
  }

  drawMultiorderBonds() {
    return this.opts.multibond;
  }

  calcAtomRadius() {
    return this.opts.atom;
  }

  getAromaticOffset() {
    return this.opts.offsarom;
  }

  getAromaticArcChunks() {
    return this.opts.chunkarom;
  }

  showAromaticLoops() {
    return this.opts.showarom;
  }
}

LinesMode.prototype.id = 'LN';
LinesMode.prototype.name = 'Lines';
LinesMode.prototype.shortName = 'Lines';
LinesMode.prototype.depGroups = [
  'ALoopsLines',
  'BondsLines',
  'OrphanedAtomsCrosses',
];

export default LinesMode;
