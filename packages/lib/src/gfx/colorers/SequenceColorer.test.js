import { expect } from 'chai';
import sinon from 'sinon';
import palettes from '../palettes';
import SequenceColorer from './SequenceColorer';

describe('SequenceColorer', () => {
  const opts = { gradient: 'rainbow' };
  const left = 0.0;
  const center = 0.5;
  const right = 1.0;
  const lGradientColor = 0x0000ff;
  const cGradientColor = 0x00ff00;
  const rGradientColor = 0xff0000;

  class FirstPalette {
    defaultNamedColor = 0xffffff;

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
    let sColorer;

    before(() => {
      paletteStub = sinon.stub(palettes, 'first').value(palette);
      sColorer = new SequenceColorer();
    });
    after(() => {
      paletteStub.restore();
    });

    it('returns default color if atom\'s residue\'s chain length is invert infinity', () => {
      const residue = {
        _chain: { minSequence: Number.POSITIVE_INFINITY, maxSequence: Number.NEGATIVE_INFINITY },
        _sequence: 5,
      };
      const atom = { residue };
      expect(sColorer.getAtomColor(atom)).to.equal(palette.defaultNamedColor);
    });
  });

  describe('#getResidueColor', () => {
    let paletteStub;
    let sColorer;

    before(() => {
      paletteStub = sinon.stub(palettes, 'first').value(palette);
      sColorer = new SequenceColorer();
    });
    after(() => {
      paletteStub.restore();
    });

    it('returns default color if residue\'s chain length is invert infinity (means no counted residues in chain)', () => {
      const residue = {
        _chain: { minSequence: Number.POSITIVE_INFINITY, maxSequence: Number.NEGATIVE_INFINITY },
        _sequence: 5,
      };
      expect(sColorer.getResidueColor(residue)).to.equal(palette.defaultNamedColor);
    });

    it('returns left gradient color if residue sequence ID is first in residue\'s chain', () => {
      const residue = {
        _chain: { minSequence: 1, maxSequence: 9 },
        _sequence: 1,
      };
      expect(sColorer.getResidueColor(residue)).to.equal(lGradientColor);
    });

    it('returns middle gradient color if residue sequence ID is central in residue\'s chain', () => {
      const residue = {
        _chain: { minSequence: 1, maxSequence: 9 },
        _sequence: 5,
      };
      expect(sColorer.getResidueColor(residue)).to.equal(cGradientColor);
    });

    it('returns right gradient color if residue sequence ID is last in residue\'s chain', () => {
      const residue = {
        _chain: { minSequence: 1, maxSequence: 9 },
        _sequence: 9,
      };
      expect(sColorer.getResidueColor(residue)).to.equal(rGradientColor);
    });

    it('returns left gradient color if residue residue\'s chain length is 0 (means 1 counted residue exists in chain)', () => {
      const residue = {
        _chain: { minSequence: 1, maxSequence: 1 },
        _sequence: 1,
      };
      expect(sColorer.getResidueColor(residue)).to.equal(lGradientColor);
    });
  });

  describe('.id', () => {
    const sColorer = new SequenceColorer();

    it('have .id property type \'string\'', () => {
      expect(sColorer).to.have.property('id');
      expect(sColorer.id).to.be.a('string');
    });

    it('have .id property different from such in parent class', () => {
      const colorer = Object.getPrototypeOf(Object.getPrototypeOf(sColorer));
      expect(sColorer.id).to.not.equal(colorer.id);
    });
  });

  describe('.name', () => {
    it('have .name property type \'string\'', () => {
      const sColorer = new SequenceColorer();
      expect(sColorer).to.have.property('name');
      expect(sColorer.name).to.be.a('string');
    });
  });

  describe('.shortName', () => {
    it('have .shortName property type \'string\'', () => {
      const sColorer = new SequenceColorer();
      expect(sColorer).to.have.property('shortName');
      expect(sColorer.shortName).to.be.a('string');
    });
  });
});
