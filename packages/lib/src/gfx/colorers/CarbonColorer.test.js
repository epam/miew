import { expect } from 'chai';
import sinon from 'sinon';
import Atom from '../../chem/Atom';
import CarbonColorer from './CarbonColorer';

describe('CarbonColorer', () => {
  const opts = {
    color: 0x222222,
    factor: 0.5,
  };
  const scaledColor = 0x111111;
  const carbonFlag = 0x0001;
  const hydrogenFlag = 0x0002;

  describe('#getAtomColor', () => {
    let atomStub;
    let cColorer;

    beforeEach(() => {
      atomStub = sinon.stub(Atom, 'Flags').value({ CARBON: carbonFlag });
      cColorer = new CarbonColorer(opts);
    });
    afterEach(() => {
      atomStub.restore();
    });

    it('returns color set during construction for carbon atoms', () => {
      const atom = { flags: carbonFlag };
      expect(cColorer.getAtomColor(atom)).to.equal(opts.color);
    });

    it('returns scaled color set during construction for non carbon atoms', () => {
      const atom = { flags: hydrogenFlag };
      expect(cColorer.getAtomColor(atom)).to.equal(scaledColor);
    });
  });

  describe('#getResidueColor', () => {
    const cColorer = new CarbonColorer(opts);

    it('returns color set during construction', () => {
      expect(cColorer.getResidueColor()).to.equal(opts.color);
    });
  });

  describe('.id', () => {
    const cColorer = new CarbonColorer();

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
      const cColorer = new CarbonColorer();
      expect(cColorer).to.have.property('name');
      expect(cColorer.name).to.be.a('string');
    });
  });

  describe('.shortName', () => {
    it('have .shortName property type \'string\'', () => {
      const cColorer = new CarbonColorer();
      expect(cColorer).to.have.property('shortName');
      expect(cColorer.shortName).to.be.a('string');
    });
  });
});
