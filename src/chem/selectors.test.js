import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import selectors from './selectors';

chai.use(dirtyChai);

describe('selectors', () => {
  describe('class Range', () => {
    const range2to7 = new selectors.Range(2, 7);
    const rangeIs2 = new selectors.Range(2);

    describe('contructor', () => {
      it('from two arguments', () => {
        expect(range2to7).to.deep.equal({ min: 2, max: 7 });
      });
      it('from one argument', () => {
        expect(rangeIs2).to.deep.equal({ min: 2, max: 2 });
      });
    });
    describe('includes', () => {
      it('not zero range', () => {
        expect(range2to7.includes(0)).to.equal(false);
        expect(range2to7.includes(2)).to.equal(true);
        expect(range2to7.includes(4)).to.equal(true);
        expect(range2to7.includes(7)).to.equal(true);
        expect(range2to7.includes(11)).to.equal(false);
      });
      it('zero range', () => {
        expect(rangeIs2.includes(-1)).to.equal(false);
        expect(rangeIs2.includes(2)).to.equal(true);
        expect(rangeIs2.includes(7)).to.equal(false);
      });
    });
    describe('toString', () => {
      it('from two arguments', () => {
        expect(range2to7.toString()).to.equal('2:7');
      });
      it('from one argument', () => {
        expect(rangeIs2.toString()).to.equal('2');
      });
    });
    describe('toJSON', () => {
      it('from two arguments', () => {
        expect(range2to7.toJSON()).to.deep.equal([2, 7]);
      });
      it('from one argument', () => {
        expect(rangeIs2.toJSON()).to.deep.equal([2, 2]);
      });
    });
  });

  describe('class RangeList', () => {
    const range0 = new selectors.Range(2, 8);
    const range1 = new selectors.Range(1, 14);
    const range2 = new selectors.Range(10, 12);

    const emptyRL = new selectors.RangeList();
    const oneRangeRL = new selectors.RangeList(range0);
    const twoRangesRL = new selectors.RangeList([range0, range2]);
    const threeRangesRL = new selectors.RangeList([range0, range1, range2]);

    describe('contructor', () => {
      it('no arguments', () => {
        expect(emptyRL).to.deep.equal({_values: []});
      });
      it('from one range', () => {
        expect(oneRangeRL).to.deep.equal({_values: [range0]});
      });
      it('from array of ranges', () => {
        expect(threeRangesRL).to.deep.equal({_values: [range0, range1, range2]});
      });
    });
    describe('append', () => {
      it('append range', () => {
        expect(oneRangeRL.append(range2)).to.deep.equal(twoRangesRL);
      });
    });
    describe('remove', () => {
      it('exist range', () => {
        expect(threeRangesRL.remove(range1)).to.deep.equal(twoRangesRL);
      });
      it('fantastic range', () => {
        expect(twoRangesRL.remove(range1)).to.deep.equal(twoRangesRL);
      });
    });
    describe('toString', () => {
      it('toString', () => {
        expect(twoRangesRL.toString()).to.equal(range0.toString() + ',' + range2.toString());
      });
    });
    describe('toJSON', () => {
      it('toJSON', () => {
        expect(twoRangesRL.toJSON()).to.deep.equal([range0.toJSON(), range2.toJSON()]);
      });
    });
    describe('includes', () => {
      it('in one of ranges', () => {
        expect(twoRangesRL.includes(11)).to.equal(true);
      });
      it('in two of ranges', () => {
        expect(threeRangesRL.includes(11)).to.equal(true);
      });
      it('outside of ranges', () => {
        expect(twoRangesRL.includes(9)).to.equal(false);
        expect(twoRangesRL.includes(20)).to.equal(false);
      });
    });
  });
});
