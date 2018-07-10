import LabeledMode from './LabeledMode';

function getRenderParams() {
  return {
    lineWidth: this.opts.lineWidth,
  };
}

class LinesMode extends LabeledMode {
  static id = 'LN';

  constructor(opts) {
    super(opts);
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

  /** @deprecated Old-fashioned atom labels, to be removed in the next major version. */

  getLabelOpts() {
    return {
      fg: 'none',
      bg: '0x202020',
      showBg: true,
      labels: this.settings.now.labels,
      colors: true,
      adjustColor: true,
      transparent: true,
    };
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
