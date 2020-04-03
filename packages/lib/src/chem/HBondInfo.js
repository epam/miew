import ResidueType from './ResidueType';
import PairCollection from './AtomPairs';

const MINIMAL_DISTANCE = 0.5;
const MIN_HBOND_ENERGY = -9.9;
const MAX_HBOND_ENERGY = -0.5;
const COUPLING_CONSTANT = -27.888; // = -332 * 0.42 * 0.2
const MAX_COUPLING_DISTANCE = 5.0; // how far is the closest atom of a potential partner residue from CA atom
const MAX_RESIDUES_THRESHOLD = 1000;

export default class HBondInfo {
  constructor(complex) {
    this._complex = complex;
    this._hbonds = []; // array of bond info for each residue
    if (this._complex._residues.length > MAX_RESIDUES_THRESHOLD) {
      this._buildVW(); // optimized version using voxel grid
    } else {
      this._build(); // test all pairs of residues
    }
  }

  isBond(from, to) {
    if (this._hbonds[from]) {
      const [acc0, acc1] = this._hbonds[from].acceptor;
      if (acc0 && acc0.residue === to && acc0.energy < MAX_HBOND_ENERGY) {
        return true;
      }
      if (acc1 && acc1.residue === to && acc1.energy < MAX_HBOND_ENERGY) {
        return true;
      }
    }
    return false;
  }

  _build() {
    const self = this;

    for (let i = 0; i < this._complex._residues.length - 1; ++i) {
      const ri = this._complex._residues[i];
      if ((ri.getType().flags & ResidueType.Flags.PROTEIN) === 0) {
        continue;
      }

      // get predecessor in chain
      let preri = null;
      if (i > 0 && (this._complex._residues[i - 1].getType().flags & ResidueType.Flags.PROTEIN)
        && ri._sequence === this._complex._residues[i - 1]._sequence + 1) {
        preri = this._complex._residues[i - 1];
      }

      for (let j = i + 1; j < this._complex._residues.length; ++j) {
        const rj = this._complex._residues[j];
        if ((rj.getType().flags & ResidueType.Flags.PROTEIN) === 0) {
          continue;
        }

        // get predecessor in chain
        let prerj = null;
        if ((this._complex._residues[j - 1].getType().flags & ResidueType.Flags.PROTEIN)
          && rj._sequence === this._complex._residues[j - 1]._sequence + 1) {
          prerj = this._complex._residues[j - 1];
        }

        self._calcHBondEnergy(preri, ri, rj);
        if (j !== i + 1) {
          self._calcHBondEnergy(prerj, rj, ri);
        }
      }
    }
  }

  _buildVW() {
    const self = this;
    const residues = this._complex._residues;
    let ri;
    let preri;

    const vw = this._complex.getVoxelWorld();
    if (vw === null) {
      return;
    }

    const pairs = new PairCollection(this._complex._residues.length * this._complex._residues.length / 2);

    function processAtom(atom) {
      const rj = atom.residue;

      if (rj._index === ri._index) {
        return;
      }

      if ((rj.getType().flags & ResidueType.Flags.PROTEIN) === 0) {
        return;
      }

      if (!pairs.addPair(ri._index, rj._index)) {
        // we've seen this pair
        return;
      }

      // get predecessor in chain
      let prerj = rj._index > 0 ? residues[rj._index - 1] : null;
      if (prerj
        && ((prerj.getType().flags & ResidueType.Flags.PROTEIN) === 0 || rj._sequence !== prerj._sequence + 1)) {
        prerj = null;
      }

      self._calcHBondEnergy(preri, ri, rj);
      if (rj._index !== ri._index + 1) {
        self._calcHBondEnergy(prerj, rj, ri);
      }
    }

    for (let i = 0; i < residues.length - 1; ++i) {
      ri = residues[i];
      if ((ri.getType().flags & ResidueType.Flags.PROTEIN) === 0) {
        continue;
      }

      // get predecessor in chain
      preri = i > 0 ? residues[i - 1] : null;
      if (preri
        && ((preri.getType().flags & ResidueType.Flags.PROTEIN) === 0 || ri._sequence !== preri._sequence + 1)) {
        preri = null;
      }

      vw.forEachAtomWithinRadius(this._residueGetCAlpha(ri), MAX_COUPLING_DISTANCE, processAtom);
    }
  }

  _residueGetCAlpha(res) {
    for (let i = 0; i < res._atoms.length; ++i) {
      const { name } = res._atoms[i];
      if (name === 'CA'
        || name === 'C1') {
        return res._atoms[i].position;
      }
    }

    return null;
  }

  _residueGetCO(res) {
    let c = null;
    let o = null;

    res.forEachAtom((a) => {
      if (a.name === 'C') {
        c = a.position;
      } else if (a.name === 'O') {
        o = a.position;
      }
    });

    return [c, o];
  }

  // TODO Support hydrogen defined in complex
  _residueGetNH(prev, res) {
    const [c, o] = this._residueGetCO(prev);

    let n;
    res.forEachAtom((a) => {
      if (a.name === 'N') {
        n = a.position;
      }
    });

    if (c && o && n) {
      // calculate hydrogen position
      const h = c.clone();
      h.sub(o);
      h.multiplyScalar(1.0 / h.length());
      h.add(n);

      return [n, h];
    }

    return [null, null];
  }

  _calcHBondEnergy(predonor, donor, acceptor) {
    let result = 0;

    if (predonor === null) {
      return result;
    }

    if (donor.getType().getName() !== 'PRO') {
      const [n, h] = this._residueGetNH(predonor, donor);
      const [c, o] = this._residueGetCO(acceptor);

      if (n === null || h === null || c === null || o === null) {
        return result;
      }

      const distanceHO = h.distanceTo(o);
      const distanceHC = h.distanceTo(c);
      const distanceNC = n.distanceTo(c);
      const distanceNO = n.distanceTo(o);

      if (distanceHO < MINIMAL_DISTANCE || distanceHC < MINIMAL_DISTANCE
          || distanceNC < MINIMAL_DISTANCE || distanceNO < MINIMAL_DISTANCE) {
        result = MIN_HBOND_ENERGY;
      } else {
        result = COUPLING_CONSTANT / distanceHO - COUPLING_CONSTANT / distanceHC
                 + COUPLING_CONSTANT / distanceNC - COUPLING_CONSTANT / distanceNO;
      }

      // DSSP compatibility mode:
      result = Math.round(result * 1000) / 1000;

      if (result < MIN_HBOND_ENERGY) {
        result = MIN_HBOND_ENERGY;
      }
    }

    // update donor
    if (typeof this._hbonds[donor._index] === 'undefined') {
      this._hbonds[donor._index] = {
        donor: [],
        acceptor: [],
      };
    }
    const donorInfo = this._hbonds[donor._index];

    if (donorInfo.acceptor.length < 2) {
      donorInfo.acceptor.push({
        residue: acceptor._index,
        energy: result,
      });
    }

    if (donorInfo.acceptor.length > 1) {
      if (result < donorInfo.acceptor[0].energy) {
        donorInfo.acceptor[1].residue = donorInfo.acceptor[0].residue;
        donorInfo.acceptor[1].energy = donorInfo.acceptor[0].energy;
        donorInfo.acceptor[0].residue = acceptor._index;
        donorInfo.acceptor[0].energy = result;
      } else if (result < donorInfo.acceptor[1].energy) {
        donorInfo.acceptor[1].residue = acceptor._index;
        donorInfo.acceptor[1].energy = result;
      }
    }

    // update acceptor
    if (typeof this._hbonds[acceptor._index] === 'undefined') {
      this._hbonds[acceptor._index] = {
        donor: [],
        acceptor: [],
      };
    }
    const accInfo = this._hbonds[acceptor._index];

    if (accInfo.donor.length < 2) {
      accInfo.donor.push({
        residue: donor._index,
        energy: result,
      });
    }

    if (accInfo.donor.length > 1) {
      if (result < accInfo.donor[0].energy) {
        accInfo.donor[1].residue = accInfo.donor[0].residue;
        accInfo.donor[1].energy = accInfo.donor[0].energy;
        accInfo.donor[0].residue = donor._index;
        accInfo.donor[0].energy = result;
      } else if (result < accInfo.donor[1].energy) {
        accInfo.donor[1].residue = donor._index;
        accInfo.donor[1].energy = result;
      }
    }

    return result;
  }
}
