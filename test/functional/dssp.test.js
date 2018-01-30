import fs from 'fs';
import path from 'path';
import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';

import PDBParser from '../../src/io/parsers/PDBParser';

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
      begin: helix._start._sequence,
      end: helix._end._sequence,
      type: helix._type,
    })),
    sheets: complex._sheets.map((sheet) => ({
      width: sheet._width,
      strands: sheet._strands.map((strand) => ({
        begin: strand._start._sequence,
        end: strand._end._sequence,
        sense: strand._sense,
      })),
    })),
  };
}

describe('The secondary structure in 1CRN', () => {

  let complex = null;

  before(function() {
    this.timeout(0);
    return load(path.join(__dirname, './data/1CRN.pdb'))
      .then((parsed) => {
        complex = parsed;
      });
  });

  it('parsed correctly', function() {
    const ss = extract(complex);
    expect(ss.helices).to.deep.equal([
      {begin: 7, end: 19, type: 1},
      {begin: 23, end: 30, type: 1},
    ]);
    expect(ss.sheets).to.deep.equal([{
      width: 2,
      strands: [
        {begin: 1, end: 4, sense: 0},
        {begin: 32, end: 35, sense: -1},
      ],
    }]);
  });

  it('calculated correctly', function() {
    this.timeout(0);
    complex.dssp();
    const ss = extract(complex);
    expect(ss.helices).to.deep.equal([
      {begin: 7, end: 17, type: 1},
      {begin: 23, end: 30, type: 1},
      {begin: 42, end: 44, type: 3},
    ]);
    expect(ss.sheets).to.deep.equal([{
      width: 2,
      strands: [
        {begin: 2, end: 3, sense: 0},
        {begin: 33, end: 34, sense: 0}, // should be -1 here
      ],
    }]);
  });
});

