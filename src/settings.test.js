import { expect } from 'chai';
import _ from 'lodash';
import settings from './settings';
import utils from './utils';


describe('settings', () => {
  describe('.set()', () => {
    it('accepts a string path', () => {
      const testSettings = _.cloneDeep(settings);
      testSettings.set('modes.VD.kSigma', 3);
      expect(testSettings.now.modes.VD.kSigma).to.be.equal(3);
    });

    it('accepts an object', () => {
      const testSettings = _.cloneDeep(settings);
      const testDiffs = _.cloneDeep(settings);
      testDiffs.set('modes.VD.kSigma', 3);
      testSettings.set(testDiffs.now);
      expect(testSettings.now.modes.VD.kSigma).to.be.equal(3);
    });

    it('ignores incorrect path', () => {
      // TODO
    });

    it('notifies about changes', () => {
      // TODO
    });
  });

  describe('.get()', () => {
    it('gets current parameter', () => {
      const testSettings = _.cloneDeep(settings);
      testSettings.set('modes.VD.kSigma', 1);
      expect(settings.get('modes.VD.kSigma')).to.be.equal(1);
    });
  });

  describe('.reset()', () => {
    it('resets all parameters to default values', () => {
      const testSettings = _.cloneDeep(settings);

      testSettings.set('modes.VD.kSigma', 3);

      testSettings.reset();
      expect(testSettings).to.be.eql(settings);
    });
  });

  describe('.checkpoint()', () => {
    it('preserves current state', () => {
      const testSettings = _.cloneDeep(settings);
      testSettings.set('modes.VD.kSigma', 3);
      testSettings.checkpoint();
      expect(testSettings.now.modes.VD.kSigma).to.be.equal(testSettings.old.modes.VD.kSigma);
    });
  });

  describe('.changed()', () => {
    it('returns empty list when checkpoint hasn\'t been used', () => {
      const testSettings = _.cloneDeep(settings);
      testSettings.set('modes.VD.kSigma', 3);
      expect(testSettings.changed().length).to.be.equal(0);
    });

    it('returns list of changed parameters since last checkpoint', () => {
      const testSettings = _.cloneDeep(settings);

      testSettings.set('modes.VD.kSigma', 3);
      testSettings.checkpoint();
      testSettings.set('modes.VD.kSigma', 5);

      expect(testSettings.changed()[0]).to.equal('modes.VD.kSigma');
    });
  });

  describe('.applyDiffs()', () => {
    it('overwrites settings with the diffs', () => {
      const testDiffs = _.cloneDeep(settings);
      testDiffs.set('modes.VD.kSigma', 3);

      const testSettings = _.cloneDeep(settings);

      testSettings.applyDiffs(testDiffs.now);
      expect(testSettings.now.modes.VD.kSigma).to.equal(testDiffs.now.modes.VD.kSigma);
    });

    it('throws an error if versions do not match', () => {
      const testSettings = _.cloneDeep(settings);
      testSettings.set('modes.VD.kSigma', 3);
      testSettings.now.VERSION = -1;

      expect(() => {
        testSettings.applyDiffs(testSettings.now);
      }).to.throw('Settings version does not match!');
    });
  });

  describe('.getDiffs()', () => {
    it('returns a difference between current and default settings', () => {
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
        music: {
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
