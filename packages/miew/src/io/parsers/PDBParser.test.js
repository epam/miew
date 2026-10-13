import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import PDBParser from './PDBParser';

chai.use(dirtyChai);

const DUMMY_ATOM = 'ATOM      1  CA  ALA A   1       0.000   0.000   0.000  1.00  0.00           C  \n';

describe('PDBParser', () => {
  describe('CRYST1 record parsing', () => {
    it('populates complex.unitCell from user CRYST1 issue sample', () => {
      const pdbData = [
        'CRYST1   42.000   42.000   42.000  90.00  90.00  90.00 P 1           1',
        DUMMY_ATOM,
      ].join('\n');

      const parser = new PDBParser(pdbData, {});
      const complex = parser.parseSync();

      expect(complex.unitCell).to.not.be.null();
      expect(complex.unitCell.a).to.equal(42.0);
      expect(complex.unitCell.b).to.equal(42.0);
      expect(complex.unitCell.c).to.equal(42.0);
      expect(complex.unitCell.alpha).to.equal(90.0);
      expect(complex.unitCell.beta).to.equal(90.0);
      expect(complex.unitCell.gamma).to.equal(90.0);
      expect(complex.unitCell.spaceGroup).to.equal('P 1');
    });

    it('populates complex.unitCell with monoclinic cell from 1CRN', () => {
      const pdbData = [
        'CRYST1   40.960   18.650   22.520  90.00  90.77  90.00 P 1 21 1      2',
        DUMMY_ATOM,
      ].join('\n');

      const parser = new PDBParser(pdbData, {});
      const complex = parser.parseSync();

      expect(complex.unitCell).to.not.be.null();
      expect(complex.unitCell.a).to.equal(40.96);
      expect(complex.unitCell.b).to.equal(18.65);
      expect(complex.unitCell.c).to.equal(22.52);
      expect(complex.unitCell.alpha).to.equal(90.0);
      expect(complex.unitCell.beta).to.equal(90.77);
      expect(complex.unitCell.gamma).to.equal(90.0);
      expect(complex.unitCell.spaceGroup).to.equal('P 1 21 1');
    });

    it('leaves complex.unitCell null when CRYST1 is absent', () => {
      const pdbData = DUMMY_ATOM;

      const parser = new PDBParser(pdbData, {});
      const complex = parser.parseSync();

      expect(complex.unitCell).to.be.null();
    });
  });
});
