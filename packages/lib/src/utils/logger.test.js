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
      expect(logger.instantiate()).to.not.equal(logger);
    });
  });

  describe('.level', () => {
    it('accepts valid level from Logger.levels()', () => {
      const log = logger.instantiate();
      const levels = log.levels();

      expect(() => {
        for (let i = 0, n = levels.length; i < n; ++i) {
          log.level = levels[i];
        }
      }).to.not.throw(Error);
    });

    it('throws an error when incorrect level name is assigned', () => {
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
        expect(log.level).to.equal(levels[i]);
      }
    });
  });

  describe('.message()', () => {
    const testMessage = 'this is a message';

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

    for (let i = 0, n = logger.levels().length; i < n; i++) {
      it(`passes message as an event field in ${logger.levels()[i]} mode`, () => {
        const log = logger.instantiate();
        const levels = log.levels();

        const callback = sinon.spy();
        const level = levels[i];
        log.level = level;
        log.addEventListener('message', callback);
        log[level](testMessage);

        expect(callback).to.be.always.calledWithExactly({ type: 'message', level, message: testMessage });
      });
    }
  });

  describe('console', () => {
    const testMessage = 'this is a message';

    for (let i = 0; i < logger.levels().length; i++) {
      const log = logger.instantiate();
      const levels = log.levels();
      const level = levels[i];

      it(`print message in console with ${level} mode`, () => {
        let logMethod = level;
        if (level !== 'error' && level !== 'warn') logMethod = 'log';
        const cons = sinon.stub(console, logMethod);

        log.level = level;
        log.console = true;

        log.message(level, testMessage);
        cons.restore();

        expect(cons).to.calledOnceWith(`miew:${level}: ${testMessage}`);
      });
    }
  });
});
