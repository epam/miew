import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import selectors from './selectors';

chai.use(dirtyChai);

describe('selectors', () => {
  describe('Range', () => {
    const range2to7 = new selectors.Range(2, 7);
    const range2to7asString = '2:7';
    const range2to7asJSON = [2, 7];
    const rangeIs2 = new selectors.Range(2);
    const rangeIs2asString = '2';
    const rangeIs2asJSON = [2, 2];

    describe('#includes(value)', () => {
      it('check range [2,7] for not including 0', () => {
        expect(range2to7.includes(0)).to.equal(false);
      });
      it('check range [2,7] for including 2', () => {
        expect(range2to7.includes(2)).to.equal(true);
      });
      it('check range [2,7] for including 4', () => {
        expect(range2to7.includes(4)).to.equal(true);
      });
      it('check range [2,7] for including 7', () => {
        expect(range2to7.includes(7)).to.equal(true);
      });
      it('check range [2,7] for not including 11', () => {
        expect(range2to7.includes(11)).to.equal(false);
      });
      it('check range [2] for not including -1', () => {
        expect(rangeIs2.includes(-1)).to.equal(false);
      });
      it('check range [2] for including 2', () => {
        expect(rangeIs2.includes(2)).to.equal(true);
      });
      it('check range [2] for not including 7', () => {
        expect(rangeIs2.includes(7)).to.equal(false);
      });
    });
    describe('#toString()', () => {
      it('construct string for two arguments range', () => {
        expect(range2to7.toString()).to.equal(range2to7asString);
      });
      it('construct string for one argument range', () => {
        expect(rangeIs2.toString()).to.equal(rangeIs2asString);
      });
    });
    describe('#toJSON()', () => {
      it('construct JSON for two arguments range', () => {
        expect(range2to7.toJSON()).to.deep.equal(range2to7asJSON);
      });
      it('construct JSON for one argument range', () => {
        expect(rangeIs2.toJSON()).to.deep.equal(rangeIs2asJSON);
      });
    });
  });

  describe('RangeList', () => {
    const range0 = new selectors.Range(2, 8);
    const range1 = new selectors.Range(1, 14);
    const range2 = new selectors.Range(10, 12);

    const twoRangesRL = new selectors.RangeList([range0, range2]);
    const twoRangesRLAsString = [range0.toString(), range2.toString()].join(',');
    const twoRangesRLAsJSON = [range0.toJSON(), range2.toJSON()];
    const threeRangesRL = new selectors.RangeList([range0, range1, range2]);

    describe('#includes(value)', () => {
      it('check list for including value which exists in one of ranges', () => {
        expect(twoRangesRL.includes(11)).to.equal(true);
      });
      it('check list for including value which exists in more than one range', () => {
        expect(threeRangesRL.includes(11)).to.equal(true);
      });
      it('check list for not including value which is between different ranges', () => {
        expect(twoRangesRL.includes(9)).to.equal(false);
      });
      it('check list for not including value which is outside all ranges', () => {
        expect(twoRangesRL.includes(20)).to.equal(false);
      });
    });
    describe('#toString()', () => {
      it('construct string', () => {
        expect(twoRangesRL.toString()).to.equal(twoRangesRLAsString);
      });
    });
    describe('#toJSON()', () => {
      it('construct JSON', () => {
        expect(twoRangesRL.toJSON()).to.deep.equal(twoRangesRLAsJSON);
      });
    });
    describe('#append(value)', () => {
      it('list begins containing values from appending range', () => {
        const rangeList = new selectors.RangeList();
        expect(rangeList.includes(11)).to.equal(false);
        rangeList.append(range2);
        expect(rangeList.includes(11)).to.equal(true);
      });
      it('list does not begin containing values outside of appending range', () => {
        const rangeList = new selectors.RangeList();
        expect(rangeList.includes(1)).to.equal(false);
        rangeList.append(range2);
        expect(rangeList.includes(1)).to.equal(false);
      });
      it('list keeps containing values from previous ranges', () => {
        const rangeList = new selectors.RangeList();
        rangeList.append(range2);
        expect(rangeList.includes(11)).to.equal(true);
        rangeList.append(range0);
        expect(rangeList.includes(11)).to.equal(true);
      });
    });
    describe('#remove(value)', () => {
      it('list stops containing values from removing range', () => {
        const rangeList = new selectors.RangeList(range0);
        expect(rangeList.includes(3)).to.equal(true);
        rangeList.remove(range0);
        expect(rangeList.includes(3)).to.equal(false);
      });
      it('list keeps containing values from remaining ranges', () => {
        const rangeList = new selectors.RangeList([range0, range2]);
        expect(rangeList.includes(11)).to.equal(true);
        rangeList.remove(range0);
        expect(rangeList.includes(11)).to.equal(true);
      });
      it('list keeps containing values from remaining ranges even if they also exists in removing range', () => {
        const rangeList = new selectors.RangeList([range0, range1]);
        expect(rangeList.includes(5)).to.equal(true);
        rangeList.remove(range0);
        expect(rangeList.includes(5)).to.equal(true);
      });
      it('list keeps containing values from all ranges when removed range was not existing in list', () => {
        const rangeList = new selectors.RangeList(range0);
        expect(rangeList.includes(3)).to.equal(true);
        rangeList.remove(range1);
        expect(rangeList.includes(3)).to.equal(true);
      });
    });
  });

  describe('ValueList', () => {
    const VaLuE1 = 'VaLuE';
    const vALue1 = 'vALue';
    const value2 = 45;

    const VL = new selectors.ValueList([value2, VaLuE1]);
    const VLAsString = [value2.toString(), VaLuE1.toString()].join(',');
    const VLAsJSON = [value2, VaLuE1];
    const onlyUpperVL = new selectors.ValueList([value2, VaLuE1], true);
    const onlyUpperVLAsString = [value2.toString(), VaLuE1.toUpperCase().toString()].join(',');
    const onlyUpperVLAsJSON = [value2, VaLuE1.toUpperCase()];

    describe('#includes(value)', () => {
      it('check case sensitive list for including value which exists in it', () => {
        expect(VL.includes(VaLuE1)).to.equal(true);
      });
      it('check case sensitive list for including value which exists in it in different case', () => {
        expect(VL.includes(vALue1)).to.equal(false);
      });
      it('check case sensitive list for including value which does not exist in it', () => {
        expect(VL.includes('anotherVal')).to.equal(false);
      });
      it('check only upper case list for including value which exists in it', () => {
        expect(onlyUpperVL.includes(VaLuE1.toUpperCase())).to.equal(true);
      });
      it('check only upper case list list for including value which exists in it in different case', () => {
        expect(onlyUpperVL.includes(vALue1)).to.equal(false);
      });
      it('check only upper case  list for including value which does not exist in it', () => {
        expect(onlyUpperVL.includes('anotherVal')).to.equal(false);
      });
    });
    describe('#toString()', () => {
      it('construct string for case sensitive list', () => {
        expect(VL.toString()).to.equal(VLAsString);
      });
      it('construct string for only upper case  list', () => {
        expect(onlyUpperVL.toString()).to.equal(onlyUpperVLAsString);
      });
    });
    describe('#toJSON()', () => {
      it('construct JSON for case sensitive list', () => {
        expect(VL.toJSON()).to.deep.equal(VLAsJSON);
      });
      it('construct JSON for only upper case  list', () => {
        expect(onlyUpperVL.toJSON()).to.deep.equal(onlyUpperVLAsJSON);
      });
    });
    describe('#append(value)', () => {
      it('case sensitive list begins containing appending value', () => {
        const valueList = new selectors.ValueList();
        expect(valueList.includes(VaLuE1)).to.equal(false);
        valueList.append(VaLuE1);
        expect(valueList.includes(VaLuE1)).to.equal(true);
      });
      it('case sensitive list does not begin containing appending value in different case', () => {
        const valueList = new selectors.ValueList();
        expect(valueList.includes(vALue1)).to.equal(false);
        valueList.append(VaLuE1);
        expect(valueList.includes(vALue1)).to.equal(false);
      });
      it('case sensitive list keeps containing values from previous ranges', () => {
        const valueList = new selectors.ValueList();
        valueList.append(VaLuE1);
        expect(valueList.includes(VaLuE1)).to.equal(true);
        valueList.append(value2);
        expect(valueList.includes(VaLuE1)).to.equal(true);
      });
      it('only upper case list begins containing upper case version of appending value', () => {
        const valueList = new selectors.ValueList(undefined, true);
        expect(valueList.includes(VaLuE1.toUpperCase())).to.equal(false);
        valueList.append(VaLuE1);
        expect(valueList.includes(VaLuE1.toUpperCase())).to.equal(true);
      });
      it('only upper case list begins containing appending value even if it is not string', () => {
        const valueList = new selectors.ValueList(undefined, true);
        expect(valueList.includes(value2)).to.equal(false);
        valueList.append(value2);
        expect(valueList.includes(value2)).to.equal(true);
      });
      it('only upper case list does not begin containing not upper case version of appending value', () => {
        const valueList = new selectors.ValueList(undefined, true);
        expect(valueList.includes(VaLuE1)).to.equal(false);
        valueList.append(VaLuE1);
        expect(valueList.includes(VaLuE1)).to.equal(false);
      });
      it('only upper case list keeps containing values from previous ranges', () => {
        const valueList = new selectors.ValueList(undefined, true);
        valueList.append(VaLuE1);
        expect(valueList.includes(VaLuE1.toUpperCase())).to.equal(true);
        valueList.append(value2);
        expect(valueList.includes(VaLuE1.toUpperCase())).to.equal(true);
      });
    });
    describe('#remove(value)', () => {
      it('case sensitive list stops containing removing value', () => {
        const valueList = new selectors.ValueList(VaLuE1);
        expect(valueList.includes(VaLuE1)).to.equal(true);
        valueList.remove(VaLuE1);
        expect(valueList.includes(VaLuE1)).to.equal(false);
      });
      it('case sensitive list keeps containing remaining values', () => {
        const valueList = new selectors.ValueList([VaLuE1, value2]);
        expect(valueList.includes(value2)).to.equal(true);
        valueList.remove(VaLuE1);
        expect(valueList.includes(value2)).to.equal(true);
      });
      it('case sensitive list which contains two equal values keeps containing one of them after deleting another', () => {
        const valueList = new selectors.ValueList([VaLuE1, VaLuE1]);
        expect(valueList.includes(VaLuE1)).to.equal(true);
        valueList.remove(VaLuE1);
        expect(valueList.includes(VaLuE1)).to.equal(true);
        valueList.remove(VaLuE1);
        expect(valueList.includes(VaLuE1)).to.equal(false);
      });
      it('case sensitive list keeps containing all values when removed value was not existing in list', () => {
        const valueList = new selectors.ValueList(VaLuE1);
        expect(valueList.includes(VaLuE1)).to.equal(true);
        valueList.remove('anotherValue');
        expect(valueList.includes(VaLuE1)).to.equal(true);
      });
      it('case sensitive list keeps containing all values when removed value was not existing in list in such case', () => {
        const valueList = new selectors.ValueList(VaLuE1);
        expect(valueList.includes(VaLuE1)).to.equal(true);
        valueList.remove(vALue1);
        expect(valueList.includes(VaLuE1)).to.equal(true);
      });
      it('only upper case  list stops containing removing value', () => {
        const valueList = new selectors.ValueList(VaLuE1, true);
        expect(valueList.includes(VaLuE1.toUpperCase())).to.equal(true);
        valueList.remove(VaLuE1.toUpperCase());
        expect(valueList.includes(VaLuE1.toUpperCase())).to.equal(false);
      });
      it('only upper case list stops containing removing value even if it is not string', () => {
        const valueList = new selectors.ValueList(value2, true);
        expect(valueList.includes(value2)).to.equal(true);
        valueList.remove(value2);
        expect(valueList.includes(value2)).to.equal(false);
      });
      it('only upper case list stops containing removing value even if it was sent not in upper case', () => {
        const valueList = new selectors.ValueList(VaLuE1, true);
        expect(valueList.includes(VaLuE1.toUpperCase())).to.equal(true);
        valueList.remove(vALue1);
        expect(valueList.includes(VaLuE1.toUpperCase())).to.equal(false);
      });
      it('only upper case keeps containing remaining values', () => {
        const valueList = new selectors.ValueList([VaLuE1, value2], true);
        expect(valueList.includes(value2)).to.equal(true);
        valueList.remove(VaLuE1);
        expect(valueList.includes(value2)).to.equal(true);
      });
      it('only upper case list which contains two equal values keeps containing one of them after deleting another', () => {
        const valueList = new selectors.ValueList([VaLuE1, VaLuE1], true);
        expect(valueList.includes(VaLuE1.toUpperCase())).to.equal(true);
        valueList.remove(VaLuE1);
        expect(valueList.includes(VaLuE1.toUpperCase())).to.equal(true);
        valueList.remove(VaLuE1);
        expect(valueList.includes(VaLuE1.toUpperCase())).to.equal(false);
      });
      it('only upper case list keeps containing all values when removed value was not existing in list', () => {
        const valueList = new selectors.ValueList(VaLuE1, true);
        expect(valueList.includes(VaLuE1.toUpperCase())).to.equal(true);
        valueList.remove('anotherValue');
        expect(valueList.includes(VaLuE1.toUpperCase())).to.equal(true);
      });
    });
  });

  describe('Selector', () => {
    const defaultSelector = new selectors.Selector();
    const defaultSelectorAsString = 'error';
    const defaultSelectorAsJSON = ['Error'];
    const newSelector = new selectors.Selector();
    newSelector.keyword = 'newSelectorKeyword';
    newSelector.name = 'newSelectorName';
    const newSelectorAsString = newSelector.keyword;
    const newSelectorAsJSON = [newSelector.name];

    describe('#toString()', () => {
      it('construct string for default selector', () => {
        expect(defaultSelector.toString()).to.equal(defaultSelectorAsString);
      });
      it('construct string for selector with modified keyword', () => {
        expect(newSelector.toString()).to.equal(newSelectorAsString);
      });
    });
    describe('#toJSON()', () => {
      it('construct JSON for default selector', () => {
        expect(defaultSelector.toJSON()).to.deep.equal(defaultSelectorAsJSON);
      });
      it('construct JSON for selector with modified name', () => {
        expect(newSelector.toJSON()).to.deep.equal(newSelectorAsJSON);
      });
    });
  });

  describe('RangeListSelector', () => {
    const range0 = new selectors.Range(2, 8);
    const range1 = new selectors.Range(1, 14);
    const rangeList = new selectors.RangeList([range0, range1]);
    const rangeListSelector = new selectors.RangeListSelector(rangeList);
    const rangeListSelectorAsString = [rangeListSelector.keyword, rangeList.toString()].join(' ');
    const rangeListSelectorAsJSON = [rangeListSelector.name, rangeList.toJSON()];

    describe('#toString()', () => {
      it('construct string', () => {
        expect(rangeListSelector.toString()).to.equal(rangeListSelectorAsString);
      });
    });
    describe('#toJSON()', () => {
      it('construct JSON', () => {
        expect(rangeListSelector.toJSON()).to.deep.equal(rangeListSelectorAsJSON);
      });
    });
  });

  describe('ValueListSelector', () => {
    const values = ['A', 'b'];
    const valueList = new selectors.ValueList(values, true);
    const valueLS = new selectors.ValueListSelector(values, false);
    const valueLSAsString = [valueLS.keyword, valueList.toString()].join(' ');
    const valueLSAsJSON = [valueLS.name, valueList.toJSON()];

    const sensitiveValueList = new selectors.ValueList(values, false);
    const sensitiveValueLS = new selectors.ValueListSelector(values, true);
    const sensitiveValueLSAsString = [sensitiveValueLS.keyword, sensitiveValueList.toString()].join(' ');
    const sensitiveValueLSAsJSON = [sensitiveValueLS.name, sensitiveValueList.toJSON()];

    describe('#toString()', () => {
      it('construct string for case insensitive selector', () => {
        expect(valueLS.toString()).to.equal(valueLSAsString);
      });
      it('construct string for case sensitive selector', () => {
        expect(sensitiveValueLS.toString()).to.equal(sensitiveValueLSAsString);
      });
    });
    describe('#toJSON()', () => {
      it('construct JSON for case insensitive selector', () => {
        expect(valueLS.toJSON()).to.deep.equal(valueLSAsJSON);
      });
      it('construct JSON for case sensitive selector', () => {
        expect(sensitiveValueLS.toJSON()).to.deep.equal(sensitiveValueLSAsJSON);
      });
    });
  });

  describe('PrefixOperator', () => {
    const noneSelector = selectors.none();
    const noArgumentedPO = new selectors.PrefixOperator();
    const noArgumentedPOAsString = [noArgumentedPO.keyword, noneSelector.toString()].join(' ');
    const noArgumentedPOAsJSON = [noArgumentedPO.name, noneSelector.toJSON()];

    const selector = selectors.all();
    selector.keyword = 'selector';
    const simplePO = new selectors.PrefixOperator(selector);
    const simplePOAsString = [simplePO.keyword, selector.toString()].join(' ');
    const simplePOAsJSON = [simplePO.name, selector.toJSON()];

    const middlePriorityPO = new selectors.PrefixOperator(selector);
    middlePriorityPO.keyword = 'middlePO';

    describe('#toString()', () => {
      it('construct string for prefix operator created with no arguments', () => {
        expect(noArgumentedPO.toString()).to.equal(noArgumentedPOAsString);
      });
      it('construct string for simple prefix operator', () => {
        expect(simplePO.toString()).to.equal(simplePOAsString);
      });
      it('construct string for higher priority prefix operator from lower priority...', () => {
        const highPriorityPO = new selectors.PrefixOperator(middlePriorityPO);
        highPriorityPO.priority = selectors.PrefixOperator.prototype.priority - 1;
        highPriorityPO.keyword = 'highestPO';
        expect(highPriorityPO.toString()).to.equal('highestPO (middlePO selector)');
      });
      it('construct string for lower priority prefix operator from higher priority...', () => {
        const lowPriorityPO = new selectors.PrefixOperator(middlePriorityPO);
        lowPriorityPO.priority = selectors.PrefixOperator.prototype.priority + 1;
        lowPriorityPO.keyword = 'lowestPO';
        expect(lowPriorityPO.toString()).to.equal('lowestPO middlePO selector');
      });
    });
    describe('#toJSON()', () => {
      it('construct JSON for prefix operator created with no arguments', () => {
        expect(noArgumentedPO.toJSON()).to.deep.equal(noArgumentedPOAsJSON);
      });
      it('construct JSON for simple prefix operator', () => {
        expect(simplePO.toJSON()).to.deep.equal(simplePOAsJSON);
      });
    });
  });

  describe('InfixOperator', () => {
    const noneSelector = selectors.none();
    const letfSelector = selectors.all();
    letfSelector.keyword = 'lSelector';
    const rightSelector = selectors.all();
    rightSelector.keyword = 'rSelector';

    const noneSelectorIO = new selectors.InfixOperator();
    const noneSelectorIOAsString = [noneSelector.toString(), noneSelectorIO.keyword, noneSelector.toString()].join(' ');
    const noneSelectorIOAsJSON = [noneSelectorIO.name, noneSelector.toJSON(), noneSelector.toJSON()];

    const halfSelectorIO = new selectors.InfixOperator(letfSelector);
    const halfSelectorIOAsString = [letfSelector.toString(), halfSelectorIO.keyword, noneSelector.toString()].join(' ');
    const halfSelectorIOAsJSON = [halfSelectorIO.name, letfSelector.toJSON(), noneSelector.toJSON()];

    const selectorIO = new selectors.InfixOperator(letfSelector, rightSelector);
    const selectorIOAsString = [letfSelector.toString(), selectorIO.keyword, rightSelector.toString()].join(' ');
    const selectorIOAsJSON = [selectorIO.name, letfSelector.toJSON(), rightSelector.toJSON()];

    const highPriorityIO = new selectors.InfixOperator(letfSelector, rightSelector);
    highPriorityIO.priority = selectors.InfixOperator.prototype.priority - 2;
    highPriorityIO.keyword = '^';
    const lowPriorityIO = new selectors.InfixOperator(letfSelector, rightSelector);
    lowPriorityIO.priority = selectors.InfixOperator.prototype.priority + 2;
    lowPriorityIO.keyword = '+';

    describe('#toString()', () => {
      it('construct string for infix operator with no arguments', () => {
        expect(noneSelectorIO.toString()).to.equal(noneSelectorIOAsString);
      });
      it('construct string for infix operator with one argument', () => {
        expect(halfSelectorIO.toString()).to.equal(halfSelectorIOAsString);
      });
      it('construct string for simple infix operator', () => {
        expect(selectorIO.toString()).to.equal(selectorIOAsString);
      });
      it('construct string for complex infix operator with follow preorities: middle(high, low)', () => {
        const complexPO = new selectors.InfixOperator(highPriorityIO, lowPriorityIO);
        complexPO.keyword = '*';
        expect(complexPO.toString()).to.equal('lSelector ^ rSelector * (lSelector + rSelector)');
      });
      it('construct string for complex infix operator with follow preorities: middle(low, high)', () => {
        const complexPO = new selectors.InfixOperator(lowPriorityIO, highPriorityIO);
        complexPO.keyword = '*';
        expect(complexPO.toString()).to.equal('(lSelector + rSelector) * lSelector ^ rSelector');
      });
      it('construct string for complex infix operator with follow preorities: middle(low, low)', () => {
        const complexPO = new selectors.InfixOperator(lowPriorityIO, lowPriorityIO);
        complexPO.keyword = '*';
        expect(complexPO.toString()).to.equal('(lSelector + rSelector) * (lSelector + rSelector)');
      });
      it('construct string for complex infix operator with follow preorities: middle(high, high)', () => {
        const complexPO = new selectors.InfixOperator(highPriorityIO, highPriorityIO);
        complexPO.keyword = '*';
        expect(complexPO.toString()).to.equal('lSelector ^ rSelector * lSelector ^ rSelector');
      });
    });
    describe('#toJSON()', () => {
      it('construct JSON for infix operator with no arguments', () => {
        expect(noneSelectorIO.toJSON()).to.deep.equal(noneSelectorIOAsJSON);
      });
      it('construct JSON for infix operator with one argument', () => {
        expect(halfSelectorIO.toJSON()).to.deep.equal(halfSelectorIOAsJSON);
      });
      it('construct JSON for simple infix operator', () => {
        expect(selectorIO.toJSON()).to.deep.equal(selectorIOAsJSON);
      });
    });
  });

  describe('#GetSelector(key)', () => {
    selectors.Context.all = selectors.all();
    selectors.Context.noSelector = undefined;
    selectors.Context.none = selectors.none();
    it('throw exception for invalid keys', () => {
      expect(() => selectors.GetSelector('strangeKey')).to.throw();
    });
    it('Does not throw exception for valid keys', () => {
      expect(() => selectors.GetSelector('all')).to.not.throw();
    });
    it('return selector which corresponds to sent key', () => {
      expect(selectors.GetSelector('all')).to.deep.equal(selectors.all());
    });
    it('return Noneselector if key corresponds to undefined or empty value', () => {
      expect(selectors.GetSelector('noSelector')).to.deep.equal(selectors.none());
    });
  });

  describe('#ClearContext()', () => {
    selectors.Context.all = selectors.all();
    selectors.Context.noSelector = undefined;
    selectors.Context.none = selectors.none();
    it('make context to stop containing key which was in it before', () => {
      expect(selectors.GetSelector('all')).to.deep.equal(selectors.all());
      selectors.ClearContext();
      expect(() => selectors.GetSelector('all')).to.throw();
    });
  });

  describe('#keyword(key)', () => {
    selectors.Context.all = selectors.all();
    selectors.Context.noSelector = undefined;
    selectors.Context.none = selectors.none();
    it('return function for creating selector which corresponds to sent key', () => {
      expect(selectors.keyword('all')).to.deep.equal(selectors.all);
    });
    it('return function for creating Noneselector if key corresponds to undefined or empty value', () => {
      expect(selectors.keyword('strangeKey')).to.deep.equal(selectors.none);
    });
    it('return function for creating selector which corresponds to sent key in different case', () => {
      expect(selectors.keyword('aLl')).to.deep.equal(selectors.all);
    });
  });

  describe('#parse(str)', () => {
    it('for incorrect selector string', () => {
      expect(selectors.parse('seal 1:10').selector).to.deep.equal(selectors.none());
      expect(selectors.parse('seal 1:10')).to.have.a.property('error');
    });
    it('for correct selector string', () => {
      expect(selectors.parse('serial 1:10')).to.deep.equal({ selector: selectors.serial(new selectors.Range(1, 10)) });
    });
  });

  class AtomName {
    constructor(name) {
      this._name = name || null;
    }

    getString() {
      return this._name || 'unknown';
    }
  }
  const residue = {
    _type: { _name: 'ALA', flags: 0x0000 }, _chain: { _name: 'A' }, _icode: 'A', _index: 2, _sequence: 4,
  };
  const atom = {
    _het: false, _location: 32, _name: new AtomName('CA'), _residue: residue, _serial: 5, element: { name: 'N' },
  };

  const Flags = {
    PROTEIN: 0x0001,
    BASIC: 0x0002,
    ACIDIC: 0x0004,
    POLAR: 0x0008,
    NONPOLAR: 0x0010,
    AROMATIC: 0x0020,
    NUCLEIC: 0x0100,
    PURINE: 0x0200,
    PYRIMIDINE: 0x0400,
    DNA: 0x0800,
    RNA: 0x1000,
    WATER: 0x10000,
  };

  describe('SerialSelector', () => {
    describe('#includesAtom(atom)', () => {
      atom._serial = 5;
      it('check on correct including atom', () => {
        expect(selectors.serial(new selectors.Range(3, 8)).includesAtom(atom)).to.equal(true);
      });
      it('check on correct excluding atom', () => {
        expect(selectors.serial(new selectors.Range(6, 18)).includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('NameSelector', () => {
    describe('#includesAtom(atom)', () => {
      atom._name._name = 'CA';
      it('check on correct including atom', () => {
        expect(selectors.name('CA').includesAtom(atom)).to.equal(true);
      });
      it('check on correct excluding atom', () => {
        expect(selectors.name('N').includesAtom(atom)).to.equal(false);
      });
      it('check on not being case sensitive', () => {
        expect(selectors.name('cA').includesAtom(atom)).to.equal(true);
      });
    });
  });

  describe('AltLocSelector', () => {
    describe('#includesAtom(atom)', () => {
      atom._location = 32;
      it('check on correct including atom', () => {
        expect(selectors.altloc(' ').includesAtom(atom)).to.equal(true);
      });
      it('check on correct excluding atom', () => {
        expect(selectors.altloc('A').includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('ElemSelector', () => {
    describe('#includesAtom(atom)', () => {
      atom.element.name = 'N';
      it('check on correct including atom', () => {
        expect(selectors.elem('N').includesAtom(atom)).to.equal(true);
      });
      it('check on correct excluding atom', () => {
        expect(selectors.elem('C').includesAtom(atom)).to.equal(false);
      });
      it('check on not being case sensitive', () => {
        expect(selectors.elem('n').includesAtom(atom)).to.equal(true);
      });
    });
  });

  describe('ResidueSelector', () => {
    describe('#includesAtom(atom)', () => {
      atom._residue._type._name = 'ALA';
      it('check on correct including atom', () => {
        expect(selectors.residue('ALA').includesAtom(atom)).to.equal(true);
      });
      it('check on correct excluding atom', () => {
        expect(selectors.residue('CYS').includesAtom(atom)).to.equal(false);
      });
      it('check on not being case sensitive', () => {
        expect(selectors.residue('AlA').includesAtom(atom)).to.equal(true);
      });
    });
  });

  describe('SequenceSelector', () => {
    describe('#includesAtom(atom)', () => {
      atom._residue._sequence = 4;
      it('check on correct including atom', () => {
        expect(selectors.sequence(new selectors.Range(2, 18)).includesAtom(atom)).to.equal(true);
      });
      it('check on correct excluding atom', () => {
        expect(selectors.sequence(new selectors.Range(5, 8)).includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('ICodeSelector', () => {
    describe('#includesAtom(atom)', () => {
      atom._residue._icode = 'A';
      it('check on correct including atom', () => {
        expect(selectors.icode('A').includesAtom(atom)).to.equal(true);
      });
      it('check on correct excluding atom', () => {
        expect(selectors.icode('F').includesAtom(atom)).to.equal(false);
      });
      it('check on being case sensitive', () => {
        expect(selectors.icode('a').includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('ResIdxSelector', () => {
    describe('#includesAtom(atom)', () => {
      atom._residue._index = 2;
      it('check on correct including atom', () => {
        expect(selectors.residx(new selectors.Range(1, 18)).includesAtom(atom)).to.equal(true);
      });
      it('check on correct excluding atom', () => {
        expect(selectors.residx(new selectors.Range(6, 18)).includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('ChainSelector', () => {
    describe('#includesAtom(atom)', () => {
      atom._residue._chain._name = 'B';
      it('check on correct including atom', () => {
        expect(selectors.chain('B').includesAtom(atom)).to.equal(true);
      });
      it('check on correct excluding atom', () => {
        expect(selectors.chain('F').includesAtom(atom)).to.equal(false);
      });
      it('check on being case sensitive', () => {
        expect(selectors.chain('b').includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('HetatmSelector', () => {
    describe('#includesAtom(atom)', () => {
      it('check on correct including hetatoms', () => {
        atom._het = true;
        expect(selectors.hetatm().includesAtom(atom)).to.equal(true);
      });
      it('check on correct excluding hetatoms', () => {
        atom._het = false;
        expect(selectors.hetatm().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('PolarHSelector', () => {
    const atomFlags = {
      HYDROGEN: 0x0008,
      NONPOLARH: 0x1008,
    };
    describe('#includesAtom(atom)', () => {
      it('check on correct including atom', () => {
        atom.flags = atomFlags.HYDROGEN;
        expect(selectors.polarh().includesAtom(atom)).to.equal(true);
      });
      it('check on correct excluding atom', () => {
        atom.flags = atomFlags.NONPOLARH;
        expect(selectors.polarh().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('NonPolarHSelector', () => {
    const atomFlags = {
      HYDROGEN: 0x0008,
      NONPOLARH: 0x1008,
    };
    describe('#includesAtom(atom)', () => {
      atom._residue._index = 2;
      it('check on correct including atom', () => {
        atom.flags = atomFlags.NONPOLARH;
        expect(selectors.nonpolarh().includesAtom(atom)).to.equal(true);
      });
      it('check on correct excluding atom', () => {
        atom.flags = atomFlags.HYDROGEN;
        expect(selectors.nonpolarh().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('AllSelector', () => {
    describe('#includesAtom(atom)', () => {
      atom._residue._index = 2;
      it('check on correct including atom', () => {
        expect(selectors.all().includesAtom(atom)).to.equal(true);
      });
    });
  });

  describe('NoneSelector', () => {
    describe('#includesAtom(atom)', () => {
      atom._residue._index = 2;
      it('check on correct excluding atom', () => {
        expect(selectors.none().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('Protein', () => {
    describe('#includesAtom(atom)', () => {
      it('check on correct including protein atom', () => {
        atom._residue._type.flags = Flags.PROTEIN;
        expect(selectors.protein().includesAtom(atom)).to.equal(true);
      });
      it('check on correct excluding not protein atom', () => {
        atom._residue._type.flags = 0x0000;
        expect(selectors.protein().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('Basic', () => {
    describe('#includesAtom(atom)', () => {
      it('check on correct including basic atom', () => {
        atom._residue._type.flags = Flags.BASIC;
        expect(selectors.basic().includesAtom(atom)).to.equal(true);
      });
      it('check on correct excluding not basic atom', () => {
        atom._residue._type.flags = 0x0000;
        expect(selectors.basic().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('Acidic', () => {
    describe('#includesAtom(atom)', () => {
      it('check on correct including acidic atom', () => {
        atom._residue._type.flags = Flags.ACIDIC;
        expect(selectors.acidic().includesAtom(atom)).to.equal(true);
      });
      it('check on correct excluding not acidic atom', () => {
        atom._residue._type.flags = 0x0000;
        expect(selectors.acidic().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('Charged', () => {
    describe('#includesAtom(atom)', () => {
      it('check on correct including acidic atom', () => {
        atom._residue._type.flags = Flags.ACIDIC;
        expect(selectors.charged().includesAtom(atom)).to.equal(true);
      });
      it('check on correct including basic atom', () => {
        atom._residue._type.flags = Flags.BASIC;
        expect(selectors.charged().includesAtom(atom)).to.equal(true);
      });
      it('check on correct excluding not acidic or basic atom', () => {
        atom._residue._type.flags = 0x0000;
        expect(selectors.charged().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('Polar', () => {
    describe('#includesAtom(atom)', () => {
      it('check on correct including polar atom', () => {
        atom._residue._type.flags = Flags.POLAR;
        expect(selectors.polar().includesAtom(atom)).to.equal(true);
      });
      it('check on correct excluding not polar atom', () => {
        atom._residue._type.flags = 0x0000;
        expect(selectors.polar().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('NonPolar', () => {
    describe('#includesAtom(atom)', () => {
      it('check on correct including nonPolar atom', () => {
        atom._residue._type.flags = Flags.NONPOLAR;
        expect(selectors.nonpolar().includesAtom(atom)).to.equal(true);
      });
      it('check on correct excluding not nonPolar atom', () => {
        atom._residue._type.flags = 0x0000;
        expect(selectors.nonpolar().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('Aromatic', () => {
    describe('#includesAtom(atom)', () => {
      it('check on correct including aromatic atom', () => {
        atom._residue._type.flags = Flags.AROMATIC;
        expect(selectors.aromatic().includesAtom(atom)).to.equal(true);
      });
      it('check on correct excluding not aromatic atom', () => {
        atom._residue._type.flags = 0x0000;
        expect(selectors.aromatic().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('Nucleic', () => {
    describe('#includesAtom(atom)', () => {
      it('check on correct including nucleic atom', () => {
        atom._residue._type.flags = Flags.NUCLEIC;
        expect(selectors.nucleic().includesAtom(atom)).to.equal(true);
      });
      it('check on correct excluding not nucleic atom', () => {
        atom._residue._type.flags = 0x0000;
        expect(selectors.nucleic().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('Purine', () => {
    describe('#includesAtom(atom)', () => {
      it('check on correct including purine atom', () => {
        atom._residue._type.flags = Flags.PURINE;
        expect(selectors.purine().includesAtom(atom)).to.equal(true);
      });
      it('check on correct excluding not purine atom', () => {
        atom._residue._type.flags = 0x0000;
        expect(selectors.purine().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('Pyrimidine', () => {
    describe('#includesAtom(atom)', () => {
      it('check on correct including pyrimidine atom', () => {
        atom._residue._type.flags = Flags.PYRIMIDINE;
        expect(selectors.pyrimidine().includesAtom(atom)).to.equal(true);
      });
      it('check on correct excluding not pyrimidine atom', () => {
        atom._residue._type.flags = 0x0000;
        expect(selectors.pyrimidine().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('Water', () => {
    describe('#includesAtom(atom)', () => {
      it('check on correct including water atom', () => {
        atom._residue._type.flags = Flags.WATER;
        expect(selectors.water().includesAtom(atom)).to.equal(true);
      });
      it('check on correct excluding not water atom', () => {
        atom._residue._type.flags = 0x0000;
        expect(selectors.water().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('NotSelector', () => {
    describe('#includesAtom(atom)', () => {
      it('check on invert selector result from false to true', () => {
        expect(selectors.none().includesAtom(atom)).to.equal(false);
        expect(selectors.not(selectors.none()).includesAtom(atom)).to.equal(true);
      });
      it('check on invert selector result from false to true', () => {
        expect(selectors.all().includesAtom(atom)).to.equal(true);
        expect(selectors.not(selectors.all()).includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('AndOperator', () => {
    describe('#includesAtom(atom)', () => {
      it('check on conjunction true and true selector results', () => {
        expect(selectors.all().includesAtom(atom)).to.equal(true);
        expect(selectors.and(selectors.all(), selectors.all()).includesAtom(atom)).to.equal(true);
      });
      it('check on conjunction true and false selector results', () => {
        expect(selectors.all().includesAtom(atom)).to.equal(true);
        expect(selectors.none().includesAtom(atom)).to.equal(false);
        expect(selectors.and(selectors.all(), selectors.none()).includesAtom(atom)).to.equal(false);
      });
      it('check on conjunction false and true selector results', () => {
        expect(selectors.all().includesAtom(atom)).to.equal(true);
        expect(selectors.none().includesAtom(atom)).to.equal(false);
        expect(selectors.and(selectors.none(), selectors.all()).includesAtom(atom)).to.equal(false);
      });
      it('check on conjunction false and false selector results', () => {
        expect(selectors.none().includesAtom(atom)).to.equal(false);
        expect(selectors.and(selectors.none(), selectors.none()).includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('OrOperator', () => {
    describe('#includesAtom(atom)', () => {
      it('check on disjunction true and true selector results', () => {
        expect(selectors.all().includesAtom(atom)).to.equal(true);
        expect(selectors.or(selectors.all(), selectors.not(selectors.none())).includesAtom(atom)).to.equal(true);
      });
      it('check on disjunction true and false selector results', () => {
        expect(selectors.all().includesAtom(atom)).to.equal(true);
        expect(selectors.none().includesAtom(atom)).to.equal(false);
        expect(selectors.or(selectors.all(), selectors.none()).includesAtom(atom)).to.equal(true);
      });
      it('check on disjunction false and true selector results', () => {
        expect(selectors.all().includesAtom(atom)).to.equal(true);
        expect(selectors.none().includesAtom(atom)).to.equal(false);
        expect(selectors.or(selectors.none(), selectors.all()).includesAtom(atom)).to.equal(true);
      });
      it('check on disjunction false and false selector results', () => {
        expect(selectors.none().includesAtom(atom)).to.equal(false);
        expect(selectors.or(selectors.not(selectors.all()), selectors.none()).includesAtom(atom)).to.equal(false);
      });
    });
  });
});
