import ParserList from './parsers/ParserList';

import PDBParser from './parsers/PDBParser';
import CMLParser from './parsers/CMLParser';
import MMTFParser from './parsers/MMTFParser';
import CIFParser from './parsers/CIFParser';
import CCP4Parser from './parsers/CCP4Parser';
import XYZParser from './parsers/XYZParser';
import PubChemParser from './parsers/PubChemParser';
import SDFParser from './parsers/SDFParser';
import DSN6Parser from './parsers/DSN6Parser';
import GROParser from './parsers/GROParser';
import MOL2Parser from './parsers/MOL2Parser';

export default new ParserList([
  // note: order might be important
  PDBParser,
  CIFParser,
  MMTFParser,
  XYZParser,
  CMLParser,
  PubChemParser,
  SDFParser,
  CCP4Parser,
  DSN6Parser,
  GROParser,
  MOL2Parser,
]);
