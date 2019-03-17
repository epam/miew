import _ from 'lodash';
import EntityList from '../utils/EntityList';

import LinesMode from './modes/LinesMode';
import LicoriceMode from './modes/LicoriceMode';
import BallsAndSticksMode from './modes/BallsAndSticksMode';
import VanDerWaalsMode from './modes/VanDerWaalsMode';
import TraceMode from './modes/TraceMode';
import TubeMode from './modes/TubeMode';
import CartoonMode from './modes/CartoonMode';
import QuickSurfaceMode from './modes/QuickSurfaceMode';
import IsoSurfaceSASMode from './modes/IsoSurfaceSASMode';
import IsoSurfaceSESMode from './modes/IsoSurfaceSESMode';
import ContactSurfaceMode from './modes/ContactSurfaceMode';
import TextMode from './modes/TextMode';

const modes = new EntityList([
  LinesMode,
  LicoriceMode,
  BallsAndSticksMode,
  VanDerWaalsMode,
  TraceMode,
  TubeMode,
  CartoonMode,
  QuickSurfaceMode,
  IsoSurfaceSASMode,
  IsoSurfaceSESMode,
  ContactSurfaceMode,
  TextMode,
]);

/** @deprecated */
Object.defineProperty(modes, 'list', {
  get() {
    return this.all;
  },
});

/** @deprecated */
Object.defineProperty(modes, 'any', {
  get() {
    return this.first;
  },
});

/** @deprecated */
Object.defineProperty(modes, 'descriptions', {
  get() {
    return _.map(this._list, m => _.pick(m.prototype, ['id', 'name']));
  },
});

/** @deprecated */
modes.create = function (mode, opts) {
  if (!opts && mode instanceof Array) {
    [mode, opts] = mode;
  }
  const Mode = this.get(mode) || this.first;
  return new Mode(opts);
};

export default modes;
