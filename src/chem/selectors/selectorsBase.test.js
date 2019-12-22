import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import selectors from '../selectors';

chai.use(dirtyChai);

describe('selectors', () => {
  const rFrom2To8 = new selectors.Range(2, 8);
  const rFrom1To14 = new selectors.Range(1, 14);
  const rFrom18To20 = new selectors.Range(18, 20);

  const rList = new selectors.RangeList([rFrom2To8, rFrom1To14, rFrom18To20]);
  const rListAsString = '2:8,1:14,18:20';
  const rListAsJSON = [[2, 8], [1, 14], [18, 20]];

  const VaLuE = 'VaLu E';
  const values = [45, VaLuE];

  describe('Selector', () => {
    const defaultSelector = new selectors.Selector();
    const newSelector = new selectors.Selector();
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
    const rListSelector = new selectors.RangeListSelector(rList);
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
    const vListSelector = new selectors.ValueListSelector(values, false);
    vListSelector.name = 'FooName';
    vListSelector.keyword = 'fooword';
    const vListSelectorSense = new selectors.ValueListSelector(values, true);
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
});
