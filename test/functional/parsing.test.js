import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import PDBParser from '../../src/io/parsers/PDBParser';
import CIFParser from '../../src/io/parsers/CIFParser';
import MMTFParser from '../../src/io/parsers/MMTFParser';
import XYZParser from '../../src/io/parsers/XYZParser';
import PubChemParser from '../../src/io/parsers/PubChemParser';
import SDFParser from '../../src/io/parsers/SDFParser';
import CCP4Parser from '../../src/io/parsers/CCP4Parser';
import GROParser from '../../src/io/parsers/GROParser';
import MOL2Parser from '../../src/io/parsers/MOL2Parser';

import complexTestData from './data/complexTestData';
import volumeTestData from './data/volumeTestData';
import DSN6Parser from '../../src/io/parsers/DSN6Parser';

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
  xyz: {
    name: 'XYZ',
    extension: 'xyz',
    encoding: 'ascii',
    Parser: XYZParser,
  },
  pubchem: {
    name: 'PubChem JSON',
    extension: 'json',
    encoding: 'ascii',
    Parser: PubChemParser,
  },
  sdf: {
    name: 'SDF',
    extension: 'sdf',
    encoding: 'ascii',
    Parser: SDFParser,
  },
  ccp4: {
    name: 'CCP4',
    extension: 'ccp4',
    encoding: null,
    Parser: CCP4Parser,
  },
  dsn6: {
    name: 'DSN6',
    extension: 'dsn6',
    encoding: null,
    Parser: DSN6Parser,
  },
  gro: {
    name: 'GRO',
    extension: 'gro',
    encoding: 'ascii',
    Parser: GROParser,
  },
  mol2: {
    name: 'MOL2',
    extension: 'mol2',
    encoding: 'ascii',
    Parser: MOL2Parser,
  },
};

function parse(entry, format, model = false) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(pathToFiles, `${entry.name}.${format.extension}`);
    fs.readFile(filePath, format.encoding, (err, contents) => {
      if (err) {
        reject(err);
      } else {
        const parser = new format.Parser(contents, {});
        if (model) {
          resolve(parser.getModel());
        } else {
          resolve(parser.parse());
        }
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
        it(`looks good in ${format.name} format`, function () {
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
              lookFor('units.length', entry.num.units);
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
        it(`looks good in ${format.name} format`, function () {
          this.timeout(0);
          if (entry.skip && entry.skip[formatId]) {
            this.skip();
            return null;
          }

          return parse(entry, format)
            .then((volume) => {
              const lookFor = createLookForAssertion(volume, formatId);

              lookFor('_dimX', entry.subdivisions.x, entry.subdivisions.precision);
              lookFor('_dimY', entry.subdivisions.y, entry.subdivisions.precision);
              lookFor('_dimZ', entry.subdivisions.z, entry.subdivisions.precision);

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

describe('Model Volume data', () => {
  volumeTestData.forEach((entry) => {
    describe(`for ${entry.name}`, () => {
      entry.formats.forEach((formatId) => {
        const format = formats[formatId];
        it(`looks good in ${format.name} format`, function () {
          this.timeout(0);
          if (entry.skip && entry.skip[formatId]) {
            this.skip();
            return null;
          }

          return parse(entry, format, true)
            .then((model) => {
              const lookFor = createLookForAssertion(model, formatId);

              lookFor('_header.nstart[0]', entry.nstart.x, entry.nstart.precision);
              lookFor('_header.nstart[1]', entry.nstart.y, entry.nstart.precision);
              lookFor('_header.nstart[2]', entry.nstart.z, entry.nstart.precision);

              lookFor('_header.extent[0]', entry.extent.x, entry.extent.precision);
              lookFor('_header.extent[1]', entry.extent.y, entry.extent.precision);
              lookFor('_header.extent[2]', entry.extent.z, entry.extent.precision);

              lookFor('_header.cellDims.x', entry.cellDims.x, entry.cellDims.precision);
              lookFor('_header.cellDims.y', entry.cellDims.y, entry.cellDims.precision);
              lookFor('_header.cellDims.z', entry.cellDims.z, entry.cellDims.precision);

              lookFor('_header.angles[0]', entry.angles.x, entry.angles.precision);
              lookFor('_header.angles[1]', entry.angles.y, entry.angles.precision);
              lookFor('_header.angles[2]', entry.angles.z, entry.angles.precision);

              lookFor('_header.grid[0]', entry.grid.x);
              lookFor('_header.grid[1]', entry.grid.y);
              lookFor('_header.grid[2]', entry.grid.z);
            });
        });
      });
    });
  });
});
