import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import Atom from './Atom';

chai.use(dirtyChai);

describe('Atom', () => {
  // Chain stub
  const chain = {
    _name: 'B',
    getName() { return this._name; },
  };

  // Residue stub
  const residue = {
    _type: { _name: 'ALA', flags: 0x0000 },
    _sequence: 4,
    _icode: 'A',
    _index: 2,
    _chain: chain,
  };
  // Element stub
  const typeH = { number: 1, name: 'H', hydrogenValency: [1] };
  const typeC = { number: 6, name: 'C', hydrogenValency: [4] };

  const name = 'CA';

  describe('constructor', () => {
    it('throws an error when required parameter is missed', () => {
      expect(() => new Atom()).to.throw();
      expect(() => new Atom(residue)).to.throw();
      expect(() => new Atom(residue, name)).to.throw();
    });

    it('creates default atom with defined name, residue and type', () => {
      const a = new Atom(null, '', {});
      expect(a.name._name).to.deep.equal('Unknown');
      expect(a.residue).to.deep.equal(null);
      expect(a.element).to.deep.equal({});
      expect(a.index).to.equal(-1);
      expect(a.bonds).to.be.empty();
    });

    it('creates atom with special flags by type', () => {
      const aC = new Atom(null, name, typeC);
      expect(aC.flags).to.equal(Atom.Flags.CARBON);
      const aH = new Atom(null, name, typeH);
      expect(aH.flags).to.equal(Atom.Flags.HYDROGEN);
      const a = new Atom(null, name, {});
      expect(a.flags).to.equal(0x0000);
    });
  });

  describe('#isHet', () => {
    it('checks the atom on being hetero', () => {
      const a = new Atom(null, '', {});
      const hetero = true;
      a.het = hetero;
      expect(a.isHet()).to.equal(hetero);
    });
  });

  describe('#isHydrogen', () => {
    it('checks the atom on being hydrogen', () => {
      const a = new Atom(null, '', typeH);
      expect(a.isHydrogen()).to.be.true();
      a.element = typeC;
      expect(a.isHydrogen()).to.be.false();
    });
  });

  describe('#getVisualName()', () => {
    it('returns name', () => {
      const a = new Atom(residue, name, typeC);
      expect(a.getVisualName()).to.equal(name);
    });
    it('returns unknown name when it is empty', () => {
      const a = new Atom(residue, '', {});
      expect(a.getVisualName()).to.equal('Unknown');
    });
  });

  describe('#getFullName()', () => {
    it('builds name taking into account residue and chain', () => {
      const a = new Atom(null, '', {});
      expect(a.getFullName()).to.equal('Unknown');
      a.residue = { _sequence: 'ResSeq', _chain: null };
      expect(a.getFullName()).to.equal('ResSeq.Unknown');
      a.residue._chain = { _name: 'Chain', getName() { return 'Chain'; } };
      expect(a.getFullName()).to.equal('Chain.ResSeq.Unknown');
    });
  });
});
