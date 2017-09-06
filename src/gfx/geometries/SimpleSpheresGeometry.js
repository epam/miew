

import _ from 'lodash';
import * as THREE from 'three';
import utils from '../../utils';
import ChunkedObjectsGeometry from './ChunkedObjectsGeometry';
import SphereCollisionGeo from './SphereCollisionGeo';

var VEC_SIZE = 3;

function SimpleSpheresGeometry(spheresCount, sphereComplexity) {
  var sphGeometry = new THREE.SphereBufferGeometry(
    1, sphereComplexity * 2, sphereComplexity,
    0, Math.PI * 2, 0, Math.PI
  );
  ChunkedObjectsGeometry.call(this, sphGeometry, spheresCount);
  SphereCollisionGeo.call(this, spheresCount);


  var normals = this._normals;
  var geoNormals = sphGeometry.attributes.normal.array;
  var chunkSize = this._chunkSize;
  this._chunkPos = this._chunkGeo.attributes.position.array;
  this._tmpPositions = utils.allocateTyped(Float32Array, chunkSize * VEC_SIZE);
  for (var i = 0; i < spheresCount; ++i) {
    normals.set(geoNormals, chunkSize * VEC_SIZE * i);
  }
}

SimpleSpheresGeometry.prototype = Object.create(ChunkedObjectsGeometry.prototype);
_.mixin(SimpleSpheresGeometry.prototype, SphereCollisionGeo.prototype);
SimpleSpheresGeometry.prototype.constructor = SimpleSpheresGeometry;

SimpleSpheresGeometry.prototype.setItem = function(itemIdx, itemPos, itemRad) {
  var tmpPos = this._tmpPositions;
  var chunkSize = this._chunkSize;
  var geoPos = this._chunkPos;

  for (var i = 0; i < chunkSize; ++i) {
    var idx = i * 3;
    tmpPos[idx] = itemPos.x + geoPos[idx] * itemRad;
    tmpPos[idx + 1] = itemPos.y + geoPos[idx + 1] * itemRad;
    tmpPos[idx + 2] = itemPos.z + geoPos[idx + 2] * itemRad;
  }

  this._positions.set(tmpPos, chunkSize * itemIdx * VEC_SIZE);
  this.setSphere(itemIdx, itemPos, itemRad);
};

export default SimpleSpheresGeometry;

