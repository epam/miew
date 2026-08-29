import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import './Miew-cli';
import { parser as parsercli } from './utils/MiewCLIParser';
import settings from './settings';

chai.use(dirtyChai);

describe('Miew-cli', () => {
  beforeEach(() => {
    settings.reset();
  });

  describe('propagateProp', () => {
    it('accepts integer 0 for zooming', () => {
      expect(parsercli.yy.utils.propagateProp('zooming', 0)).to.equal(0);
    });

    it('accepts integer 1 for zooming', () => {
      expect(parsercli.yy.utils.propagateProp('zooming', 1)).to.equal(1);
    });

    it('accepts boolean false for zooming', () => {
      expect(parsercli.yy.utils.propagateProp('zooming', false)).to.equal(false);
    });

    it('accepts boolean true for zooming', () => {
      expect(parsercli.yy.utils.propagateProp('zooming', true)).to.equal(true);
    });

    it('accepts integer 0 for zooming.wheel', () => {
      expect(parsercli.yy.utils.propagateProp('zooming.wheel', 0)).to.equal(0);
    });

    it('accepts integer 1 for zooming.wheel', () => {
      expect(parsercli.yy.utils.propagateProp('zooming.wheel', 1)).to.equal(1);
    });

    it('allows undefined argument for GET queries without throwing', () => {
      expect(parsercli.yy.utils.propagateProp('zooming', undefined)).to.be.undefined();
      expect(parsercli.yy.utils.propagateProp('zooming.wheel', undefined)).to.be.undefined();
    });

    it('throws error with expected type for invalid zooming argument', () => {
      expect(() => {
        parsercli.yy.utils.propagateProp('zooming', 'invalid_string');
      }).to.throw('zooming must be a "boolean"');
    });
  });

  describe('CLI execution', () => {
    it('executes "set zooming 0" and disables all zooming channels', () => {
      const mockMiew = {
        set(path, value) {
          settings.set(path, value);
        },
        get(path) {
          return settings.get(path);
        },
      };
      parsercli.yy.miew = mockMiew;

      parsercli.parse('set zooming 0');
      expect(settings.now.zooming).to.deep.equal({ wheel: false, drag: false, touch: false });

      parsercli.parse('set zooming 1');
      expect(settings.now.zooming).to.deep.equal({ wheel: true, drag: true, touch: true });
    });

    it('executes "set zooming.wheel 0" and updates single channel', () => {
      const mockMiew = {
        set(path, value) {
          settings.set(path, value);
        },
        get(path) {
          return settings.get(path);
        },
      };
      parsercli.yy.miew = mockMiew;

      parsercli.parse('set zooming.wheel 0');
      expect(settings.now.zooming.wheel).to.equal(0);
      expect(settings.now.zooming.drag).to.be.true();
      expect(settings.now.zooming.touch).to.be.true();
    });
  });
});
