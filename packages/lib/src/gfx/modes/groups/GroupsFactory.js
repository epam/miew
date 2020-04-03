import MeshCreator from '../../meshes/MeshCreator';
import groups from './groups';
import processors from '../processors/processors';

function _bakeGroup(triplet, Processor, Group) {
  return function (complex, colorer, mode, polyComplexity, mask, material) {
    return new Processor(Group, triplet, complex, colorer, mode, polyComplexity, mask, material);
  };
}

class GroupsFactory {
  static AtomsSpheres(caps, settings) {
    const gfxTriplet = MeshCreator.createSpheres(caps, settings);

    return _bakeGroup(gfxTriplet, processors.Atoms, groups.AtomsSphereGroup);
  }

  static OrphanedAtomsCrosses(caps, settings, renderParams) {
    const gfxTriplet = MeshCreator.createCrosses(caps, settings, renderParams);

    return _bakeGroup(gfxTriplet, processors.OrphanAtoms, groups.AtomsSphereGroup);
  }

  static BondsCylinders(caps, settings) {
    const gfxTriplet = MeshCreator.create2CCylinders(caps, settings);

    return _bakeGroup(gfxTriplet, processors.Bonds, groups.BondsCylinderGroup);
  }

  static BondsLines(caps, settings, renderParams) {
    const gfxTriplet = MeshCreator.create2CLines(caps, settings, renderParams);

    return _bakeGroup(gfxTriplet, processors.Bonds, groups.BondsLinesGroup);
  }

  static CartoonChains(caps, settings) {
    const gfxTriplet = MeshCreator.createExtrudedChains(caps, settings);

    return _bakeGroup(gfxTriplet, processors.Subseqs, groups.ResiduesSubseqGroup);
  }

  static TraceChains(caps, settings) {
    const gfxTriplet = MeshCreator.create2CClosedCylinders(caps, settings);

    return _bakeGroup(gfxTriplet, processors.Subseqs, groups.ResiduesTraceGroup);
  }

  static NucleicSpheres(caps, settings) {
    const gfxTriplet = MeshCreator.createSpheres(caps, settings);

    return _bakeGroup(gfxTriplet, processors.Nucleic, groups.NucleicSpheresGroup);
  }

  static NucleicCylinders(caps, settings) {
    const gfxTriplet = MeshCreator.create2CCylinders(caps, settings);

    return _bakeGroup(gfxTriplet, processors.Nucleic, groups.NucleicCylindersGroup);
  }

  static ALoopsTorus(caps, settings) {
    const gfxTriplet = MeshCreator.createExtrudedChains(caps, settings);

    return _bakeGroup(gfxTriplet, processors.Aromatic, groups.AromaticTorusGroup);
  }

  static ALoopsLines(caps, settings, renderParams) {
    const gfxTriplet = MeshCreator.createChunkedLines(caps, settings, renderParams);

    return _bakeGroup(gfxTriplet, processors.Aromatic, groups.AromaticLinesGroup);
  }

  static QuickSurfGeo(caps, settings, renderParams) {
    const gfxTriplet = MeshCreator.createQuickSurface(caps, settings, renderParams);

    return _bakeGroup(gfxTriplet, processors.Atoms, groups.AtomsSurfaceGroup);
  }

  static ContactSurfaceGeo(caps, settings, renderParams) {
    const gfxTriplet = MeshCreator.createContactSurface(caps, settings, renderParams);

    return _bakeGroup(gfxTriplet, processors.Atoms, groups.AtomsSurfaceGroup);
  }

  static SASSESSurfaceGeo(caps, settings, renderParams) {
    const gfxTriplet = MeshCreator.createSASSES(caps, settings, renderParams);

    return _bakeGroup(gfxTriplet, processors.Atoms, groups.AtomsSASSESGroupStub);
  }

  static TextLabelsGeo(caps, settings) {
    const gfxTriplet = MeshCreator.createLabels(caps, settings);

    return _bakeGroup(gfxTriplet, processors.Atoms, groups.AtomsTextGroup);
  }
}

export default GroupsFactory;
