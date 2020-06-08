import { expect } from 'chai';
import sinon from 'sinon';
import palettes from '../palettes';
import ResidueTypeColorer from './ResidueTypeColorer';

describe('ResidueTypeColorer', () => {
  describe('.id', () => {
    const rtc = new ResidueTypeColorer();
    it('have property called id', () => {
      expect(rtc).to.have.property('id');
    });

    it('have .id property type \'string\'', () => {
      expect(rtc.id).to.be.a('string');
    });

    it('have .id property different from such in parent class', () => {
      const colorer = Object.getPrototypeOf(Object.getPrototypeOf(rtc));
      expect(rtc.id).to.not.equal(colorer.id);
    });
  });

  describe('.name', () => {
    const rtc = new ResidueTypeColorer();
    it('have property called name', () => {
      expect(rtc).to.have.property('name');
    });

    it('have .name property type \'string\'', () => {
      expect(rtc.name).to.be.a('string');
    });
  });

  describe('.shortName', () => {
    const rtc = new ResidueTypeColorer();
    it('have property called shortName', () => {
      expect(rtc).to.have.property('shortName');
    });

    it('have .shortName property type \'string\'', () => {
      expect(rtc.shortName).to.be.a('string');
    });
  });

  const residueColor = 'residueColor';

  class FirstPalette {
    getResidueColor() {
      return residueColor;
    }
  }

  const residue = { _type: { _name: 'resTypeName' } };
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

    it('returns the same color with set for atom\'s residue type', () => {
      const rtc = new ResidueTypeColorer();
      expect(rtc.getAtomColor(atom)).to.equal(residueColor);
    });

    it('calls getResidueColor() with atom\'s residue', () => {
      const rtc = new ResidueTypeColorer();
      const getResidueColor = sinon.spy(rtc, 'getResidueColor');
      rtc.getAtomColor(atom);
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

    it('returns the same color with set for residue type', () => {
      const rtc = new ResidueTypeColorer();
      expect(rtc.getResidueColor(residue)).to.equal(residueColor);
    });

    it('calls getResidueColor with exactly residue\'s type name', () => {
      const rtc = new ResidueTypeColorer();
      const getResidueColor = sinon.spy(rtc.palette, 'getResidueColor');
      rtc.getResidueColor(residue);
      expect(getResidueColor).to.be.calledOnce().and.calledWithExactly(residue._type._name);
      getResidueColor.restore();
    });
  });
});
