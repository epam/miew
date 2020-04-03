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

export default modes;
