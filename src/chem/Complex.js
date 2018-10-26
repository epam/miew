import logger from '../utils/logger';
import * as THREE from 'three';
import Atom from './Atom';
import Chain from './Chain';
import Element from './Element';
import Helix from './Helix';
import Strand from './Strand';
import Sheet from './Sheet';
import Component from './Component';
import ResidueType from './ResidueType';
import Bond from './Bond';
import AutoBond from './AutoBond';
import SGroup from './SGroup';
import AromaticLoopsMarker from './AromaticLoopsMarker';
import BiologicalUnit from './BiologicalUnit';
import selectors from './selectors';
import VoxelWorld from './VoxelWorld';
import SecondaryStructureMap from './SecondaryStructureMap';
import StructuralElement from './StructuralElement';

const VOXEL_SIZE = 5.0;

const StructureType = SecondaryStructureMap.StructureType;
const StructuralElementType = StructuralElement.Type;

// see http://www.wwpdb.org/documentation/file-format-content/format33/sect5.html#HELIX
const helixClassMap = {
  [StructureType.HELIX_ALPHA]: 1,
  [StructureType.HELIX_PI]: 3,
  [StructureType.HELIX_310]: 5,
};

const loopMap = {
  [StructureType.BRIDGE]: StructuralElementType.BRIDGE,
  [StructureType.TURN]: StructuralElementType.TURN,
  [StructureType.BEND]: StructuralElementType.BEND,
  [StructureType.LOOP]: StructuralElementType.COIL,
};

/**
 * The entire complex of the molecules under study.
 *
 * @exports Complex
 * @constructor
 */
class Complex {
  constructor() {
    this._chains = [];
    this._components = [];
    this._helices = [];
    this._sheets = [];
    this.structures = [];

    this._residueTypes = Object.create(ResidueType.StandardTypes);
    this._atoms = [];    // TODO: preallocate
    this._residues = []; // TODO: preallocate
    this._bonds = [];    // TODO: preallocate
    this._sgroups = [];
    this._molecules = [];
    this._maskNeedsUpdate = false;

    this.metadata = {};

    this.symmetry = [];
    this.units = [new BiologicalUnit(this)];
    this._currentUnit = 0; // default biological unit is the asymmetric unit
  }

  addAtom(atom) {
    const index = this._atoms.length;
    this._atoms.push(atom);
    return index;
  }

  addSheet(sheet) {
    const index = this._sheets.length;
    this._sheets.push(sheet);
    return index;
  }

  addHelix(helix) {
    const index = this._helices.length;
    this._helices.push(helix);
    return index;
  }

  getAtoms() {
    return this._atoms;
  }

  getBonds() {
    return this._bonds;
  }

  getAtomCount() {
    return this._atoms.length;
  }

  addResidue(residue) {
    const index = this._residues.length;
    this._residues.push(residue);
    return index;
  }

  updateToFrame(frameData) {
    this.forEachChain(function(chain) {
      chain.updateToFrame(frameData);
    });
  }

  addResidueType(resName) {
    const rt = this._residueTypes[resName] = new ResidueType(resName, 'Unknown', '');
    return rt;
  }

  getResidueCount() {
    return this._residues.length;
  }

  getResidues() {
    return this._residues;
  }

  getSGroupCount() {
    return this._sgroups.length;
  }

  getSGroups() {
    return this._sgroups;
  }

  /*
     Extract atom by its fullname: #chainName#.#residueId#.#atomName#
     */
  getAtomByFullname(fullName) {
    const parts = fullName.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const chainName = parts[0];
    const resId = parseInt(parts[1], 10);
    if (Number.isNaN(resId)) {
      return null;
    }
    const atomName = parts[2].toUpperCase();

    let currAtom = null;
    this.forEachChain(function(chain) {
      if (currAtom) {
        return;
      }
      if (chain._name.localeCompare(chainName) === 0) {
        chain.forEachResidue(function(residue) {
          if (currAtom) {
            return;
          }
          if (residue._sequence === resId) {
            residue.forEachAtom(function(atom) {
              if (currAtom) {
                return;
              }
              if (atomName.localeCompare(atom._name.getString()) === 0) {
                currAtom = atom;
              }
            });
          }
        });
      }
    });

    return currAtom;
  }

  /**
   * Create a new chain.
   *
   * @param {string} name - Chain name.
   * @returns {Chain} - Newly created chain.
   */
  addChain(name) {
    const result = new Chain(this, name);
    this._chains.push(result); // TODO: keep chains in dictionary with an (ordered?) array of keys
    return result;
  }

  getChain(name) {
    for (let i = 0, n = this._chains.length; i < n; ++i) {
      const chain = this._chains[i];
      if (chain.getName() === name) {
        return chain;
      }
    }
    return null;
  }

  getChainCount() {
    return this._chains.length;
  }

  getMolecules() {
    return this._molecules;
  }

  getMoleculeCount() {
    return this._molecules.length;
  }

  forEachAtom(process) {
    const atoms = this._atoms;
    for (let i = 0, n = atoms.length; i < n; ++i) {
      process(atoms[i]);
    }
  }

  forEachBond(process) {
    const bonds = this._bonds;
    for (let i = 0, n = bonds.length; i < n; ++i) {
      process(bonds[i]);
    }
  }

  forEachResidue(process) {
    const residues = this._residues;
    for (let i = 0, n = residues.length; i < n; ++i) {
      process(residues[i]);
    }
  }

  forEachChain(process) {
    const chains = this._chains;
    for (let i = 0, n = chains.length; i < n; ++i) {
      process(chains[i]);
    }
  }

  forEachMolecule(process) {
    const molecules = this._molecules;
    const n = molecules.length;
    for (let i = 0; i < n; ++i) {
      process(molecules[i]);
    }
  }

  forEachSGroup(process) {
    const groups = this._sgroups;
    for (let i = 0, n = groups.length; i < n; ++i) {
      process(groups[i]);
    }
  }

  forEachComponent(process) {
    const components = this._components;
    for (let i = 0, n = components.length; i < n; ++i) {
      process(components[i]);
    }
  }

  forEachVisibleComponent(process) {
    const components = this._components;
    for (let i = 0, n = components.length; i < n; ++i) {
      process(components[i]);
    }
  }

  addBond(left, right, order, type, fixed) {
    const bond = new Bond(left, right, order, type, fixed);
    this._bonds.push(bond);
    return bond;
  }

  getBondCount() {
    return this._bonds.length;
  }

  getResidueType(name) {
    return this._residueTypes[name] || null;
  }

  _atomNameCompare(a, b, hVal) {
    const hydrogenName = Element.ByName.H.name;
    const carbideName = Element.ByName.C.name;

    function snc(str) {
      if (str === carbideName) {
        return String.fromCharCode(1);
      }
      if (str === hydrogenName) {
        return String.fromCharCode(hVal);
      }
      return str;
    }

    const ca = snc(a);
    const cb = snc(b);
    if (ca < cb) {
      return -1;
    }
    if (ca > cb) {
      return 1;
    }
    return 0;
  }

  _atomNameCompareCWithH(a, b) {
    return this._atomNameCompare(a, b, 2);
  }

  _atomNameCompareCWithoutH(a, b) {
    return this._atomNameCompare(a, b, 254);
  }

  _buildFormulaSimple(part, charge) {
    const atoms = part.atoms;
    let element = null;
    const hash = {};
    let out = '';
    const self = this;
    const hydrogenName = Element.ByName.H.name;
    let actualCharge = 0;
    atoms.forEach(function(a) {
      const hc = a.getHydrogenCount();
      element = a.element;
      if (hash[element.name]) {
        hash[element.name] += 1;
      } else {
        hash[element.name] = 1;
      }
      if (hc > 0) {
        if (hash[hydrogenName]) {
          hash[hydrogenName] += hc;
        } else {
          hash[hydrogenName] = hc;
        }
      }
      actualCharge += a.getCharge();
    });
    const k = Object.keys(hash);
    if (hash.C) {
      k.sort(this._atomNameCompareCWithH.bind(this));
    } else {
      k.sort(function(a, b) {
        return self._atomNameCompare(a, b, 'H'.charCodeAt(0));
      });
    }
    k.forEach(function(e) {
      const cname = e.substr(0, 1).toUpperCase() + e.substr(1).toLowerCase();
      if (hash[e] > 1) {
        out += cname + hash[e].toString();
      } else {
        out += cname;
      }
    });
    if (charge === null) {
      //apply ourselves
      if (actualCharge !== 0) {
        if (k.length > 1) {
          out = '(' + out + ')';
        }
        if (actualCharge > 1) {
          out += '^{' + actualCharge.toString() + '+}';
        }
        if (actualCharge === 1) {
          out += '^+';
        }
        if (actualCharge < -1) {
          out += '^{' + Math.abs(actualCharge).toString() + '-}';
        }
        if (actualCharge === -1) {
          out += '^-';
        }
      }
      if (part.repeatCount > 1) {
        out = part.repeatCount.toString(10) + out;
      }
    } else {
      charge(k.length, actualCharge);
    }
    return out;
  }

  _buildPartFormula(part) {
    if ((part.owner instanceof Complex) || (part.owner instanceof Component)) {
      return this._buildFormulaSimple(part, null);
    } else if (part.owner instanceof SGroup) {
      return part.owner.buildChemicalFormula(this, part);
    } else {
      return '';
    }
  }

  _partCompareFunc(a, b) {
    return this._partCompareFuncInt(a, b, true);
  }

  _getCumulativeCharge(arr) {
    const n = arr.length;
    let cumCharge = 0;
    for (let i = 0; i < n; i++) {
      cumCharge += arr[i].getCharge();
    }
    return cumCharge;
  }

  _partCompareFuncInt(a, b, skipH) {
    const self = this;
    const hydroName = Element.ByName.H.name;
    function buildAtomArray(atms, skipHydro) {
      const r = {};
      atms.forEach(function(singleAtom) {
        if (r[singleAtom.element.name]) {
          r[singleAtom.element.name] += 1;
        } else {
          r[singleAtom.element.name] = 1;
        }
        if (!skipHydro) {
          const hCount = singleAtom.getHydrogenCount();
          if (hCount > 0) {
            if (r[hydroName]) {
              r[hydroName] += hCount;
            } else {
              r[hydroName] = hCount;
            }
          }
        }
      });
      const k = Object.keys(r);
      k.sort(self._atomNameCompareCWithoutH.bind(self));
      return {seq: k, data: r};
    }
    const skipArr = [skipH, false];
    let atomDiff;
    for (let i = 0; i < skipArr.length; i++) {
      const skipPar = skipArr[i];

      const aData = buildAtomArray(a.atoms, skipPar);
      const bData = buildAtomArray(b.atoms, skipPar);

      for (let aIdx = 0, bIdx = 0; aIdx < aData.seq.length && bIdx < bData.seq.length;) {
        if (aData.seq[aIdx] === bData.seq[bIdx]) {
          if (aData.data[aData.seq[aIdx]] === bData.data[bData.seq[bIdx]]) {
            aIdx += 1;
            bIdx += 1;
          } else {
            atomDiff = bData.data[bData.seq[bIdx]] - aData.data[aData.seq[aIdx]];
            return atomDiff;
          }
        } else {
          return self._atomNameCompareCWithoutH(aData.seq[aIdx], bData.seq[bIdx]);
        }
      }
      atomDiff = aData.seq.length - bData.seq.length;
      if (atomDiff !== 0 || !skipPar) {
        if (atomDiff === 0) {
          return this._getCumulativeCharge(a.atoms) - this._getCumulativeCharge(b.atoms);
        } else {
          return atomDiff;
        }
      }
    }
    return this._getCumulativeCharge(a.atoms) - this._getCumulativeCharge(b.atoms);
  }

  _checkFormulaBuildable() {
    const atoms = this.getAtoms();
    const nAtoms = atoms.length;
    for (let i = 0; i < nAtoms; i++) {
      const atom = atoms[i];
      if (atom.element.number > Element.ByName.MT.number) {
        return '}\\text{Could not create chemical formula for this structure.}{';
      }
    }
    return '';
  }

  buildChemicalFormula() {
    const retDelim = '*';
    const formulaParts = []; //object array
    let currPart = null;
    let pAtoms = null;
    const atomsHash = {};
    let hEntry = null;
    const self = this;
    let formula = this._checkFormulaBuildable();
    if (formula !== '') {
      return formula;
    }
    this.forEachAtom(function(a) {
      if (atomsHash[a.getSerial()]) {
        logger.warn('Broken complex. Formula can be invalid...');
      }
      atomsHash[a.getSerial()] = {atom: a, taken: null};
    });
    //groups part goes first
    this.forEachSGroup(function(grp) {
      if (grp._charge === 0 && grp._repeat === 1) {
        //if do not we have valid reason to take part ==> skip
        return;
      }
      currPart = {owner: grp, atoms: [], repeatCount: 1};
      pAtoms = currPart.atoms;
      grp._atoms.forEach(function(a) {
        hEntry = atomsHash[a.getSerial()];
        //check is not taken
        if (hEntry.taken === null) {
          pAtoms.push(a);
          //mark as taken
          hEntry.taken = grp;
        }
      });
      if (currPart.atoms.length > 0) {
        formulaParts.push(currPart);
      }
      currPart = null;
    });
    //components part
    this.forEachComponent(function(cmp) {
      currPart = {owner: cmp, atoms: [], repeatCount: 1};
      pAtoms = currPart.atoms;
      cmp.forEachResidue(function(r) {
        r._atoms.forEach(function(a) {
          hEntry = atomsHash[a.getSerial()];
          //check is not taken
          if (hEntry.taken === null) {
            pAtoms.push(a);
            //mark as taken
            hEntry.taken = cmp;
          }
        });
      });
      if (currPart.atoms.length > 0) {
        formulaParts.push(currPart);
      }
      currPart = null;
    });
    //collect main part
    const atomKeys = Object.keys(atomsHash);
    atomKeys.forEach(function(a) {
      if (a.taken === null) {
        if (currPart === null) {
          currPart = {owner: self, atoms: [], repeatCount: 1};
        }
        currPart.atoms.push(a.atom);
        a.taken = self;
      }
    });
    //add first part
    if (currPart !== null) {
      if (currPart.atoms.length > 0) {
        formulaParts.push(currPart);
      }
    }
    //sort parts
    formulaParts.sort(function(a, b) {
      return self._partCompareFunc(a, b);
    });
    //now join the same parts
    let i = formulaParts.length - 1;
    let j = formulaParts.length - 2;
    while (i >= 0 && j >= 0) {
      const pi = formulaParts[i];
      const pj = formulaParts[j];
      if (!((pi.owner instanceof Complex) || (pi.owner instanceof Component))) {
        i--;
        if (i === j) {
          j--;
        }
        continue;
      }
      if (!((pj.owner instanceof Complex) || (pj.owner instanceof Component))) {
        j--;
        continue;
      }

      if (this._partCompareFuncInt(pj, pi, false) === 0) {
        pj.repeatCount += pi.repeatCount;
        formulaParts.splice(i, 1);
      }
      j--;
      i--;
    }

    //build formula for each part individually
    formulaParts.forEach(function(p) {
      const pf = self._buildPartFormula(p);
      if (pf.length > 0) {
        if (formula.length > 0) {
          formula += retDelim;
        }
        formula += pf;
      }
    });
    return formula;
  }

  getUnifiedSerial(chain, serial, iCode) {
    /* eslint-disable no-magic-numbers */
    const maxSerial = 65536;
    const chainShift = maxSerial * 256;
    /* eslint-enable no-magic-numbers */
    return serial + iCode * maxSerial + chain * chainShift;
  }

  splitUnifiedSerial(uniSerial) {
    /* eslint-disable no-magic-numbers */
    const maxSerial = 65536;
    const chainShift = maxSerial * 256;
    /* eslint-enable no-magic-numbers */
    const chainId = Math.floor(uniSerial / chainShift);
    const remnant = uniSerial - chainId * chainShift;
    const insCode = Math.floor(remnant / maxSerial);
    const ser =  remnant - insCode * maxSerial;
    return {chain: chainId, serial: ser, iCode: insCode};
  }

  _fillCmpEdit() {
    const self = this;
    const components = this._components;

    function addComp() {
      const comp = new Component(self);
      comp._index = components.length;
      components[comp._index] = comp;
      return comp;
    }

    this.forEachChain(function(chain) {
      const residues = chain._residues;
      const resCount = residues.length;
      if (resCount < 1) {
        return;
      }
      let comp = addComp();
      let currStart = residues[0]._index;

      for (let i = 0; i < resCount; ++i) {
        const currRes = residues[i];
        currRes._component = comp;

        const nextRes = i === resCount - 1 ? null : residues[i + 1];
        if (!nextRes ||
          !currRes.isConnected(nextRes) ||
          currRes._index !== nextRes._index - 1) {
          // the last condition is broken and incorrect
          // the refactoring of the Component is required in order to fix this issue
          comp.setSubDivs([{
            start: currStart,
            end: currRes._index
          }]);
          if (nextRes) {
            currStart = nextRes._index;
            comp = addComp();
          }
        }
      }
    });
  }

  // This function was added in the moment of despair
  // It was the dark times for miew
  _fillCmpNoedit() {
    const comp = new Component(this);
    comp._index = 0;

    const residues = this._residues;
    const resCount = residues.length;
    if (resCount === 0) {
      return;
    }

    const currSubDivs = [];
    let currStart = 0;
    for (let i = 0; i < resCount; ++i) {
      const currRes = residues[i];
      currRes._component = comp;

      var nextRes = i === resCount - 1 ? null : residues[i + 1];
      if (!nextRes ||
        !currRes.isConnected(nextRes)) {
        // wrap up this interval
        currSubDivs[currSubDivs.length] = {
          start: currStart,
          end: i
        };
        if (nextRes) {
          currStart = i + 1;
        }
      }
    }

    comp.setSubDivs(currSubDivs);
    this._components[comp._index] = comp;
  }

  /**
   * Fill components information.
   * @param {boolean} enableEditing - Restructure Complex to enable per-component editing.
   */
  _fillComponents(enableEditing) {
    if (enableEditing) {
      this._fillCmpEdit();
    } else {
      this._fillCmpNoedit();
    }
  }

  getCurrentUnit() {
    return this._currentUnit;
  }

  /**
   * @function
   * @deprecated Renamed to {@link Complex#getCurrentUnit}
   */
  getCurrentStructure = Complex.prototype.getCurrentUnit;

  /**
   * @function
   * @deprecated Renamed to {@link Complex#resetCurrentUnit}
   */
  resetCurrentStructure = Complex.prototype.resetCurrentUnit;

  /**
   * @function
   * @deprecated Renamed to {@link Complex#setCurrentUnit}
   */
  setCurrentStructure = Complex.prototype.setCurrentUnit;

  getDefaultBoundaries() {
    return this.units[0].getBoundaries();
  }

  getBoundaries() {
    return this.units[this._currentUnit].getBoundaries();
  }

  getTransforms() {
    return this.units[this._currentUnit].getTransforms();
  }

  getSelector() {
    return this.units[this._currentUnit].getSelector();
  }

  resetCurrentUnit() {
    this._currentUnit = 0;
    this.setCurrentUnit(1);
  }

  setCurrentUnit(newUnit) {
    if (newUnit !== null && newUnit !== undefined &&
      newUnit !== this._currentUnit &&
      newUnit >= 0 &&
      newUnit < this.units.length) {
      this._currentUnit = newUnit;
      return true;
    }
    return false;
  }

  _computeBounds() {
    const units = this.units;
    for (let i = 0, n = units.length; i < n; ++i) {
      units[i].computeBoundaries();
    }
  }

  onAtomPositionChanged() {
    this.forEachChain(function(a) {
      a._finalize();
    });
    this.forEachComponent(function(c) {
      c.update();
    });
    // Update bounding sphere and box
    this._computeBounds();
    this._finalizeBonds();
    this.forEachSGroup(function(s) {
      s._rebuildSGroupOnAtomChange();
    });
  }

  update() {
    if (this._maskNeedsUpdate) {
      this.updateStructuresMask();
      this._maskNeedsUpdate = false;
    }
  }

  _finalizeBonds() {

    const bonds = this.getBonds();
    const n = bonds.length;
    for (let i = 0; i < n; ++i) {
      bonds[i]._index = i;
    }
  }

  /**
   * Finalizes complex's inner data(i.e. after parsing).
   * @param {objects} opts - Build bonds automatically.
   * @param {boolean} opts.needAutoBonding     - Build bonds automatically.
   * @param {boolean} opts.detectAromaticLoops - Find/mark aromatic loops.
   * @param {boolean} opts.enableEditing       - Restructure Complex to enable per-component editing.
   * @param {Array<Atom>} [opts.serialAtomMap] - Array of atoms ordered by their serials.
   */
  finalize(opts) {
    opts = opts || {};
    // Put bonds into atoms
    const bonds = this._bonds;
    let i;
    let n;
    //remove invalid bonds
    for (i = bonds.length - 1; i >= 0; i--) {
      const bond = bonds[i];
      if (bond._left === null || bond._right === null) {
        bonds.splice(i, 1);
      } else {
        bond._left._bonds.push(bond);
        bond._right._bonds.push(bond);
      }
    }

    const residues = this._residues;
    for (i = 0, n = residues.length; i < n; ++i) {
      residues[i]._finalize();
    }

    this.forEachChain(function(a) {
      a._finalize();
    });

    // WARNING! this MUST be done BEFORE computeBounds is called
    const units = this.units;
    for (i = 0, n = units.length; i < n; ++i) {
      units[i].finalize();
    }
    // try setting first biomolecule by defaults
    this.setCurrentUnit(1);

    const residueHash = {};
    for (i = 0, n = residues.length; i < n; ++i) {
      const res = residues[i];
      // This code is extremely dangerous for non-PDB formats
      residueHash[this.getUnifiedSerial(
        res.getChain().getName().charCodeAt(0),
        res.getSequence(), res.getICode().charCodeAt(0)
      )] = res;
    }

    const structures = this.structures;
    for (i = 0, n = structures.length; i < n; ++i) {
      structures[i]._finalize(opts.serialAtomMap, residueHash, this);
    }

    const helices = this._helices;
    for (i = 0, n = helices.length; i < n; ++i) {
      helices[i]._finalize(opts.serialAtomMap, residueHash, this);
    }

    const sheets = this._sheets;
    for (i = 0, n = sheets.length; i < n; ++i) {
      sheets[i]._finalize(opts.serialAtomMap, residueHash, this);
    }

    // Update bounding sphere and box
    this._computeBounds();

    const atoms = this._atoms;
    for (i = 0, n = atoms.length; i < n; ++i) {
      const currAtom = atoms[i];
      currAtom._index = i;
    }

    if (opts.needAutoBonding) {
      // console.time('AutoBonding');
      const autoConnector = new AutoBond(this);
      autoConnector.build();
      autoConnector.destroy();
      // console.timeEnd('AutoBonding');
    }

    const chains = this._chains;
    for (i = 0, n = chains.length; i < n; ++i) {
      chains[i]._index = i;
    }

    for (i = 0, n = residues.length; i < n; ++i) {
      residues[i]._index = i;
    }

    // mark non-polar hydrogens
    for (i = 0, n = atoms.length; i < n; ++i) {
      let atom = atoms[i];
      if (atom.flags & Atom.Flags.HYDROGEN && atom._bonds.length === 1) {
        let bond = atom._bonds[0];
        let other = bond._left !== atom && bond._left || bond._right;
        if (other.flags & Atom.Flags.CARBON) {
          atom.flags |= Atom.Flags.NONPOLARH;
        }
      }
    }

    this._finalizeBonds();
    this._fillComponents(opts.enableEditing);

    const marker = new AromaticLoopsMarker(this);
    marker.markCycles();
    if (opts.detectAromaticLoops) { // TODO remove this condition clause, it is for debug purposes only!
      marker.detectCycles(); // TODO add conditional detection
    }

    this._finalizeMolecules();
  }

  _finalizeMolecules() {
    // add reference to molecule into residue
    for (let i = 0; i < this._molecules.length; i++) {
      const molecule = this._molecules[i];
      const count = molecule._residues.length;
      for (let j = 0; j < count; j++) {
        const residue = molecule._residues[j];
        residue._molecule = molecule;
      }
    }
  }

  updateStructuresMask() {
    const updater = (structure) => structure.collectMask();
    this.forEachResidue(updater);
    this.forEachChain(updater);
    this.forEachMolecule(updater);
  }

  countAtomsByMask(mask) {
    let count = 0;

    this.forEachAtom(function(atom) {
      if ((atom._mask & mask) !== 0) {
        count++;
      }
    });

    return count;
  }

  getNumAtomsBySelector(selector) {
    let count = 0;

    this.forEachAtom(function(atom) {
      if (selector.includesAtom(atom)) {
        count++;
      }
    });

    return count;
  }

  resetAtomMask(mask) {
    this.forEachAtom(function(atom) {
      atom._mask = mask;
    });
  }

  markAtoms(selector, mask) {
    const setMask = mask;
    const clearMask = ~setMask;
    let count = 0;
    const totalSelector = selectors.keyword('And')(selector, this.getSelector());

    this.forEachAtom(function(atom) {
      if (totalSelector.includesAtom(atom)) {
        atom._mask |= setMask;
        count++;
      } else {
        atom._mask &= clearMask;
      }
    });
    this._maskNeedsUpdate = true;

    return count;
  }

  markAtomsAdditionally(selector, mask) {
    const setMask = mask;
    let count = 0;

    this.forEachAtom(function(atom) {
      if (selector.includesAtom(atom) && (atom._mask & mask) !== mask) {
        atom._mask |= setMask;
        count++;
      }
    });

    return count;
  }

  clearAtomBits(mask) {
    const clearMask = ~mask;
    const reseter = a => {
      a._mask &= clearMask;
    };
    this.forEachAtom(reseter);
    this.forEachResidue(reseter);
    this.forEachChain(reseter);
    this.forEachMolecule(reseter);
  }

  getAtomNames() {
    if (this.hasOwnProperty('_atomNames')) {
      return this._atomNames;
    }

    const dict = {};
    this.forEachAtom(function(atom) {
      dict[atom._name._name] = 1;
    });
    this._atomNames = Object.keys(dict);

    return this._atomNames;
  }

  getElements() {
    if (this.hasOwnProperty('_elements')) {
      return this._elements;
    }

    const dict = {};
    this.forEachAtom(function(atom) {
      dict[atom.element.name] = 1;
    });
    this._elements = Object.keys(dict);

    return this._elements;
  }

  getResidueNames() {
    if (this.hasOwnProperty('_residueNames')) {
      return this._residueNames;
    }

    const dict = {};
    this.forEachResidue(function(res) {
      dict[res._type._name] = 1;
    });
    this._residueNames = Object.keys(dict);

    return this._residueNames;
  }

  getChainNames() {
    if (this.hasOwnProperty('_chainNames')) {
      return this._chainNames;
    }

    const dict = {};
    this.forEachChain(function(chain) {
      dict[chain._name] = 1;
    });
    this._chainNames = Object.keys(dict);

    return this._chainNames;
  }

  getAltLocNames() {
    if (this.hasOwnProperty('_altlocNames')) {
      return this._altlocNames;
    }

    const dict = {};
    this.forEachAtom(function(atom) {
      dict[String.fromCharCode(atom._location)] = 1;
    });
    this._altlocNames = Object.keys(dict);

    return this._altlocNames;
  }

  getVoxelWorld() {
    if (!this.hasOwnProperty('_voxelWorld')) {
      try {
        this._voxelWorld = new VoxelWorld(
          this.getDefaultBoundaries().boundingBox,
          new THREE.Vector3(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE)
        );
        this._voxelWorld.addAtoms(this);
      } catch (e) {
        logger.warn('Unable to create voxel world');
        this._voxelWorld = null;
      }
    }

    return this._voxelWorld;
  }

  // this function joins multiple complexes into one (this)
  // atom, bond, ... objects are reused -- so input complexes are no longer valid
  joinComplexes(complexes) {
    let i, j;

    // clear target complex
    this._chains = [];
    this._components = [];
    this._helices = [];
    this._sheets = [];
    this.structures = [];
    this._atoms = [];
    this._residues = [];
    this._bonds = [];
    this._sgroups = [];

    let atomBias = 0;
    let bondBias = 0;
    let residueBias = 0;
    let chainBias = 0;
    let componentBias = 0;
    for (i = 0; i < complexes.length; ++i) {
      const c = complexes[i];

      // add atoms
      for (j = 0; j < c._atoms.length; ++j) {
        const a = c._atoms[j];
        a._serial += atomBias;
        a._index += atomBias;
        this._atoms.push(a);
      }

      // add bonds
      for (j = 0; j < c._bonds.length; ++j) {
        const b = c._bonds[j];
        b._index += bondBias;
        this._bonds.push(b);
      }

      // add residues
      for (j = 0; j < c._residues.length; ++j) {
        const r = c._residues[j];
        r._index += residueBias;
        this._residues.push(r);
      }

      // add chains
      for (j = 0; j < c._chains.length; ++j) {
        const chain = c._chains[j];
        chain._complex = this;
        chain._index += chainBias;
        this._chains.push(chain);
      }

      // add structures
      for (j = 0; j < c.structures.length; ++j) {
        this.structures.push(c.structures[j]);
      }

      // add sheets
      for (j = 0; j < c._sheets.length; ++j) {
        this._sheets.push(c._sheets[j]);
      }

      // add helices
      for (j = 0; j < c._helices.length; ++j) {
        this._helices.push(c._helices[j]);
      }

      // add SGroups
      for (j = 0; j < c._sgroups.length; ++j) {
        this._sgroups.push(c._sgroups[j]);
      }

      // add components
      for (j = 0; j < c._components.length; ++j) {
        const comp = c._components[j];
        comp._complex = this;
        comp._index += componentBias;
        this._components.push(comp);
      }

      // merge residue types
      for (let rt in c._residueTypes) {
        if (c._residueTypes.hasOwnProperty(rt)) {
          this._residueTypes[rt] = c._residueTypes[rt];
        }
      }

      atomBias += c._atoms.length;
      bondBias += c._bonds.length;
      residueBias += c._residues.length;
      chainBias += c._chains.length;
      componentBias += c._components.length;
    }

    this._computeBounds();
  }

  /**
   * Replace secondary structure with calculated one.
   *
   * DSSP algorithm implementation is used.
   *
   * Kabsch W, Sander C. 1983. Dictionary of protein secondary structure: pattern recognition of hydrogen-bonded and
   * geometrical features. Biopolymers. 22(12):2577-2637. doi:10.1002/bip.360221211.
   */
  dssp() {
    const ssMap = new SecondaryStructureMap(this);

    const structures = this.structures = [];
    const helices = this._helices = [];
    const sheets = this._sheets = [];

    const getSheet = (index) => {
      let item = sheets[index];
      if (!item) {
        item = sheets[index] = new Sheet(String(index), 0);
      }
      return item;
    };

    let lastCode;
    let lastSheetIndex;
    let lastHelixIndex = 0;
    let curStructure = null;
    for (let i = 0, n = this._residues.length; i < n; ++i) {
      const curCode = ssMap._ss[i];
      const curResidue = this._residues[i];
      const curSheetIndex = ssMap._sheet[i];

      // expand the last structure
      if (curCode === lastCode && curSheetIndex === lastSheetIndex) {
        curResidue._secondary = curStructure;
        if (curStructure) {
          curStructure.term = curResidue;
        }
        if (curStructure instanceof Helix) {
          curStructure.length++;
        }
        continue;
      }

      // create a new structure
      const helixClass = helixClassMap[curCode];
      const loopType = loopMap[curCode];
      if (curCode === StructureType.STRAND) {
        let curSheet = getSheet(curSheetIndex);
        curStructure = new Strand(curSheet, curResidue, curResidue, 0, null, null);
        curSheet.addStrand(curStructure);
      } else if (helixClass !== undefined) {
        lastHelixIndex++;
        curStructure = new Helix(helixClass, curResidue, curResidue, lastHelixIndex, String(lastHelixIndex), '', 1);
        helices.push(curStructure);
      } else if (loopType !== undefined) {
        curStructure = new StructuralElement(loopType, curResidue, curResidue);
      } else {
        curStructure = null;
      }

      if (curStructure) {
        structures.push(curStructure);
      }

      curResidue._secondary = curStructure;

      lastCode = curCode;
      lastSheetIndex = curSheetIndex;
    }

    this._sheets = sheets.filter(_sheet => true); // squeeze sheets array
  }
}

Complex.prototype.id = 'Complex';
Complex.prototype.name = '';

export default Complex;

