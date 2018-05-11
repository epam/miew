import EntityList from './EntityList';

import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';

chai.use(dirtyChai);

function getSomeEntity(id = 'some') {
  return {id};
}

describe('EntityList', () => {

  const A = getSomeEntity('a');
  const B = getSomeEntity('b');
  const C = getSomeEntity('See');
  const A2 = getSomeEntity('a');

  describe('constructor', () => {

    it('creates an empty list', () => {
      const entityList = new EntityList();
      expect(entityList.all).to.be.empty();
    });

    it('allows to pre-populate the list', () => {
      const entityList = new EntityList([A, B, C]);
      expect(entityList.all).to.deep.equal([A, B, C]);
    });

  });

  describe('#register()', () => {

    it('adds an entity to the list in order', () => {
      const entityList = new EntityList();
      entityList.register(A);
      entityList.register(B);
      expect(entityList.all).to.deep.equal([A, B]);
    });

    it('does not add twice', () => {
      const entityList = new EntityList();
      entityList.register(A);
      entityList.register(A);
      expect(entityList.all).to.deep.equal([A]);
    });

    it('keeps multiple entities with the same id', () => {
      const entityList = new EntityList();
      entityList.register(A);
      entityList.register(A2);
      expect(entityList.all).to.deep.equal([A, A2]);
    });

  });

  describe('#unregister()', () => {

    it('removes an entity from the list', () => {
      const entityList = new EntityList([A, B]);
      entityList.unregister(A);
      expect(entityList.all).to.deep.equal([B]);
    });

    it('skips a not registered entity silently', () => {
      const entityList = new EntityList([A, B]);
      entityList.unregister(C);
      entityList.unregister(A2);
      expect(entityList.all).to.deep.equal([A, B]);
    });

    it('supports multiple entities with the same id', () => {
      const entityList = new EntityList([A, A2]);
      entityList.unregister(A2);
      expect(entityList.all).to.deep.equal([A]);
      entityList.unregister(A);
      expect(entityList.all).to.be.empty();
    });

  });

  describe('#all', () => {

    it('gives a new copy of the real list', () => {
      const entityList = new EntityList([A]);

      const listA1 = entityList.all;
      const listA2 = entityList.all;
      expect(listA2).to.not.equal(listA1);
      expect(listA2).to.deep.equal(listA1);

      listA2.push(B);

      const listA3 = entityList.all;
      expect(listA2).to.not.deep.equal(listA1);
      expect(listA3).to.deep.equal(listA1);
    });

  });

  describe('#get()', () => {

    let entityList;

    beforeEach(() => {
      entityList = new EntityList([A, B]);
    });

    it('returns matching id', () => {
      expect(entityList.get('b')).to.equal(B);
    });

    it('ignores mismatching id', () => {
      expect(entityList.get('c')).to.be.an('undefined');
    });

    it('ignores anything if empty', () => {
      entityList = new EntityList();
      expect(entityList.get('a')).to.be.an('undefined');
    });

    it('is case insensitive for id', () => {
      entityList.register(C);
      expect(entityList.get('A')).to.equal(A);
      expect(entityList.get('sEe')).to.equal(C);
    });

    it('returns the first of matching entities', () => {
      entityList.register(A2);
      expect(entityList.get('a')).to.equal(A);
    });

  });

});
