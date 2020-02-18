import * as THREE from 'three';

/**
 * Atom measurements.
 *
 * @param {string} id              - SGroup id
 * @param {string} name            - Name of the group
 * @param {THREE.Vector3} position - Registered coordinates
 * @param {array} atoms            - Atoms group consists of
 * @param {object} saveNode        - XML node from file for saving
 *
 * @exports SGroup
 * @constructor
 */
class SGroup {
  constructor(id, name, position, atoms, saveNode) {
    this._id = id;
    this._name = name;
    this._position = position || new THREE.Vector3();
    this._atoms = atoms || [];
    this._charge = 0; // default group charge
    this._repeat = 1; // how many times group repeated: always > 0
    this._center = null;
    this.xmlNodeRef = saveNode || null;
  }

  /**
   * Get atom full name.
   * @returns {string} Atom full name.
   */
  getName() {
    return this._name;
  }

  getPosition() {
    return this._position;
  }

  getCentralPoint() {
    return this._center;
  }

  _rebuildSGroupOnAtomChange() {
    const nLimon = 100000000;
    if (this._center === null) {
      return; // nothing to do if we are not relative
    }

    const bLow = new THREE.Vector3(nLimon, nLimon, nLimon);
    const bHight = new THREE.Vector3(-nLimon, -nLimon, -nLimon);
    for (let j = 0, n = this._atoms.length; j < n; j++) {
      const aPos = this._atoms[j].position;
      bLow.set(Math.min(bLow.x, aPos.x), Math.min(bLow.y, aPos.y), Math.min(bLow.z, aPos.z));
      bHight.set(Math.max(bHight.x, aPos.x), Math.max(bHight.y, aPos.y), Math.max(bHight.z, aPos.z));
    }
    this._center.addVectors(bLow, bHight);
    this._center.multiplyScalar(0.5);
  }
}

export default SGroup;
