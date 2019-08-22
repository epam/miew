import fs from 'fs';
import path from 'path';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import PDBParser from '../../src/io/parsers/PDBParser';
import PDBExporter from '../../src/io/exporters/PDBExporter';

chai.use(dirtyChai);
chai.use(sinonChai);
chai.use(chaiAsPromised);

const pathToFiles = path.join(__dirname, './data');

const filesForTest = [
  '1CRN.pdb',
  '1MVA.pdb',
];

const matchLines = [
  'HEADER',
  'TITLE',
  'COMPND.... ?(?:MOL_ID:|MOLECULE:|CHAIN:)',
  'HELIX',
  // 'SHEET.{35} +$',
  'ATOM',
  'HETATM',
  'CONECT',
  'REMARK 290 (?:\\s+SMTRY)',
  'REMARK 350 (?:\\s+BIOMT|BIOMOLECULE:|APPLY THE FOLLOWING TO CHAINS:)',
];

const matchLinesRE = new RegExp(`(?:${matchLines.join(')|(?:')})`);

function getExportedString(data) {
  const parser = new PDBParser(data, {});
  const complex = parser.parseSync();
  const exporter = new PDBExporter(complex, {});
  return exporter.exportSync();
}

function getInitialString(filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(pathToFiles, '/', filename);
    fs.readFile(filePath, 'ascii', (err, string) => {
      if (err) {
        reject(err);
      } else {
        resolve(string);
      }
    });
  });
}

function filterLines(text) {
  const lines = text
    .split(/\r?\n/)
    .filter((line) => line.search(matchLinesRE) === 0);
  return lines;
}

describe('PDBExporter output matches PDBParser input', () => {
  for (let i = 0; i < filesForTest.length; i++) {
    it(`for ${filesForTest[i]}`, () => getInitialString(filesForTest[i]).then((data) => {
      expect(filterLines(getExportedString(data))).to.deep.equal(filterLines(data));
    }));
  }
});
