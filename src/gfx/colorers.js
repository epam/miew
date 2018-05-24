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
]);

/** @deprecated */
Object.defineProperty(colorers, 'list', {
  get: function() {
    return this.all;
  },
});

/** @deprecated */
Object.defineProperty(colorers, 'any', {
  get: function() {
    return this.first;
  },
});

/** @deprecated */
Object.defineProperty(colorers, 'descriptions', {
  get: function() {
    return _.map(this._list, (m) => _.pick(m.prototype, ['id', 'name']));
  },
});

/**
 * Create a colorer instance.
 *
 * @deprecated
 * @param {string|Array} colorer - Colorer identifier or two-element array containing both colorer identifier
 *   and options.
 * @param {object=} opts - Colorer options object overriding defaults.
 * @returns {object} New colorer object.
 *
 * @example
 * c = create('UN');                      // create Unified colorer
 * c = create('UN', {color: 0x00FF00});   // override unified color
 * c = create(['UN', {color: 0x00FF00}]); // pass an array (e.g. received from deserializing the colorer settings)
 */
colorers.create = function(colorer, opts) {
  if (!opts && colorer instanceof Array) {
    opts = colorer[1];
    colorer = colorer[0];
  }
  const Colorer = this.get(colorer) || this.any;
  return new Colorer(opts);
};

export default colorers;
