import * as THREE from 'three';
import logger from '../utils/logger';
import Atom from './Atom';
import Chain from './Chain';
import Helix from './Helix';
import Strand from './Strand';
import Sheet from './Sheet';
import Component from './Component';
import ResidueType from './ResidueType';
import Bond from './Bond';
import AutoBond from './AutoBond';
import AromaticLoopsMarker from './AromaticLoopsMarker';
import BiologicalUnit from './BiologicalUnit';
import selectors from './selectors';
import VoxelWorld from './VoxelWorld';
import SecondaryStructureMap from './SecondaryStructureMap';
import StructuralElement from './StructuralElement';

const VOXEL_SIZE = 5.0;

const { StructureType } = SecondaryStructureMap;
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
    this._atoms = [];
    this._residues = [];
    this._bonds = [];
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
    this.forEachChain((chain) => {
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
    this.forEachChain((chain) => {
      if (currAtom) {
        return;
      }
      if (chain._name.localeCompare(chainName) === 0) {
        chain.forEachResidue((residue) => {
          if (currAtom) {
            return;
          }
          if (residue._sequence === resId) {
            residue.forEachAtom((atom) => {
              if (currAtom) {
                return;
              }
              if (atomName.localeCompare(atom.name) === 0) {
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
    this._chains.push(result);
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
    const ser = remnant - insCode * maxSerial;
    return { chain: chainId, serial: ser, iCode: insCode };
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

    this.forEachChain((chain) => {
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
        if (!nextRes
          || !currRes.isConnected(nextRes)
          || currRes._index !== nextRes._index - 1) {
          // the last condition is broken and incorrect
          // the refactoring of the Component is required in order to fix this issue
          comp.setSubDivs([{
            start: currStart,
            end: currRes._index,
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

      const nextRes = i === resCount - 1 ? null : residues[i + 1];
      if (!nextRes
        || !currRes.isConnected(nextRes)) {
        // wrap up this interval
        currSubDivs[currSubDivs.length] = {
          start: currStart,
          end: i,
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
    if (newUnit !== null && newUnit !== undefined
      && newUnit !== this._currentUnit
      && newUnit >= 0
      && newUnit < this.units.length) {
      this._currentUnit = newUnit;
      return true;
    }
    return false;
  }

  _computeBounds() {
    const { units } = this;
    for (let i = 0, n = units.length; i < n; ++i) {
      units[i].computeBoundaries();
    }
  }

  onAtomPositionChanged() {
    this.forEachChain((a) => {
      a._finalize();
    });
    this.forEachComponent((c) => {
      c.update();
    });
    // Update bounding sphere and box
    this._computeBounds();
    this._finalizeBonds();
    this.forEachSGroup((s) => {
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
    // remove invalid bonds
    for (i = bonds.length - 1; i >= 0; i--) {
      const bond = bonds[i];
      if (bond._left === null || bond._right === null) {
        bonds.splice(i, 1);
      } else {
        bond._left.bonds.push(bond);
        bond._right.bonds.push(bond);
      }
    }

    const residues = this._residues;
    for (i = 0, n = residues.length; i < n; ++i) {
      residues[i]._finalize();
    }

    this.forEachChain((a) => {
      a._finalize();
    });

    // WARNING! this MUST be done BEFORE computeBounds is called
    const { units } = this;
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
        res.getSequence(),
        res.getICode().charCodeAt(0),
      )] = res;
    }

    const { structures } = this;
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
      currAtom.index = i;
    }

    if (opts.needAutoBonding) {
      // Ignore errors during autobonding
      try {
        const autoConnector = new AutoBond(this);
        autoConnector.build();
        autoConnector.destroy();
      } catch (e) {
        console.warn('Autobonding failed:', e);
      }
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
      const atom = atoms[i];
      if (atom.flags & Atom.Flags.HYDROGEN && atom.bonds.length === 1) {
        const bond = atom.bonds[0];
        const other = (bond._left !== atom && bond._left) || bond._right;
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
      const count = molecule.residues.length;
      for (let j = 0; j < count; j++) {
        const residue = molecule.residues[j];
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

    this.forEachAtom((atom) => {
      if ((atom.mask & mask) !== 0) {
        count++;
      }
    });

    return count;
  }

  getNumAtomsBySelector(selector) {
    let count = 0;

    this.forEachAtom((atom) => {
      if (selector.includesAtom(atom)) {
        count++;
      }
    });

    return count;
  }

  resetAtomMask(mask) {
    this.forEachAtom((atom) => {
      atom.mask = mask;
    });
  }

  markAtoms(selector, mask) {
    const setMask = mask;
    const clearMask = ~setMask;
    let count = 0;
    const totalSelector = selectors.keyword('And')(selector, this.getSelector());

    this.forEachAtom((atom) => {
      if (totalSelector.includesAtom(atom)) {
        atom.mask |= setMask;
        count++;
      } else {
        atom.mask &= clearMask;
      }
    });
    this._maskNeedsUpdate = true;

    return count;
  }

  markAtomsAdditionally(selector, mask) {
    const setMask = mask;
    let count = 0;

    this.forEachAtom((atom) => {
      if (selector.includesAtom(atom) && (atom.mask & mask) !== mask) {
        atom.mask |= setMask;
        count++;
      }
    });

    return count;
  }

  clearAtomBits(mask) {
    const clearMask = ~mask;
    this.forEachAtom((atom) => {
      atom.mask &= clearMask;
    });
    const reseter = (a) => {
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
    this.forEachAtom((atom) => {
      dict[atom.name] = 1;
    });
    this._atomNames = Object.keys(dict);

    return this._atomNames;
  }

  getElements() {
    if (this.hasOwnProperty('_elements')) {
      return this._elements;
    }

    const dict = {};
    this.forEachAtom((atom) => {
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
    this.forEachResidue((res) => {
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
    this.forEachChain((chain) => {
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
    this.forEachAtom((atom) => {
      dict[String.fromCharCode(atom.location)] = 1;
    });
    this._altlocNames = Object.keys(dict);

    return this._altlocNames;
  }

  getVoxelWorld() {
    if (!this.hasOwnProperty('_voxelWorld')) {
      try {
        this._voxelWorld = new VoxelWorld(
          this.getDefaultBoundaries().boundingBox,
          new THREE.Vector3(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE),
        );
        this._voxelWorld.addAtoms(this);
      } catch (e) {
        logger.warn('Unable to create voxel world');
        this._voxelWorld = null;
      }
    }

    return this._voxelWorld;
  }

  /**
   * Simple function to make unified routine procedure without code duplication.
   * @param {Array} srcArray   - Source chemical structure array (will be part of resulting chemical structure array).
   * @param {Array} dstArray   - Resulting chemical structure array.
   * @param {number} param     - Parameter for processor.
   * @param {function} functor - Processor for every element in array.
   */
  addElement(srcArray, dstArray, param, functor) {
    const { length } = srcArray;
    for (let i = 0; i < length; ++i) {
      const elem = srcArray[i];
      functor(elem, param);
      dstArray.push(elem);
    }
  }

  // this function joins multiple complexes into one (this)
  // atom, bond, ... objects are reused -- so input complexes are no longer valid
  joinComplexes(complexes) {
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

    const self = this;
    let atomBias = 0;
    let bondBias = 0;
    let residueBias = 0;
    let chainBias = 0;
    let componentBias = 0;

    function processAtom(atom, bias) {
      atom.serial += bias;
      atom.index += bias;
    }

    function processBond(bond, bias) {
      bond._index += bias;
    }

    function processResidue(residue, bias) {
      residue._index += bias;
    }

    function processChain(chain, bias) {
      chain._complex = self;
      chain._index += bias;
    }

    function processComponent(component, bias) {
      component._complex = self;
      component._index += bias;
    }

    /**
     * Simple function to do nothing.
     */
    function doNothing() {
    }

    for (let i = 0; i < complexes.length; ++i) {
      const c = complexes[i];
      this.addElement(c._atoms, this._atoms, atomBias, processAtom);
      this.addElement(c._bonds, this._bonds, bondBias, processBond);
      this.addElement(c._residues, this._residues, residueBias, processResidue);
      this.addElement(c._chains, this._chains, chainBias, processChain);
      this.addElement(c._sheets, this._sheets, 0, doNothing);
      this.addElement(c._helices, this._helices, 0, doNothing);
      this.addElement(c._sgroups, this._sgroups, 0, doNothing);
      this.addElement(c._components, this._components, componentBias, processComponent);
      this.addElement(c.structures, this.structures, 0, doNothing);
      // merge residue types
      for (const rt in c._residueTypes) {
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
        const curSheet = getSheet(curSheetIndex);
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

    this._sheets = sheets.filter((_sheet) => true); // squeeze sheets array
  }
}

Complex.prototype.id = 'Complex';
Complex.prototype.name = '';

export default Complex;
