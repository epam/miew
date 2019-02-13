import fs from 'fs';
import path from 'path';
import PDBExporter from '../../src/io/exporters/PDBExporter';
import PDBParser from '../../src/io/parsers/PDBParser';
import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(dirtyChai);
chai.use(sinonChai);
chai.use(chaiAsPromised);

const pathToFiles = path.join(__dirname, './data');

const filesForTest = [
  '1CRN_for_exporter_test.pdb',
  '4NRE_for_exporter_test.pdb',
  '1MVA_for_exporter_test.pdb',
  '2MPZ_for_exporter_test.pdb',
  '5B40_for_exporter_test.pdb'
];

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

function normalizeNewLines(text) {
  return text.replace(/\r/g, '');
}

describe('PDBExporter output matches PDBParser input', () => {
  for (let i = 0; i < filesForTest.length; i++) {
    it(`for ${filesForTest[i]}`, () => {
      return getInitialString(filesForTest[i]).then((data) => {
        expect(getExportedString(data)).to.equal(normalizeNewLines(data));
      });
    });
  }
});
