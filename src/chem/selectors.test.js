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
});
