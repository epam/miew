import utils from '../utils';

const cMaxPairsForHashCode = 32;
const cHashTableSize = 1024 * 1024;
const cNumbersPerPair = 4;
const cMaxNeighbours = 14;
const cInvalidVal = -1;
// 89237 is a large simple number, can be used for pseudo random hash code create
const cBigPrime = 89237;

class AtomPairs {
  constructor(maxPairsEstimate) {
    this.numPairs = 0;
    this.numMaxPairs = maxPairsEstimate;
    this.intBuffer = utils.allocateTyped(Int32Array, maxPairsEstimate * cNumbersPerPair);
    for (let i = 0; i < maxPairsEstimate * cNumbersPerPair; i++) {
      this.intBuffer[i] = cInvalidVal;
    }
    this.hashBuffer = utils.allocateTyped(Int32Array, cHashTableSize * cMaxPairsForHashCode);
    for (let i = 0; i < cHashTableSize * cMaxPairsForHashCode; i++) {
      this.hashBuffer[i] = cInvalidVal;
    }
  }

  /**
   * Destroy all pairs memory
   */
  destroy() {
    this.intBuffer = null;
    this.hashBuffer = null;
  }

  /**
   * Add pair of atoms to collection
   * @param {number} indexA - Index of the 1st vertex.
   * @param {number} indexB - Index of the 2nd vertex.
   */
  addPair(indexA, indexB) {
    const ia = (indexA < indexB) ? indexA : indexB;
    const ib = (indexA > indexB) ? indexA : indexB;
    const codeToAdd = ia + (ib << cMaxNeighbours);

    const hashCode = (ia + (ib * cBigPrime)) & (cHashTableSize - 1);
    let j = hashCode * cMaxPairsForHashCode;
    let apI = 0;
    for (; apI < cMaxPairsForHashCode; apI++) {
      const code = this.hashBuffer[j + apI];
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
  }
}

export default AtomPairs;
