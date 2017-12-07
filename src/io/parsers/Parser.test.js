import Parser from './Parser';

import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(dirtyChai);
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('Parser', () => {

  const fakeResult = {foo: 'bar'};

  describe('#parseSync()', () => {

    it('throws an error', () => {
      const parser = new Parser();
      expect(() => parser.parseSync()).to.throw(Error);
    });

  });

  describe('#parse(callbacks) - @deprecated', () => {

    let parser, callbacks;

    beforeEach(() => {
      parser = new Parser();
      sinon.stub(parser, 'parseSync').returns(fakeResult);
      callbacks = {};
      callbacks.ready = sinon.spy();
      callbacks.error = sinon.spy();
    });

    it('calls parseSync() eventually', () => {
      const fulfill = parser.parse(callbacks);
      expect(parser.parseSync).to.not.have.been.called();
      return fulfill.then(() => {
        expect(parser.parseSync).to.be.calledOnce();
      });
    });

    it('calls an error callback eventually', () => {
      parser.parseSync.restore();
      const fulfill = parser.parse(callbacks);
      expect(callbacks.ready).to.not.have.been.called();
      expect(callbacks.error).to.not.have.been.called();
      return fulfill.then(() => {
        expect(callbacks.ready).to.not.have.been.called();
        expect(callbacks.error).to.be.calledOnce();
        expect(callbacks.error).to.be.calledWith(sinon.match.instanceOf(Error));
      });
    });

    it('calls a ready callback eventually if parseSync() does not throw', () => {
      const fulfill = parser.parse(callbacks);
      expect(callbacks.ready).to.not.have.been.called();
      expect(callbacks.error).to.not.have.been.called();
      return fulfill.then(() => {
        expect(callbacks.ready).to.be.calledOnce();
        expect(callbacks.ready).to.be.calledWith(fakeResult);
        expect(callbacks.error).to.not.have.been.called();
      });
    });

    it('fails without calling parseSync if aborted', () => {
      const fulfill = parser.parse(callbacks);
      parser.abort();
      return expect(fulfill).to.be.fulfilled().then(() => {
        expect(callbacks.ready).to.not.have.been.called();
        expect(callbacks.error).to.be.calledOnce();
        expect(callbacks.error).to.be.calledWith(sinon.match.instanceOf(Error));
        expect(parser.parseSync).to.not.have.been.called();
      });
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
      return expect(parser.parse()).to.eventually.deep.equal(fakeResult);
    });

    it('fails and does not call parseSync if aborted', () => {
      const promise = parser.parse();
      parser.abort();
      return expect(promise).to.be.rejected().then(() => {
        expect(parser.parseSync).to.not.have.been.called();
      });
    });

  });

  describe('.checkDataTypeOptions() - @deprecated', () => {

    const check = Parser.checkDataTypeOptions;

    it('accepts matching file type no matter what filename it has', () => {
      expect(check({fileType: 'pubchem'}, 'pubchem')).to.equal(true);
      expect(check({fileType: 'pdb', fileName: '1crn.ent'}, 'pdb', '.pdb')).to.equal(true);
    });

    it('declines mismatching file type no matter what filename it has', () => {
      expect(check({fileType: 'pdb'}, 'cif')).to.equal(false);
      expect(check({fileType: 'pdb', fileName: '1crn.cif'}, 'cif', '.cif')).to.equal(false);
    });

    it('accepts matching extension if no type specified', () => {
      expect(check({fileName: '1crn.ent'}, 'pdb', '.ent')).to.equal(true);
      expect(check({fileName: '1crn.pdb'}, 'pdb')).to.equal(true);
    });

    it('declines mismatching extension if no type specified', () => {
      expect(check({fileName: '1crn.pdb'}, 'pdb', '.ent')).to.equal(false);
      expect(check({fileName: '1crn.ent'}, 'pdb')).to.equal(false);
    });

    it('declines if neither type nor filename is specified', () => {
      expect(check({}, 'pdb', '.pdb')).to.equal(false);
    });

    it('is case insensitive for type and file name', () => {
      expect(check({fileType: 'PubChem'}, 'PUBchem')).to.equal(true);
      expect(check({fileName: '1crn.mmCIF'}, 'MMcif')).to.equal(true);
      expect(check({fileName: '1crn.mmCIF'}, 'mmcif', '.MMcif')).to.equal(true);
    });

  });

});
