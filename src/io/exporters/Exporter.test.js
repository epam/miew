import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import Exporter from './Exporter';

chai.use(dirtyChai);
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('Exporter', () => {
  const fakeResult = 'foo';

  describe('#exportSync()', () => {
    it('throws an error', () => {
      const exporter = new Exporter();
      expect(() => exporter.exportSync()).to.throw(Error);
    });
  });

  describe('#export()', () => {
    let exporter;

    beforeEach(() => {
      exporter = new Exporter();
      sinon.stub(exporter, 'exportSync').returns(fakeResult);
    });

    it('calls exportSync() eventually', () => {
      const promise = exporter.export();
      expect(exporter.exportSync).to.not.have.been.called();
      return promise.then(() => {
        expect(exporter.exportSync).to.be.calledOnce();
      });
    });

    it('rejects the promise eventually', () => {
      exporter.exportSync.restore();
      return expect(exporter.export()).to.be.rejected();
    });

    it('resolves the promise eventually if exportSync() does not throw', () => {
      const promise = expect(exporter.export()).to.eventually.deep.equal(fakeResult);
      return promise;
    });

    it('fails and does not call exportSync if aborted', () => {
      const promise = exporter.export();
      exporter.abort();
      return expect(promise).to.be.rejected().then(() => {
        expect(exporter.exportSync).to.not.have.been.called();
      });
    });
  });
});
