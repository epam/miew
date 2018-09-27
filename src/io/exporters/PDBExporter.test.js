import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';
import PDBExporter from './PDBExporter';
import PDBParser from "../parsers/PDBParser";

const pathToFiles = path.join(__dirname, '../../../test/functional/data');

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
    console.log(filePath + '\n');
    fs.readFile(filePath, 'ascii', (err, string) => {
      if (err) {
        reject(err);
      } else {
        resolve(string);
      }
    });
  });
}

describe('PDBExporter test', () => {
  for (let i = 0; i < filesForTest.length; i++) {
    it('exported and initial string comparison', () => {
      getInitialString(filesForTest[i]).then((data) => {
        expect(getExportedString(data)).to.deep.include(data);
      });
    });
  }
});
