

//////////////////////////////////////////////////////////////////////////////
import utils from '../utils';
//////////////////////////////////////////////////////////////////////////////
var cMaxPairsForHashCode = 32;
var cHashTableSize = 1024 * 1024;
var cNumbersPerPair = 4;
var cMaxNeighbours = 14;
var cInvalidVal = -1;
// 89237 is a large simple number, can be used for pseudo random hash code create
var cBigPrime = 89237;

function AtomPairs(maxPairsEstimate) {
  var i = 0;

  this.numPairs = 0;
  this.numMaxPairs = maxPairsEstimate;
  this.intBuffer = utils.allocateTyped(Int32Array, maxPairsEstimate * cNumbersPerPair);
  for (; i < maxPairsEstimate * cNumbersPerPair; i++) {
    this.intBuffer[i] = cInvalidVal;
  }
  this.hashBuffer = utils.allocateTyped(Int32Array, cHashTableSize * cMaxPairsForHashCode);
  for (i = 0; i < cHashTableSize * cMaxPairsForHashCode; i++) {
    this.hashBuffer[i] = cInvalidVal;
  }
}

/**
 * Destroy all pairs memory
 */
AtomPairs.prototype.destroy = function() {
  this.intBuffer = null;
  this.hashBuffer = null;
};

/**
 * Add pair of atoms to collection
 * @param {number} indexA - Index of the 1st vertex.
 * @param {number} indexB - Index of the 2nd vertex.
 */
AtomPairs.prototype.addPair = function(indexA, indexB) {
  var ia = (indexA < indexB) ? indexA : indexB;
  var ib = (indexA > indexB) ? indexA : indexB;
  var codeToAdd = ia + (ib << cMaxNeighbours);

  var hashCode = (ia + (ib * cBigPrime)) & (cHashTableSize - 1);
  var j = hashCode * cMaxPairsForHashCode;
  var apI = 0;
  for (; apI < cMaxPairsForHashCode; apI++) {
    var code = this.hashBuffer[j + apI];
    if (code === cInvalidVal) {
      break;
    }
    if (code === codeToAdd) {
      return false;
    }
  }
  // add this new hash code
  if (apI >= cMaxPairsForHashCode) {
    throw new Error('addPair: increase cMaxPairsForHashCode');
  }
  this.hashBuffer[j + apI] = codeToAdd;

  // actually add
  if (this.numPairs >= this.numMaxPairs) {
    throw new Error('addPair: increase num pairs');
  }
  j = this.numPairs * cNumbersPerPair;
  this.intBuffer[j] = ia;
  this.intBuffer[j + 1] = ib;
  this.intBuffer[j + 2] = codeToAdd;
  this.numPairs++;
  return true;
};

export default AtomPairs;
