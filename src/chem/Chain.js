import Residue from './Residue';
import ResidueType from './ResidueType';
import * as THREE from 'three';

/**
 * Residue chain.
 *
 * @param {Complex} complex - Molecular complex this chain belongs to.
 * @param {string} name - One character identifier (usually space, A-Z, 0-9, or a-z).
 *
 * @exports Chain
 * @constructor
 */
class  Chain {
  constructor(complex, name) {
    this._complex = complex;
    this._name = name;
    this._mask = 1 | 0;
    this._index = -1;

    this._residues = []; // TODO: change to range

    this.minSequence = Number.POSITIVE_INFINITY;
    this.maxSequence = Number.NEGATIVE_INFINITY;
  }

  getComplex() {
    return this._complex;
  }

  getName() {
    return this._name;
  }

  getResidues() {
    return this._residues;
  }

  /**
   * Finds thre residue with specified sequence number and inserion code
   * @param {Number} seqNum sequence number
   * @param {string} iCode insertion code
   * @returns {*} Residue or null if not found
   */
  findResidue(seqNum, iCode) {
    const residues = this._residues;

    for (let i = 0, n = residues.length; i < n; ++i) {
      const res = residues[i];
      if (res._sequence === seqNum && res._icode === iCode) {
        return [res, i];
      }
    }

    return null;
  }

  _finalize() {
    const residues = this._residues;

    let prev = null;
    for (let i = 0, n = residues.length; i < n; ++i) {
      const next = (i + 1 < n) ? residues[i + 1] : null;
      const curr = residues[i];
      // TODO: skip invalid residues
      if (1 /* curr._isValid */) { // eslint-disable-line no-constant-condition
        curr._finalize2(prev, next);
        prev = curr;
      }
    }

    //fix very first wing
    if (residues.length > 1) {
      const p = residues[1]._wingVector;
      residues[0]._wingVector = new THREE.Vector3(p.x, p.y, p.z);
    } else if (residues.length > 0) {
      residues[0]._wingVector = new THREE.Vector3(1, 0, 0);
    }

  }

  updateToFrame(frameData) {
    const residues = this._residues;
    let prev = null;
    let prevData = null;
    const frameRes = frameData._residues;
    const n = residues.length;
    function getAtomPos(atom) {
      return frameData.getAtomPos(atom._index);
    }

    for (let i = 0; i < n; ++i) {
      const curr = residues[i];
      const currData = frameRes[curr._index];
      const nextRes = (i + 1 < n) ? residues[i + 1] : null;
      curr._innerFinalize(prev, prevData, nextRes, currData, getAtomPos);
      prev = curr;
      prevData = currData;
    }

    frameRes[residues[0]._index]._wingVector = n > 1 ?
      frameRes[residues[1]._index]._wingVector  :
      new THREE.Vector3(1, 0, 0);
  }

  /**
   * Create a new residue.
   *
   * @param {string} name - Residue name.
   * @param {number} sequence - Residue sequence number.
   * @param {string} iCode - Insertion code.
   * @returns {Residue} - Newly created residue instance.
   */
  addResidue(name, sequence, iCode) {
    let type = this._complex.getResidueType(name);
    if (type === null) {
      type = this._complex.addResidueType(name);
    }
    const residue = new Residue(this, type, sequence, iCode);
    this._complex.addResidue(residue);
    this._residues.push(residue); // TODO: change to range

    if (type.flags & (ResidueType.Flags.NUCLEIC | ResidueType.Flags.PROTEIN)) {
      if (this.maxSequence < sequence) {
        this.maxSequence = sequence;
      }
      if (this.minSequence > sequence) {
        this.minSequence = sequence;
      }
    }

    return residue;
  }

  getResidueCount() {
    return this._residues.length;
  }

  forEachResidue(process) {
    const residues = this._residues;
    for (let i = 0, n = residues.length; i < n; ++i) {
      process(residues[i]);
    }
  }

  collectMask() {
    let mask = 0xffffffff;
    const residues = this._residues;
    for (let i = 0, n = residues.length; i < n; ++i) {
      mask &= residues[i]._mask;
    }
    this._mask = mask;
  }
}

export default Chain;

