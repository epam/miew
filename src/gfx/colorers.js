import EntityList from '../utils/EntityList';

import ElementColorer from './colorers/ElementColorer';
import ResidueTypeColorer from './colorers/ResidueTypeColorer';
import SequenceColorer from './colorers/SequenceColorer';
import ChainColorer from './colorers/ChainColorer';
import SecondaryStructureColorer from './colorers/SecondaryStructureColorer';
import UniformColorer from './colorers/UniformColorer';
import ConditionalColorer from './colorers/ConditionalColorer';
import ConformationColorer from './colorers/ConformationColorer';
import TemperatureColorer from './colorers/TemperatureColorer';
import OccupancyColorer from './colorers/OccupancyColorer';
import HydrophobicityColorer from './colorers/HydrophobicityColorer';
import MoleculeColorer from './colorers/MoleculeColorer';
import CarbonColorer from './colorers/CarbonColorer';

const colorers = new EntityList([
  ElementColorer,
  ResidueTypeColorer,
  SequenceColorer,
  ChainColorer,
  SecondaryStructureColorer,
  UniformColorer,
  ConditionalColorer,
  ConformationColorer,
  TemperatureColorer,
  OccupancyColorer,
  HydrophobicityColorer,
  MoleculeColorer,
  CarbonColorer,
]);

export default colorers;
