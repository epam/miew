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
    const value0 = 'a';
    const value1 = 'B';
    const value2 = 12;

    const emptyVL = new selectors.ValueList();
    const oneValueVL = new selectors.ValueList(value0);
    const twoValuesVL = new selectors.ValueList([value0, value2]);
    const threeValuesVL = new selectors.ValueList([value0, value1, value2]);

    describe('contructor', () => {
      it('no arguments', () => {
        expect(emptyVL).to.deep.equal({ _values: [] });
      });
      it('from one value', () => {
        expect(oneValueVL).to.deep.equal({ _values: [value0] });
      });
      it('from array of values', () => {
        expect(threeValuesVL).to.deep.equal({ _values: [value0, value1, value2] });
      });
      it('with toUpperCase setting', () => {
        const valList = new selectors.ValueList(['ala', 12, 'B', 'c'], true);
        expect(valList).to.deep.equal({ _values: ['ALA', 12, 'B', 'C'] });
      });
    });
    describe('append', () => {
      it('append value', () => {
        expect(oneValueVL.append(value2)).to.deep.equal(twoValuesVL);
      });
    });
    describe('remove', () => {
      it('exist range', () => {
        expect(threeValuesVL.remove(value1)).to.deep.equal(twoValuesVL);
      });
      it('fantastic range', () => {
        expect(twoValuesVL.remove(value1)).to.deep.equal(twoValuesVL);
      });
    });
    describe('toString', () => {
      it('toString', () => {
        expect(twoValuesVL.toString()).to.equal([value0.toString(), value2.toString()].join(','));
      });
    });
    describe('toJSON', () => {
      it('toJSON', () => {
        expect(twoValuesVL.toJSON()).to.deep.equal([value0, value2]);
      });
    });
    describe('includes', () => {
      it('existed value', () => {
        expect(twoValuesVL.includes(value0)).to.equal(true);
      });
      it('fantastic value', () => {
        expect(twoValuesVL.includes(value1)).to.equal(false);
      });
    });
  });

  describe('Selector', () => {
    const selector = new selectors.Selector();

    describe('Selector prototype', () => {
      it('keyword', () => {
        expect(selector.keyword).to.equal('error');
      });
      it('name', () => {
        expect(selector.name).to.equal('Error');
      });
    });
    describe('toString', () => {
      it('from prototype', () => {
        expect(selector.toString()).to.equal('error');
      });
      it('from extention', () => {
        selector.keyword = 'new keyword';
        expect(selector.toString()).to.equal('new keyword');
      });
    });
    describe('toJSON', () => {
      it('from prototype', () => {
        expect(selector.toJSON()).to.deep.equal(['Error']);
      });
      it('from extention', () => {
        selector.name = 'new name';
        expect(selector.toJSON()).to.deep.equal(['new name']);
      });
    });
  });

  describe('RangeListSelector', () => {
    const rangeList = new selectors.RangeList([new selectors.Range(2, 8), new selectors.Range(1, 14)]);
    const rangeListSelector = new selectors.RangeListSelector([new selectors.Range(2, 8), new selectors.Range(1, 14)]);

    describe('construcnor', () => {
      it('keyword', () => {
        expect(rangeListSelector.keyword).to.equal('error');
      });
      it('name', () => {
        expect(rangeListSelector.name).to.equal('Error');
      });
      it('list', () => {
        expect(rangeListSelector.list).to.deep.equal(rangeList);
      });
    });
    describe('toString', () => {
      it('toString', () => {
        expect(rangeListSelector.toString()).to.equal(['error', rangeList.toString()].join(' '));
      });
    });
    describe('toJSON', () => {
      it('toJSON', () => {
        expect(rangeListSelector.toJSON()).to.deep.equal(['Error', rangeList.toJSON()]);
      });
    });
  });

  describe('ValueListSelector', () => {
    const valueList = new selectors.ValueList(['A', 'b'], false);
    const valueListSelector = new selectors.ValueListSelector(['A', 'b'], true);

    describe('construcnor', () => {
      it('keyword', () => {
        expect(valueListSelector.keyword).to.equal('error');
      });
      it('name', () => {
        expect(valueListSelector.name).to.equal('Error');
      });
      it('list', () => {
        expect(valueListSelector.list).to.deep.equal(valueList);
      });
      it('caseSensitive list', () => {
        const vl = new selectors.ValueList(['A', 'b'], true);
        const vls = new selectors.ValueListSelector(['A', 'b'], false);
        expect(vls.list).to.deep.equal(vl);
      });
    });
    describe('toString', () => {
      it('toString', () => {
        expect(valueListSelector.toString()).to.equal(['error', valueList.toString()].join(' '));
      });
    });
    describe('toJSON', () => {
      it('toJSON', () => {
        expect(valueListSelector.toJSON()).to.deep.equal(['Error', valueList.toJSON()]);
      });
    });
  });

  describe('PrefixOperator', () => {
    const selector = selectors.all();
    selector.keyword = 'selector';
    const noneSelector = selectors.none();
    const selectorPO = new selectors.PrefixOperator(selector);
    const noneSelectorPO = new selectors.PrefixOperator();

    describe('construcnor', () => {
      it('priority', () => {
        expect(selectorPO.priority).to.equal(1);
      });
      it('construcnor with rhs', () => {
        expect(selectorPO.rhs).to.deep.equal(selector);
      });
      it('construcnor without arguments', () => {
        expect(noneSelectorPO.rhs).to.deep.equal(noneSelector);
      });
    });
    describe('toString', () => {
      it('easy prefix operator toString', () => {
        expect(selectorPO.toString()).to.equal(['error', selector.toString()].join(' '));
      });
      describe('complex prefix operator toString', () => {
        const middlePriorityPO = new selectors.PrefixOperator(selector);
        middlePriorityPO.keyword = 'middle';
        it('higher from lower priority selector', () => {
          const highPriorityPO = new selectors.PrefixOperator(middlePriorityPO);
          highPriorityPO.priority = selectors.PrefixOperator.prototype.priority - 1;
          highPriorityPO.keyword = 'high';
          expect(highPriorityPO.toString()).to.equal('high (middle selector)');
        });
        it('lower from higher priority selector', () => {
          const lowPriorityPO = new selectors.PrefixOperator(middlePriorityPO);
          lowPriorityPO.priority = selectors.PrefixOperator.prototype.priority + 1;
          lowPriorityPO.keyword = 'low';
          expect(lowPriorityPO.toString()).to.equal('low middle selector');
        });
      });
    });
    describe('toJSON', () => {
      it('toJSON', () => {
        expect(selectorPO.toJSON()).to.deep.equal(['Error', selector.toJSON()]);
      });
    });
  });

  describe('InfixOperator', () => {
    const letfSelector = selectors.all();
    letfSelector.keyword = 'lSelector';
    const rightSelector = selectors.all();
    rightSelector.keyword = 'rSelector';
    const noneSelector = selectors.none();
    const selectorIO = new selectors.InfixOperator(letfSelector, rightSelector);
    const halfSelectorIO = new selectors.InfixOperator(letfSelector);
    const noneSelectorIO = new selectors.InfixOperator();

    describe('construcnor', () => {
      it('priority', () => {
        expect(selectorIO.priority).to.equal(1000);
      });
      it('construcnor with two arguments', () => {
        expect(selectorIO.lhs).to.deep.equal(letfSelector);
        expect(selectorIO.rhs).to.deep.equal(rightSelector);
      });
      it('construcnor with one argument', () => {
        expect(halfSelectorIO.lhs).to.deep.equal(letfSelector);
        expect(halfSelectorIO.rhs).to.deep.equal(noneSelector);
      });
      it('construcnor without arguments', () => {
        expect(noneSelectorIO.lhs).to.deep.equal(noneSelector);
        expect(noneSelectorIO.rhs).to.deep.equal(noneSelector);
      });
    });
    describe('toString', () => {
      it('toString', () => {
        expect(selectorIO.toString()).to.equal([letfSelector.toString(), 'error', rightSelector.toString()].join(' '));
      });
      describe('complex infix operator toString', () => {
        const highPriorityIO = new selectors.InfixOperator(letfSelector, rightSelector);
        highPriorityIO.priority = selectors.InfixOperator.prototype.priority - 2;
        highPriorityIO.keyword = 'high';
        const lowPriorityIO = new selectors.InfixOperator(letfSelector, rightSelector);
        lowPriorityIO.priority = selectors.InfixOperator.prototype.priority + 2;
        lowPriorityIO.keyword = 'low';
        it('middle(high, low)', () => {
          const complexPO = new selectors.InfixOperator(highPriorityIO, lowPriorityIO);
          complexPO.keyword = 'middle';
          expect(complexPO.toString()).to.equal('lSelector high rSelector middle (lSelector low rSelector)');
        });
        it('middle(low, high)', () => {
          const complexPO = new selectors.InfixOperator(lowPriorityIO, highPriorityIO);
          complexPO.keyword = 'middle';
          expect(complexPO.toString()).to.equal('(lSelector low rSelector) middle lSelector high rSelector');
        });
        it('middle(low, low)', () => {
          const complexPO = new selectors.InfixOperator(lowPriorityIO, lowPriorityIO);
          complexPO.keyword = 'middle';
          expect(complexPO.toString()).to.equal('(lSelector low rSelector) middle (lSelector low rSelector)');
        });
        it('middle(high, high)', () => {
          const complexPO = new selectors.InfixOperator(highPriorityIO, highPriorityIO);
          complexPO.keyword = 'middle';
          expect(complexPO.toString()).to.equal('lSelector high rSelector middle lSelector high rSelector');
        });
      });
    });
    describe('toJSON', () => {
      it('toJSON', () => {
        expect(selectorIO.toJSON()).to.deep.equal(['Error', letfSelector.toJSON(), rightSelector.toJSON()]);
      });
    });
  });

  describe('selectors functions', () => {
    describe('GetSelector', () => {
      it('for exists selector', () => {
        const key = 'all';
        selectors.Context[key] = selectors.all;
        expect(selectors.GetSelector(key)).to.not.throw();
        expect(new selectors.GetSelector(key)()).to.deep.equal(selectors.all());
      });
      it('for exists but empty selector', () => {
        const key = 'all';
        selectors.Context[key] = undefined;
        expect(new selectors.GetSelector(key)()).to.deep.equal(selectors.none());
      });
      it('for fantastic selector', () => {
        const key = 'p';
        selectors.Context.all = selectors.all;
        expect(() => selectors.GetSelector(key)).to.throw();
      });
    });
    describe('ClearContext', () => {
      it('for exists selector', () => {
        const key = 'all';
        selectors.Context[key] = selectors.all();
        selectors.ClearContext();
        expect(selectors.Context).to.deep.equal({});
      });
    });
    describe('keyword', () => {
      it('for exists selector', () => {
        expect(selectors.keyword('ALL')).to.deep.equal(selectors.all);
      });
      it('for fantastic selector', () => {
        expect(selectors.keyword('hh')).to.deep.equal(selectors.none);
      });
    });
    describe('parse', () => {
      it('for incorrect selector string', () => {
        expect(selectors.parse('seal 1:10').selector).to.deep.equal(selectors.none());
        expect(selectors.parse('seal 1:10')).to.have.a.property('error');
      });
      it('for correct selector string', () => {
        expect(selectors.parse('serial 1:10')).to.deep.equal({ selector: selectors.serial(new selectors.Range(1, 10)) });
      });
    });
  });

  describe('includesAtom function', () => {
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

    describe('base selectors', () => {
      const Flags = {
        HYDROGEN: 0x0008,
        NONPOLARH: 0x1008,
      };

      it('Serial', () => {
        atom._serial = 5;
        expect(selectors.serial(new selectors.Range(6, 18)).includesAtom(atom)).to.equal(false);
        expect(selectors.serial([new selectors.Range(2, 8), new selectors.Range(6, 18)]).includesAtom(atom)).to.equal(true);
      });
      it('Name', () => {
        atom._name._name = 'CA';
        expect(selectors.name('N').includesAtom(atom)).to.equal(false);
        expect(selectors.name(['N', 'CA']).includesAtom(atom)).to.equal(true);
      });
      it('AltLoc', () => {
        atom._location = 32;
        expect(selectors.altloc('A').includesAtom(atom)).to.equal(false);
        expect(selectors.altloc(['A', ' ']).includesAtom(atom)).to.equal(true);
      });
      it('Elem', () => {
        atom.element.name = 'N';
        expect(selectors.elem('C').includesAtom(atom)).to.equal(false);
        expect(selectors.elem(['N', 'C']).includesAtom(atom)).to.equal(true);
      });
      it('Residue', () => {
        atom._residue._type._name = 'ALA';
        expect(selectors.residue('CYS').includesAtom(atom)).to.equal(false);
        expect(selectors.residue(['THR', 'ALA', 'CYS']).includesAtom(atom)).to.equal(true);
      });
      it('Sequence', () => {
        atom._residue._sequence = 4;
        expect(selectors.sequence(new selectors.Range(6, 18)).includesAtom(atom)).to.equal(false);
        expect(selectors.sequence([new selectors.Range(2, 8), new selectors.Range(6, 18)]).includesAtom(atom)).to.equal(true);
      });
      it('ICode', () => {
        atom._residue._icode = 'A';
        expect(selectors.icode('a').includesAtom(atom)).to.equal(false);
        expect(selectors.icode(['A', 'b', 'C']).includesAtom(atom)).to.equal(true);
      });
      it('ResIdx', () => {
        atom._residue._index = 2;
        expect(selectors.residx(new selectors.Range(6, 18)).includesAtom(atom)).to.equal(false);
        expect(selectors.residx([new selectors.Range(2, 8), new selectors.Range(6, 18)]).includesAtom(atom)).to.equal(true);
      });
      it('Chain', () => {
        atom._residue._chain._name = 'B';
        expect(selectors.chain('b').includesAtom(atom)).to.equal(false);
        expect(selectors.chain(['A', 'B', 'c']).includesAtom(atom)).to.equal(true);
      });
      it('Hetatm', () => {
        atom._het = true;
        expect(selectors.hetatm().includesAtom(atom)).to.equal(true);
        atom._het = false;
        expect(selectors.hetatm().includesAtom(atom)).to.equal(false);
      });
      it('PolarH', () => {
        atom.flags = Flags.HYDROGEN;
        expect(selectors.polarh().includesAtom(atom)).to.equal(true);
        atom.flags = Flags.NONPOLARH;
        expect(selectors.polarh().includesAtom(atom)).to.equal(false);
      });
      it('NonPolarH', () => {
        atom.flags = Flags.NONPOLARH;
        expect(selectors.nonpolarh().includesAtom(atom)).to.equal(true);
        atom.flags = Flags.HYDROGEN;
        expect(selectors.nonpolarh().includesAtom(atom)).to.equal(false);
      });
      it('All', () => {
        expect(selectors.all().includesAtom(atom)).to.equal(true);
      });
      it('None', () => {
        expect(selectors.none().includesAtom(atom)).to.equal(false);
      });
    });
    describe('flag selectors', () => {
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
      it('Protein', () => {
        atom._residue._type.flags = Flags.PROTEIN;
        expect(selectors.protein().includesAtom(atom)).to.equal(true);
        atom._residue._type.flags = 0x0000;
        expect(selectors.protein().includesAtom(atom)).to.equal(false);
      });
      it('Basic', () => {
        atom._residue._type.flags = Flags.BASIC;
        expect(selectors.basic().includesAtom(atom)).to.equal(true);
        atom._residue._type.flags = 0x0000;
        expect(selectors.basic().includesAtom(atom)).to.equal(false);
      });
      it('Acidic', () => {
        atom._residue._type.flags = Flags.ACIDIC;
        expect(selectors.acidic().includesAtom(atom)).to.equal(true);
        atom._residue._type.flags = 0x0000;
        expect(selectors.acidic().includesAtom(atom)).to.equal(false);
      });
      it('Charged', () => {
        atom._residue._type.flags = Flags.ACIDIC;
        expect(selectors.charged().includesAtom(atom)).to.equal(true);
        atom._residue._type.flags = Flags.BASIC;
        expect(selectors.charged().includesAtom(atom)).to.equal(true);
        atom._residue._type.flags = 0x0000;
        expect(selectors.charged().includesAtom(atom)).to.equal(false);
      });
      it('Polar', () => {
        atom._residue._type.flags = Flags.POLAR;
        expect(selectors.polar().includesAtom(atom)).to.equal(true);
        atom._residue._type.flags = 0x0000;
        expect(selectors.polar().includesAtom(atom)).to.equal(false);
      });
      it('NonPolar', () => {
        atom._residue._type.flags = Flags.NONPOLAR;
        expect(selectors.nonpolar().includesAtom(atom)).to.equal(true);
        atom._residue._type.flags = 0x0000;
        expect(selectors.nonpolar().includesAtom(atom)).to.equal(false);
      });
      it('Aromatic', () => {
        atom._residue._type.flags = Flags.AROMATIC;
        expect(selectors.aromatic().includesAtom(atom)).to.equal(true);
        atom._residue._type.flags = 0x0000;
        expect(selectors.aromatic().includesAtom(atom)).to.equal(false);
      });
      it('Nucleic', () => {
        atom._residue._type.flags = Flags.NUCLEIC;
        expect(selectors.nucleic().includesAtom(atom)).to.equal(true);
        atom._residue._type.flags = 0x0000;
        expect(selectors.nucleic().includesAtom(atom)).to.equal(false);
      });
      it('Purine', () => {
        atom._residue._type.flags = Flags.PURINE;
        expect(selectors.purine().includesAtom(atom)).to.equal(true);
        atom._residue._type.flags = 0x0000;
        expect(selectors.purine().includesAtom(atom)).to.equal(false);
      });
      it('Pyrimidine', () => {
        atom._residue._type.flags = Flags.PYRIMIDINE;
        expect(selectors.pyrimidine().includesAtom(atom)).to.equal(true);
        atom._residue._type.flags = 0x0000;
        expect(selectors.pyrimidine().includesAtom(atom)).to.equal(false);
      });
      it('Water', () => {
        atom._residue._type.flags = Flags.WATER;
        expect(selectors.water().includesAtom(atom)).to.equal(true);
        atom._residue._type.flags = 0x0000;
        expect(selectors.water().includesAtom(atom)).to.equal(false);
      });
    });
    describe('operators', () => {
      it('Not', () => {
        expect(selectors.not(selectors.none()).includesAtom(atom)).to.equal(true);
        expect(selectors.not(selectors.all()).includesAtom(atom)).to.equal(false);
      });
      it('And', () => {
        expect(selectors.and(selectors.all(), selectors.not(selectors.none())).includesAtom(atom)).to.equal(true);
        expect(selectors.and(selectors.all(), selectors.none()).includesAtom(atom)).to.equal(false);
        expect(selectors.and(selectors.none(), selectors.all()).includesAtom(atom)).to.equal(false);
        expect(selectors.and(selectors.not(selectors.all()), selectors.none()).includesAtom(atom)).to.equal(false);
      });
      it('Or', () => {
        expect(selectors.and(selectors.all(), selectors.not(selectors.none())).includesAtom(atom)).to.equal(true);
        expect(selectors.or(selectors.all(), selectors.none()).includesAtom(atom)).to.equal(true);
        expect(selectors.or(selectors.none(), selectors.all()).includesAtom(atom)).to.equal(true);
        expect(selectors.and(selectors.not(selectors.all()), selectors.none()).includesAtom(atom)).to.equal(false);
      });
    });
  });
});
