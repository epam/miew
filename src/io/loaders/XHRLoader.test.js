import XHRLoader from './XHRLoader';

import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(dirtyChai);
chai.use(sinonChai);

describe('XHRLoader', () => {

  const fakeSource = 'http://localhost/foo';

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
    let xhrStub;
    let OldXMLHttpRequest;

    beforeEach(() => {
      xhrStub = {
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
                  this.response = res;
                  this._listeners.load();
                }
              });
            }
          });
        },

        status: 200,

        addEventListener(type, fn) {
          this._listeners[type] = fn;
        },

        open() {
        },

        send() {
          if (this.responseType === 'text') {
            if (!this._fail()) {
              this._succeed(fakeText);
            }
          } else if (this.responseType === 'arraybuffer') {
            if (!this._fail()) {
              this._succeed(fakeBinary);
            }
          }
        },

        abort() {
          this._shouldAbort = true;
        },
      };
      OldXMLHttpRequest = global.XMLHttpRequest;
      global.XMLHttpRequest = sinon.stub().returns(xhrStub);
      loader = new XHRLoader(fakeSource);
    });

    afterEach(() => {
      if (OldXMLHttpRequest) {
        global.XMLHttpRequest = OldXMLHttpRequest;
      } else {
        delete global.XMLHttpRequest;
      }
    });

    it('resolves a promise on HTTP 200', () => {
      return expect(loader.load()).to.be.fulfilled();
    });

    it('rejects a promise on HTTP 404', () => {
      xhrStub.status = 404;
      return expect(loader.load()).to.be.rejected();
    });

    it('rejects a promise on network failure', () => {
      xhrStub._shouldError = true;
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
      loader = new XHRLoader(fakeSource, {binary: true});
      return expect(loader.load()).to.be.fulfilled().then((data) => {
        expect(data).to.equal(fakeBinary);
      });
    });

  });

  describe('.canLoad()', () => {

    it('accepts a string', () => {
      expect(XHRLoader.canLoad(fakeSource, {})).to.equal(true);
    });

    it('rejects a non-string object', () => {
      expect(XHRLoader.canLoad(42, {})).to.equal(false);
      expect(XHRLoader.canLoad({name: 'foo'}, {})).to.equal(false);
    });

    it('requires the source type to be "url"', () => {
      expect(XHRLoader.canLoad(fakeSource, {sourceType: 'url'})).to.equal(true);
      expect(XHRLoader.canLoad(fakeSource, {sourceType: 'file'})).to.equal(false);
    });

  });

});
