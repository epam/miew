import { expect } from 'chai';
import sinon from 'sinon';
import palettes from '../palettes';
import ChainColorer from './ChainColorer';

describe('ChainColorer', () => {
  const chainName = 'A';
  const chainColor = 0xFFFFFF;

  class FirstPalette {
    getChainColor(name) {
      if (name === chainName) {
        return chainColor;
      }
      return 0x000000;
    }
  }

  class Residue {
    constructor(chain) {
      this._chainName = chain;
    }

    getChain() {
      return { _name: this._chainName };
    }
  }
  const palette = new FirstPalette();

  describe('#getAtomColor', () => {
    let paletteStub;
    let cColorer;

    before(() => {
      paletteStub = sinon.stub(palettes, 'first').value(palette);
      cColorer = new ChainColorer();
    });
    after(() => {
      paletteStub.restore();
    });

    it('returns color which is set for atom\'s residue\'s chain name', () => {
      const residue = new Residue(chainName);
      const atom = { residue };
      expect(cColorer.getAtomColor(atom)).to.equal(chainColor);
    });
  });

  describe('#getResidueColor', () => {
    let paletteStub;
    let cColorer;

    before(() => {
      paletteStub = sinon.stub(palettes, 'first').value(palette);
      cColorer = new ChainColorer();
    });
    after(() => {
      paletteStub.restore();
    });

    it('returns color which is set for residue\'s chain name', () => {
      const residue = new Residue(chainName);
      expect(cColorer.getResidueColor(residue)).to.equal(chainColor);
    });
  });

  describe('.id', () => {
    const cColorer = new ChainColorer();

    it('have .id property type \'string\'', () => {
      expect(cColorer).to.have.property('id');
      expect(cColorer.id).to.be.a('string');
    });

    it('have .id property different from such in parent class', () => {
      const colorer = Object.getPrototypeOf(Object.getPrototypeOf(cColorer));
      expect(cColorer.id).to.not.equal(colorer.id);
    });
  });

  describe('.name', () => {
    it('have .name property type \'string\'', () => {
      const cColorer = new ChainColorer();
      expect(cColorer).to.have.property('name');
      expect(cColorer.name).to.be.a('string');
    });
  });

  describe('.shortName', () => {
    it('have .shortName property type \'string\'', () => {
      const cColorer = new ChainColorer();
      expect(cColorer).to.have.property('shortName');
      expect(cColorer.shortName).to.be.a('string');
    });
  });
});
