import EventDispatcher from './EventDispatcher';

import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(dirtyChai);
chai.use(sinonChai);

//////////////////////////////////////////////////////////////////////////////

describe('utils/EventDispatcher', function() {
  const type = 'test';
  const event = {type: type};

  describe('.dispatchEvent()', function() {
    it('calls callback on event', function() {
      const dispatcher = new EventDispatcher();
      const callback = sinon.spy();

      dispatcher.addEventListener(type, callback);
      dispatcher.dispatchEvent(event);

      expect(callback).to.be.calledOnce();
      expect(callback).to.be.always.calledWithExactly(event);
    });

    it('registers callback with same context only once', function() {
      // TODO does this test has correct description?
      const dispatcher = new EventDispatcher();
      const callback = sinon.spy();

      dispatcher.addEventListener(type, callback);
      dispatcher.addEventListener(type, callback);
      dispatcher.dispatchEvent(event);

      expect(callback).to.be.calledOnce();
    });

    it('calls multiple callbacks on event', function() {
      const dispatcher = new EventDispatcher();
      const callback = sinon.spy();
      const callback1 = sinon.spy();

      dispatcher.addEventListener(type, callback);
      dispatcher.addEventListener(type, callback1);
      dispatcher.dispatchEvent(event);

      expect(callback).to.be.calledOnce();
      expect(callback1).to.be.calledOnce();
    });

    it('uses the dispatcher as default context', function() {
      const dispatcher = new EventDispatcher();
      const callback = sinon.spy();

      dispatcher.addEventListener(type, callback);
      dispatcher.dispatchEvent(event);

      expect(callback).to.be.calledOn(dispatcher);
    });

    it('uses custom context properly', function() {
      const dispatcher = new EventDispatcher();
      const callback = sinon.spy();
      const stubObj = {};

      dispatcher.addEventListener(type, callback, stubObj);
      dispatcher.dispatchEvent(event);

      expect(callback).to.be.calledOn(stubObj);
    });

    it('triggers multiple times', function() {
      const dispatcher = new EventDispatcher();
      const callback = sinon.spy();

      dispatcher.addEventListener(type, callback);
      dispatcher.dispatchEvent(event);
      dispatcher.dispatchEvent(event);

      expect(callback).to.be.calledTwice();
    });

    it('calls same function with different contexts', function() {
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

    it('preserves passed arguments', function() {
      const dispatcher = new EventDispatcher();
      const callback = sinon.spy();
      const a1 = 1;
      const a2 = 'str';
      const a3 = {o: {a: 1}};
      const evt = {
        type: type,
        a1: a1,
        a2: a2,
        a3: a3,
      };

      dispatcher.addEventListener(type, callback);
      dispatcher.dispatchEvent(evt);

      expect(callback).to.be.calledOnce();
      expect(callback).to.be.always.calledWithExactly(evt);
    });
  });

  describe('.removeEventListener()', function() {
    const type1 = 'test1';
    const event1 = {type: type1};
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
        dispatcher: dispatcher,
        callback: callback,
        callback1: callback1,
        callback2: callback2,
      };
    }

    it('removes all callbacks if all params are unspecified', function() {
      const res = init();
      const dispatcher = res.dispatcher;
      const callback = res.callback;
      const callback1 = res.callback1;
      const callback2 = res.callback2;
      dispatcher.removeEventListener();
      dispatcher.dispatchEvent(event);
      dispatcher.dispatchEvent(event1);

      expect(callback).to.be.not.called();
      expect(callback1).to.be.not.called();
      expect(callback2).to.be.not.called();
    });

    it('removes all callbacks for specified event', function() {
      const res = init();
      const dispatcher = res.dispatcher;
      const callback = res.callback;
      const callback1 = res.callback1;
      const callback2 = res.callback2;
      dispatcher.removeEventListener(type);
      dispatcher.dispatchEvent(event);
      dispatcher.dispatchEvent(event1);

      expect(callback).to.be.not.called();
      expect(callback1).to.be.not.called();
      expect(callback2).to.be.calledTwice();
      expect(callback2).to.be.calledOn(dispatcher);
      expect(callback2).to.be.calledOn(obj);
    });

    it('removes specified callbacks', function() {
      const res = init();
      const dispatcher = res.dispatcher;
      const callback = res.callback;
      const callback1 = res.callback1;
      const callback2 = res.callback2;
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

    it('removes all callbacks with specified context', function() {
      const res = init();
      const dispatcher = res.dispatcher;
      const callback = res.callback;
      const callback1 = res.callback1;
      const callback2 = res.callback2;
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

    it('removes specified callbacks for specified event', function() {
      const res = init();
      const dispatcher = res.dispatcher;
      const callback = res.callback;
      const callback1 = res.callback1;
      const callback2 = res.callback2;
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

    it('removes callbacks for specified event and context', function() {
      const res = init();
      const dispatcher = res.dispatcher;
      const callback = res.callback;
      const callback1 = res.callback1;
      const callback2 = res.callback2;
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

    it('removes specified callbacks with specified context', function() {
      const res = init();
      const dispatcher = res.dispatcher;
      const callback = res.callback;
      const callback1 = res.callback1;
      const callback2 = res.callback2;
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

    it('removes exact callback when event, callback and context are specified', function() {
      const res = init();
      const dispatcher = res.dispatcher;
      const callback = res.callback;
      const callback1 = res.callback1;
      const callback2 = res.callback2;
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
