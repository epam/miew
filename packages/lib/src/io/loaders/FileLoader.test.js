import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import FileLoader from './FileLoader';

chai.use(dirtyChai);
chai.use(sinonChai);

class BlobStub {}
class FileStub extends BlobStub {
  constructor() {
    super();
    this.name = 'foo';
  }
}

describe('FileLoader', () => {
  const fakeSource = new FileStub();

  before(() => {
    global.File = FileStub;
    global.Blob = BlobStub;
  });

  after(() => {
    delete global.Blob;
    delete global.File;
  });

  describe('#load()', () => {
    const fakeProgress = {
      type: 'progress',
      lengthComputable: true,
      total: 4,
      loaded: 3,
    };

    const fakeText = 'foo-text';
    const fakeBinary = (() => {
      const buf = new ArrayBuffer(4);
      const view = new Int32Array(buf);
      view[0] = 0xF00F00;
      return buf;
    })();

    let loader;
    let fileReaderStub;

    beforeEach(() => {
      fileReaderStub = {
        _listeners: {},
        _shouldAbort: false,
        _shouldError: false,

        _fail() {
          if (this._shouldAbort) {
            this._listeners.abort();
            return true;
          }
          if (this._shouldError) {
            this._listeners.error();
            return true;
          }
          return false;
        },

        _succeed(res) {
          setTimeout(() => {
            if (!this._fail()) {
              this._listeners.progress(fakeProgress);
              setTimeout(() => {
                if (!this._fail()) {
                  this.result = res;
                  this._listeners.load();
                }
              });
            }
          });
        },

        addEventListener(type, fn) {
          this._listeners[type] = fn;
        },

        readAsText() {
          if (!this._fail()) {
            this._succeed(fakeText);
          }
        },

        readAsArrayBuffer() {
          if (!this._fail()) {
            this._succeed(fakeBinary);
          }
        },

        abort() {
          this._shouldAbort = true;
        },
      };
      global.FileReader = sinon.stub().returns(fileReaderStub);
      loader = new FileLoader(fakeSource);
    });

    afterEach(() => {
      delete global.FileReader;
    });

    it('resolves a promise on success', () => expect(loader.load()).to.be.fulfilled());

    it('rejects a promise on failure', () => {
      fileReaderStub._shouldError = true;
      return expect(loader.load()).to.be.rejected();
    });

    it('rejects a promise if aborted beforehand', () => {
      loader.abort();
      return expect(loader.load()).to.be.rejected();
    });

    it('rejects a promise if aborted afterwards', () => {
      const promise = loader.load();
      loader.abort();
      return expect(promise).to.be.rejected();
    });

    it('generates progress events', () => {
      const onProgress = sinon.spy();
      loader.addEventListener('progress', onProgress);
      return expect(loader.load()).to.be.fulfilled().then(() => {
        expect(onProgress).to.be.calledOnce().and.calledWithExactly(fakeProgress);
      });
    });

    it('reads a string by default', () => expect(loader.load()).to.be.fulfilled().then((data) => {
      expect(data).to.equal(fakeText);
    }));

    it('reads an ArrayBuffer if requested', () => {
      loader = new FileLoader(fakeSource, { binary: true });
      return expect(loader.load()).to.be.fulfilled().then((data) => {
        expect(data).to.equal(fakeBinary);
      });
    });
  });

  describe('.canProbablyLoad()', () => {
    it('accepts a File or Blob', () => {
      expect(FileLoader.canProbablyLoad(new File())).to.equal(true);
      expect(FileLoader.canProbablyLoad(new Blob())).to.equal(true);
    });

    it('rejects a string or a plain object', () => {
      expect(FileLoader.canProbablyLoad('foo')).to.equal(false);
      expect(FileLoader.canProbablyLoad({ name: 'foo' })).to.equal(false);
    });
  });

  describe('.extractName()', () => {
    it('returns .name field if present', () => {
      expect(FileLoader.extractName({ name: 'foo' })).to.equal('foo');
      expect(FileLoader.extractName({})).to.equal(undefined);
    });

    it('returns undefined for undefined sources', () => {
      expect(FileLoader.extractName(undefined)).to.equal(undefined);
    });
  });
});
