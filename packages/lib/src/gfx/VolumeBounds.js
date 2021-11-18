import * as THREE from 'three';
import gfxutils from './gfxutils';

function _flattenArray(input) {
  const n = input.length;
  const output = new Float32Array(n * 3);
  for (let i = 0; i < n; ++i) {
    const j = 3 * i;
    const v = input[i];
    output[j] = v.x;
    output[j + 1] = v.y;
    output[j + 2] = v.z;
  }
  return output;
}

class VolumeBounds {
  static _projectionTable = { // corresponds between (origin axes and angles between them) and between saving vector coordinates
    XY: ['x', 2],
    XZ: ['y', 1],
    YZ: ['z', 0],
  };

  constructor(bBox, volInfo) {
    const { delta } = volInfo; // {x: XY, y : XZ, z: YZ}
    const { obtuseAngle } = volInfo; // 1 - obtuse, 0 - acute

    const bSize = new THREE.Vector3();
    bBox.getSize(bSize);
    bSize.multiplyScalar(0.5);

    const offsetVert = this._getBaseVertices(delta, obtuseAngle);

    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    for (let i = 0; i < 4; i++) {
      vertices.push(offsetVert[i].clone().multiply(bSize));
      vertices.push(offsetVert[(i + 1) % 4].clone().multiply(bSize));
    }
    const translation = new THREE.Vector3(2 * bSize.x * (1 - delta.x - delta.y), 0, 0);
    for (let i = 0; i < 8; i++) {
      vertices.push(vertices[i].clone().add(translation));
    }
    for (let i = 0; i < 4; i++) {
      vertices.push(vertices[i * 2].clone());
      vertices.push(vertices[i * 2 + 8].clone());
    }
    const center = new THREE.Vector3();
    bBox.getCenter(center);
    vertices.forEach((vertex) => vertex.add(center)); // pivot shift

    const flatVertices = _flattenArray(vertices);
    geometry.setAttribute('position', new THREE.BufferAttribute(flatVertices, 3));

    this._lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xFFFFFF }));
    this._lines.layers.set(gfxutils.LAYERS.VOLUME);
  }

  // Set one edge (4 points) of frame, from which with parallel transfer  the rest of the frame points can be obtained
  _getBaseVertices(delta, obtuseAngle) {
    const projTable = VolumeBounds._projectionTable;

    const proj = ((index, inv) => { // tricky function to take account of projections: their position(related to box) and sign
      const currDelta = delta[projTable[index][0]];
      const angleValue = -0.5 * (inv - 1) + inv * obtuseAngle[projTable[index][1]];// inv = 1: alpha; inv = -1: 1 - alpha
      return angleValue * currDelta;
    });

    const offsetVert = [
      new THREE.Vector3(-1 + 2 * (proj('XZ', 1) + proj('XY', 1)), -1 + 2 * proj('YZ', 1), -1),
      new THREE.Vector3(-1 + 2 * (proj('XZ', -1) + proj('XY', 1)), -1 + 2 * proj('YZ', -1), 1),
      new THREE.Vector3(-1 + 2 * (proj('XZ', -1) + proj('XY', -1)), 1 - 2 * proj('YZ', 1), 1),
      new THREE.Vector3(-1 + 2 * (proj('XZ', 1) + proj('XY', -1)), 1 - 2 * proj('YZ', -1), -1),
    ];

    return offsetVert;
  }

  getMesh() {
    return this._lines;
  }
}

export default VolumeBounds;
