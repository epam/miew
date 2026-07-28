import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import * as THREE from 'three';
import Complex from './Complex';
import Element from './Element';

chai.use(dirtyChai);

// Carbon's bonding radius is 0.68, and the default bonding tolerance is 0.45, so two carbon
// atoms placed 1.5 angstrom apart are well within the ~1.81 angstrom bonding cutoff. The offset
// is spread across all three axes (rather than along a single one) so the complex's bounding box
// isn't degenerate on any axis, which the voxel-based neighbor search relies on.
const cBondedOffset = { x: 1, y: 1, z: 0.5 }; // magnitude === 1.5

function buildComplex(atomSpecs) {
  const complex = new Complex();
  const chain = complex.addChain('A');
  const residue = chain.addResidue('ALA', 1, ' ');
  const element = Element.getByName('C');

  const atoms = atomSpecs.map((spec, i) => residue.addAtom(
    `A${i}`,
    element,
    new THREE.Vector3(spec.x, spec.y, spec.z),
    undefined,
    spec.het,
  ));

  return { complex, atoms };
}

describe('AutoBond (via Complex#finalize)', () => {
  it('bonds two regular atoms within bonding distance', () => {
    const { complex, atoms } = buildComplex([
      { x: 0, y: 0, z: 0 },
      { ...cBondedOffset },
    ]);

    complex.finalize({ needAutoBonding: true, detectAromaticLoops: false, enableEditing: false });

    expect(atoms[0].bonds).to.have.lengthOf(1);
    expect(atoms[1].bonds).to.have.lengthOf(1);
  });

  it('bonds a hetatm atom without existing bonds by default', () => {
    const { complex, atoms } = buildComplex([
      {
        x: 0, y: 0, z: 0, het: true,
      },
      { ...cBondedOffset },
    ]);

    complex.finalize({ needAutoBonding: true, detectAromaticLoops: false, enableEditing: false });

    expect(atoms[0].bonds).to.have.lengthOf(1);
    expect(atoms[1].bonds).to.have.lengthOf(1);
  });

  it('excludes a hetatm atom from auto-bonding when excludeHetatmFromAutoBonding is set', () => {
    const { complex, atoms } = buildComplex([
      {
        x: 0, y: 0, z: 0, het: true,
      },
      { ...cBondedOffset },
    ]);

    complex.finalize({
      needAutoBonding: true,
      excludeHetatmFromAutoBonding: true,
      detectAromaticLoops: false,
      enableEditing: false,
    });

    expect(atoms[0].bonds).to.have.lengthOf(0);
    expect(atoms[1].bonds).to.have.lengthOf(0);
  });

  it('still bonds two regular (non-hetatm) atoms when excludeHetatmFromAutoBonding is set', () => {
    const { complex, atoms } = buildComplex([
      { x: 0, y: 0, z: 0 },
      { ...cBondedOffset },
    ]);

    complex.finalize({
      needAutoBonding: true,
      excludeHetatmFromAutoBonding: true,
      detectAromaticLoops: false,
      enableEditing: false,
    });

    expect(atoms[0].bonds).to.have.lengthOf(1);
    expect(atoms[1].bonds).to.have.lengthOf(1);
  });

  it('keeps a hetatm atom eligible for its pre-existing bonds even when excluded', () => {
    const { complex, atoms } = buildComplex([
      {
        x: 0, y: 0, z: 0, het: true,
      },
      { ...cBondedOffset, het: true },
    ]);
    complex.addBond(atoms[0], atoms[1]);

    complex.finalize({
      needAutoBonding: true,
      excludeHetatmFromAutoBonding: true,
      detectAromaticLoops: false,
      enableEditing: false,
    });

    expect(atoms[0].bonds).to.have.lengthOf(1);
    expect(atoms[1].bonds).to.have.lengthOf(1);
  });
});
