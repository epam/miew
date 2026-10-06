import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import sinon from 'sinon';
import settings from './settings';

chai.use(dirtyChai);

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

    it('normalizes boolean false for zooming to all channels false', () => {
      const s = new Settings();

      s.set('zooming', false);

      expect(s.now.zooming).to.deep.equal({ wheel: false, drag: false, touch: false });
    });

    it('normalizes boolean true for zooming to all channels true', () => {
      const s = new Settings();

      s.set('zooming', false);
      s.set('zooming', true);

      expect(s.now.zooming).to.deep.equal({ wheel: true, drag: true, touch: true });
    });

    it('normalizes integer 0 for zooming to all channels false', () => {
      const s = new Settings();

      s.set('zooming', 0);

      expect(s.now.zooming).to.deep.equal({ wheel: false, drag: false, touch: false });
    });

    it('normalizes integer 1 for zooming to all channels true', () => {
      const s = new Settings();

      s.set('zooming', 0);
      s.set('zooming', 1);

      expect(s.now.zooming).to.deep.equal({ wheel: true, drag: true, touch: true });
    });

    it('normalizes integer zooming in an object parameter', () => {
      const s = new Settings();

      s.set({ zooming: 0 });

      expect(s.now.zooming).to.deep.equal({ wheel: false, drag: false, touch: false });

      s.set({ zooming: 1 });

      expect(s.now.zooming).to.deep.equal({ wheel: true, drag: true, touch: true });
    });

    it('normalizes boolean zooming in an object parameter', () => {
      const s = new Settings();

      s.set({ zooming: false });

      expect(s.now.zooming).to.deep.equal({ wheel: false, drag: false, touch: false });

      s.set({ zooming: true });

      expect(s.now.zooming).to.deep.equal({ wheel: true, drag: true, touch: true });
    });

    it('updates individual zooming channels independently', () => {
      const s = new Settings();

      s.set('zooming.wheel', false);
      expect(s.now.zooming).to.deep.equal({ wheel: false, drag: true, touch: true });

      s.set({ zooming: { touch: false } });
      expect(s.now.zooming).to.deep.equal({ wheel: false, drag: true, touch: false });
    });

    it('emits change events when zooming is updated as a boolean', () => {
      const s = new Settings();
      const wheelCallback = sinon.spy();
      const dragCallback = sinon.spy();
      const touchCallback = sinon.spy();

      s.addEventListener('change:zooming.wheel', wheelCallback);
      s.addEventListener('change:zooming.drag', dragCallback);
      s.addEventListener('change:zooming.touch', touchCallback);

      s.set('zooming', false);

      expect(wheelCallback).to.be.calledWith(sinon.match({ value: false }));
      expect(dragCallback).to.be.calledWith(sinon.match({ value: false }));
      expect(touchCallback).to.be.calledWith(sinon.match({ value: false }));
    });
  });

  describe('.get()', () => {
    it('gets current parameter', () => {
      const s = new Settings();

      s.set('modes.VD.kSigma', 1);

      expect(settings.get('modes.VD.kSigma')).to.equal(1);
    });
  });

  describe('defaults', () => {
    it('defaults autoBonding to "default"', () => {
      const s = new Settings();

      expect(s.now.autoBonding).to.equal('default');
    });

    it('defaults zooming to { wheel: true, drag: true, touch: true }', () => {
      const s = new Settings();

      expect(s.now.zooming).to.deep.equal({ wheel: true, drag: true, touch: true });
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
