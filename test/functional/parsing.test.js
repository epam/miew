import PDBParser from '../../src/io/parsers/PDBParser';
import CIFParser from '../../src/io/parsers/CIFParser';
import MMTFParser from '../../src/io/parsers/MMTFParser';
import PubChemParser from '../../src/io/parsers/PubChemParser';
import CCP4Parser from '../../src/io/parsers/CCP4Parser';

import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';

import complexTestData from './data/complexTestData';
import volumeTestData from './data/volumeTestData';

chai.use(dirtyChai);

const pathToFiles = path.join(__dirname, './data');

const formats = {
  pdb: {
    name: 'PDB',
    extension: 'pdb',
    encoding: 'ascii',
    Parser: PDBParser,
  },
  cif: {
    name: 'PDBx/mmCIF',
    extension: 'cif',
    encoding: 'ascii',
    Parser: CIFParser,
  },
  mmtf: {
    name: 'MMTF',
    extension: 'mmtf',
    encoding: null,
    Parser: MMTFParser,
  },
  pubchem: {
    name: 'PubChem JSON',
    extension: 'json',
    encoding: 'ascii',
    Parser: PubChemParser,
  },
  ccp4: {
    name: 'CCP4',
    extension: 'ccp4',
    encoding: null,
    Parser: CCP4Parser,
  },
};

function parse(entry, format) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(pathToFiles, `${entry.name}.${format.extension}`);
    fs.readFile(filePath, format.encoding, (err, contents) => {
      if (err) {
        reject(err);
      } else {
        const parser = new format.Parser(contents, {});
        resolve(parser.parse());
      }
    });
  });
}

function selectByFormat(value, formatId) {
  if (value !== undefined && value !== null && typeof value === 'object') {
    const specific = value[formatId];
    return specific !== undefined ? specific : value.default;
  }
  return value;
}

function createLookForAssertion(dataSet, formatId) {
  return (prop, value, precision) => {
    value = selectByFormat(value, formatId);
    precision = selectByFormat(precision, formatId);
    if (value !== undefined) {
      if (precision !== undefined) {
        expect(dataSet).to.have.nested.property(prop);
        expect(_.get(dataSet, prop)).to.be.closeTo(value, precision);
      } else {
        expect(dataSet).to.have.nested.property(prop, value);
      }
    }
  };

}

describe('Parsed Complex data', () => {

  complexTestData.forEach((entry) => {
    describe(`for ${entry.name}`, () => {

      entry.formats.forEach((formatId) => {
        const format = formats[formatId];
        it(`looks good in ${format.name} format`, function() {
          this.timeout(0);
          if (entry.skip && entry.skip[formatId]) {
            this.skip();
            return null;
          }

          return parse(entry, format)
            .then((complex) => {

              const lookFor = createLookForAssertion(complex, formatId);

              lookFor('_atoms.length', entry.num.atoms);
              lookFor('_bonds.length', entry.num.bonds);
              lookFor('_residues.length', entry.num.residues);
              lookFor('_chains.length', entry.num.chains);

              lookFor('_molecules.length', entry.num.molecules);
              lookFor('structures.length', entry.num.structures);
              lookFor('symmetry.length', entry.num.symmetries);

              lookFor('_helices.length', entry.num.helices);
              lookFor('_sheets.length', entry.num.sheets);
            });
        });
      });

    });
  });

});

describe('Parsed Volume data', () => {

  volumeTestData.forEach((entry) => {
    describe(`for ${entry.name}`, () => {

      entry.formats.forEach((formatId) => {
        const format = formats[formatId];
        it(`looks good in ${format.name} format`, function() {
          this.timeout(0);
          if (entry.skip && entry.skip[formatId]) {
            this.skip();
            return null;
          }

          return parse(entry, format)
            .then((volume) => {

              const lookFor = createLookForAssertion(volume, formatId);

              lookFor('_dimX', entry.subdivisions.x);
              lookFor('_dimY', entry.subdivisions.y);
              lookFor('_dimZ', entry.subdivisions.z);

              lookFor('_box.min.x', entry.range.x[0], entry.range.precision);
              lookFor('_box.max.x', entry.range.x[1], entry.range.precision);
              lookFor('_box.min.y', entry.range.y[0], entry.range.precision);
              lookFor('_box.max.y', entry.range.y[1], entry.range.precision);
              lookFor('_box.min.z', entry.range.z[0], entry.range.precision);
              lookFor('_box.max.z', entry.range.z[1], entry.range.precision);
            });
        });
      });

    });
  });

});
