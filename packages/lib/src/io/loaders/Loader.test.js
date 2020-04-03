import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import Loader from './Loader';

chai.use(dirtyChai);
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('Loader', () => {
  describe('#load()', () => {
    it('rejects the promise eventually', () => {
      const loader = new Loader();
      return expect(loader.load()).to.be.rejected();
    });
  });

  describe('#abort()', () => {
    it('is immediately forwarded to a loading agent', () => {
      const loader = new Loader();
      const abort = sinon.spy();
      loader._agent = { abort };
      loader.abort();
      expect(abort).to.be.calledOnce();
    });
  });

  describe('.extractName()', () => {
    it('returns undefined', () => {
      expect(Loader.extractName('anything')).to.equal(undefined);
    });
  });
});
