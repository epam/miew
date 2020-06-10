import { expect } from 'chai';
import sinon from 'sinon';
import palettes from '../palettes';
import HydrophobicityColorer from './HydrophobicityColorer';

describe('HydrophobicityColorer', () => {
  const opts = { gradient: 'rainbow' };
  const left = 0.0;
  const center = 0.5;
  const right = 1.0;
  const lGradientColor = 0x0000ff;
  const cGradientColor = 0x00ff00;
  const rGradientColor = 0xff0000;

  class FirstPalette {
    defaultResidueColor = 0xffffff;

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
  const palette = new FirstPalette();

  describe('#getAtomColor', () => {
    let paletteStub;
    let hColorer;

    before(() => {
      paletteStub = sinon.stub(palettes, 'first').value(palette);
      hColorer = new HydrophobicityColorer(opts);
    });
    after(() => {
      paletteStub.restore();
    });

    it('returns default color which is set for residues if atom\'s residue is not hydrophobicity', () => {
      const atom = { residue: { _type: {} } };
      const color = hColorer.getAtomColor(atom);
      expect(color).to.equal(palette.defaultResidueColor);
    });
  });

  describe('#getResidueColor', () => {
    let paletteStub;
    let hColorer;

    beforeEach(() => {
      paletteStub = sinon.stub(palettes, 'first').value(palette);
      hColorer = new HydrophobicityColorer(opts);
    });
    afterEach(() => {
      paletteStub.restore();
    });

    it('returns left color of gradient for residue with the highest hydrophobicity', () => {
      const residueH = { _type: { hydrophobicity: -4.5 } };
      const color = hColorer.getResidueColor(residueH);
      expect(color).to.equal(lGradientColor);
    });

    it('returns middle color of gradient for residue with the middle hydrophobicity', () => {
      const residueH = { _type: { hydrophobicity: 0.0 } };
      const color = hColorer.getResidueColor(residueH);
      expect(color).to.equal(cGradientColor);
    });

    it('returns right color of gradient for residue with the highest hydrophobicity', () => {
      const residueH = { _type: { hydrophobicity: 4.5 } };
      const color = hColorer.getResidueColor(residueH);
      expect(color).to.equal(rGradientColor);
    });

    it('returns default color which is set for residues if residue is not hydrophobicity', () => {
      const residue = { _type: {} };
      const color = hColorer.getResidueColor(residue);
      expect(color).to.equal(palette.defaultResidueColor);
    });
  });

  describe('.id', () => {
    const hColorer = new HydrophobicityColorer();

    it('have .id property type \'string\'', () => {
      expect(hColorer).to.have.property('id');
      expect(hColorer.id).to.be.a('string');
    });

    it('have .id property different from such in parent class', () => {
      const colorer = Object.getPrototypeOf(Object.getPrototypeOf(hColorer));
      expect(hColorer.id).to.not.equal(colorer.id);
    });
  });

  describe('.name', () => {
    it('have .name property type \'string\'', () => {
      const hColorer = new HydrophobicityColorer();
      expect(hColorer).to.have.property('name');
      expect(hColorer.name).to.be.a('string');
    });
  });

  describe('.shortName', () => {
    it('have .shortName property type \'string\'', () => {
      const hColorer = new HydrophobicityColorer();
      expect(hColorer).to.have.property('shortName');
      expect(hColorer.shortName).to.be.a('string');
    });
  });
});
