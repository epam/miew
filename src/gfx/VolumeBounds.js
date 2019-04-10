import * as THREE from 'three/src/Three';

class VolumeBounds {
  constructor(volumeVisual) {
    const geometry = new THREE.Geometry();

    const bBox = volumeVisual.getBoundaries().boundingBox;
    const bSize = bBox.getSize().multiplyScalar(0.5);
    const { delta } = volumeVisual.getMesh().volumeInfo; // {x: XY, y : XZ, z: YZ}
    const { obtuseAngle } = volumeVisual.getMesh().volumeInfo;

    const projTable = {
      XY: ['x', 2],
      XZ: ['y', 1],
      YZ: ['z', 0],
    };

    const proj = ((index, inv) => {
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
    for (let i = 0; i < 4; i++) {
      geometry.vertices.push(offsetVert[i].clone().multiply(bSize));
      geometry.vertices.push(offsetVert[(i + 1) % 4].clone().multiply(bSize));
    }
    const translation = new THREE.Vector3(2 * bSize.x * (1 - delta.x - delta.y), 0, 0);
    for (let i = 0; i < 8; i++) {
      geometry.vertices.push(geometry.vertices[i].clone().add(translation));
    }
    for (let i = 0; i < 4; i++) {
      geometry.vertices.push(geometry.vertices[i * 2].clone());
      geometry.vertices.push(geometry.vertices[i * 2 + 8].clone());
    }
    geometry.vertices.forEach(vertex => vertex.add(bBox.getCenter()));
    this._lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xFFFFFF }));
  }

  getMesh() {
    return this._lines;
  }
}

export default VolumeBounds;
