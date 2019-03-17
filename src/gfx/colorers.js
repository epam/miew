import _ from 'lodash';
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

/** @deprecated */
Object.defineProperty(colorers, 'list', {
  get() {
    return this.all;
  },
});

/** @deprecated */
Object.defineProperty(colorers, 'any', {
  get() {
    return this.first;
  },
});

/** @deprecated */
Object.defineProperty(colorers, 'descriptions', {
  get() {
    return _.map(this._list, m => _.pick(m.prototype, ['id', 'name']));
  },
});

/** @deprecated */
colorers.create = function (colorer, opts) {
  if (!opts && colorer instanceof Array) {
    [colorer, opts] = colorer;
  }
  const Colorer = this.get(colorer) || this.first;
  return new Colorer(opts);
};

export default colorers;
