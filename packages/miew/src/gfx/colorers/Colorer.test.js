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

    it('creates inheritor without params using default settings', () => {
      const ih = new InheritorColorer();
      expect(ih.opts).to.deep.equal(defOpts);
      expect(ih.palette).to.equal(firstPalette);
    });

    it('creates inheritor with opts merging them with default settings', () => {
      const ih = new InheritorColorer(opts);
      expect(ih.opts).to.deep.equal(mergedOpts);
      expect(ih.palette).to.equal(firstPalette);
    });

    it('checks for changing opts not influence on created colorer', () => {
      const ih = new InheritorColorer(opts);
      expect(ih.opts).to.deep.equal(mergedOpts);
      opts.max += 10;
      expect(ih.opts.max).to.equal(mergedOpts.max);
    });

    it('checks for changing default opts influence on created colorer', () => {
      const ih = new InheritorColorer(opts);
      expect(ih.opts).to.deep.equal(mergedOpts);
      defOpts.min += 10;
      expect(ih.opts.min).to.equal(defOpts.min);
    });
  });

  describe('#identify', () => {
    let settingsStub;
    let defOpts = { min: 4, max: 19 };
    let opts = { max: 9 };

    beforeEach(() => {
      defOpts = { min: 4, max: 19 };
      opts = { max: 9 };

      settingsStub = sinon.stub(settings, 'now').value({ colorers: { IH: defOpts } });
    });
    afterEach(() => {
      settingsStub.restore();
    });

    it('returns only id for colorer created with no difference from settings', () => {
      const ih = new InheritorColorer();
      const id = ih.identify();
      expect(id instanceof Array).to.equal(false);
      expect(id).to.equal(ih.id);
    });

    it('returns array [id diff] for colorer created with differences from settings', () => {
      const ih = new InheritorColorer(opts);
      const id = ih.identify();
      expect(id instanceof Array).to.equal(true);
      expect(id.length).to.equal(2);
      expect(id[0]).to.equal(ih.id);
      expect(id[1]).to.deep.equal(opts);
    });
  });
});
