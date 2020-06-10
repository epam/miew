import { expect } from 'chai';
import sinon from 'sinon';
import palettes from '../palettes';
import ElementColorer from './ElementColorer';

describe('ElementColorer', () => {
  const carbonElem = 'C';
  const oxygenElem = 'O';
  const carbonColor = 0xFFFF00;
  const oxygenColor = 0x00FFFF;
  const optsCarbonColor = 0xFF0000;

  class FirstPalette {
    defaultResidueColor = 0xffffff;

    getElementColor(name) {
      if (name === carbonElem) {
        return carbonColor;
      }
      if (name === oxygenElem) {
        return oxygenColor;
      }
      return 0x000000;
    }
  }
  const palette = new FirstPalette();

  describe('#getAtomColor', () => {
    let paletteStub;
    let eColorerWithCarbon;
    let eColorerWithoutCarbon;

    beforeEach(() => {
      paletteStub = sinon.stub(palettes, 'first').value(palette);
      eColorerWithCarbon = new ElementColorer({ carbon: optsCarbonColor });
      eColorerWithoutCarbon = new ElementColorer({ carbon: -1 });
    });
    afterEach(() => {
      paletteStub.restore();
    });

    it('always returns proper color for Oxygen', () => {
      const oxygenAtom = { element: { name: 'O' } };
      expect(eColorerWithCarbon.getAtomColor(oxygenAtom)).to.equal(oxygenColor);
      expect(eColorerWithoutCarbon.getAtomColor(oxygenAtom)).to.equal(oxygenColor);
    });

    it('returns proper color for Carbon element if colorer options does not have another carbon color', () => {
      const carbonAtom = { element: { name: 'C' } };
      expect(eColorerWithoutCarbon.getAtomColor(carbonAtom)).to.equal(carbonColor);
    });

    it('returns color which is set in colorer options for Carbon instead of proper color for Carbon', () => {
      const carbonAtom = { element: { name: 'C' } };
      expect(eColorerWithCarbon.getAtomColor(carbonAtom)).to.equal(optsCarbonColor);
    });
  });

  describe('#getResidueColor', () => {
    let paletteStub;
    let eColorer;

    before(() => {
      paletteStub = sinon.stub(palettes, 'first').value(palette);
      eColorer = new ElementColorer();
    });
    after(() => {
      paletteStub.restore();
    });

    it('returns default color which is set for all residues', () => {
      const color = eColorer.getResidueColor();
      expect(color).to.equal(palette.defaultResidueColor);
    });
  });

  describe('.id', () => {
    const eColorer = new ElementColorer();

    it('have .id property type \'string\'', () => {
      expect(eColorer).to.have.property('id');
      expect(eColorer.id).to.be.a('string');
    });

    it('have .id property different from such in parent class', () => {
      const colorer = Object.getPrototypeOf(Object.getPrototypeOf(eColorer));
      expect(eColorer.id).to.not.equal(colorer.id);
    });
  });

  describe('.name', () => {
    it('have .name property type \'string\'', () => {
      const eColorer = new ElementColorer();
      expect(eColorer).to.have.property('name');
      expect(eColorer.name).to.be.a('string');
    });
  });

  describe('.shortName', () => {
    it('have .shortName property type \'string\'', () => {
      const eColorer = new ElementColorer();
      expect(eColorer).to.have.property('shortName');
      expect(eColorer.shortName).to.be.a('string');
    });
  });
});
