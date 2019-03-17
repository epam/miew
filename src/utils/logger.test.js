import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import logger from './logger';

chai.use(dirtyChai);
chai.use(sinonChai);

describe('utils/logger', () => {
  describe('.instantiate()', () => {
    it('creates different instance', () => {
      expect(logger.instantiate()).to.not.be.equal(logger);
    });
  });

  describe('.level', () => {
    it('does not throw error when correct level is passed', () => {
      const log = logger.instantiate();
      const levels = log.levels();

      expect(() => {
        for (let i = 0, n = levels.length; i < n; ++i) {
          log.level = levels[i];
        }
      }).to.not.throw(Error);
    });

    it('throws error when incorrect level name is assigned', () => {
      const log = logger.instantiate();

      expect(() => {
        log.level = 'inferno';
      }).to.throw(Error);
    });

    it('returns latest set correct level', () => {
      const log = logger.instantiate();
      const levels = log.levels();

      for (let i = 0, n = levels.length; i < n; ++i) {
        log.level = levels[i];
        expect(log.level).to.be.equal(levels[i]);
      }
    });
  });

  describe('.message()', () => {
    it('emits signal when message level is above or higher than current', () => {
      const log = logger.instantiate();
      const levels = log.levels();
      const callback = sinon.spy();

      log.addEventListener('message', callback);

      for (let i = 0, n = levels.length; i < n; ++i) {
        log.level = levels[i];
        for (let j = 0; j < n; ++j) {
          callback.resetHistory();
          log.message(levels[j], levels[j]);
          if (j >= i) {
            expect(callback).to.be.calledOnce();
          } else {
            expect(callback).to.be.not.called();
          }
        }
      }
    });

    it('passes message as an event field when it is being logged', () => {
      const log = logger.instantiate();
      const levels = log.levels();
      const callback = sinon.spy();

      const level = levels[0];
      const testMessage = 'this is a message';
      log.level = level;
      log.addEventListener('message', callback);
      log.message(level, testMessage);

      expect(callback).to.be.always.calledWithExactly({ type: 'message', level, message: testMessage });
    });
  });
});
