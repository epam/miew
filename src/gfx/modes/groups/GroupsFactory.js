

import MeshCreator from '../../meshes/MeshCreator';
import groups from './groups';
import processors from '../processors/processors';

function _bakeGroup(triplet, Processor, Group) {
  return function(complex, colorer, mode, polyComplexity, mask, material) {
    return new Processor(Group, triplet, complex, colorer, mode, polyComplexity, mask, material);
  };
}

function GroupsFactory() {
}

GroupsFactory.AtomsSpheres = function(caps, settings) {
  var gfxTriplet = MeshCreator.createSpheres(caps, settings);

  return _bakeGroup(gfxTriplet, processors.Atoms, groups.AtomsSphereGroup);
};

GroupsFactory.OrphanedAtomsCrosses = function(caps, settings, renderParams) {
  var gfxTriplet = MeshCreator.createCrosses(caps, settings, renderParams);

  return _bakeGroup(gfxTriplet, processors.OrphanAtoms, groups.AtomsSphereGroup);
};

GroupsFactory.BondsCylinders = function(caps, settings) {
  var gfxTriplet = MeshCreator.create2CCylinders(caps, settings);

  return _bakeGroup(gfxTriplet, processors.Bonds, groups.BondsCylinderGroup);
};

GroupsFactory.BondsLines = function(caps, settings, renderParams) {
  var gfxTriplet = MeshCreator.create2CLines(caps, settings, renderParams);
  return _bakeGroup(gfxTriplet, processors.Bonds, groups.BondsLinesGroup);
};

GroupsFactory.CartoonChains = function(caps, settings) {
  var gfxTriplet = MeshCreator.createExtrudedChains(caps, settings);

  return _bakeGroup(gfxTriplet, processors.Subseqs, groups.ResiduesSubseqGroup);
};

GroupsFactory.TraceChains = function(caps, settings) {
  var gfxTriplet = MeshCreator.create2CClosedCylinders(caps, settings);

  return _bakeGroup(gfxTriplet, processors.Subseqs, groups.ResiduesTraceGroup);
};

GroupsFactory.NucleicSpheres = function(caps, settings) {
  var gfxTriplet = MeshCreator.createSpheres(caps, settings);
  return _bakeGroup(gfxTriplet, processors.Nucleic, groups.NucleicSpheresGroup);
};

GroupsFactory.NucleicCylinders = function(caps, settings) {
  var gfxTriplet = MeshCreator.create2CCylinders(caps, settings);
  return _bakeGroup(gfxTriplet, processors.Nucleic, groups.NucleicCylindersGroup);
};

GroupsFactory.ALoopsTorus = function(caps, settings) {
  var gfxTriplet = MeshCreator.createExtrudedChains(caps, settings);

  return _bakeGroup(gfxTriplet, processors.Aromatic, groups.AromaticTorusGroup);
};

GroupsFactory.ALoopsLines = function(caps, settings, renderParams) {
  var gfxTriplet = MeshCreator.createChunkedLines(caps, settings, renderParams);

  return _bakeGroup(gfxTriplet, processors.Aromatic, groups.AromaticLinesGroup);
};

GroupsFactory.QuickSurfGeo = function(caps, settings, renderParams) {
  var gfxTriplet = MeshCreator.createQuickSurface(caps, settings, renderParams);

  return _bakeGroup(gfxTriplet, processors.Atoms, groups.AtomsSurfaceGroup);
};

GroupsFactory.ContactSurfaceGeo = function(caps, settings, renderParams) {
  var gfxTriplet = MeshCreator.createContactSurface(caps, settings, renderParams);

  return _bakeGroup(gfxTriplet, processors.Atoms, groups.AtomsSurfaceGroup);
};

GroupsFactory.SASSESSurfaceGeo = function(caps, settings, renderParams) {
  var gfxTriplet = MeshCreator.createSASSES(caps, settings, renderParams);

  return _bakeGroup(gfxTriplet, processors.Atoms, groups.AtomsSASSESGroupStub);
};

GroupsFactory.TextLabelsGeo = function(caps, settings) {
  var gfxTriplet = MeshCreator.createLabels(caps, settings);

  return _bakeGroup(gfxTriplet, processors.Atoms, groups.AtomsTextGroup);
};

/** @deprecated Old-fashioned atom labels, to be removed in the next major version. */
GroupsFactory.SGroupsLabels = function(_caps, _settings) {
  return _bakeGroup(null, processors.SGroups, null);
};

export default GroupsFactory;

