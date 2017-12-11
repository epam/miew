import LoaderList from './LoaderList';

import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';

chai.use(dirtyChai);

function getSomeLoaderClass(type = 'some') {
  const SomeLoader = class {
    static canProbablyLoad(source) {
      return source === `${type}-source`;
    }
  };
  SomeLoader.types = [type, `${type}-type`];
  return SomeLoader;
}

describe('LoaderList', () => {

  const A = getSomeLoaderClass('a');
  const B = getSomeLoaderClass('b');
  const C = getSomeLoaderClass('See');
  const A2 = getSomeLoaderClass('a');

  const typeA  = ['a', 'a-type'];
  const typeB  = ['b', 'b-type'];
  const typeAB = ['a', 'a-type', 'b', 'b-type'];

  describe('constructor', () => {

    it('creates an empty list', () => {
      const loaderList = new LoaderList();
      expect(loaderList.all).to.be.empty();
      expect(loaderList.types).to.be.empty();
    });

    it('allows to pre-populate the list', () => {
      const loaderList = new LoaderList([A, B, C]);
      expect(loaderList.all).to.deep.equal([A, B, C]);
    });

  });

  describe('#register()', () => {

    it('adds a loader to the list in order', () => {
      const loaderList = new LoaderList();
      loaderList.register(A);
      loaderList.register(B);
      expect(loaderList.all).to.deep.equal([A, B]);
      expect(loaderList.types.sort()).to.deep.equal(typeAB);
    });

    it('does not add twice', () => {
      const loaderList = new LoaderList();
      loaderList.register(A);
      loaderList.register(A);
      expect(loaderList.all).to.deep.equal([A]);
      expect(loaderList.types).to.deep.equal(typeA);
    });

    it('allows multiple loaders for the same format', () => {
      const loaderList = new LoaderList();
      loaderList.register(A);
      loaderList.register(A2);
      expect(loaderList.all).to.deep.equal([A, A2]);
      expect(loaderList.types).to.deep.equal(typeA);
    });

  });

  describe('#unregister()', () => {

    it('removes a loader from the list', () => {
      const loaderList = new LoaderList([A, B]);
      loaderList.unregister(A);
      expect(loaderList.all).to.deep.equal([B]);
      expect(loaderList.types).to.deep.equal(typeB);
    });

    it('skips a not registered loader', () => {
      const loaderList = new LoaderList([A, B]);
      loaderList.unregister(C);
      loaderList.unregister(A2);
      expect(loaderList.all).to.deep.equal([A, B]);
      expect(loaderList.types.sort()).to.deep.equal(typeAB);
    });

    it('supports multiple loaders for the same format', () => {
      const loaderList = new LoaderList([A, A2]);
      loaderList.unregister(A2);
      expect(loaderList.all).to.deep.equal([A]);
      expect(loaderList.types).to.deep.equal(typeA);
      loaderList.unregister(A);
      expect(loaderList.all).to.be.empty();
      expect(loaderList.types).to.be.empty();
    });

  });

  describe('#all', () => {

    it('gives a new copy of the real list', () => {
      const loaderList = new LoaderList([A]);

      const listA1 = loaderList.all;
      const listA2 = loaderList.all;
      expect(listA2).to.not.equal(listA1);
      expect(listA2).to.deep.equal(listA1);

      listA2.push(B);

      const listA3 = loaderList.all;
      expect(listA2).to.not.deep.equal(listA1);
      expect(listA3).to.deep.equal(listA1);
    });

  });

  describe('#find()', () => {

    let loaderList;

    beforeEach(() => {
      loaderList = new LoaderList([A, B]);
    });

    it('returns matching type', () => {
      expect(loaderList.find({type: 'b'})).to.deep.equal([B]);
    });

    it('ignores mismatching file type', () => {
      expect(loaderList.find({type: 'c'})).to.be.empty();
    });

    it('returns a match if an alternative type name is used', () => {
      expect(loaderList.find({type: 'b-type'})).to.deep.equal([B]);
    });

    it('is case insensitive for type', () => {
      loaderList.register(C);
      expect(loaderList.find({type: 'A-Type'})).to.deep.equal([A]);
      expect(loaderList.find({type: 'see-Type'})).to.deep.equal([C]);
    });

    it('tries to detect a loader automatically if source is given', () => {
      expect(loaderList.find({source: 'source'})).to.be.empty();
      expect(loaderList.find({source: 'b-source'})).to.deep.equal([B]);
    });

    it('returns multiple entries if they all fit', () => {
      loaderList.register(A2);
      expect(loaderList.find({type: 'a'})).to.deep.equal([A, A2]);
      expect(loaderList.find({source: 'a-source'})).to.deep.equal([A, A2]);
    });

    it('returns nothing if neither type nor source is specified', () => {
      expect(loaderList.find({})).to.be.empty();
    });

  });

});
