import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import {
  Selector,
  RangeListSelector,
  ValueListSelector,
  NoneSelector,
  AllSelector,
} from './selectorsBase';
import { Range, RangeList } from './selectArgs';

chai.use(dirtyChai);

const rFrom2To8 = new Range(2, 8);
const rFrom1To14 = new Range(1, 14);
const rFrom18To20 = new Range(18, 20);

const rList = new RangeList([rFrom2To8, rFrom1To14, rFrom18To20]);
const rListAsString = '2:8,1:14,18:20';
const rListAsJSON = [[2, 8], [1, 14], [18, 20]];

const VaLuE = 'VaLu E';
const values = [45, VaLuE];

const atom = {
  residue: null,
  name: 'CA',
  type: { name: 'N' },
};

describe('Selector', () => {
  const defaultSelector = new Selector();
  const newSelector = new Selector();
  newSelector.keyword = 'newKeyword';
  newSelector.name = 'newName';

  describe('#toString()', () => {
    it('constructs string for default selector', () => {
      expect(defaultSelector.toString()).to.equal('error');
    });
    it('constructs string for selector with modified keyword', () => {
      expect(newSelector.toString()).to.equal('newKeyword');
    });
  });
  describe('#toJSON()', () => {
    it('constructs JSON for default selector', () => {
      expect(defaultSelector.toJSON()).to.deep.equal(['Error']);
    });
    it('constructs JSON for selector with modified name', () => {
      expect(newSelector.toJSON()).to.deep.equal(['newName']);
    });
  });
});

describe('RangeListSelector', () => {
  const rListSelector = new RangeListSelector(rList);
  rListSelector.name = 'FooName';
  rListSelector.keyword = 'fooword';

  describe('#toString()', () => {
    it('constructs string', () => {
      expect(rListSelector.toString()).to.equal(`fooword ${rListAsString}`);
    });
  });

  describe('#toJSON()', () => {
    it('constructs JSON', () => {
      expect(rListSelector.toJSON()).to.deep.equal(['FooName', rListAsJSON]);
    });
  });
});

describe('ValueListSelector', () => {
  const vListSelector = new ValueListSelector(values, false);
  vListSelector.name = 'FooName';
  vListSelector.keyword = 'fooword';
  const vListSelectorSense = new ValueListSelector(values, true);
  vListSelectorSense.name = 'FooName';
  vListSelectorSense.keyword = 'fooword';

  describe('#toString()', () => {
    it('constructs string for case insensitive selector', () => {
      expect(vListSelector.toString()).to.equal('fooword 45,"VALU E"');
    });
    it('constructs string for case sensitive selector', () => {
      expect(vListSelectorSense.toString()).to.equal('fooword 45,"VaLu E"');
    });
  });
  describe('#toJSON()', () => {
    it('constructs JSON for case insensitive selector', () => {
      expect(vListSelector.toJSON()).to.deep.equal(['FooName', [45, 'VALU E']]);
    });
    it('constructs JSON for case sensitive selector', () => {
      expect(vListSelectorSense.toJSON()).to.deep.equal(['FooName', [45, 'VaLu E']]);
    });
  });
});

describe('AllSelector', () => {
  describe('#includesAtom(atom)', () => {
    it('includes some not specific atom', () => {
      const all = new AllSelector();
      expect(all.includesAtom(atom)).to.equal(true);
    });
  });
});

describe('NoneSelector', () => {
  describe('#includesAtom(atom)', () => {
    it('excludes some not specific atom', () => {
      const none = new NoneSelector();
      expect(none.includesAtom(atom)).to.equal(false);
    });
  });
});
