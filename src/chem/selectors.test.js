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
        expect(emptyRL).to.deep.equal({ _values: [] });
      });
      it('from one range', () => {
        expect(oneRangeRL).to.deep.equal({ _values: [range0] });
      });
      it('from array of ranges', () => {
        expect(threeRangesRL).to.deep.equal({ _values: [range0, range1, range2] });
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
        expect(twoRangesRL.toString()).to.equal([range0.toString(), range2.toString()].join(','));
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

  describe('class ValueList', () => {
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

  describe('class Selector', () => {
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

  describe('class RangeListSelector', () => {
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

  describe('class ValueListSelector', () => {
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

  describe('includesAtom function', () => {
    class AtomName {
      constructor(name, node) {
        this._name = name || null;
      }
      
      getString() {
        return this._name || 'unknown';
      }
    }
    const residue = { _type: { _name: 'ALA', flags: 0x0000 },  _chain: { _name: 'A' }, _icode: 'A', _index: 2, _sequence: 4 }
    const atom = { _het: false, _location: 32, _name: new AtomName('CA'), _residue: residue, _serial: 5, element: { name: 'N'}};
    
    describe('base selectors', () => {
      const Flags = {
        HYDROGEN: 0x0008,
        NONPOLARH: 0x1008,
      };
      
      it('Serial', () => {
        atom._serial = 5
        expect(selectors.serial(new selectors.Range(6, 18)).includesAtom(atom)).to.equal(false);
        expect(selectors.serial([new selectors.Range(2, 8), new selectors.Range(6, 18)]).includesAtom(atom)).to.equal(true);
      });
      it('Name', () => {
        atom._name._name = 'CA';
        expect(selectors.name('N').includesAtom(atom)).to.equal(false);
        expect(selectors.name(['N', 'CA']).includesAtom(atom)).to.equal(true);
      });
      it('AltLoc', () => {
        atom._location = 32
        expect(selectors.altloc('A').includesAtom(atom)).to.equal(false);
        expect(selectors.altloc(['A', ' ']).includesAtom(atom)).to.equal(true);
      });
      it('Elem', () => {
        atom.element.name = 'N'
        expect(selectors.elem('C').includesAtom(atom)).to.equal(false);
        expect(selectors.elem(['N', 'C']).includesAtom(atom)).to.equal(true);
      });
      it('Residue', () => {
        atom._residue._type._name = 'ALA'
        expect(selectors.residue('CYS').includesAtom(atom)).to.equal(false);
        expect(selectors.residue(['THR','ALA', 'CYS']).includesAtom(atom)).to.equal(true);
      });
      it('Sequence', () => {
        atom._residue._sequence = 4
        expect(selectors.sequence(new selectors.Range(6, 18)).includesAtom(atom)).to.equal(false);
        expect(selectors.sequence([new selectors.Range(2, 8), new selectors.Range(6, 18)]).includesAtom(atom)).to.equal(true);
      });
      it('ICode', () => {
        atom._residue._icode = 'A'
        expect(selectors.icode('a').includesAtom(atom)).to.equal(false);
        expect(selectors.icode(['A','b', 'C']).includesAtom(atom)).to.equal(true);
      });
      it('ResIdx', () => {
        atom._residue._index = 2
        expect(selectors.residx(new selectors.Range(6, 18)).includesAtom(atom)).to.equal(false);
        expect(selectors.residx([new selectors.Range(2, 8), new selectors.Range(6, 18)]).includesAtom(atom)).to.equal(true);
      });
      it('Chain', () => {
        atom._residue._chain._name = 'B'
        expect(selectors.chain('b').includesAtom(atom)).to.equal(false);
        expect(selectors.chain(['A','B', 'c']).includesAtom(atom)).to.equal(true);
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
