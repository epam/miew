import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import logger from '../../src/utils/logger';

chai.use(dirtyChai);
chai.use(sinonChai);

//////////////////////////////////////////////////////////////////////////////

describe('utils/Logger', function() {
  describe('.instantiate', function() {
    it('creates different instance', function() {
      expect(logger.instantiate()).to.not.be.equal(logger);
    });
  });

  describe('.level', function() {
    it('does not throw error when correct level is passed', function() {
      var log = logger.instantiate();
      var levels = log.levels();

      expect(function() {
        for (var i = 0, n = levels.length; i < n; ++i) {
          log.level = levels[i];
        }
      }).to.not.throw(Error);
    });

    it('throws error when incorrect level name is assigned', function() {
      var log = logger.instantiate();

      expect(function() {
        log.level = 'inferno';
      }).to.throw(Error);
    });

    it('returns latest set correct level', function() {
      var log = logger.instantiate();
      var levels = log.levels();

      for (var i = 0, n = levels.length; i < n; ++i) {
        log.level = levels[i];
        expect(log.level).to.be.equal(levels[i]);
      }
    });
  });

  describe('.message', function() {
    it('emits signal when message level is above or higher than current', function() {
      var log = logger.instantiate();
      var levels = log.levels();
      var callback = sinon.spy();

      log.addEventListener('message', callback);

      for (var i = 0, n = levels.length; i < n; ++i) {
        log.level = levels[i];
        for (var j = 0; j < n; ++j) {
          callback.reset();
          log.message(levels[j], levels[j]);
          if (j >= i) {
            expect(callback).to.be.calledOnce();
          } else {
            expect(callback).to.be.not.called();
          }
        }
      }
    });

    it('passes message as an event field when it is being logged', function() {
      var log = logger.instantiate();
      var levels = log.levels();
      var callback = sinon.spy();

      var level = levels[0];
      var testMessage = 'this is a message';
      log.level = level;
      log.addEventListener('message', callback);
      log.message(level, testMessage);

      expect(callback).to.be.always.calledWithExactly({type: 'message', level: level, message: testMessage});
    });
  });
});
