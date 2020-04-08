import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import proxyquire from 'proxyquire';
import selectors from './selectors';
import ResidueType from './ResidueType';

chai.use(dirtyChai);

describe('selectors', () => {
  const rFrom1To14 = new selectors.Range(1, 14);
  const rFrom18To20 = new selectors.Range(18, 20);

  const residue = {
    _type: { _name: 'ALA', flags: 0x0000 },
    _sequence: 4,
    _icode: 'A',
    _index: 2,
    _chain: { _name: 'B' },
  };

  const atom = {
    residue,
    name: 'CA',
    element: { name: 'N' },
    position: 1,
    role: 1,
    het: true,
    serial: 5,
    location: (' ').charCodeAt(0),
    occupancy: 1,
    temperature: 1,
    charge: 1,
  };

  describe('#ClearContext()', () => {
    beforeEach(() => {
      selectors.Context.all = selectors.all();
    });
    afterEach(() => {
      selectors.ClearContext();
    });

    it('makes context to stop containing key which was in it before', () => {
      expect(selectors.GetSelector('all')).to.deep.equal(selectors.all());
      selectors.ClearContext();
      expect(() => selectors.GetSelector('all')).to.throw();
    });
  });

  describe('#GetSelector(key)', () => {
    before(() => {
      selectors.Context.all = selectors.all();
      selectors.Context.noSelector = undefined;
      selectors.Context.none = selectors.none();
    });
    after(() => {
      selectors.ClearContext();
    });

    it('throws exception for invalid keys', () => {
      expect(() => selectors.GetSelector('strangeKey')).to.throw();
    });
    it('does not throw exception for valid keys', () => {
      expect(() => selectors.GetSelector('all')).to.not.throw();
    });
    it('returns selector which corresponds to sent key', () => {
      expect(selectors.GetSelector('all')).to.deep.equal(selectors.all());
    });
    it('returns none selector if key corresponds to undefined or empty value', () => {
      expect(selectors.GetSelector('noSelector')).to.deep.equal(selectors.none());
    });
  });

  describe('#keyword(key)', () => {
    before(() => {
      selectors.Context.all = selectors.all();
      selectors.Context.noSelector = undefined;
      selectors.Context.none = selectors.none();
    });
    after(() => {
      selectors.ClearContext();
    });

    it('returns function for creating selector which corresponds to sent key', () => {
      expect(selectors.keyword('all')).to.deep.equal(selectors.all);
    });
    it('returns function for creating None selector if key corresponds to undefined or empty value', () => {
      expect(selectors.keyword('strangeKey')).to.deep.equal(selectors.none);
    });
    it('returns function for creating selector which corresponds to sent key in different case', () => {
      expect(selectors.keyword('aLl')).to.deep.equal(selectors.all);
    });
  });

  describe('#parse(str)', () => {
    let correctSelector;
    let errorMessage;
    let modifiedSelector;

    before(() => {
      correctSelector = selectors.serial(new selectors.Range(1, 10));
      errorMessage = 'errorMessage';

      const parser = {
        parse: (str) => {
          if (str === 'correctSelString') {
            return correctSelector;
          }
          const exc = { message: errorMessage };
          throw exc;
        },
      };
      modifiedSelector = proxyquire('./selectors', { '../utils/SelectionParser': { parser } });
    });

    it('returns object with correct selector in selector field if input string is correct selection string', () => {
      expect(modifiedSelector.default.parse('correctSelString').selector).to.deep.equal(correctSelector);
    });
    it('returns object with noneSelector in selector field if input string is incorrect selection string', () => {
      expect(modifiedSelector.default.parse('incorrectSelString').selector).to.deep.equal(selectors.none());
    });
    it('returns object with correct errorMessage if input string is incorrect selection string', () => {
      expect(modifiedSelector.default.parse('incorrectSelString').error).to.deep.equal(errorMessage);
    });
  });

  describe('SerialSelector', () => {
    describe('#includesAtom(atom)', () => {
      it('includes atom which serial is inside range', () => {
        expect(selectors.serial(rFrom1To14).includesAtom(atom)).to.equal(true);
      });
      it('excludes atom which serial is outside range', () => {
        expect(selectors.serial(rFrom18To20).includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('NameSelector', () => {
    describe('#includesAtom(atom)', () => {
      it('includes atom with such name in same case', () => {
        expect(selectors.name('CA').includesAtom(atom)).to.equal(true);
      });
      it('excludes atom with different name', () => {
        expect(selectors.name('N').includesAtom(atom)).to.equal(false);
      });
      it('includes atom with such name in different case', () => {
        expect(selectors.name('cA').includesAtom(atom)).to.equal(true);
      });
    });
  });

  describe('AltLocSelector', () => {
    describe('#includesAtom(atom)', () => {
      it('includes atom with same location', () => {
        expect(selectors.altloc(' ').includesAtom(atom)).to.equal(true);
      });
      it('excludes atom with defferent location', () => {
        expect(selectors.altloc('A').includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('ElemSelector', () => {
    describe('#includesAtom(atom)', () => {
      it('includes atom with same element name in same case', () => {
        expect(selectors.elem('N').includesAtom(atom)).to.equal(true);
      });
      it('excludes atom with different element name', () => {
        expect(selectors.elem('C').includesAtom(atom)).to.equal(false);
      });
      it('includes atom with same element name in different case', () => {
        expect(selectors.elem('n').includesAtom(atom)).to.equal(true);
      });
    });
  });

  describe('ResidueSelector', () => {
    describe('#includesAtom(atom)', () => {
      it('includes atom with same residue name in same case', () => {
        expect(selectors.residue('ALA').includesAtom(atom)).to.equal(true);
      });
      it('excludes atom with different residue name', () => {
        expect(selectors.residue('CYS').includesAtom(atom)).to.equal(false);
      });
      it('includes atom with same residue name in different case', () => {
        expect(selectors.residue('AlA').includesAtom(atom)).to.equal(true);
      });
    });
  });

  describe('SequenceSelector', () => {
    describe('#includesAtom(atom)', () => {
      it('includes atom which sequence number is inside range', () => {
        expect(selectors.sequence(rFrom1To14).includesAtom(atom)).to.equal(true);
      });
      it('excludes atom which sequence number is outside range', () => {
        expect(selectors.sequence(rFrom18To20).includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('ICodeSelector', () => {
    describe('#includesAtom(atom)', () => {
      it('includes atom with same residue ICode in same case', () => {
        expect(selectors.icode('A').includesAtom(atom)).to.equal(true);
      });
      it('excludes atom with different residue ICode', () => {
        expect(selectors.icode('F').includesAtom(atom)).to.equal(false);
      });
      it('includes atom with same residue ICode in different case', () => {
        expect(selectors.icode('a').includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('ResIdxSelector', () => {
    describe('#includesAtom(atom)', () => {
      it('includes atom wich residue index is inside range', () => {
        expect(selectors.residx(rFrom1To14).includesAtom(atom)).to.equal(true);
      });
      it('excludes atom wich residue index is outside range', () => {
        expect(selectors.residx(rFrom18To20).includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('ChainSelector', () => {
    describe('#includesAtom(atom)', () => {
      it('includes atom with same chain name in same case', () => {
        expect(selectors.chain('B').includesAtom(atom)).to.equal(true);
      });
      it('includes atom with different chain name', () => {
        expect(selectors.chain('F').includesAtom(atom)).to.equal(false);
      });
      it('includes atom with same chain name in different case', () => {
        expect(selectors.chain('b').includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('HetatmSelector', () => {
    describe('#includesAtom(atom)', () => {
      it('includes hetatoms', () => {
        atom.het = true;
        expect(selectors.hetatm().includesAtom(atom)).to.equal(true);
      });
      it('excludes other', () => {
        atom.het = false;
        expect(selectors.hetatm().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('PolarHSelector', () => {
    describe('#includesAtom(atom)', () => {
      const flags = {
        HYDROGEN: 0x0008,
        NONPOLARH: 0x1008,
      };
      it('includes polar atoms', () => {
        atom.flags = flags.HYDROGEN;
        expect(selectors.polarh().includesAtom(atom)).to.equal(true);
      });
      it('excludes nonPolar atoms', () => {
        atom.flags = flags.NONPOLARH;
        expect(selectors.polarh().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('NonPolarHSelector', () => {
    describe('#includesAtom(atom)', () => {
      const flags = {
        HYDROGEN: 0x0008,
        NONPOLARH: 0x1008,
      };
      it('includes nonPolar atoms', () => {
        atom.flags = flags.NONPOLARH;
        expect(selectors.nonpolarh().includesAtom(atom)).to.equal(true);
      });
      it('excludes polar atoms', () => {
        atom.flags = flags.HYDROGEN;
        expect(selectors.nonpolarh().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('Protein', () => {
    describe('#includesAtom(atom)', () => {
      it('includes protein atom', () => {
        atom.residue._type.flags = ResidueType.Flags.PROTEIN;
        expect(selectors.protein().includesAtom(atom)).to.equal(true);
      });
      it('excludes not protein atom', () => {
        atom.residue._type.flags = 0x0000;
        expect(selectors.protein().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('Basic', () => {
    describe('#includesAtom(atom)', () => {
      it('includes basic atom', () => {
        atom.residue._type.flags = ResidueType.Flags.BASIC;
        expect(selectors.basic().includesAtom(atom)).to.equal(true);
      });
      it('excludes not basic atom', () => {
        atom.residue._type.flags = 0x0000;
        expect(selectors.basic().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('Acidic', () => {
    describe('#includesAtom(atom)', () => {
      it('includes acidic atom', () => {
        atom.residue._type.flags = ResidueType.Flags.ACIDIC;
        expect(selectors.acidic().includesAtom(atom)).to.equal(true);
      });
      it('excludes not acidic atom', () => {
        atom.residue._type.flags = 0x0000;
        expect(selectors.acidic().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('Charged', () => {
    describe('#includesAtom(atom)', () => {
      it('includes acidic atom', () => {
        atom.residue._type.flags = ResidueType.Flags.ACIDIC;
        expect(selectors.charged().includesAtom(atom)).to.equal(true);
      });
      it('check on correct including basic atom', () => {
        atom.residue._type.flags = ResidueType.Flags.BASIC;
        expect(selectors.charged().includesAtom(atom)).to.equal(true);
      });
      it('excludes not acidic or basic atom', () => {
        atom.residue._type.flags = 0x0000;
        expect(selectors.charged().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('Polar', () => {
    describe('#includesAtom(atom)', () => {
      it('includes polar atom', () => {
        atom.residue._type.flags = ResidueType.Flags.POLAR;
        expect(selectors.polar().includesAtom(atom)).to.equal(true);
      });
      it('excludes not polar atom', () => {
        atom.residue._type.flags = 0x0000;
        expect(selectors.polar().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('NonPolar', () => {
    describe('#includesAtom(atom)', () => {
      it('includes nonPolar atom', () => {
        atom.residue._type.flags = ResidueType.Flags.NONPOLAR;
        expect(selectors.nonpolar().includesAtom(atom)).to.equal(true);
      });
      it('excludes not nonPolar atom', () => {
        atom.residue._type.flags = 0x0000;
        expect(selectors.nonpolar().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('Aromatic', () => {
    describe('#includesAtom(atom)', () => {
      it('includes aromatic atom', () => {
        atom.residue._type.flags = ResidueType.Flags.AROMATIC;
        expect(selectors.aromatic().includesAtom(atom)).to.equal(true);
      });
      it('excludes not aromatic atom', () => {
        atom.residue._type.flags = 0x0000;
        expect(selectors.aromatic().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('Nucleic', () => {
    describe('#includesAtom(atom)', () => {
      it('includes nucleic atom', () => {
        atom.residue._type.flags = ResidueType.Flags.NUCLEIC;
        expect(selectors.nucleic().includesAtom(atom)).to.equal(true);
      });
      it('excludes not nucleic atom', () => {
        atom.residue._type.flags = 0x0000;
        expect(selectors.nucleic().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('Purine', () => {
    describe('#includesAtom(atom)', () => {
      it('includes purine atom', () => {
        atom.residue._type.flags = ResidueType.Flags.PURINE;
        expect(selectors.purine().includesAtom(atom)).to.equal(true);
      });
      it('excludes not purine atom', () => {
        atom.residue._type.flags = 0x0000;
        expect(selectors.purine().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('Pyrimidine', () => {
    describe('#includesAtom(atom)', () => {
      it('includes pyrimidine atom', () => {
        atom.residue._type.flags = ResidueType.Flags.PYRIMIDINE;
        expect(selectors.pyrimidine().includesAtom(atom)).to.equal(true);
      });
      it('excludes not pyrimidine atom', () => {
        atom.residue._type.flags = 0x0000;
        expect(selectors.pyrimidine().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('Water', () => {
    describe('#includesAtom(atom)', () => {
      it('includes water atom', () => {
        atom.residue._type.flags = ResidueType.Flags.WATER;
        expect(selectors.water().includesAtom(atom)).to.equal(true);
      });
      it('excludes not water atom', () => {
        atom.residue._type.flags = 0x0000;
        expect(selectors.water().includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('NotOperator', () => {
    describe('#includesAtom(atom)', () => {
      it('inverts false to true', () => {
        expect(selectors.not(selectors.none()).includesAtom(atom)).to.equal(true);
      });
      it('inverts true to false', () => {
        expect(selectors.not(selectors.all()).includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('AndOperator', () => {
    describe('#includesAtom(atom)', () => {
      it('gives true for true and true selectors results', () => {
        expect(selectors.and(selectors.all(), selectors.all()).includesAtom(atom)).to.equal(true);
      });
      it('gives false for true and false selectors results', () => {
        expect(selectors.and(selectors.all(), selectors.none()).includesAtom(atom)).to.equal(false);
      });
      it('gives false for false and true selectors results', () => {
        expect(selectors.and(selectors.none(), selectors.all()).includesAtom(atom)).to.equal(false);
      });
      it('gives false for false and false selectors results', () => {
        expect(selectors.and(selectors.none(), selectors.none()).includesAtom(atom)).to.equal(false);
      });
    });
  });

  describe('OrOperator', () => {
    describe('#includesAtom(atom)', () => {
      it('gives true for true and true selector results', () => {
        expect(selectors.or(selectors.all(), selectors.all()).includesAtom(atom)).to.equal(true);
      });
      it('gives true for true and false selector results', () => {
        expect(selectors.or(selectors.all(), selectors.none()).includesAtom(atom)).to.equal(true);
      });
      it('gives true for false and true selector results', () => {
        expect(selectors.or(selectors.none(), selectors.all()).includesAtom(atom)).to.equal(true);
      });
      it('gives false for false and false selector results', () => {
        expect(selectors.or(selectors.none(), selectors.none()).includesAtom(atom)).to.equal(false);
      });
    });
  });
});
