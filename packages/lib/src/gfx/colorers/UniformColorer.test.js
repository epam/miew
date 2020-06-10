import { expect } from 'chai';
import UniformColorer from './UniformColorer';

describe('UniformColorer', () => {
  const opts = { color: 'red' };

  describe('#getAtomColor', () => {
    it('returns color set during construColorertion', () => {
      const uColorer = new UniformColorer(opts);
      expect(uColorer.getAtomColor()).to.equal(opts.color);
    });
  });

  describe('#getResidueColor', () => {
    it('returns color set during construColorertion', () => {
      const uColorer = new UniformColorer(opts);
      expect(uColorer.getResidueColor()).to.equal(opts.color);
    });
  });

  describe('.id', () => {
    const uColorer = new UniformColorer();

    it('have .id property type \'string\'', () => {
      expect(uColorer).to.have.property('id');
      expect(uColorer.id).to.be.a('string');
    });

    it('have .id property different from suColorerh in parent class', () => {
      const colorer = Object.getPrototypeOf(Object.getPrototypeOf(uColorer));
      expect(uColorer.id).to.not.equal(colorer.id);
    });
  });

  describe('.name', () => {
    it('have .name property type \'string\'', () => {
      const uColorer = new UniformColorer();
      expect(uColorer).to.have.property('name');
      expect(uColorer.name).to.be.a('string');
    });
  });

  describe('.shortName', () => {
    it('have .shortName property type \'string\'', () => {
      const uColorer = new UniformColorer();
      expect(uColorer).to.have.property('shortName');
      expect(uColorer.shortName).to.be.a('string');
    });
  });
});
