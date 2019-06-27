import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import Parser from './Parser';

chai.use(dirtyChai);
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('Parser', () => {
  const fakeResult = { foo: 'bar' };

  describe('#parseSync()', () => {
    it('throws an error', () => {
      const parser = new Parser();
      expect(() => parser.parseSync()).to.throw(Error);
    });
  });

  describe('#parse()', () => {
    let parser;

    beforeEach(() => {
      parser = new Parser();
      sinon.stub(parser, 'parseSync').returns(fakeResult);
    });

    it('calls parseSync() eventually', () => {
      const promise = parser.parse();
      expect(parser.parseSync).to.not.have.been.called();
      return promise.then(() => {
        expect(parser.parseSync).to.be.calledOnce();
      });
    });

    it('rejects the promise eventually', () => {
      parser.parseSync.restore();
      return expect(parser.parse()).to.be.rejected();
    });

    it('resolves the promise eventually if parseSync() does not throw', () => {
      const promise = expect(parser.parse()).to.eventually.deep.equal(fakeResult);
      return promise;
    });

    it('fails and does not call parseSync if aborted', () => {
      const promise = parser.parse();
      parser.abort();
      return expect(promise).to.be.rejected().then(() => {
        expect(parser.parseSync).to.not.have.been.called();
      });
    });
  });
});
