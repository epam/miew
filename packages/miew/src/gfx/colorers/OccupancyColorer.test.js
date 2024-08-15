import { expect } from 'chai';
import sinon from 'sinon';
import palettes from '../palettes';
import OccupancyColorer from './OccupancyColorer';

describe('OccupancyColorer', () => {
  const opts = { gradient: 'rainbow' };
  const left = 0.0;
  const center = 0.5;
  const right = 1.0;
  const lGradientColor = 0x0000ff;
  const cGradientColor = 0x00ff00;
  const rGradientColor = 0xff0000;

  class FirstPalette {
    defaultGradientColor = 0xffffff;

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
    let oColorer;

    beforeEach(() => {
      paletteStub = sinon.stub(palettes, 'first').value(palette);
      oColorer = new OccupancyColorer(opts);
    });
    afterEach(() => {
      paletteStub.restore();
    });

    it('returns left color of gradient for atom with the highest occupancy', () => {
      const atom = { occupancy: 1.0 };
      const color = oColorer.getAtomColor(atom);
      expect(color).to.equal(lGradientColor);
    });

    it('returns middle color of gradient for atom with the middle occupancy', () => {
      const atom = { occupancy: 0.5 };
      const color = oColorer.getAtomColor(atom);
      expect(color).to.equal(cGradientColor);
    });

    it('returns right color of gradient for atom with the lowest occupancy', () => {
      const atom = { occupancy: 0.0 };
      const color = oColorer.getAtomColor(atom);
      expect(color).to.equal(rGradientColor);
    });

    it('returns default color which is set for this palette if atom\'s occupancy is not specified', () => {
      const atom = { occupancy: undefined };

      const color = oColorer.getAtomColor(atom);
      expect(color).to.equal(palette.defaultGradientColor);
    });
  });

  describe('#getResidueColor', () => {
    let paletteStub;
    let oColorer;

    beforeEach(() => {
      paletteStub = sinon.stub(palettes, 'first').value(palette);
      oColorer = new OccupancyColorer(opts);
    });
    afterEach(() => {
      paletteStub.restore();
    });

    it('returns left color of gradient for residue with the highest occupancy', () => {
      const residue = { occupancy: 1.0 };
      const color = oColorer.getResidueColor(residue);
      expect(color).to.equal(lGradientColor);
    });

    it('returns middle color of gradient for residue with the middle occupancy', () => {
      const residue = { occupancy: 0.5 };
      const color = oColorer.getResidueColor(residue);
      expect(color).to.equal(cGradientColor);
    });

    it('returns right color of gradient for residue with the lowest occupancy', () => {
      const residue = { occupancy: 0.0 };
      const color = oColorer.getResidueColor(residue);
      expect(color).to.equal(rGradientColor);
    });

    /* it('returns default color which is set for this palette if gradient mode is not specified in it', () => {
      const residue = { occupancy: 0.0 };
      const colorerWithoutOpts = new OccupancyColorer();
      const colorerWithoutGradOpts = new OccupancyColorer({ color: 0x0000ff });

      let color = colorerWithoutOpts.getResidueColor(residue);
      expect(color).to.equal(palette.defaultGradientColor);

      color = colorerWithoutGradOpts.getResidueColor(residue);
      expect(color).to.equal(palette.defaultGradientColor);
    }); */

    it('returns default color which is set for this palette if residue\'s occupancy is not specified', () => {
      const residue = { occupancy: undefined };

      const color = oColorer.getResidueColor(residue);
      expect(color).to.equal(palette.defaultGradientColor);
    });
  });

  describe('.id', () => {
    const oColorer = new OccupancyColorer();

    it('have .id property type \'string\'', () => {
      expect(oColorer).to.have.property('id');
      expect(oColorer.id).to.be.a('string');
    });

    it('have .id property different from such in parent class', () => {
      const colorer = Object.getPrototypeOf(Object.getPrototypeOf(oColorer));
      expect(oColorer.id).to.not.equal(colorer.id);
    });
  });

  describe('.name', () => {
    it('have .name property type \'string\'', () => {
      const oColorer = new OccupancyColorer();
      expect(oColorer).to.have.property('name');
      expect(oColorer.name).to.be.a('string');
    });
  });

  describe('.shortName', () => {
    it('have .shortName property type \'string\'', () => {
      const oColorer = new OccupancyColorer();
      expect(oColorer).to.have.property('shortName');
      expect(oColorer.shortName).to.be.a('string');
    });
  });
});
