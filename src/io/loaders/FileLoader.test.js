import FileLoader from './FileLoader';

import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(dirtyChai);
chai.use(sinonChai);

class FileStub {
  constructor() {
    this.name = 'foo';
  }
}

describe('FileLoader', () => {

  const fakeSource = new FileStub();

  before(() => {
    global.File = FileStub;
  });

  after(() => {
    delete global.File;
  });

  describe('constructor', () => {
    /* eslint-disable no-new */
    it('fills opts.fileName if it is not yet set', () => {
      const opts = {};
      new FileLoader(fakeSource, opts);
      expect(opts).to.have.property('fileName', 'foo');
    });

    it('leaves opts.fileName intact if present', () => {
      const opts = {fileName: 'bar'};
      new FileLoader(fakeSource, opts);
      expect(opts).to.have.property('fileName', 'bar');
    });
    /* eslint-enable no-new */
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
          } else if (this._shouldError) {
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

    it('resolves a promise on success', () => {
      return expect(loader.load()).to.be.fulfilled();
    });

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

    it('reads a string by default', () => {
      return expect(loader.load()).to.be.fulfilled().then((data) => {
        expect(data).to.equal(fakeText);
      });
    });

    it('reads an ArrayBuffer if requested', () => {
      loader = new FileLoader(fakeSource, {binary: true});
      return expect(loader.load()).to.be.fulfilled().then((data) => {
        expect(data).to.equal(fakeBinary);
      });
    });

  });

  describe('.canLoad()', () => {

    it('accepts a File', () => {
      expect(FileLoader.canLoad(fakeSource, {})).to.equal(true);
    });

    it('rejects a non-File object', () => {
      expect(FileLoader.canLoad('foo', {})).to.equal(false);
      expect(FileLoader.canLoad({name: 'foo'}, {})).to.equal(false);
    });

    it('requires the source type to be "file"', () => {
      expect(FileLoader.canLoad(fakeSource, {sourceType: 'url'})).to.equal(false);
      expect(FileLoader.canLoad(fakeSource, {sourceType: 'file'})).to.equal(true);
    });

  });

});
