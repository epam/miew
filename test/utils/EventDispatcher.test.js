import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import EventDispatcher from '../../src/utils/EventDispatcher';

chai.use(dirtyChai);
chai.use(sinonChai);

//////////////////////////////////////////////////////////////////////////////

describe('utils/EventDispatcher', function() {
  var type = 'test';
  var event = {type: type};

  describe('.dispatchEvent()', function() {
    it('calls callback on event', function() {
      var dispatcher = new EventDispatcher();
      var callback = sinon.spy();

      dispatcher.addEventListener(type, callback);
      dispatcher.dispatchEvent(event);

      expect(callback).to.be.calledOnce();
      expect(callback).to.be.always.calledWithExactly(event);
    });

    it('registers callback with same context only once', function() {
      // TODO does this test has correct description?
      var dispatcher = new EventDispatcher();
      var callback = sinon.spy();

      dispatcher.addEventListener(type, callback);
      dispatcher.addEventListener(type, callback);
      dispatcher.dispatchEvent(event);

      expect(callback).to.be.calledOnce();
    });

    it('calls multiple callbacks on event', function() {
      var dispatcher = new EventDispatcher();
      var callback = sinon.spy();
      var callback1 = sinon.spy();

      dispatcher.addEventListener(type, callback);
      dispatcher.addEventListener(type, callback1);
      dispatcher.dispatchEvent(event);

      expect(callback).to.be.calledOnce();
      expect(callback1).to.be.calledOnce();
    });

    it('uses the dispatcher as default context', function() {
      var dispatcher = new EventDispatcher();
      var callback = sinon.spy();

      dispatcher.addEventListener(type, callback);
      dispatcher.dispatchEvent(event);

      expect(callback).to.be.calledOn(dispatcher);
    });

    it('uses custom context properly', function() {
      var dispatcher = new EventDispatcher();
      var callback = sinon.spy();
      var stubObj = {};

      dispatcher.addEventListener(type, callback, stubObj);
      dispatcher.dispatchEvent(event);

      expect(callback).to.be.calledOn(stubObj);
    });

    it('triggers multiple times', function() {
      var dispatcher = new EventDispatcher();
      var callback = sinon.spy();

      dispatcher.addEventListener(type, callback);
      dispatcher.dispatchEvent(event);
      dispatcher.dispatchEvent(event);

      expect(callback).to.be.calledTwice();
    });

    it('calls same function with different contexts', function() {
      var dispatcher = new EventDispatcher();
      var callback = sinon.spy();
      var stubObj = {};

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
      var dispatcher = new EventDispatcher();
      var callback = sinon.spy();
      var a1 = 1;
      var a2 = 'str';
      var a3 = {o: {a: 1}};
      var evt = {
        type: type,
        a1: a1,
        a2: a2,
        a3:a3,
      };

      dispatcher.addEventListener(type, callback);
      dispatcher.dispatchEvent(evt);

      expect(callback).to.be.calledOnce();
      expect(callback).to.be.always.calledWithExactly(evt);
    });
  });

  describe('.removeEventListener()', function() {
    var type1 = 'test1';
    var event1 = {type:type1};
    var obj = {};

    function init() {
      var dispatcher = new EventDispatcher();
      var callback = sinon.spy();
      var callback1 = sinon.spy();
      var callback2 = sinon.spy();

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
      var res = init();
      var dispatcher = res.dispatcher;
      var callback = res.callback;
      var callback1 = res.callback1;
      var callback2 = res.callback2;
      dispatcher.removeEventListener();
      dispatcher.dispatchEvent(event);
      dispatcher.dispatchEvent(event1);

      expect(callback).to.be.not.called();
      expect(callback1).to.be.not.called();
      expect(callback2).to.be.not.called();
    });

    it('removes all callbacks for specified event', function() {
      var res = init();
      var dispatcher = res.dispatcher;
      var callback = res.callback;
      var callback1 = res.callback1;
      var callback2 = res.callback2;
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
      var res = init();
      var dispatcher = res.dispatcher;
      var callback = res.callback;
      var callback1 = res.callback1;
      var callback2 = res.callback2;
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
      var res = init();
      var dispatcher = res.dispatcher;
      var callback = res.callback;
      var callback1 = res.callback1;
      var callback2 = res.callback2;
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
      var res = init();
      var dispatcher = res.dispatcher;
      var callback = res.callback;
      var callback1 = res.callback1;
      var callback2 = res.callback2;
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
      var res = init();
      var dispatcher = res.dispatcher;
      var callback = res.callback;
      var callback1 = res.callback1;
      var callback2 = res.callback2;
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
      var res = init();
      var dispatcher = res.dispatcher;
      var callback = res.callback;
      var callback1 = res.callback1;
      var callback2 = res.callback2;
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
      var res = init();
      var dispatcher = res.dispatcher;
      var callback = res.callback;
      var callback1 = res.callback1;
      var callback2 = res.callback2;
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
