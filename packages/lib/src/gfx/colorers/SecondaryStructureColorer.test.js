import { expect } from 'chai';
import sinon from 'sinon';
import palettes from '../palettes';
import SecondaryStructureColorer from './SecondaryStructureColorer';
import ResidueType from '../../chem/ResidueType';

describe('SecondaryStructureColorer', () => {
  const dnaFlag = 0x0800;
  const rnaFlag = 0x1000;
  const dnaColor = 0xffff00;
  const rnaColor = 0xff00ff;
  const helixColor = 0x00ff00;
  const eColor = 0x0000ff;

  class FirstPalette {
    defaultSecondaryColor = 0xffffff;

    getSecondaryColor(type) {
      let color = 0x000000;
      if (type === 'dna') {
        color = dnaColor;
      }
      if (type === 'rna') {
        color = rnaColor;
      }
      if (type === 'H') {
        color = undefined;
      }
      if (type === 'helix') {
        color = helixColor;
      }
      if (type === 'E') {
        color = eColor;
      }
      return color;
    }
  }

  class Residue {
    constructor(secondary, flags) {
      this._secondary = secondary || null;
      if (flags) {
        this._type = { flags };
      } else {
        this._type = { flags: 0x0000 };
      }
    }

    getSecondary() {
      return this._secondary;
    }
  }
  const palette = new FirstPalette();

  describe('#getAtomColor', () => {
    let paletteStub;
    let residueTypeStub;
    let ssColorer;

    beforeEach(() => {
      paletteStub = sinon.stub(palettes, 'first').value(palette);
      residueTypeStub = sinon.stub(ResidueType, 'Flags').value({ DNA: dnaFlag, RNA: rnaFlag });
      ssColorer = new SecondaryStructureColorer();
    });
    afterEach(() => {
      paletteStub.restore();
      residueTypeStub.restore();
    });

    it('returns proper color for atom in DNA residue', () => {
      const residue = new Residue(null, dnaFlag);
      const atom = { residue };
      expect(ssColorer.getAtomColor(atom)).to.equal(dnaColor);
    });
  });

  describe('#getResidueColor', () => {
    let paletteStub;
    let residueTypeStub;
    let ssColorer;

    beforeEach(() => {
      paletteStub = sinon.stub(palettes, 'first').value(palette);
      residueTypeStub = sinon.stub(ResidueType, 'Flags').value({ DNA: dnaFlag, RNA: rnaFlag });
      ssColorer = new SecondaryStructureColorer();
    });
    afterEach(() => {
      paletteStub.restore();
      residueTypeStub.restore();
    });

    it('returns proper color for DNA residue', () => {
      const residue = new Residue(null, dnaFlag);
      expect(ssColorer.getResidueColor(residue)).to.equal(dnaColor);
    });

    it('returns proper color for RNA residue', () => {
      const residue = new Residue(null, rnaFlag);
      expect(ssColorer.getResidueColor(residue)).to.equal(rnaColor);
    });

    it('returns default color for not DNA or RNA residues whose secondary structure is not specified', () => {
      const residue = new Residue(null);
      expect(ssColorer.getResidueColor(residue)).to.equal(palette.defaultSecondaryColor);
    });

    it('returns proper color for helix using generic information than residue is not DNA or RNA', () => {
      const residue = new Residue({ type: 'H', generic: 'helix' });
      expect(ssColorer.getResidueColor(residue)).to.equal(helixColor);
    });

    it('returns proper color for strand using type information than residue is not DNA or RNA', () => {
      const residue = new Residue({ type: 'E', generic: 'strand' });
      expect(ssColorer.getResidueColor(residue)).to.equal(eColor);
    });
  });

  describe('.id', () => {
    const ssColorer = new SecondaryStructureColorer();

    it('have .id property type \'string\'', () => {
      expect(ssColorer).to.have.property('id');
      expect(ssColorer.id).to.be.a('string');
    });

    it('have .id property different from such in parent class', () => {
      const colorer = Object.getPrototypeOf(Object.getPrototypeOf(ssColorer));
      expect(ssColorer.id).to.not.equal(colorer.id);
    });
  });

  describe('.name', () => {
    it('have .name property type \'string\'', () => {
      const ssColorer = new SecondaryStructureColorer();
      expect(ssColorer).to.have.property('name');
      expect(ssColorer.name).to.be.a('string');
    });
  });

  describe('.shortName', () => {
    it('have .shortName property type \'string\'', () => {
      const ssColorer = new SecondaryStructureColorer();
      expect(ssColorer).to.have.property('shortName');
      expect(ssColorer.shortName).to.be.a('string');
    });
  });
});
