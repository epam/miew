

import VolumeSurfaceGeometry from './VolumeSurfaceGeometry';
import ContactSurface from './ContactSurface';
import chem from '../../chem';

var Volume = chem.Volume;

/**
 * This class implements 'contact' isosurface geometry generation algorithm.
 * @param spheresCount - number of atoms/spheres
 * @param opts - geometry specific options
 * @constructor
 */
function ContactSurfaceGeometry(spheresCount, opts) {
  VolumeSurfaceGeometry.call(this, spheresCount, opts);
}

ContactSurfaceGeometry.prototype = Object.create(VolumeSurfaceGeometry.prototype);
ContactSurfaceGeometry.prototype.constructor = ContactSurfaceGeometry;

ContactSurfaceGeometry.prototype._computeSurface = function(packedArrays, box, boundaries, params) {
  var contactSurface = new ContactSurface(packedArrays, boundaries, params);
  contactSurface.build();

  var surface = {
    volMap: new Volume(Float32Array, this.numVoxels, box, 1, contactSurface.volMap),
    volTexMap: new Volume(Float32Array, this.numVoxels, box, 3, contactSurface.volTexMap),
    atomMap: contactSurface.atomMap,
    atomWeightMap: new Volume(Float32Array, this.numVoxels, box, 1, contactSurface.weightsMap),
  };
  return surface;
};


export default ContactSurfaceGeometry;

