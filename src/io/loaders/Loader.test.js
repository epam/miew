import Loader from './Loader';

import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(dirtyChai);
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('Loader', () => {

  const fakeResult = {foo: 'bar'};

  describe('#load(callbacks) - @deprecated', () => {

    let loader, callbacks;

    beforeEach(() => {
      loader = new Loader();
      sinon.stub(loader, 'loadAsync').resolves(fakeResult);
      callbacks = {};
      callbacks.ready = sinon.spy();
      callbacks.error = sinon.spy();
    });

    it('calls loadAsync() immediately', () => {
      const fulfill = loader.load(callbacks);
      expect(loader.loadAsync).to.be.calledOnce();
      return fulfill.then(() => {
        expect(loader.loadAsync).to.be.calledOnce();
      });
    });

    it('calls an error callback eventually', () => {
      loader.loadAsync.restore();
      const fulfill = loader.load(callbacks);
      expect(callbacks.ready).to.not.have.been.called();
      expect(callbacks.error).to.not.have.been.called();
      return fulfill.then(() => {
        expect(callbacks.ready).to.not.have.been.called();
        expect(callbacks.error).to.be.calledOnce();
        expect(callbacks.error).to.be.calledWith(sinon.match.instanceOf(Error));
      });
    });

    it('calls a ready callback eventually if loadAsync() does not throw', () => {
      const fulfill = loader.load(callbacks);
      expect(callbacks.ready).to.not.have.been.called();
      expect(callbacks.error).to.not.have.been.called();
      return fulfill.then(() => {
        expect(callbacks.ready).to.be.calledOnce();
        expect(callbacks.ready).to.be.calledWith(fakeResult);
        expect(callbacks.error).to.not.have.been.called();
      });
    });

    it('ignores abort() by default', () => {
      const promise = loader.load(callbacks);
      loader.abort();
      return expect(promise).to.be.fulfilled().then(() => {
        expect(callbacks.ready).to.be.calledOnce();
        expect(callbacks.ready).to.be.calledWith(fakeResult);
        expect(callbacks.error).to.not.have.been.called();
      });
    });

    it('forwards progress events to a callback', () => {
      const eventA = {type: 'progress'};
      const eventB = {
        type: 'progress',
        lengthComputable: true,
        total: 100,
        loaded: 50,
      };

      loader.loadAsync.restore();
      sinon.stub(loader, 'loadAsync').callsFake(function fakeLoadAsync() {
        return new Promise((resolve) => {
          setTimeout(() => {
            this.dispatchEvent(eventA);
            setTimeout(() => {
              this.dispatchEvent(eventB);
              resolve(fakeResult);
            });
          });
        });
      });
      callbacks.progress = sinon.spy();
      return expect(loader.load(callbacks)).to.be.fulfilled().then(() => {
        expect(callbacks.progress).to.be.calledTwice();
        expect(callbacks.progress.firstCall).to.be.calledWithExactly();
        expect(callbacks.progress.secondCall).to.be.calledWithExactly(0.5);
      });
    });

  });

  describe('#load()', () => {

    let loader;

    beforeEach(() => {
      loader = new Loader();
      sinon.stub(loader, 'loadAsync').resolves(fakeResult);
    });

    it('calls loadAsync() immediately', () => {
      const promise = loader.load();
      expect(loader.loadAsync).to.be.calledOnce();
      return promise.catch(() => {}).then(() => {
        expect(loader.loadAsync).to.be.calledOnce();
      });
    });

    it('rejects the promise eventually', () => {
      loader.loadAsync.restore();
      return expect(loader.load()).to.be.rejected();
    });

    it('resolves the promise eventually if loadAsync() does not throw', () => {
      return expect(loader.load()).to.eventually.deep.equal(fakeResult);
    });

    it('ignores abort() by default', () => {
      const promise = loader.load();
      loader.abort();
      return expect(promise).to.eventually.deep.equal(fakeResult);
    });

  });

  describe('#abort()', () => {

    it('is immediately forwarded to a loading agent', () => {
      const loader = new Loader();
      const abort = sinon.spy();
      loader._agent = {abort};
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
