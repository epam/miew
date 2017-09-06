

//////////////////////////////////////////////////////////////////////////////
import Residue from './Residue';
import ResidueType from './ResidueType';
import * as THREE from 'three';
//////////////////////////////////////////////////////////////////////////////

/**
 * Residue chain.
 *
 * @param {Complex} complex - Molecular complex this chain belongs to.
 * @param {string} name - One character identifier (usually space, A-Z, 0-9, or a-z).
 *
 * @exports Chain
 * @constructor
 */
function Chain(complex, name) {
  this._complex = complex;
  this._name = name;
  this._mask = 1 | 0;
  this._index = -1;

  this._residues = []; // TODO: change to range

  this.minSequence = Number.POSITIVE_INFINITY;
  this.maxSequence = Number.NEGATIVE_INFINITY;
}

Chain.prototype.getComplex = function() {
  return this._complex;
};

Chain.prototype.getName = function() {
  return this._name;
};

Chain.prototype.getResidues = function() {
  return this._residues;
};


/**
 * Finds thre residue with specified sequence number and inserion code
 * @param {Number} seqNum sequence number
 * @param {string} iCode insertion code
 * @returns {*} Residue or null if not found
 */
Chain.prototype.findResidue = function(seqNum, iCode) {
  var residues = this._residues;

  for (var i = 0, n = residues.length; i < n; ++i) {
    var res = residues[i];
    if (res._sequence === seqNum && res._icode === iCode) {
      return [res, i];
    }
  }

  return null;
};

Chain.prototype._finalize = function() {
  var residues = this._residues;

  var prev = null;
  for (var i = 0, n = residues.length; i < n; ++i) {
    var next = (i + 1 < n) ? residues[i + 1] : null;
    var curr = residues[i];
    // TODO: skip invalid residues
    if (1 /* curr._isValid */) { // eslint-disable-line no-constant-condition
      curr._finalize2(prev, next);
      prev = curr;
    }
  }

  //fix very first wing
  if (residues.length > 1) {
    var p = residues[1]._wingVector;
    residues[0]._wingVector = new THREE.Vector3(p.x, p.y, p.z);
  } else if (residues.length > 0) {
    residues[0]._wingVector = new THREE.Vector3(1, 0, 0);
  }

};

Chain.prototype.updateToFrame = function(frameData) {
  var residues = this._residues;
  var prev = null;
  var prevData = null;
  var frameRes = frameData._residues;
  var n = residues.length;
  function getAtomPos(atom) {
    return frameData.getAtomPos(atom._index);
  }

  for (var i = 0; i < n; ++i) {
    var curr = residues[i];
    var currData = frameRes[curr._index];
    var nextRes = (i + 1 < n) ? residues[i + 1] : null;
    curr._innerFinalize(prev, prevData, nextRes, currData, getAtomPos);
    prev = curr;
    prevData = currData;
  }

  frameRes[residues[0]._index]._wingVector = n > 1 ?
    frameRes[residues[1]._index]._wingVector  :
    new THREE.Vector3(1, 0, 0);
};
/**
 * Create a new residue.
 *
 * @param {string} name - Residue name.
 * @param {number} sequence - Residue sequence number.
 * @param {string} iCode - Insertion code.
 * @returns {Residue} - Newly created residue instance.
 */
Chain.prototype.addResidue = function(name, sequence, iCode) {
  var type = this._complex.getResidueType(name);
  if (type === null) {
    type = this._complex.addResidueType(name);
  }
  var residue = new Residue(this, type, sequence, iCode);
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
};

Chain.prototype.getResidueCount = function() {
  return this._residues.length;
};

Chain.prototype.forEachResidue = function(process) {
  var residues = this._residues;
  for (var i = 0, n = residues.length; i < n; ++i) {
    process(residues[i]);
  }
};

Chain.prototype.collectMask = function() {
  var mask = 0xffffffff;
  var residues = this._residues;
  for (var i = 0, n = residues.length; i < n; ++i) {
    mask &= residues[i]._mask;
  }
  this._mask = mask;
};

export default Chain;

