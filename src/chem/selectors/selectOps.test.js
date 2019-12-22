import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import selectors from '../selectors';

chai.use(dirtyChai);

describe('selectArgs', () => {
  describe('PrefixOperator', () => {
    const noneSelector = selectors.none();
    const selector = selectors.all();
    selector.keyword = 'selector';

    const noArgPO = new selectors.PrefixOperator();
    const simplePO = new selectors.PrefixOperator(selector);
    simplePO.keyword = 'simplePO';

    describe('#toString()', () => {
      it('constructs string for prefix operator created with no arguments', () => {
        expect(noArgPO.toString()).to.equal('error none');
      });
      it('constructs string for higher priority prefix operator from lower priority...', () => {
        const highPriorityPO = new selectors.PrefixOperator(simplePO);
        highPriorityPO.priority -= 1;
        highPriorityPO.keyword = 'higherPO';
        expect(highPriorityPO.toString()).to.equal('higherPO (simplePO selector)');
      });
      it('constructs string for lower priority prefix operator from higher priority...', () => {
        const lowPriorityPO = new selectors.PrefixOperator(simplePO);
        lowPriorityPO.priority += 1;
        lowPriorityPO.keyword = 'lowerPO';
        expect(lowPriorityPO.toString()).to.equal('lowerPO simplePO selector');
      });
    });

    describe('#toJSON()', () => {
      it('constructs JSON for prefix operator created with no arguments', () => {
        expect(noArgPO.toJSON()).to.deep.equal(['Error', noneSelector.toJSON()]);
      });
    });
  });

  describe('InfixOperator', () => {
    const noneSelector = selectors.none();
    const leftSelector = selectors.all();
    leftSelector.keyword = 'lSelector';
    const rightSelector = selectors.all();
    rightSelector.keyword = 'rSelector';

    const noneSelectorIO = new selectors.InfixOperator();
    const halfSelectorIO = new selectors.InfixOperator(leftSelector);
    const selectorIO = new selectors.InfixOperator(leftSelector, rightSelector);

    const highPriorityIO = new selectors.InfixOperator(leftSelector, rightSelector);
    highPriorityIO.priority -= 2;
    highPriorityIO.keyword = '^';

    const lowPriorityIO = new selectors.InfixOperator(leftSelector, rightSelector);
    lowPriorityIO.priority += 2;
    lowPriorityIO.keyword = '+';

    describe('#toString()', () => {
      it('constructs string for infix operator with no arguments', () => {
        expect(noneSelectorIO.toString()).to.equal('none error none');
      });
      it('constructs string for infix operator with one argument', () => {
        expect(halfSelectorIO.toString()).to.equal('lSelector error none');
      });
      it('constructs string for simple infix operator', () => {
        expect(selectorIO.toString()).to.equal('lSelector error rSelector');
      });
      it('constructs string for complex infix operator with follow priorities: middle(high, low)', () => {
        const complexIO = new selectors.InfixOperator(highPriorityIO, lowPriorityIO);
        complexIO.keyword = '*';
        expect(complexIO.toString()).to.equal('lSelector ^ rSelector * (lSelector + rSelector)');
      });
      it('constructs string for complex infix operator with follow priorities: middle(low, high)', () => {
        const complexIO = new selectors.InfixOperator(lowPriorityIO, highPriorityIO);
        complexIO.keyword = '*';
        expect(complexIO.toString()).to.equal('(lSelector + rSelector) * lSelector ^ rSelector');
      });
      it('constructs string for complex infix operator with follow priorities: middle(low, low)', () => {
        const complexIO = new selectors.InfixOperator(lowPriorityIO, lowPriorityIO);
        complexIO.keyword = '*';
        expect(complexIO.toString()).to.equal('(lSelector + rSelector) * (lSelector + rSelector)');
      });
      it('constructs string for complex infix operator with follow priorities: middle(high, high)', () => {
        const complexIO = new selectors.InfixOperator(highPriorityIO, highPriorityIO);
        complexIO.keyword = '*';
        expect(complexIO.toString()).to.equal('lSelector ^ rSelector * lSelector ^ rSelector');
      });
    });

    describe('#toJSON()', () => {
      it('constructs JSON for infix operator with no arguments', () => {
        expect(noneSelectorIO.toJSON()).to.deep.equal(['Error', noneSelector.toJSON(), noneSelector.toJSON()]);
      });
      it('constructs JSON for infix operator with one argument', () => {
        expect(halfSelectorIO.toJSON()).to.deep.equal(['Error', leftSelector.toJSON(), noneSelector.toJSON()]);
      });
      it('constructs JSON for simple infix operator', () => {
        expect(selectorIO.toJSON()).to.deep.equal(['Error', leftSelector.toJSON(), rightSelector.toJSON()]);
      });
    });
  });
});
