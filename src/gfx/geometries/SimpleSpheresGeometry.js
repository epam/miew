

import _ from 'lodash';
import * as THREE from 'three';
import utils from '../../utils';
import ChunkedObjectsGeometry from './ChunkedObjectsGeometry';
import SphereCollisionGeo from './SphereCollisionGeo';

const VEC_SIZE = 3;

function SimpleSpheresGeometry(spheresCount, sphereComplexity) {
  const sphGeometry = new THREE.SphereBufferGeometry(
    1, sphereComplexity * 2, sphereComplexity,
    0, Math.PI * 2, 0, Math.PI
  );
  ChunkedObjectsGeometry.call(this, sphGeometry, spheresCount);
  SphereCollisionGeo.call(this, spheresCount);


  const normals = this._normals;
  const geoNormals = sphGeometry.attributes.normal.array;
  const chunkSize = this._chunkSize;
  this._chunkPos = this._chunkGeo.attributes.position.array;
  this._tmpPositions = utils.allocateTyped(Float32Array, chunkSize * VEC_SIZE);
  for (let i = 0; i < spheresCount; ++i) {
    normals.set(geoNormals, chunkSize * VEC_SIZE * i);
  }
}

SimpleSpheresGeometry.prototype = Object.create(ChunkedObjectsGeometry.prototype);
_.mixin(SimpleSpheresGeometry.prototype, SphereCollisionGeo.prototype);
SimpleSpheresGeometry.prototype.constructor = SimpleSpheresGeometry;

SimpleSpheresGeometry.prototype.setItem = function(itemIdx, itemPos, itemRad) {
  const tmpPos = this._tmpPositions;
  const chunkSize = this._chunkSize;
  const geoPos = this._chunkPos;

  for (let i = 0; i < chunkSize; ++i) {
    const idx = i * 3;
    tmpPos[idx] = itemPos.x + geoPos[idx] * itemRad;
    tmpPos[idx + 1] = itemPos.y + geoPos[idx + 1] * itemRad;
    tmpPos[idx + 2] = itemPos.z + geoPos[idx + 2] * itemRad;
  }

  this._positions.set(tmpPos, chunkSize * itemIdx * VEC_SIZE);
  this.setSphere(itemIdx, itemPos, itemRad);
};

export default SimpleSpheresGeometry;

