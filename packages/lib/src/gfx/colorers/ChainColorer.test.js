import { expect } from 'chai';
import sinon from 'sinon';
import palettes from '../palettes';
import ChainColorer from './ChainColorer';

describe('ChainColorer', () => {
  describe('.id', () => {
    const uc = new ChainColorer();
    it('have property called id', () => {
      expect(uc).to.have.property('id');
    });

    it('have .id property type \'string\'', () => {
      expect(uc.id).to.be.a('string');
    });

    it('have .id property different from such in parent class', () => {
      const colorer = Object.getPrototypeOf(Object.getPrototypeOf(uc));
      expect(uc.id).to.not.equal(colorer.id);
    });
  });

  describe('.name', () => {
    const uc = new ChainColorer();
    it('have property called name', () => {
      expect(uc).to.have.property('name');
    });

    it('have .name property type \'string\'', () => {
      expect(uc.name).to.be.a('string');
    });
  });

  describe('.shortName', () => {
    const uc = new ChainColorer();
    it('have property called shortName', () => {
      expect(uc).to.have.property('shortName');
    });

    it('have .shortName property type \'string\'', () => {
      expect(uc.shortName).to.be.a('string');
    });
  });

  const chainColor = 'chainColor';

  class FirstPalette {
    getChainColor() {
      return chainColor;
    }
  }

  class Residue {
    getChain() {
      return { _name: 'chaiName' };
    }
  }
  const residue = new Residue();
  const palette = new FirstPalette();

  describe('#getAtomColor', () => {
    let paletteStub;
    const atom = { residue };

    beforeEach(() => {
      paletteStub = sinon.stub(palettes, 'first').value(palette);
    });
    afterEach(() => {
      paletteStub.restore();
    });

    it('returns the same color with set for atom\'s chain', () => {
      const uc = new ChainColorer();
      expect(uc.getAtomColor(atom)).to.equal(chainColor);
    });

    it('calls getResidueColor() with atom\'s residue', () => {
      const uc = new ChainColorer();
      const getResidueColor = sinon.spy(uc, 'getResidueColor');
      uc.getAtomColor(atom);
      expect(getResidueColor).to.be.calledOnce().and.calledWith(atom.residue);
      getResidueColor.restore();
    });
  });

  describe('#getResidueColor', () => {
    let paletteStub;

    beforeEach(() => {
      paletteStub = sinon.stub(palettes, 'first').value(palette);
    });
    afterEach(() => {
      paletteStub.restore();
    });

    it('returns the same color with set for residue\'s chain', () => {
      const uc = new ChainColorer();
      expect(uc.getResidueColor(residue)).to.equal(chainColor);
    });

    it('calls getChainColor with exactly residue\'s chain name', () => {
      const uc = new ChainColorer();
      const getChainColor = sinon.spy(uc.palette, 'getChainColor');
      uc.getResidueColor(residue);
      expect(getChainColor).to.be.calledOnce().and.calledWithExactly(residue.getChain()._name);
      getChainColor.restore();
    });
  });
});
