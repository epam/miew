import { expect } from 'chai';
import sinon from 'sinon';
import palettes from '../palettes';
import MoleculeColorer from './MoleculeColorer';

describe('MoleculeColorer', () => {
  const opts = { gradient: 'rainbow' };
  const left = 0.0;
  const center = 0.5;
  const right = 1.0;
  const lGradientColor = 0x0000ff;
  const cGradientColor = 0x00ff00;
  const rGradientColor = 0xff0000;

  class FirstPalette {
    getGradientColor(value, gradientName) {
      if (value === left && gradientName === opts.gradient) {
        return lGradientColor;
      }
      if (value === center && gradientName === opts.gradient) {
        return cGradientColor;
      }
      if (value === right && gradientName === opts.gradient) {
        return rGradientColor;
      }
      return 0x000000;
    }
  }

  class Complex {
    constructor(moleculeCount) {
      this._moleculeCount = moleculeCount;
    }

    getMoleculeCount() {
      return this._moleculeCount;
    }
  }
  const palette = new FirstPalette();

  describe('#getAtomColor', () => {
    let paletteStub;
    let mColorer;

    before(() => {
      paletteStub = sinon.stub(palettes, 'first').value(palette);
      mColorer = new MoleculeColorer();
    });
    after(() => {
      paletteStub.restore();
    });

    it('returns left gradient color if complex have only one molecule', () => {
      const residue = { _molecule: { index: 1 } };
      const atom = { residue };
      const complex = new Complex(1);
      expect(mColorer.getAtomColor(atom, complex)).to.equal(lGradientColor);
    });
  });

  describe('#getResidueColor', () => {
    let paletteStub;
    let mColorer;

    before(() => {
      paletteStub = sinon.stub(palettes, 'first').value(palette);
      mColorer = new MoleculeColorer();
    });
    after(() => {
      paletteStub.restore();
    });

    it('returns left gradient color if complex have only one molecule', () => {
      const residue = { _molecule: { index: 1 } };
      const complex = new Complex(1);
      expect(mColorer.getResidueColor(residue, complex)).to.equal(lGradientColor);
    });

    it('returns left gradient color if residue\'s molecule is first in complex', () => {
      const residue = { _molecule: { index: 1 } };
      const complex = new Complex(3);
      expect(mColorer.getResidueColor(residue, complex)).to.equal(lGradientColor);
    });

    it('returns left gradient color if residue\'s molecule is central in complex', () => {
      const residue = { _molecule: { index: 2 } };
      const complex = new Complex(3);
      expect(mColorer.getResidueColor(residue, complex)).to.equal(cGradientColor);
    });

    it('returns left gradient color if residue\'s molecule is last in complex', () => {
      const residue = { _molecule: { index: 3 } };
      const complex = new Complex(3);
      expect(mColorer.getResidueColor(residue, complex)).to.equal(rGradientColor);
    });
  });

  describe('.id', () => {
    const mColorer = new MoleculeColorer();

    it('have .id property type \'string\'', () => {
      expect(mColorer).to.have.property('id');
      expect(mColorer.id).to.be.a('string');
    });

    it('have .id property different from such in parent class', () => {
      const colorer = Object.getPrototypeOf(Object.getPrototypeOf(mColorer));
      expect(mColorer.id).to.not.equal(colorer.id);
    });
  });

  describe('.name', () => {
    it('have .name property type \'string\'', () => {
      const mColorer = new MoleculeColorer();
      expect(mColorer).to.have.property('name');
      expect(mColorer.name).to.be.a('string');
    });
  });

  describe('.shortName', () => {
    it('have .shortName property type \'string\'', () => {
      const mColorer = new MoleculeColorer();
      expect(mColorer).to.have.property('shortName');
      expect(mColorer.shortName).to.be.a('string');
    });
  });
});
