

import * as THREE from 'three';
import utils from '../../utils';

var MAX_POINTS_COUNT_16BIT = 65536;
var PTS_PER_TRIANGLE = 3;

function CylinderBufferGeometry(
  radiusTop,
  radiusBottom,
  height,
  radialSegments,
  heightSegments,
  openEnded
) {

  THREE.BufferGeometry.call(this);

  var thetaStart = 0;
  var thetaLength = 2 * Math.PI;


  this.type = 'CylinderBufferGeometry';

  this.parameters = {
    radiusTop: radiusTop,
    radiusBottom: radiusBottom,
    height: height,
    radialSegments: radialSegments,
    heightSegments: heightSegments,
    openEnded: openEnded
  };

  var hasTop = openEnded === false && radiusTop > 0;
  var hasBottom = openEnded === false && radiusBottom > 0;
  var vertexCount = (heightSegments + 1) * radialSegments +
      hasTop * (radialSegments + 1) +
      hasBottom * (radialSegments + 1);
  var facesCount = (2 * heightSegments + hasTop + hasBottom) * radialSegments;

  var heightHalf = height / 2;

  /* eslint-disable no-magic-numbers */
  var positions = new THREE.BufferAttribute(utils.allocateTyped(Float32Array, vertexCount * 3), 3);
  var normals = new THREE.BufferAttribute(utils.allocateTyped(Float32Array, vertexCount * 3), 3);
  var indices = new THREE.Uint16BufferAttribute(utils.allocateTyped(Uint16Array, facesCount * PTS_PER_TRIANGLE), 1);
  /* eslint-enable no-magic-numbers */

  var uvs = new THREE.BufferAttribute(utils.allocateTyped(Float32Array, vertexCount * 2), 2);
  console.assert(vertexCount < MAX_POINTS_COUNT_16BIT, 'DEBUG: Cylinder Geometry has too many vertices (65536 max).');

  var currVtxIdx = 0;
  var currFaceIdx = 0;
  var tanTheta = -(radiusBottom - radiusTop) / height;

  // setup cylinder data
  for (var y = 0; y <= heightSegments; y++) {
    // faces
    if (y !== heightSegments) {
      for (var i = 0; i < radialSegments; i++) {
        var v1 = currVtxIdx + i;
        var v2 = currVtxIdx + radialSegments + i;
        var v3 = currVtxIdx + radialSegments + (i + 1) % radialSegments;
        var v4 = currVtxIdx + (i + 1) % radialSegments;

        indices.setXYZ(currFaceIdx * PTS_PER_TRIANGLE, v1, v4, v2);
        currFaceIdx++;
        indices.setXYZ(currFaceIdx * PTS_PER_TRIANGLE, v2, v4, v3);
        currFaceIdx++;
      }
    }

    // vertices
    var v = y / heightSegments;
    var radius = v * (radiusBottom - radiusTop) + radiusTop;

    for (var x = 0; x < radialSegments; x++) {

      var u = x / radialSegments;

      var vx = radius * Math.sin(u * thetaLength + thetaStart);
      var vy = v * height - heightHalf;
      var vz = radius * Math.cos(u * thetaLength + thetaStart);

      var normal = new THREE.Vector3(
        vx,
        Math.sqrt(vx * vx + vz * vz) * tanTheta,
        vz
      ).normalize();

      positions.setXYZ(currVtxIdx, vx, vy, vz);
      normals.setXYZ(currVtxIdx, normal.x, normal.y, normal.z);
      uvs.setXY(currVtxIdx, u, v);
      ++currVtxIdx;
    }
  }

  // top cap
  if (hasTop) {
    var startTIdx = currVtxIdx;
    var lastIdx = currVtxIdx + radialSegments;
    for (var fTIdx = 0; fTIdx < radialSegments; ++fTIdx) {
      var currSrcIdx = currVtxIdx - radialSegments;
      positions.setXYZ(currVtxIdx, positions.getX(currSrcIdx), positions.getY(currSrcIdx), positions.getZ(currSrcIdx));
      normals.setXYZ(currVtxIdx, 0, 1, 0);
      uvs.setXY(currVtxIdx, 1, 1);


      var nextTVtx = startTIdx + (fTIdx + 1) % radialSegments;
      indices.setXYZ(currFaceIdx * PTS_PER_TRIANGLE, currVtxIdx, nextTVtx, lastIdx);
      currFaceIdx++;
      currVtxIdx++;
    }

    positions.setXYZ(currVtxIdx, 0, heightHalf, 0);
    normals.setXYZ(currVtxIdx, 0, 1, 0);
    uvs.setXY(currVtxIdx, 1, 1);
    ++currVtxIdx;
  }

  // bottom cap
  if (hasBottom) {
    var startBIdx = currVtxIdx;
    var lastBIdx = currVtxIdx + radialSegments;
    for (var fBIdx = 0; fBIdx < radialSegments; ++fBIdx) {
      var currSrcBIdx = fBIdx;
      positions.setXYZ(
        currVtxIdx,
        positions.getX(currSrcBIdx), positions.getY(currSrcBIdx), positions.getZ(currSrcBIdx)
      );
      normals.setXYZ(currVtxIdx, 0, -1, 0);
      uvs.setXY(currVtxIdx, 0, 0);


      var nextBVtx = startBIdx + (fBIdx + 1) % radialSegments;
      indices.setXYZ(currFaceIdx * PTS_PER_TRIANGLE, nextBVtx, currVtxIdx, lastBIdx);
      currFaceIdx++;
      currVtxIdx++;
    }

    positions.setXYZ(currVtxIdx, 0, -heightHalf, 0);
    normals.setXYZ(currVtxIdx, 0, -1, 0);
    uvs.setXY(currVtxIdx, 0, 0);
  }

  this.setIndex(indices);
  this.addAttribute('position', positions);
  this.addAttribute('normal', normals);
  this.addAttribute('uv', uvs);
}

CylinderBufferGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
CylinderBufferGeometry.prototype.constructor = CylinderBufferGeometry;

CylinderBufferGeometry.prototype.clone = function() {

  var parameters = this.parameters;

  return new CylinderBufferGeometry(
    parameters.radiusTop,
    parameters.radiusBottom,
    parameters.height,
    parameters.radialSegments,
    parameters.heightSegments,
    parameters.openEnded
  );
};

export default CylinderBufferGeometry;

