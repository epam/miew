import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import EventDispatcher from './EventDispatcher';

chai.use(dirtyChai);
chai.use(sinonChai);

describe('utils/EventDispatcher', () => {
  const type = 'test';
  const event = { type };

  describe('.dispatchEvent()', () => {
    it('calls callback on event', () => {
      const dispatcher = new EventDispatcher();
      const callback = sinon.spy();

      dispatcher.addEventListener(type, callback);
      dispatcher.dispatchEvent(event);

      expect(callback).to.be.calledOnce();
      expect(callback).to.be.always.calledWithExactly(event);
    });

    it('registers callback with same context only once', () => {
      const dispatcher = new EventDispatcher();
      const callback = sinon.spy();

      dispatcher.addEventListener(type, callback);
      dispatcher.addEventListener(type, callback);
      dispatcher.dispatchEvent(event);

      expect(callback).to.be.calledOnce();
    });

    it('calls multiple callbacks on event', () => {
      const dispatcher = new EventDispatcher();
      const callback = sinon.spy();
      const callback1 = sinon.spy();

      dispatcher.addEventListener(type, callback);
      dispatcher.addEventListener(type, callback1);
      dispatcher.dispatchEvent(event);

      expect(callback).to.be.calledOnce();
      expect(callback1).to.be.calledOnce();
    });

    it('uses the dispatcher as default context', () => {
      const dispatcher = new EventDispatcher();
      const callback = sinon.spy();

      dispatcher.addEventListener(type, callback);
      dispatcher.dispatchEvent(event);

      expect(callback).to.be.calledOn(dispatcher);
    });

    it('uses custom context properly', () => {
      const dispatcher = new EventDispatcher();
      const callback = sinon.spy();
      const stubObj = {};

      dispatcher.addEventListener(type, callback, stubObj);
      dispatcher.dispatchEvent(event);

      expect(callback).to.be.calledOn(stubObj);
    });

    it('triggers multiple times', () => {
      const dispatcher = new EventDispatcher();
      const callback = sinon.spy();

      dispatcher.addEventListener(type, callback);
      dispatcher.dispatchEvent(event);
      dispatcher.dispatchEvent(event);

      expect(callback).to.be.calledTwice();
    });

    it('calls same function with different contexts', () => {
      const dispatcher = new EventDispatcher();
      const callback = sinon.spy();
      const stubObj = {};

      dispatcher.addEventListener(type, callback);
      dispatcher.addEventListener(type, callback, stubObj);
      dispatcher.dispatchEvent(event);

      expect(callback).to.be.calledTwice();
      if (callback.getCall(0).calledOn(dispatcher)) {
        expect(callback.getCall(1).calledOn(stubObj)).to.be.true();
      } else {
        expect(callback.getCall(0).calledOn(stubObj)).to.be.true();
        expect(callback.getCall(1).calledOn(dispatcher)).to.be.true();
      }
    });

    it('preserves passed arguments', () => {
      const dispatcher = new EventDispatcher();
      const callback = sinon.spy();
      const a1 = 1;
      const a2 = 'str';
      const a3 = { o: { a: 1 } };
      const evt = {
        type,
        a1,
        a2,
        a3,
      };

      dispatcher.addEventListener(type, callback);
      dispatcher.dispatchEvent(evt);

      expect(callback).to.be.calledOnce();
      expect(callback).to.be.always.calledWithExactly(evt);
    });
  });

  describe('.removeEventListener()', () => {
    const type1 = 'test1';
    const event1 = { type: type1 };
    const obj = {};

    function init() {
      const dispatcher = new EventDispatcher();
      const callback = sinon.spy();
      const callback1 = sinon.spy();
      const callback2 = sinon.spy();

      dispatcher.addEventListener(type, callback);
      dispatcher.addEventListener(type, callback, obj);
      dispatcher.addEventListener(type, callback1);
      dispatcher.addEventListener(type, callback1, obj);
      dispatcher.addEventListener(type1, callback2);
      dispatcher.addEventListener(type1, callback2, obj);

      return {
        dispatcher,
        callback,
        callback1,
        callback2,
      };
    }

    it('removes all callbacks if all params are unspecified', () => {
      const res = init();
      const {
        dispatcher,
        callback,
        callback1,
        callback2,
      } = res;
      dispatcher.removeEventListener();
      dispatcher.dispatchEvent(event);
      dispatcher.dispatchEvent(event1);

      expect(callback).to.be.not.called();
      expect(callback1).to.be.not.called();
      expect(callback2).to.be.not.called();
    });

    it('removes all callbacks for specified event', () => {
      const res = init();
      const {
        dispatcher,
        callback,
        callback1,
        callback2,
      } = res;
      dispatcher.removeEventListener(type);
      dispatcher.dispatchEvent(event);
      dispatcher.dispatchEvent(event1);

      expect(callback).to.be.not.called();
      expect(callback1).to.be.not.called();
      expect(callback2).to.be.calledTwice();
      expect(callback2).to.be.calledOn(dispatcher);
      expect(callback2).to.be.calledOn(obj);
    });

    it('removes specified callbacks', () => {
      const res = init();
      const {
        dispatcher,
        callback,
        callback1,
        callback2,
      } = res;
      dispatcher.removeEventListener(null, callback);
      dispatcher.dispatchEvent(event);
      dispatcher.dispatchEvent(event1);

      expect(callback).to.be.not.called();
      expect(callback1).to.be.calledTwice();
      expect(callback1).to.be.calledOn(dispatcher);
      expect(callback1).to.be.calledOn(obj);
      expect(callback2).to.be.calledTwice();
      expect(callback2).to.be.calledOn(dispatcher);
      expect(callback2).to.be.calledOn(obj);
    });

    it('removes all callbacks with specified context', () => {
      const res = init();
      const {
        dispatcher,
        callback,
        callback1,
        callback2,
      } = res;
      dispatcher.removeEventListener(null, null, dispatcher);
      dispatcher.dispatchEvent(event);
      dispatcher.dispatchEvent(event1);

      expect(callback).to.be.calledOnce();
      expect(callback).to.be.calledOn(obj);
      expect(callback1).to.be.calledOnce();
      expect(callback1).to.be.calledOn(obj);
      expect(callback2).to.be.calledOnce();
      expect(callback2).to.be.calledOn(obj);
    });

    it('removes specified callbacks for specified event', () => {
      const res = init();
      const {
        dispatcher,
        callback,
        callback1,
        callback2,
      } = res;
      dispatcher.removeEventListener(type, callback);
      dispatcher.dispatchEvent(event);
      dispatcher.dispatchEvent(event1);

      expect(callback).to.be.not.called();
      expect(callback1).to.be.calledTwice();
      expect(callback1).to.be.calledOn(dispatcher);
      expect(callback1).to.be.calledOn(obj);
      expect(callback2).to.be.calledTwice();
      expect(callback2).to.be.calledOn(dispatcher);
      expect(callback2).to.be.calledOn(obj);
    });

    it('removes callbacks for specified event and context', () => {
      const res = init();
      const {
        dispatcher,
        callback,
        callback1,
        callback2,
      } = res;
      dispatcher.removeEventListener(type, null, obj);
      dispatcher.dispatchEvent(event);
      dispatcher.dispatchEvent(event1);

      expect(callback).to.be.calledOnce();
      expect(callback).to.be.calledOn(dispatcher);
      expect(callback1).to.be.calledOnce();
      expect(callback1).to.be.calledOn(dispatcher);
      expect(callback2).to.be.calledTwice();
      expect(callback2).to.be.calledOn(dispatcher);
      expect(callback2).to.be.calledOn(obj);
    });

    it('removes specified callbacks with specified context', () => {
      const res = init();
      const {
        dispatcher,
        callback,
        callback1,
        callback2,
      } = res;
      dispatcher.removeEventListener(null, callback, obj);
      dispatcher.dispatchEvent(event);
      dispatcher.dispatchEvent(event1);

      expect(callback).to.be.calledOnce();
      expect(callback).to.be.calledOn(dispatcher);
      expect(callback1).to.be.calledTwice();
      expect(callback1).to.be.calledOn(dispatcher);
      expect(callback1).to.be.calledOn(obj);
      expect(callback2).to.be.calledTwice();
      expect(callback2).to.be.calledOn(dispatcher);
      expect(callback2).to.be.calledOn(obj);
    });

    it('removes exact callback when event, callback and context are specified', () => {
      const res = init();
      const {
        dispatcher,
        callback,
        callback1,
        callback2,
      } = res;
      dispatcher.removeEventListener(type, callback, dispatcher);
      dispatcher.dispatchEvent(event);
      dispatcher.dispatchEvent(event1);

      expect(callback).to.be.calledOnce();
      expect(callback).to.be.always.calledOn(obj);
      expect(callback1).to.be.calledTwice();
      expect(callback2).to.be.calledTwice();
    });
  });
});
