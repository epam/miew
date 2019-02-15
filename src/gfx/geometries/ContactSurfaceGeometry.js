import VolumeSurfaceGeometry from './VolumeSurfaceGeometry';
import ContactSurface from './ContactSurface';
import chem from '../../chem';

const { Volume } = chem;

/**
 * This class implements 'contact' isosurface geometry generation algorithm.
 * @param spheresCount - number of atoms/spheres
 * @param opts - geometry specific options
 * @constructor
 */

class ContactSurfaceGeometry extends VolumeSurfaceGeometry {
  _computeSurface(packedArrays, box, boundaries, params) {
    const contactSurface = new ContactSurface(packedArrays, boundaries, params);
    contactSurface.build();

    const surface = {
      volMap: new Volume(Float32Array, this.numVoxels, box, 1, contactSurface.volMap),
      volTexMap: new Volume(Float32Array, this.numVoxels, box, 3, contactSurface.volTexMap),
      atomMap: contactSurface.atomMap,
      atomWeightMap: new Volume(Float32Array, this.numVoxels, box, 1, contactSurface.weightsMap),
    };
    return surface;
  }
}

export default ContactSurfaceGeometry;
