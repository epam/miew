import { expect } from 'chai';
import sinon from 'sinon';
import palettes from '../palettes';
import settings from '../../settings';
import Colorer from './Colorer';

describe('Colorer', () => {
  class InheritorColorer extends Colorer {
    static id = 'IH';
  }
  InheritorColorer.prototype.id = 'IH';
  InheritorColorer.prototype.name = 'Inheritor';
  InheritorColorer.prototype.shortName = 'Inheritor';

  describe('constructor', () => {
    let paletteStub;
    let settingsStub;
    let defOpts = { min: 4, max: 19 };
    let opts = { max: 9 };
    let mergedOpts = { min: 4, max: 9 };
    const firstPalette = 'firstPalette';

    beforeEach(() => {
      defOpts = { min: 4, max: 19 };
      opts = { max: 9 };
      mergedOpts = { min: 4, max: 9 };

      settingsStub = sinon.stub(settings, 'now').value({ colorers: { IH: defOpts } });
      paletteStub = sinon.stub(palettes, 'first').value(firstPalette);
    });
    afterEach(() => {
      settingsStub.restore();
      paletteStub.restore();
    });

    it('throws an error when trying to instantiate Colorer class', () => {
      expect(() => new Colorer()).to.throw();
    });

    it('for inherit creates without params', () => {
      const ih = new InheritorColorer();
      expect(ih.opts).to.deep.equal(defOpts);
      expect(ih.palette).to.equal(firstPalette);
    });

    it('for inherit creates with opts', () => {
      const ih = new InheritorColorer(opts);
      expect(ih.opts).to.deep.equal(mergedOpts);
      expect(ih.palette).to.equal(firstPalette);
    });

    it('check for changing opts not influence on created colorer', () => {
      const ih = new InheritorColorer(opts);
      expect(ih.opts).to.deep.equal(mergedOpts);
      opts.max = 15;
      expect(ih.opts).to.deep.equal(mergedOpts);
    });

    it('check for changing default opts influence on created colorer', () => {
      const ih = new InheritorColorer(opts);
      expect(ih.opts).to.deep.equal(mergedOpts);
      defOpts.min = 8;
      mergedOpts.min = defOpts.min;
      expect(ih.opts).to.deep.equal(mergedOpts);
    });
  });

  describe('#identify', () => {
  });
});
