import * as THREE from 'three';

const DEG_TO_RAD = Math.PI / 180.0;

/**
 * Crystallographic unit cell data model.
 * Encapsulates cell lengths (a, b, c), angles (alpha, beta, gamma), and space group.
 * Computes basis vectors and bounding box wireframe vertices in Cartesian coordinates.
 */
class UnitCell {
  /**
   * @param {THREE.Vector3|number[]|object} lengths - Cell dimensions a, b, c (in Ångströms).
   * @param {THREE.Vector3|number[]|object} angles - Cell angles alpha, beta, gamma (in degrees).
   * @param {string} [spaceGroup=''] - Space group name.
   */
  constructor(lengths, angles, spaceGroup = '') {
    this.a = lengths.x ?? lengths[0] ?? lengths.a ?? 0;
    this.b = lengths.y ?? lengths[1] ?? lengths.b ?? 0;
    this.c = lengths.z ?? lengths[2] ?? lengths.c ?? 0;

    this.alpha = angles.x ?? angles[0] ?? angles.alpha ?? 90;
    this.beta = angles.y ?? angles[1] ?? angles.beta ?? 90;
    this.gamma = angles.z ?? angles[2] ?? angles.gamma ?? 90;

    this.spaceGroup = spaceGroup || '';
  }

  /**
   * Computes Cartesian basis vectors for the unit cell.
   * Uses standard crystallographic orthogonalization:
   *   - vector a along Cartesian X axis
   *   - vector b in XY plane
   *   - vector c completes right-handed system (Z > 0)
   *
   * @returns {{a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3}} Basis vectors in Cartesian space.
   */
  getBasisVectors() {
    const {
      a, b, c, alpha, beta, gamma,
    } = this;

    const alphaRad = alpha * DEG_TO_RAD;
    const betaRad = beta * DEG_TO_RAD;
    const gammaRad = gamma * DEG_TO_RAD;

    const cosAlpha = Math.cos(alphaRad);
    const cosBeta = Math.cos(betaRad);
    const cosGamma = Math.cos(gammaRad);
    const sinGamma = Math.sin(gammaRad);

    const ax = a;
    const ay = 0;
    const az = 0;

    const bx = b * cosGamma;
    const by = b * sinGamma;
    const bz = 0;

    const cx = c * cosBeta;
    const cy = sinGamma !== 0 ? (c * (cosAlpha - cosBeta * cosGamma)) / sinGamma : 0;
    const czTerm = 1.0 - cosBeta * cosBeta - (sinGamma !== 0 ? ((cosAlpha - cosBeta * cosGamma) / sinGamma) ** 2 : 0);
    const cz = c * Math.sqrt(Math.max(0.0, czTerm));

    return {
      a: new THREE.Vector3(ax, ay, az),
      b: new THREE.Vector3(bx, by, bz),
      c: new THREE.Vector3(cx, cy, cz),
    };
  }

  /**
   * Computes the 24 vertices (12 line segments) for the unit cell wireframe.
   * The first three line segments (vertices 0..5) correspond to origin axes +a, +b, and +c.
   *
   * @returns {THREE.Vector3[]} Array of 24 THREE.Vector3 line endpoints.
   */
  getLineSegments() {
    const { a: aVec, b: bVec, c: cVec } = this.getBasisVectors();

    const v0 = new THREE.Vector3(0, 0, 0);
    const vA = aVec.clone();
    const vB = bVec.clone();
    const vAB = aVec.clone().add(bVec);
    const vC = cVec.clone();
    const vAC = aVec.clone().add(cVec);
    const vBC = bVec.clone().add(cVec);
    const vABC = aVec.clone().add(bVec).add(cVec);

    return [
      // 3 Origin axes (+a, +b, +c)
      v0.clone(), vA.clone(),
      v0.clone(), vB.clone(),
      v0.clone(), vC.clone(),

      // Remaining 9 edges
      vA.clone(), vAB.clone(),
      vB.clone(), vAB.clone(),
      vA.clone(), vAC.clone(),
      vC.clone(), vAC.clone(),
      vB.clone(), vBC.clone(),
      vC.clone(), vBC.clone(),
      vAB.clone(), vABC.clone(),
      vAC.clone(), vABC.clone(),
      vBC.clone(), vABC.clone(),
    ];
  }
}

export default UnitCell;
