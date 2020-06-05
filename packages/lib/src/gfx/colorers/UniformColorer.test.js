import { expect } from 'chai';
import UniformColorer from './UniformColorer';

describe('UniformColorer', () => {
  const opts = { color: 'red' };

  describe('.id', () => {
    const un = new UniformColorer();
    it('have property called id', () => {
      expect(un).to.have.property('id');
    });

    it('have .id property type \'string\'', () => {
      expect(un.id).to.be.a('string');
    });

    it('have .id property different from such in parent class', () => {
      const colorer = Object.getPrototypeOf(Object.getPrototypeOf(un));
      expect(un.id).to.not.equal(colorer.id);
    });
  });

  describe('.name', () => {
    const un = new UniformColorer();
    it('have property called name', () => {
      expect(un).to.have.property('name');
    });

    it('have .name property type \'string\'', () => {
      expect(un.name).to.be.a('string');
    });
  });

  describe('.shortName', () => {
    const un = new UniformColorer();
    it('have property called shortName', () => {
      expect(un).to.have.property('shortName');
    });

    it('have .shortName property type \'string\'', () => {
      expect(un.shortName).to.be.a('string');
    });
  });

  describe('#getAtomColor', () => {
    it('returns color stored as opts field', () => {
      const uc = new UniformColorer(opts);
      expect(uc.getAtomColor()).to.equal(opts.color);
    });
  });

  describe('#getResidueColor', () => {
    it('returns color stored as opts field', () => {
      const uc = new UniformColorer(opts);
      expect(uc.getResidueColor()).to.equal(opts.color);
    });
  });
});
