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

  describe('constructor', () => {

    it('instantiates a Parser', () => {
      expect(new Parser()).to.be.an.instanceOf(Parser);
    });

  });

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
      callbacks = {};
      callbacks.ready = sinon.spy();
      callbacks.error = sinon.spy();
    });

    it('calls parseSync() eventually', () => {
      sinon.spy(parser, 'parseSync');
      const fulfill = parser.parse(callbacks);
      expect(parser.parseSync).to.not.be.called();
      return fulfill.then(() => {
        expect(parser.parseSync).to.be.calledOnce();
      });
    });

    it('calls an error callback eventually', () => {
      const fulfill = parser.parse(callbacks);
      expect(callbacks.ready).to.not.be.called();
      expect(callbacks.error).to.not.be.called();
      return fulfill.then(() => {
        expect(callbacks.ready).to.not.be.called();
        expect(callbacks.error).to.be.calledOnce();
        expect(callbacks.error).to.be.calledWith(sinon.match.instanceOf(Error));
      });
    });

    it('calls a ready callback eventually if parseSync() doesn\'t throw', () => {
      parser.parseSync = () => fakeResult;
      const fulfill = parser.parse(callbacks);
      expect(callbacks.ready).to.not.be.called();
      expect(callbacks.error).to.not.be.called();
      return fulfill.then(() => {
        expect(callbacks.ready).to.be.calledOnce();
        expect(callbacks.ready).to.be.calledWith(fakeResult);
        expect(callbacks.error).to.not.be.called();
      });
    });

    it('fails if aborted before the call', () => {
      parser.abort();
      return parser.parse(callbacks).then(() => {
        expect(callbacks.ready).to.not.be.called();
        expect(callbacks.error).to.be.calledOnce();
        expect(callbacks.error).to.be.calledWith(sinon.match.instanceOf(Error));
      });
    });

    it('fails if aborted after the call', () => {
      const promise = parser.parse(callbacks);
      parser.abort();
      return promise.then(() => {
        expect(callbacks.ready).to.not.be.called();
        expect(callbacks.error).to.be.calledOnce();
        expect(callbacks.error).to.be.calledWith(sinon.match.instanceOf(Error));
      });
    });

  });

  describe('#parse()', () => {

    let parser;

    beforeEach(() => {
      parser = new Parser();
    });

    it('calls parseSync() eventually', () => {
      sinon.spy(parser, 'parseSync');
      const promise = parser.parse();
      expect(parser.parseSync).to.not.be.called();
      return promise.catch(() => {}).then(() => {
        expect(parser.parseSync).to.be.calledOnce();
      });
    });

    it('rejects the promise eventually', () => {
      return expect(parser.parse()).to.be.rejected();
    });

    it('resolves the promise eventually if parseSync() doesn\'t throw', () => {
      parser.parseSync = () => fakeResult;
      return expect(parser.parse()).to.eventually.deep.equal(fakeResult);
    });

    it('fails if aborted before the call', () => {
      parser.abort();
      return expect(parser.parse()).to.be.rejected();
    });

    it('fails if aborted after the call', () => {
      const promise = parser.parse();
      parser.abort();
      return expect(promise).to.be.rejected();
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
