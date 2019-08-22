import fs from 'fs';
import path from 'path';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import PDBParser from '../../src/io/parsers/PDBParser';
import StructuralElement from '../../src/chem/StructuralElement';

chai.use(dirtyChai);

function load(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'ascii', (err, contents) => {
      if (err) {
        reject(err);
      } else {
        const parser = new PDBParser(contents, {});
        resolve(parser.parse());
      }
    });
  });
}

function extract(complex) {
  return {
    helices: complex._helices.map((helix) => ({
      init: helix.init._sequence,
      term: helix.term._sequence,
      type: helix.type,
    })),
    sheets: complex._sheets.map((sheet) => ({
      width: sheet._width,
      strands: sheet._strands.map((strand) => ({
        init: strand.init._sequence,
        term: strand.term._sequence,
        sense: strand.sense,
      })),
    })),
  };
}

describe('The secondary structure in 1CRN', () => {
  let complex = null;

  before(function () {
    this.timeout(0);
    return load(path.join(__dirname, './data/1CRN.pdb'))
      .then((parsed) => {
        complex = parsed;
      });
  });

  it('parsed correctly', () => {
    const ss = extract(complex);
    expect(ss.helices).to.deep.equal([
      { init: 7, term: 19, type: StructuralElement.Type.HELIX_ALPHA },
      { init: 23, term: 30, type: StructuralElement.Type.HELIX_ALPHA },
    ]);
    expect(ss.sheets).to.deep.equal([{
      width: 2,
      strands: [
        { init: 1, term: 4, sense: 0 },
        { init: 32, term: 35, sense: -1 },
      ],
    }]);
  });

  it('calculated correctly', function () {
    this.timeout(0);
    complex.dssp();
    const ss = extract(complex);
    expect(ss.helices).to.deep.equal([
      { init: 7, term: 17, type: StructuralElement.Type.HELIX_ALPHA },
      { init: 23, term: 30, type: StructuralElement.Type.HELIX_ALPHA },
      { init: 42, term: 44, type: StructuralElement.Type.HELIX_310 },
    ]);
    expect(ss.sheets).to.deep.equal([{
      width: 2,
      strands: [
        { init: 2, term: 3, sense: 0 },
        { init: 33, term: 34, sense: 0 }, // should be -1 here
      ],
    }]);
  });
});
