import { expect } from 'chai';
import sinon from 'sinon';
import palettes from '../palettes';
import ConformationColorer from './ConformationColorer';

describe('ConformationColorer', () => {
  const chainName = 'A';
  const chainColor = 0xFFFFFF;

  class FirstPalette {
    defaultResidueColor = 0x00ffff;

    getChainColor(name) {
      if (name === chainName) {
        return chainColor;
      }
      return 0x000000;
    }
  }
  const palette = new FirstPalette();

  describe('#getAtomColor', () => {
    let paletteStub;
    let cColorer;

    before(() => {
      paletteStub = sinon.stub(palettes, 'first').value(palette);
      cColorer = new ConformationColorer();
    });
    after(() => {
      paletteStub.restore();
    });

    it('returns color which is set for name of atom located chain', () => {
      const atom = { location: chainName.charCodeAt(0) };
      expect(cColorer.getAtomColor(atom)).to.equal(chainColor);
    });
  });

  describe('#getResidueColor', () => {
    let paletteStub;
    let cColorer;

    before(() => {
      paletteStub = sinon.stub(palettes, 'first').value(palette);
      cColorer = new ConformationColorer();
    });
    after(() => {
      paletteStub.restore();
    });

    it('returns default color which is set for all residues', () => {
      const color = cColorer.getResidueColor();
      expect(color).to.equal(palette.defaultResidueColor);
    });
  });

  describe('.id', () => {
    const cColorer = new ConformationColorer();

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
      const cColorer = new ConformationColorer();
      expect(cColorer).to.have.property('name');
      expect(cColorer.name).to.be.a('string');
    });
  });

  describe('.shortName', () => {
    it('have .shortName property type \'string\'', () => {
      const cColorer = new ConformationColorer();
      expect(cColorer).to.have.property('shortName');
      expect(cColorer.shortName).to.be.a('string');
    });
  });
});
