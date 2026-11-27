import * as THREE from 'three';

const DEG_TO_RAD = Math.PI / 180.0;

/**
 * Crystallographic unit cell data model.
 * Encapsulates cell lengths (a, b, c), angles (alpha, beta, gamma), and space group.
 * Computes basis vectors and bounding box wireframe vertices in Cartesian coordinates.
 */
class UnitCell {
  /**
   * @param {THREE.Vector3} lengths - Cell dimensions a, b, c (in Ångströms).
   * @param {THREE.Vector3} angles - Cell angles alpha, beta, gamma (in degrees).
   * @param {string} [spaceGroup=''] - Space group name.
   */
  constructor(lengths, angles, spaceGroup = '') {
    this.a = lengths.x;
    this.b = lengths.y;
    this.c = lengths.z;

    this.alpha = angles.x;
    this.beta = angles.y;
    this.gamma = angles.z;

    this.spaceGroup = spaceGroup || '';
  }

  /**
   * Validates raw parsed cell parameters and creates a UnitCell if valid.
   * Returns null if any cell length is non-finite or <= 0; defaults non-finite angles to 90°.
   *
   * @param {object} params
   * @param {number} params.a - Cell length a (in Ångströms).
   * @param {number} params.b - Cell length b (in Ångströms).
   * @param {number} params.c - Cell length c (in Ångströms).
   * @param {number} [params.alpha=90] - Cell angle alpha (in degrees).
   * @param {number} [params.beta=90] - Cell angle beta (in degrees).
   * @param {number} [params.gamma=90] - Cell angle gamma (in degrees).
   * @param {string} [params.spaceGroup=''] - Space group name.
   * @returns {UnitCell|null}
   */
  static create({
    a, b, c, alpha, beta, gamma, spaceGroup = '',
  }) {
    if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)
      || a <= 0 || b <= 0 || c <= 0) {
      return null;
    }

    return new UnitCell(
      new THREE.Vector3(a, b, c),
      new THREE.Vector3(
        Number.isFinite(alpha) ? alpha : 90,
        Number.isFinite(beta) ? beta : 90,
        Number.isFinite(gamma) ? gamma : 90,
      ),
      spaceGroup,
    );
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
