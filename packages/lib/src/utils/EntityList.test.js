import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import EntityList from './EntityList';

chai.use(dirtyChai);

function getSomeEntity(id = 'some') {
  return { id };
}

function getMultiEntity(id) {
  return { id1: `${id}1`, id2: `${id}2` };
}

describe('EntityList', () => {
  const A = getSomeEntity('a');
  const B = getSomeEntity('b');
  const C = getSomeEntity('See');
  const A2 = getSomeEntity('a');
  const MA = getMultiEntity('a');
  const MB = getMultiEntity('b');

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

  describe('#first', () => {
    it('gives the first registered entity', () => {
      const entityList = new EntityList([A2, A]);
      expect(entityList.first).to.equal(A2);
    });

    it('is undefined for empty list', () => {
      const entityList = new EntityList();
      expect(entityList.first).to.be.an('undefined');
    });
  });

  describe('#keys()', () => {
    it('returns a list of unique keys', () => {
      const entityList = new EntityList([A, B, A2]);
      expect(entityList.keys().sort()).to.deep.equal(['a', 'b']);
    });

    it('returns a list of keys for secondary index', () => {
      const entityList = new EntityList([MA, MB], ['id1', 'id2']);
      expect(entityList.keys('id2').sort()).to.deep.equal(['a2', 'b2']);
    });
  });

  describe('#get()', () => {
    let entityList;
    let secondList;

    beforeEach(() => {
      entityList = new EntityList([A, B]);
      secondList = new EntityList([MA, MB], ['id1', 'id2']);
    });

    it('returns matching key', () => {
      expect(entityList.get('b')).to.equal(B);
    });

    it('ignores mismatching key', () => {
      expect(entityList.get('c')).to.be.an('undefined');
    });

    it('ignores undefined key', () => {
      expect(secondList.get(undefined)).to.be.an('undefined');
    });

    it('ignores anything if empty', () => {
      entityList = new EntityList();
      expect(entityList.get('a')).to.be.an('undefined');
    });

    it('is case insensitive for key', () => {
      entityList.register(C);
      expect(entityList.get('A')).to.equal(A);
      expect(entityList.get('sEe')).to.equal(C);
    });

    it('returns the first of matching entities', () => {
      entityList.register(A2);
      expect(entityList.get('a')).to.equal(A);
    });

    it('allows specifying an index to search', () => {
      expect(entityList.get('b', 'id')).to.equal(B);
    });

    it('returns matching key for the secondary index', () => {
      expect(secondList.get('b2', 'id2')).to.equal(MB);
    });

    it('ignores mismatching key for the secondary index', () => {
      expect(secondList.get('b1', 'id2')).to.be.an('undefined');
    });

    it('ignores mismatching index', () => {
      expect(secondList.get('b1', 'id')).to.be.an('undefined');
    });
  });
});
