import ImmediateLoader from './ImmediateLoader';

import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(dirtyChai);
chai.use(sinonChai);

describe('ImmediateLoader', () => {

  describe('#load(callbacks)', () => {

    it('should work asynchronously', (done) => {
      const loader = new ImmediateLoader();
      const callbacks = {
        ready: () => { done(); },
        error: (err) => { done(err); },
      };
      sinon.spy(callbacks, 'ready');
      sinon.spy(callbacks, 'error');
      loader.load(callbacks);
      expect(callbacks.ready).to.not.be.called();
      expect(callbacks.error).to.not.be.called();
    });

    it('should catch an error', (done) => {
      const loader = new ImmediateLoader();
      loader.load({
        ready: () => {
          throw new Error('Some error has happened');
        },
        error: (err) => {
          expect(err).to.be.an.instanceOf(Error);
          done();
        }
      });
    });

    it('should load without error', (done) => {
      const loader = new ImmediateLoader('foo', {});
      loader.load({
        ready: (data) => {
          expect(data).to.equal('foo');
          done();
        },
        error: (err) => {
          done(err);
        }
      });
    });

  });

  describe('.canLoad()', () => {
    const correctOpts = {sourceType: 'immediate'};

    it('can\'t load undefined source', () => {
      return expect(ImmediateLoader.canLoad()).to.equal(false);
    });

    it('can\'t load unknown source', () => {
      return expect(ImmediateLoader.canLoad('')).to.equal(false);
    });

    it('can\'t load not "immediate" source', () => {
      return expect(ImmediateLoader.canLoad('', {})).to.equal(false);
    });

    it('should load sourceType = \'immediate\'', () => {
      return expect(ImmediateLoader.canLoad('', correctOpts)).to.equal(true);
    });
  });

  describe('.canProbablyLoad()', () => {

    it('rejects everything', () => {
      return expect(ImmediateLoader.canProbablyLoad('anything')).to.equal(false);
    });

  });

});
