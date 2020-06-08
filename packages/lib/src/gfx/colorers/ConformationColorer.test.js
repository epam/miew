import { expect } from 'chai';
import sinon from 'sinon';
import palettes from '../palettes';
import ConformationColorer from './ConformationColorer';

describe('ConformationColorer', () => {
  describe('.id', () => {
    const cc = new ConformationColorer();
    it('have property called id', () => {
      expect(cc).to.have.property('id');
    });

    it('have .id property type \'string\'', () => {
      expect(cc.id).to.be.a('string');
    });

    it('have .id property different from such in parent class', () => {
      const colorer = Object.getPrototypeOf(Object.getPrototypeOf(cc));
      expect(cc.id).to.not.equal(colorer.id);
    });
  });

  describe('.name', () => {
    const cc = new ConformationColorer();
    it('have property called name', () => {
      expect(cc).to.have.property('name');
    });

    it('have .name property type \'string\'', () => {
      expect(cc.name).to.be.a('string');
    });
  });

  describe('.shortName', () => {
    const cc = new ConformationColorer();
    it('have property called shortName', () => {
      expect(cc).to.have.property('shortName');
    });

    it('have .shortName property type \'string\'', () => {
      expect(cc.shortName).to.be.a('string');
    });
  });

  const chainColor = 'chainColor';

  class FirstPalette {
    static defaultResidueColor = 'defColor';

    getChainColor() {
      return chainColor;
    }
  }

  const palette = new FirstPalette();

  describe('#getAtomColor', () => {
    let paletteStub;
    const atom = { location: 'loc' };

    beforeEach(() => {
      paletteStub = sinon.stub(palettes, 'first').value(palette);
    });
    afterEach(() => {
      paletteStub.restore();
    });

    it('returns color corresponded to chain detected via atom location', () => {
      const cc = new ConformationColorer();
      expect(cc.getAtomColor(atom)).to.equal(chainColor);
    });

    it('checks sequence of calls and their arguments', () => {
      const cc = new ConformationColorer();
      const fromCharCode = sinon.spy(String, 'fromCharCode');
      const getChainColor = sinon.spy(cc.palette, 'getChainColor');
      cc.getAtomColor(atom);
      expect(fromCharCode).to.be.calledOnce().and.calledWithExactly(atom.location);
      expect(getChainColor).to.be.calledOnce().and.calledWithExactly(fromCharCode.returnValues[0]);
      fromCharCode.restore();
      getChainColor.restore();
    });
  });

  describe('#getResidueColor', () => {
    it('returns default color which is set for object\'s palette', () => {
      const paletteStub = sinon.stub(palettes, 'first').value(palette);

      const cc = new ConformationColorer();
      expect(cc.getResidueColor()).to.equal(palette.defaultResidueColor);

      paletteStub.restore();
    });
  });
});
