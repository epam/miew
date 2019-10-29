import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import settings from './settings';

chai.use(dirtyChai);
chai.use(sinonChai);

const Settings = settings.constructor;

describe('settings', () => {
  describe('.set()', () => {
    it('accepts a string path', () => {
      const s = new Settings();

      s.set('modes.VD.kSigma', 3);

      expect(s.now.modes.VD.kSigma).to.equal(3);
    });

    it('accepts an object', () => {
      const s = new Settings();

      s.set({
        modes: {
          VD: {
            kSigma: 3,
          },
        },
      });

      expect(s.now.modes.VD.kSigma).to.equal(3);
    });

    it('ignores incorrect path', () => {
      const s = new Settings();
      const prop = 'super.duper';

      s.set(prop, 1);

      expect(s.now).to.not.have.property(prop);
    });

    it('notifies about changes', () => {
      const prop = 'modes.VD.kSigma';
      const callback = sinon.spy();
      const s = new Settings();

      s.addEventListener(`change:${prop}`, callback);
      s.set(prop, 3);

      expect(callback).to.be.called();
    });
  });

  describe('.get()', () => {
    it('gets current parameter', () => {
      const s = new Settings();

      s.set('modes.VD.kSigma', 1);

      expect(settings.get('modes.VD.kSigma')).to.equal(1);
    });
  });

  describe('.reset()', () => {
    it('resets all parameters to default values', () => {
      const s = new Settings();

      s.set('modes.VD.kSigma', 3);
      s.reset();

      expect(s.now).to.deep.equal(s.defaults);
    });
  });

  describe('.checkpoint()', () => {
    it('preserves current state in settings.old', () => {
      const s = new Settings();

      s.set('modes.VD.kSigma', 3);
      expect(s.now).to.not.deep.equal(s.old);
      s.checkpoint();
      expect(s.now).to.deep.equal(s.old);
    });
  });

  describe('.changed()', () => {
    it('returns empty changed list when checkpoint hasn\'t been used', () => {
      const s = new Settings();

      s.set('modes.VD.kSigma', 3);

      expect(s.changed()).to.be.empty();
    });

    it('returns list of changed parameters since last checkpoint', () => {
      const s = new Settings();

      s.set('modes.VD.kSigma', 3);
      s.checkpoint();
      s.set('modes.VD.kSigma', 5);

      expect(s.changed()).to.deep.equal(['modes.VD.kSigma']);
    });
  });

  describe('.applyDiffs()', () => {
    it('overwrites settings with the diffs', () => {
      const diffs = {
        modes: {
          VD: {
            kSigma: 3,
          },
        },
      };
      const s = new Settings();

      s.applyDiffs(diffs);

      expect(s.now.modes.VD.kSigma).to.equal(diffs.modes.VD.kSigma);
    });

    it('throws an error if versions do not match', () => {
      const diffs = {
        modes: {
          VD: {
            kSigma: 3,
          },
        },
        VERSION: -1,
      };
      const s = new Settings();

      expect(() => {
        s.applyDiffs(diffs);
      }).to.throw('Settings version does not match!');
    });
  });

  describe('.getDiffs()', () => {
    it('returns a difference between current and default settings', () => {
      const s = new Settings();
      const diffs = {
        modes: {
          VD: {
            kSigma: 3,
          },
        },
      };

      s.set(diffs);

      expect(s.getDiffs(false)).to.deep.equal(diffs);
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
      const s = new Settings();

      s.setPluginOpts(pluginName, testPlugin);

      expect(s.now.plugins[pluginName]).to.deep.equal(testPlugin);
    });
  });
});
