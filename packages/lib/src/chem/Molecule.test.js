import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import Molecule from './Molecule';

chai.use(dirtyChai);

describe('Molecule', () => {
  describe('constructor', () => {
    it('doesn\'t throw on creating molecule without params', () => {
      expect(() => new Molecule()).to.not.throw();
    });

    it('creates molecule with default params', () => {
      const m = new Molecule();
      expect(m.name).to.equal('');
      expect(m.mask).to.equal(1);
      expect(m.index).to.equal(-1);
      expect(m.residues).is.empty();
    });

    it('creates molecule with given params', () => {
      const complex = { name: 'testComplex' };
      const m = new Molecule(complex, 'Test', 123);
      expect(m.name).to.equal('Test');
      expect(m.complex).to.deep.equal(complex);
      expect(m.index).to.equal(123);
    });
  });

  describe('#forEachResidue', () => {
    it('process every residue with given functor', () => {
      const m = new Molecule();
      m.residues = [{ index: 1 }, { index: 2 }];
      // eslint-disable-next-line no-return-assign
      m.forEachResidue((r) => r.index += 1);
      expect(m.residues[0].index).to.equal(2);
      expect(m.residues[1].index).to.equal(3);
    });
  });

  describe('#collectMask', () => {
    it('collects mask from its residues', () => {
      const m = new Molecule();
      m.residues = [{ _mask: 0x00000010 }, { _mask: 0x00000011 }];
      expect(m.mask).to.equal(1);
      m.collectMask();
      expect(m.mask).to.equal(0x00000010);
    });
  });
});
