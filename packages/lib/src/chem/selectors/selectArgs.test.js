import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import { Range, RangeList, ValueList } from './selectArgs';

chai.use(dirtyChai);

const rFrom2To8 = new Range(2, 8);
const rFrom1To14 = new Range(1, 14);
const rFrom18To20 = new Range(18, 20);
const rEqual2 = new Range(2);

const rList = new RangeList([rFrom2To8, rFrom1To14, rFrom18To20]);
const rListAsString = '2:8,1:14,18:20';
const rListAsJSON = [[2, 8], [1, 14], [18, 20]];

const VaLuE = 'VaLu E';
const vALue = 'vALu e';
const anotherValue = 'anotherValue';
const values = [45, VaLuE];

describe('Range', () => {
  describe('#toString()', () => {
    it('constructs string for two arguments range', () => {
      expect(rFrom2To8.toString()).to.equal('2:8');
    });
    it('constructs string for one argument range', () => {
      expect(rEqual2.toString()).to.equal('2');
    });
  });
  describe('#toJSON()', () => {
    it('constructs JSON for two arguments range', () => {
      expect(rFrom2To8.toJSON()).to.deep.equal([2, 8]);
    });
    it('constructs JSON for one argument range', () => {
      expect(rEqual2.toJSON()).to.deep.equal([2, 2]);
    });
  });
  describe('#includes(value)', () => {
    it('does not include value wich is smaller than bottom border', () => {
      expect(rFrom2To8.includes(0)).to.equal(false);
    });
    it('includes value wich is equal to bottom border', () => {
      expect(rFrom2To8.includes(2)).to.equal(true);
    });
    it('includes value wich lies between bottom and top borders', () => {
      expect(rFrom2To8.includes(4)).to.equal(true);
    });
    it('includes value wich is equal to top border', () => {
      expect(rFrom2To8.includes(7)).to.equal(true);
    });
    it('does not include value wich is igger than top border', () => {
      expect(rFrom2To8.includes(11)).to.equal(false);
    });
    it('does not include value wich is smaller than single existed', () => {
      expect(rEqual2.includes(-1)).to.equal(false);
    });
    it('includes value wich is equal to single existed', () => {
      expect(rEqual2.includes(2)).to.equal(true);
    });
    it('does not include value wich is bigger than single existed', () => {
      expect(rEqual2.includes(7)).to.equal(false);
    });
  });
});

describe('RangeList', () => {
  describe('#toString()', () => {
    it('constructs string', () => {
      expect(rList.toString()).to.equal(rListAsString);
    });
  });
  describe('#toJSON()', () => {
    it('constructs JSON', () => {
      expect(rList.toJSON()).to.deep.equal(rListAsJSON);
    });
  });
  describe('#includes(value)', () => {
    it('includes value which exists in one of ranges', () => {
      expect(rList.includes(13)).to.equal(true);
    });
    it('includes value which exists in more than one range', () => {
      expect(rList.includes(5)).to.equal(true);
    });
    it('does not include value which is between different ranges', () => {
      expect(rList.includes(17)).to.equal(false);
    });
    it('does not include value which is outside all ranges', () => {
      expect(rList.includes(22)).to.equal(false);
    });
  });
  describe('#append(value)', () => {
    let rangeList;
    beforeEach(() => {
      rangeList = new RangeList();
    });

    it('begins containing values from appending range', () => {
      expect(rangeList.includes(19)).to.equal(false);
      rangeList.append(rFrom18To20);
      expect(rangeList.includes(19)).to.equal(true);
    });
    it('does not begin containing values outside of appending range', () => {
      expect(rangeList.includes(1)).to.equal(false);
      rangeList.append(rFrom18To20);
      expect(rangeList.includes(1)).to.equal(false);
    });
    it('keeps containing values from previous ranges', () => {
      rangeList.append(rFrom18To20);
      expect(rangeList.includes(19)).to.equal(true);
      rangeList.append(rFrom2To8);
      expect(rangeList.includes(19)).to.equal(true);
    });
  });
  describe('#remove(value)', () => {
    let rangeList;
    beforeEach(() => {
      rangeList = new RangeList([rFrom2To8, rFrom1To14, rFrom18To20]);
    });
    it('stops containing values from removing range', () => {
      expect(rangeList.includes(19)).to.equal(true);
      rangeList.remove(rFrom18To20);
      expect(rangeList.includes(19)).to.equal(false);
    });
    it('keeps containing values from remaining ranges', () => {
      expect(rangeList.includes(13)).to.equal(true);
      rangeList.remove(rFrom18To20);
      expect(rangeList.includes(13)).to.equal(true);
    });
    it('keeps containing values from remaining ranges even if they also exists in removing range', () => {
      expect(rangeList.includes(5)).to.equal(true);
      rangeList.remove(rFrom1To14);
      expect(rangeList.includes(5)).to.equal(true);
    });
    it('keeps containing values from all ranges when removed range was not existing in list', () => {
      expect(rangeList.includes(2)).to.equal(true);
      rangeList.remove(rEqual2);
      expect(rangeList.includes(2)).to.equal(true);
    });
  });
});

describe('ValueList', () => {
  const vList = new ValueList(values);
  const vListOnlyUpper = new ValueList(values, true);

  describe('#toString()', () => {
    it('constructs string for case sensitive list', () => {
      expect(vList.toString()).to.equal('45,"VaLu E"');
    });
    it('constructs string for only upper case list', () => {
      expect(vListOnlyUpper.toString()).to.equal('45,"VALU E"');
    });
  });
  describe('#toJSON()', () => {
    it('constructs JSON for case sensitive list', () => {
      expect(vList.toJSON()).to.deep.equal(values);
    });
    it('constructs JSON for only upper case list', () => {
      expect(vListOnlyUpper.toJSON()).to.deep.equal([45, 'VALU E']);
    });
  });
  describe('#includes(value)', () => {
    it('includes value which exists in it (case sensitive list)', () => {
      expect(vList.includes(VaLuE)).to.equal(true);
    });
    it('does not include value which exists in it in different case (case sensitive list)', () => {
      expect(vList.includes(vALue)).to.equal(false);
    });
    it('does nit include value which does not exist in it (case sensitive list)', () => {
      expect(vList.includes(anotherValue)).to.equal(false);
    });
    it('includes value which exists in it (only upper case list)', () => {
      expect(vListOnlyUpper.includes(VaLuE.toUpperCase())).to.equal(true);
    });
    it('does not include value which exists in it in not upper case (only upper case list)', () => {
      expect(vListOnlyUpper.includes(vALue)).to.equal(false);
    });
    it('does not include value which does not exist in it (only upper case list)', () => {
      expect(vListOnlyUpper.includes(anotherValue)).to.equal(false);
    });
  });
  describe('#append(value)', () => {
    let valueList;
    let valueListOnlyUpper;
    beforeEach(() => {
      valueList = new ValueList();
      valueListOnlyUpper = new ValueList(undefined, true);
    });
    it('begins containing appending value (case sensitive list)', () => {
      expect(valueList.includes(VaLuE)).to.equal(false);
      valueList.append(VaLuE);
      expect(valueList.includes(VaLuE)).to.equal(true);
    });
    it('does not begin containing appending value in different case (case sensitive list)', () => {
      expect(valueList.includes(vALue)).to.equal(false);
      valueList.append(VaLuE);
      expect(valueList.includes(vALue)).to.equal(false);
    });
    it('keeps containing values from previous ranges (case sensitive list)', () => {
      valueList.append(VaLuE);
      expect(valueList.includes(VaLuE)).to.equal(true);
      valueList.append(45);
      expect(valueList.includes(VaLuE)).to.equal(true);
    });
    it('begins containing upper case version of appending value (only upper case list)', () => {
      expect(valueListOnlyUpper.includes(VaLuE.toUpperCase())).to.equal(false);
      valueListOnlyUpper.append(VaLuE);
      expect(valueListOnlyUpper.includes(VaLuE.toUpperCase())).to.equal(true);
    });
    it('begins containing appending value even if it is not string (only upper case list)', () => {
      expect(valueListOnlyUpper.includes(45)).to.equal(false);
      valueListOnlyUpper.append(45);
      expect(valueListOnlyUpper.includes(45)).to.equal(true);
    });
    it('does not begin containing not upper case version of appending value (only upper case list)', () => {
      expect(valueListOnlyUpper.includes(VaLuE)).to.equal(false);
      valueListOnlyUpper.append(VaLuE);
      expect(valueListOnlyUpper.includes(VaLuE)).to.equal(false);
    });
    it('keeps containing values from previous ranges (only upper case list)', () => {
      valueListOnlyUpper.append(VaLuE);
      expect(valueListOnlyUpper.includes(VaLuE.toUpperCase())).to.equal(true);
      valueListOnlyUpper.append(45);
      expect(valueListOnlyUpper.includes(VaLuE.toUpperCase())).to.equal(true);
    });
  });
  describe('#remove(value)', () => {
    let valueList;
    let valueListOnlyUpper;
    beforeEach(() => {
      valueList = new ValueList([VaLuE, 45, 45]);
      valueListOnlyUpper = new ValueList([VaLuE, 45, 45, 78], true);
    });
    it('stops containing removing value (case sensitive list)', () => {
      expect(valueList.includes(VaLuE)).to.equal(true);
      valueList.remove(VaLuE);
      expect(valueList.includes(VaLuE)).to.equal(false);
    });
    it('keeps containing remaining values (case sensitive list)', () => {
      expect(valueList.includes(45)).to.equal(true);
      valueList.remove(VaLuE);
      expect(valueList.includes(45)).to.equal(true);
    });
    it('keeps containing one of two equal values after deleting another (case sensitive list)', () => {
      expect(valueList.includes(45)).to.equal(true);
      valueList.remove(45);
      expect(valueList.includes(45)).to.equal(true);
      valueList.remove(45);
      expect(valueList.includes(45)).to.equal(false);
    });
    it('keeps containing all values when removed value was not existing in it (case sensitive list)', () => {
      expect(valueList.includes(VaLuE)).to.equal(true);
      valueList.remove(anotherValue);
      expect(valueList.includes(VaLuE)).to.equal(true);
    });
    it('keeps containing all values when removed value was not existing in list in such case (case sensitive list)', () => {
      expect(valueList.includes(VaLuE)).to.equal(true);
      valueList.remove(vALue);
      expect(valueList.includes(VaLuE)).to.equal(true);
    });
    it('stops containing removing value (only upper case list)', () => {
      expect(valueListOnlyUpper.includes(VaLuE.toUpperCase())).to.equal(true);
      valueListOnlyUpper.remove(VaLuE.toUpperCase());
      expect(valueListOnlyUpper.includes(VaLuE.toUpperCase())).to.equal(false);
    });
    it('stops containing removing value even if it is not string (only upper case list)', () => {
      expect(valueListOnlyUpper.includes(78)).to.equal(true);
      valueListOnlyUpper.remove(78);
      expect(valueListOnlyUpper.includes(78)).to.equal(false);
    });
    it('stops containing removing value even if it was sent not in upper case (only upper case list)', () => {
      expect(valueListOnlyUpper.includes(VaLuE.toUpperCase())).to.equal(true);
      valueListOnlyUpper.remove(vALue);
      expect(valueListOnlyUpper.includes(VaLuE.toUpperCase())).to.equal(false);
    });
    it('keeps containing remaining values', () => {
      expect(valueListOnlyUpper.includes(45)).to.equal(true);
      valueListOnlyUpper.remove(VaLuE);
      expect(valueListOnlyUpper.includes(45)).to.equal(true);
    });
    it('keeps containing one of two equal values after deleting another (only upper case list)', () => {
      expect(valueListOnlyUpper.includes(45)).to.equal(true);
      valueListOnlyUpper.remove(45);
      expect(valueListOnlyUpper.includes(45)).to.equal(true);
      valueListOnlyUpper.remove(45);
      expect(valueListOnlyUpper.includes(45)).to.equal(false);
    });
    it('keeps containing all values when removed value was not existing in it (only upper case list)', () => {
      expect(valueListOnlyUpper.includes(VaLuE.toUpperCase())).to.equal(true);
      valueListOnlyUpper.remove(anotherValue);
      expect(valueListOnlyUpper.includes(VaLuE.toUpperCase())).to.equal(true);
    });
  });
});
