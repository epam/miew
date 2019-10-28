import { expect } from 'chai';
import _ from 'lodash';
import settings from './settings';
import utils from './utils';


describe('settings', () => {
  describe('.set()', () => {
    describe('path is a string', () => {
      it('sets chosen parameters with current values', () => {
        const testSettings = _.cloneDeep(settings);
        testSettings.set('modes.VD.kSigma', 3);
        expect(testSettings.now.modes.VD.kSigma).to.be.equal(3);
      });
    });

    describe('path is not a string (is an object)', () => {
      it('makes diff with settings.now and sets diff', () => {
        const testSettings = _.cloneDeep(settings);

        const testDiffs = _.cloneDeep(settings);
        testDiffs.set('modes.VD.kSigma', 3);
        testSettings.set(testDiffs.now);
        expect(testSettings.now.modes.VD.kSigma).to.be.equal(3);
      });
    });
  });

  describe('.get()', () => {
    it('gets current parameter', () => {
      const testSettings = _.cloneDeep(settings);
      testSettings.now.modes.VD.kSigma = 1;
      expect(settings.get('modes.VD.kSigma')).to.be.equal(1);
    });
  });

  describe('.reset()', () => {
    it('resets all parameters in default', () => {
      const testSettings = _.cloneDeep(settings);

      testSettings.set('modes.VD.kSigma', 3);

      testSettings.reset();
      expect(testSettings).to.be.eql(settings);
    });
  });

  describe('.checkpoint()', () => {
    it('saved "now" parameters in "old" field', () => {
      const testSettings = _.cloneDeep(settings);
      testSettings.now.modes.VD.kSigma = 3;
      testSettings.checkpoint();
      expect(testSettings.now.modes.VD.kSigma).to.be.equal(testSettings.old.modes.VD.kSigma);
    });
  });

  describe('.changed()', () => {
    describe('checkpoint is been never used', () => {
      it('returns []', () => {
        const testSettings = _.cloneDeep(settings);
        testSettings.now.modes.VD.kSigma = 3;
        expect(testSettings.changed().length).to.be.equal(0);
      });
    });

    describe('checkpoint was used', () => {
      it('returns changed parameters in which now != old', () => {
        const testSettings = _.cloneDeep(settings);

        testSettings.set('modes.VD.kSigma', 3);
        testSettings.checkpoint();
        testSettings.set('modes.VD.kSigma', 5);

        const changeParams = {};
        changeParams.kSigma = testSettings.now.modes.VD.kSigma;
        expect(testSettings.changed()[0]).to.equal('modes.VD.kSigma');
      });
    });
  });

  describe('.applyDiffs()', () => {
    describe('version doesnt match', () => {
      it('throws an error', () => {
        const testSettings = _.cloneDeep(settings);
        testSettings.set('modes.VD.kSigma', 3);
        testSettings.now.VERSION = -1;

        expect(() => {
          testSettings.applyDiffs(testSettings.now);
        }).to.throw('Settings version does not match!');
      });
    });

    describe('version doesnt exist or it matches', () => {
      it('resets with new diffs', () => {
        const testDiffs = _.cloneDeep(settings);
        testDiffs.set('modes.VD.kSigma', 3);

        const testSettings = _.cloneDeep(settings);

        testSettings.applyDiffs(testDiffs.now);
        expect(testSettings.now.modes.VD.kSigma).to.equal(testDiffs.now.modes.VD.kSigma);
      });
    });
  });

  describe('.getDiffs()', () => {
    it('returns differ between default settings and settings.now', () => {
      const testSettings = _.cloneDeep(settings);
      testSettings.set('modes.VD.kSigma', 3);
      testSettings.VERSION = 0;

      const diffs = utils.objectsDiff(testSettings.now, testSettings.defaults);
      diffs.VERSION = testSettings.VERSION;
      expect(testSettings.getDiffs(true)).to.eql(diffs);
    });
  });

  describe('.setPluginOpts()', () => {
    it('adds additional parameters in plugins field', () => {
      const testPlugin = {
        highway: 'to hell',
        show: 'must go on',
        music:
          {
            directions: ['rock', 'metal'],
          },
      };
      const pluginName = 'testPlugin';

      const testSettings = _.cloneDeep(settings);
      testSettings.setPluginOpts(pluginName, testPlugin);
      expect(testSettings.now.plugins[pluginName]).to.eql(testPlugin);
    });
  });
});
