

/* This is a stub class keep it until SAS/SES is refactored */

import AtomsSphereGroup from './AtomsSphereGroup';

function AtomsSASSESGroupStub(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
  AtomsSphereGroup.call(this, geoParams, selection, colorer, mode, transforms, polyComplexity, material);
}

AtomsSASSESGroupStub.prototype = Object.create(AtomsSphereGroup.prototype);
AtomsSASSESGroupStub.prototype.constructor = AtomsSASSESGroupStub;

AtomsSASSESGroupStub.prototype._makeGeoArgs = function(selection, mode, colorer, _polyComplexity) {
  var selectedAtoms = [];
  var atoms = selection.atoms;
  var chunks = selection.chunks;
  var i = 0, n = chunks.length;
  for (; i < n; ++i) {
    selectedAtoms[i] = atoms[chunks[i]];
  }
  var opts = mode.getSurfaceOpts();
  opts.atoms = selectedAtoms;
  opts.selection = selection;
  opts.colorMode = colorer;
  return [n, opts];
};

export default AtomsSASSESGroupStub;

