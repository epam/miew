import { expect } from 'chai';
import sinon from 'sinon';
import palettes from '../palettes';
import ResidueTypeColorer from './ResidueTypeColorer';

describe('ResidueTypeColorer', () => {
  const resTypeName = 'HET';
  const resColor = 0xFFFFFF;

  class FirstPalette {
    getResidueColor(name) {
      if (name === resTypeName) {
        return resColor;
      }
      return 0x000000;
    }
  }
  const palette = new FirstPalette();

  describe('#getAtomColor', () => {
    let paletteStub;
    let rtColorer;

    before(() => {
      paletteStub = sinon.stub(palettes, 'first').value(palette);
      rtColorer = new ResidueTypeColorer();
    });
    after(() => {
      paletteStub.restore();
    });

    it('returns color which is set for atom\'s residue\'s type', () => {
      const residue = { _type: { _name: resTypeName } };
      const atom = { residue };
      expect(rtColorer.getAtomColor(atom)).to.equal(resColor);
    });
  });

  describe('#getResidueColor', () => {
    let paletteStub;
    let rtColorer;

    before(() => {
      paletteStub = sinon.stub(palettes, 'first').value(palette);
      rtColorer = new ResidueTypeColorer();
    });
    after(() => {
      paletteStub.restore();
    });

    it('returns color which is set for residue\'s type', () => {
      const residue = { _type: { _name: resTypeName } };
      expect(rtColorer.getResidueColor(residue)).to.equal(resColor);
    });
  });

  describe('.id', () => {
    const rtColorer = new ResidueTypeColorer();

    it('have .id property type \'string\'', () => {
      expect(rtColorer).to.have.property('id');
      expect(rtColorer.id).to.be.a('string');
    });

    it('have .id property different from such in parent class', () => {
      const colorer = Object.getPrototypeOf(Object.getPrototypeOf(rtColorer));
      expect(rtColorer.id).to.not.equal(colorer.id);
    });
  });

  describe('.name', () => {
    it('have .name property type \'string\'', () => {
      const rtColorer = new ResidueTypeColorer();
      expect(rtColorer).to.have.property('name');
      expect(rtColorer.name).to.be.a('string');
    });
  });

  describe('.shortName', () => {
    it('have .shortName property type \'string\'', () => {
      const rtColorer = new ResidueTypeColorer();
      expect(rtColorer).to.have.property('shortName');
      expect(rtColorer.shortName).to.be.a('string');
    });
  });
});
