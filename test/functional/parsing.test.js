import PDBParser from '../../src/io/parsers/PDBParser';
import CIFParser from '../../src/io/parsers/CIFParser';
import MMTFParser from '../../src/io/parsers/MMTFParser';

import fs from 'fs';
import path from 'path';
import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';

import complexTestData from './data/complexTestData';

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
};

function parse(entry, format) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(pathToFiles, `${entry.name}.${format.extension}`);
    fs.readFile(filePath, format.encoding, (err, contents) => {
      if (err) {
        reject(err);
      } else {
        const parser = new format.Parser(contents, {});
        parser.parse({
          error: reject,
          ready: complex => resolve(complex),
        });
      }
    });
  });
}

function selectByFormat(value, formatId) {
  if (value !== null && typeof value === 'object') {
    const specific = value[formatId];
    return specific !== undefined ? specific : value.default;
  }
  return value;
}

describe('Complex data', () => {

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

              const lookFor = (prop, value) => {
                value = selectByFormat(value, formatId);
                if (value !== undefined) {
                  expect(complex).to.have.nested.property(prop, value);
                }
              };

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
