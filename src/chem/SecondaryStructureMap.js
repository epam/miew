import HBondInfo from './HBondInfo';
import ResidueType from './ResidueType';

const BridgeType = Object.freeze({
  NO_BRIDGE: 0,
  PARALLEL: 1,
  ANTI_PARALLEL: 2,
});

const HelixFlag = Object.freeze({
  START: 1,
  MIDDLE: 2,
  END: 3,
  START_AND_END: 4,
});

const StructureType = Object.freeze({
  LOOP: ' ',
  ALPHA_HELIX: 'H',
  BETA_BRIDGE: 'B',
  STRAND: 'E',
  HELIX_3_10: 'G',
  PI_HELIX: 'I',
  TURN: 'T',
  BEND: 'S',
});

export default class SecondaryStructureMap {
  constructor(complex) {
    this._complex = complex;
    this._build();
  }

  _build() {
    const self = this;
    this._hbonds = new HBondInfo(this._complex);
    this._ss = []; // DSSP map by residue

    // auxilliary data
    this._sheet = [];
    this._betaPartners = [];
    this._bend = [];
    for (let i = 0; i < this._complex.getResidues().length; ++i) {
      this._betaPartners[i] = [];
    }
    this._helixFlags = [];
    this._helixFlags[3] = [];
    this._helixFlags[4] = [];
    this._helixFlags[5] = [];

    // calculate peptide chain lengths
    this._chainLengths = [];
    for (let i = 0; i < this._complex._chains.length; ++i) {
      let chain = this._complex._chains[i].getResidues();
      let len = 0;
      for (; len < chain.length; ++len) {
        if ((chain[len].getType().flags & ResidueType.Flags.PROTEIN) === 0) {
          break;
        }
      }
      this._chainLengths[i] = len;
    }

    this._buildBetaSheets();

    for (let i = 0; i < this._complex._chains.length; ++i) {
      self._buildAlphaHelices(this._complex._chains[i].getResidues(), this._chainLengths[i], false);
    }
  }

  _buildAlphaHelices(inResidues, chainLength, inPreferPiHelices) {
    // Helix and Turn
    for (let stride = 3; stride <= 5; ++stride) {
      if (inResidues.length < stride) {
        break;
      }

      for (let i = 0; i + stride < chainLength; ++i) {
        if (this._hbonds.isBond(inResidues[i + stride]._index, inResidues[i]._index)
        /*&& NoChainBreak(res[i], res[i + stride])*/) {
          this._helixFlags[stride][inResidues[i + stride]._index] = HelixFlag.END;
          for (let j = i + 1; j < i + stride; ++j) {
            if (typeof  this._helixFlags[stride][inResidues[j]._index] === 'undefined') {
              this._helixFlags[stride][inResidues[j]._index] = HelixFlag.MIDDLE;
            }
          }

          if (this._helixFlags[stride][inResidues[i]._index] === HelixFlag.END) {
            this._helixFlags[stride][inResidues[i]._index] = HelixFlag.START_AND_END;
          } else {
            this._helixFlags[stride][inResidues[i]._index] = HelixFlag.START;
          }
        }
      }
    }

    for (let i = 2; i < chainLength - 2; ++i) {
      let kappa = this._kappa(inResidues[i - 2], inResidues[i], inResidues[i + 2]);
      this._bend[inResidues[i]._index] = (kappa !== 360 && kappa > 70);
    }

    for (let i = 1; i + 4 < chainLength; ++i) {
      if (this._isHelixStart(inResidues[i]._index, 4) && this._isHelixStart(inResidues[i - 1]._index, 4)) {
        for (let j = i; j <= i + 3; ++j) {
          this._ss[inResidues[j]._index] = StructureType.ALPHA_HELIX;
        }
      }
    }

    for (let i = 1; i + 3 < chainLength; ++i) {
      if (this._isHelixStart(inResidues[i]._index, 3) && this._isHelixStart(inResidues[i - 1]._index, 3)) {
        let empty = true;
        for (let j = i; empty && j <= i + 2; ++j) {
          empty = typeof this._ss[inResidues[j]._index] === 'undefined' ||
                  this._ss[inResidues[j]._index] === StructureType.HELIX_3_10;
        }
        if (empty) {
          for (let j = i; j <= i + 2; ++j) {
            this._ss[inResidues[j]._index] = StructureType.HELIX_3_10;
          }
        }
      }
    }

    for (let i = 1; i + 5 < chainLength; ++i) {
      if (this._isHelixStart(inResidues[i]._index, 5) && this._isHelixStart(inResidues[i - 1]._index, 5)) {
        let empty = true;
        for (let j = i; empty && j <= i + 4; ++j) {
          empty = typeof this._ss[inResidues[j]._index] === 'undefined' ||
                  this._ss[inResidues[j]._index] === StructureType.PI_HELIX ||
                  (inPreferPiHelices && this._ss[inResidues[j]._index] === StructureType.ALPHA_HELIX);
        }
        if (empty) {
          for (let j = i; j <= i + 4; ++j) {
            this._ss[inResidues[j]._index] = StructureType.PI_HELIX;
          }
        }
      }
    }

    for (let i = 1; i + 1 < chainLength; ++i) {
      if (typeof this._ss[inResidues[i]._index] === 'undefined') {
        let isTurn = false;
        for (let stride = 3; stride <= 5 && !isTurn; ++stride) {
          for (let k = 1; k < stride && !isTurn; ++k) {
            isTurn = (i >= k) && this._isHelixStart(inResidues[i - k]._index, stride);
          }
        }

        if (isTurn) {
          this._ss[inResidues[i]._index] = StructureType.TURN;
        } else if (this._bend[inResidues[i]._index]) {
          this._ss[inResidues[i]._index] = StructureType.BEND;
        }
      }
    }
  }

  _residueGetCAlpha(res) {
    for (let i = 0; i < res._atoms.length; ++i) {
      let name = res._atoms[i].getName().getString();
      if (name === 'CA' ||
          name === 'C1') {
        return res._atoms[i].getPosition();
      }
    }

    return null;
  }

  _cosinusAngle(p1, p2, p3, p4) {
    let v12 = p1.clone(); v12.sub(p2);
    let v34 = p3.clone(); v34.sub(p4);

    let result = 0;

    let x = v12.dot(v12) * v34.dot(v34);
    if (x > 0) {
      result = v12.dot(v34) / Math.sqrt(x);
    }

    return result;
  }

  _kappa(prevPrev, res, nextNext) {
    let curCA = this._residueGetCAlpha(res);
    let ppCA = this._residueGetCAlpha(prevPrev);
    let nnCA = this._residueGetCAlpha(nextNext);
    if (curCA === null || ppCA === null || nnCA === null) {
      return 180;
    }

    let ckap = this._cosinusAngle(curCA, ppCA, nnCA, curCA);
    let skap = Math.sqrt(1 - ckap * ckap);
    return Math.atan2(skap, ckap) * 180 / Math.PI;
  }

  _isHelixStart(res, stride) {
    return (this._helixFlags[stride][res] === HelixFlag.START ||
      this._helixFlags[stride][res] === HelixFlag.START_AND_END);
  }

  _buildBetaSheets() {
    // find bridges
    // check each chain against each other chain, and against itself
    let bridges = [];
    for (let a = 0; a < this._complex._chains.length; ++a) {
      let lenA = this._chainLengths[a];
      if (lenA <= 4) {
        continue;
      }

      let chainA = this._complex._chains[a].getResidues();

      for (let b = a; b < this._complex._chains.length; ++b) {
        let lenB = this._chainLengths[b];
        if (lenB <= 4) {
          continue;
        }

        let chainB = this._complex._chains[b].getResidues();

        for (let i = 1; i + 1 < lenA; ++i) {
          let ri = chainA[i];

          let j = 1;
          if (b === a) {
            j = i + 3; // check for self-bridges forward down the chain
          }

          for (; j + 1 < lenB; ++j) {
            let rj = chainB[j];

            let type = this._testBridge(chainA, i, chainB, j);
            if (type === BridgeType.NO_BRIDGE) {
              continue;
            }

            // there is a bridge, try to attach it to previously found sequence
            let found = false;
            for (let bridge of bridges) {
              if (type !== bridge.type || ri._index !== bridge.i[bridge.i.length - 1] + 1) {
                continue;
              }

              if (type === BridgeType.PARALLEL && bridge.j[bridge.j.length - 1] + 1 === rj._index) {
                bridge.i.push(ri._index);
                bridge.j.push(rj._index);
                found = true;
                break;
              }

              if (type === BridgeType.ANTI_PARALLEL && bridge.j[0] - 1 === rj._index) {
                bridge.i.push(ri._index);
                bridge.j.unshift(rj._index);
                found = true;
                break;
              }
            }

            // this bridge cannot be attached anywhere, start a new sequence
            if (!found) {
              bridges.push({
                type: type,
                i: [ri._index],
                chainI: ri.getChain()._index,
                j: [rj._index],
                chainJ: rj.getChain()._index
              });
            }
          }
        }
      }
    }

    // extend ladders
    bridges.sort(function(a, b) {
      if (a.chainI < b.chainI || (a.chainI === b.chainI && a.i[0] < b.i[0])) {
        return -1;
      }
      return 1;
    });

    for (let i = 0; i < bridges.length; ++i) {
      for (let j = i + 1; j < bridges.length; ++j) {
        let ibi = bridges[i].i[0];
        let iei = bridges[i].i[bridges[i].i.length - 1];
        let jbi = bridges[i].j[0];
        let jei = bridges[i].j[bridges[i].j.length - 1];
        let ibj = bridges[j].i[0];
        let iej = bridges[j].i[bridges[j].i.length - 1];
        let jbj = bridges[j].j[0];
        let jej = bridges[j].j[bridges[j].j.length - 1];

        if (bridges[i].type !== bridges[j].type ||
          this._hasChainBreak(Math.min(ibi, ibj), Math.max(iei, iej)) ||
          this._hasChainBreak(Math.min(jbi, jbj), Math.max(jei, jej)) ||
          ibj - iei >= 6 || (iei >= ibj && ibi <= iej)) {
          continue;
        }

        let bulge = false;
        if (bridges[i].type === BridgeType.PARALLEL) {
          bulge = ((jbj - jei < 6 && ibj - iei < 3) || (jbj - jei < 3));
        } else {
          bulge = ((jbi - jej < 6 && ibj - iei < 3) || (jbi - jej < 3));
        }

        if (bulge) {
          bridges[i].i = bridges[i].i.concat(bridges[j].i);
          if (bridges[i].type === BridgeType.PARALLEL) {
            bridges[i].j = bridges[i].j.concat(bridges[j].j);
          } else {
            bridges[i].j = bridges[j].j.concat(bridges[i].j);
          }
          bridges.splice(j--, 1);
        }
      }
    }

    // Sheet
    let ladderset = new Set();
    for (let i = 0; i < bridges.length; ++i) {
      ladderset.add(bridges[i]);
    }

    let sheet = 1, ladder = 0;
    while (ladderset.size > 0) {
      let bridge = ladderset.values().next().value;
      ladderset.delete(bridge);

      let sheetset = new Set();
      sheetset.add(bridge);

      let toMove;
      do {
        toMove = new Set();
        for (let a of sheetset.values()) {
          for (let b of ladderset.values()) {
            if (this._areBridgesLinked(a, b)) {
              toMove.add(b);
            }
          }
        }
        for (bridge of toMove.values()) {
          sheetset.add(bridge);
          ladderset.delete(bridge);
        }
      } while (toMove.size > 0);

      for (bridge of sheetset.values()) {
        bridge.ladder = ladder;
        bridge.sheet = sheet;
        bridge.link = sheetset;
        ++ladder;
      }

      ++sheet;
    }

    for (let i = 0; i < bridges.length; ++i) {
      let bridge = bridges[i];

      // find out if any of the i and j set members already have
      // a bridge assigned, if so, we're assigning bridge 2

      let betai = 0, betaj = 0;

      for (let l = 0; l < bridge.i.length; ++l) {
        if (this._betaPartners[bridge.i[l]][0]) {
          betai = 1;
          break;
        }
      }

      for (let l = 0; l < bridge.j.length; ++l) {
        if (this._betaPartners[bridge.j[l]][0]) {
          betaj = 1;
          break;
        }
      }

      let ss = StructureType.BETA_BRIDGE;
      if (bridge.i.length > 1) {
        ss = StructureType.STRAND;
      }

      if (bridge.type === BridgeType.PARALLEL) {
        let j = 0;
        for (let k = 0; k < bridge.i.length; ++k) {
          this._betaPartners[bridge.i[k]][betai] = {
            residue: bridge.j[j++],
            ladder: bridge.ladder,
            parallel: true
          };
        }

        j = 0;
        for (let k = 0; k < bridge.j.length; ++k) {
          this._betaPartners[bridge.j[k]][betaj] = {
            residue: bridge.i[j++],
            ladder: bridge.ladder,
            parallel: true
          };
        }
      } else {
        let j = bridge.j.length - 1;
        for (let k = 0; k < bridge.i.length; ++k) {
          this._betaPartners[bridge.i[k]][betai] = {
            residue: bridge.j[j--],
            ladder: bridge.ladder,
            parallel: false
          };
        }

        j = bridge.i.length - 1;
        for (let k = 0; k < bridge.j.length; ++k) {
          this._betaPartners[bridge.j[k]][betaj] = {
            residue: bridge.i[j--],
            ladder: bridge.ladder,
            parallel: false
          };
        }
      }

      for (let k = bridge.i[0]; k <= bridge.i[bridge.i.length - 1]; ++k) {
        if (this._ss[k] !== StructureType.STRAND) {
          this._ss[k] = ss;
          this._sheet[k] = bridge.sheet;
        }
      }

      for (let k = bridge.j[0]; k <= bridge.j[bridge.j.length - 1]; ++k) {
        if (this._ss[k] !== StructureType.STRAND) {
          this._ss[k] = ss;
          this._sheet[k] = bridge.sheet;
        }
      }
    }
  }

  _testBridge(chainA, from, chainB, to) {
    let result = BridgeType.NO_BRIDGE;

    let a = chainA[from - 1]._index;
    let b = chainA[from]._index;
    let c = chainA[from + 1]._index;
    let d = chainB[to - 1]._index;
    let e = chainB[to]._index;
    let f = chainB[to + 1]._index;

    let isBond = this._hbonds.isBond.bind(this._hbonds);
    if ((isBond(c, e) && isBond(e, a)) || (isBond(f, b) && isBond(b, d))) {
      result = BridgeType.PARALLEL;
    } else if ((isBond(c, d) && isBond(f, a)) || (isBond(e, b) && isBond(b, e))) {
      result = BridgeType.ANTI_PARALLEL;
    }
    return result;
  }

  // return true if any of the residues in bridge a is identical to any of the residues in bridge b
  // TODO Optimize
  _areBridgesLinked(a, b) {
    let ai = new Set(a.i);
    let aj = new Set(a.j);

    for (let i of b.i) {
      if (ai.has(i) || aj.has(i)) {
        return true;
      }
    }

    for (let i of b.j) {
      if (ai.has(i) || aj.has(i)) {
        return true;
      }
    }

    return false;
  }

  _hasChainBreak(from, to) {
    for (let i = from + 1; i <= to; ++i) {
      if (this._complex._residues[i]._sequence !== this._complex._residues[i - 1]._sequence + 1) {
        return true;
      }
    }
    return false;
  }
}

SecondaryStructureMap.StructureType = StructureType;
