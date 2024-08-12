import * as THREE from 'three';
import utils from '../../utils';

const MAX_POINTS_COUNT_16BIT = 65536;
const PTS_PER_TRIANGLE = 3;

class CylinderBufferGeometry extends THREE.BufferGeometry {
  constructor(
    radiusTop,
    radiusBottom,
    height,
    radialSegments,
    heightSegments,
    openEnded,
  ) {
    super();

    const thetaStart = 0;
    const thetaLength = 2 * Math.PI;

    this.type = 'CylinderBufferGeometry';

    this.parameters = {
      radiusTop,
      radiusBottom,
      height,
      radialSegments,
      heightSegments,
      openEnded,
    };

    const hasTop = openEnded === false && radiusTop > 0;
    const hasBottom = openEnded === false && radiusBottom > 0;
    const vertexCount = (heightSegments + 1) * radialSegments
      + hasTop * (radialSegments + 1)
      + hasBottom * (radialSegments + 1);
    const facesCount = (2 * heightSegments + hasTop + hasBottom) * radialSegments;

    const heightHalf = height / 2;

    /* eslint-disable no-magic-numbers */
    const positions = new THREE.BufferAttribute(utils.allocateTyped(Float32Array, vertexCount * 3), 3);
    const normals = new THREE.BufferAttribute(utils.allocateTyped(Float32Array, vertexCount * 3), 3);
    const indices = new THREE.Uint16BufferAttribute(utils.allocateTyped(Uint16Array, facesCount * PTS_PER_TRIANGLE), 1);
    /* eslint-enable no-magic-numbers */

    const uvs = new THREE.BufferAttribute(utils.allocateTyped(Float32Array, vertexCount * 2), 2);
    console.assert(vertexCount < MAX_POINTS_COUNT_16BIT, 'DEBUG: Cylinder Geometry has too many vertices (65536 max).');

    let currVtxIdx = 0;
    let currFaceIdx = 0;
    const tanTheta = -(radiusBottom - radiusTop) / height;

    // setup cylinder data
    for (let y = 0; y <= heightSegments; y++) {
      // faces
      if (y !== heightSegments) {
        for (let i = 0; i < radialSegments; i++) {
          const v1 = currVtxIdx + i;
          const v2 = currVtxIdx + radialSegments + i;
          const v3 = currVtxIdx + radialSegments + ((i + 1) % radialSegments);
          const v4 = currVtxIdx + ((i + 1) % radialSegments);

          indices.setXYZ(currFaceIdx * PTS_PER_TRIANGLE, v1, v4, v2);
          currFaceIdx++;
          indices.setXYZ(currFaceIdx * PTS_PER_TRIANGLE, v2, v4, v3);
          currFaceIdx++;
        }
      }

      // vertices
      const v = y / heightSegments;
      const radius = v * (radiusBottom - radiusTop) + radiusTop;

      for (let x = 0; x < radialSegments; x++) {
        const u = x / radialSegments;

        const vx = radius * Math.sin(u * thetaLength + thetaStart);
        const vy = v * height - heightHalf;
        const vz = radius * Math.cos(u * thetaLength + thetaStart);

        const normal = new THREE.Vector3(
          vx,
          Math.sqrt(vx * vx + vz * vz) * tanTheta,
          vz,
        ).normalize();

        positions.setXYZ(currVtxIdx, vx, vy, vz);
        normals.setXYZ(currVtxIdx, normal.x, normal.y, normal.z);
        uvs.setXY(currVtxIdx, u, v);
        ++currVtxIdx;
      }
    }

    // top cap
    if (hasTop) {
      const startTIdx = currVtxIdx;
      const lastIdx = currVtxIdx + radialSegments;
      for (let fTIdx = 0; fTIdx < radialSegments; ++fTIdx) {
        const currSrcIdx = currVtxIdx - radialSegments;
        positions.setXYZ(
          currVtxIdx,
          positions.getX(currSrcIdx),
          positions.getY(currSrcIdx),
          positions.getZ(currSrcIdx),
        );
        normals.setXYZ(currVtxIdx, 0, 1, 0);
        uvs.setXY(currVtxIdx, 1, 1);

        const nextTVtx = startTIdx + ((fTIdx + 1) % radialSegments);
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
      const startBIdx = currVtxIdx;
      const lastBIdx = currVtxIdx + radialSegments;
      for (let fBIdx = 0; fBIdx < radialSegments; ++fBIdx) {
        const currSrcBIdx = fBIdx;
        positions.setXYZ(
          currVtxIdx,
          positions.getX(currSrcBIdx),
          positions.getY(currSrcBIdx),
          positions.getZ(currSrcBIdx),
        );
        normals.setXYZ(currVtxIdx, 0, -1, 0);
        uvs.setXY(currVtxIdx, 0, 0);

        const nextBVtx = startBIdx + ((fBIdx + 1) % radialSegments);
        indices.setXYZ(currFaceIdx * PTS_PER_TRIANGLE, nextBVtx, currVtxIdx, lastBIdx);
        currFaceIdx++;
        currVtxIdx++;
      }

      positions.setXYZ(currVtxIdx, 0, -heightHalf, 0);
      normals.setXYZ(currVtxIdx, 0, -1, 0);
      uvs.setXY(currVtxIdx, 0, 0);
    }

    this.setIndex(indices);
    this.setAttribute('position', positions);
    this.setAttribute('normal', normals);
    this.setAttribute('uv', uvs);
  }

  clone() {
    const { parameters } = this;

    return new CylinderBufferGeometry(
      parameters.radiusTop,
      parameters.radiusBottom,
      parameters.height,
      parameters.radialSegments,
      parameters.heightSegments,
      parameters.openEnded,
    );
  }
}

export default CylinderBufferGeometry;
