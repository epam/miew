import utils from '../utils';
import logger from '../utils/logger';
import * as THREE from 'three';
import DataSource from './DataSource';
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
import BioStructure from './BioStructure';
import selectors from './selectors';
import VoxelWorld from './VoxelWorld';
import SecondaryStructureMap from './SecondaryStructureMap';

const VOXEL_SIZE = 5.0;

/**
 * The entire complex of the molecules under study.
 *
 * @exports Complex
 * @constructor
 */
function Complex() {
  this._chains = [];
  this._components = [];
  this._helices = [];
  this._sheets = [];

  this._residueTypes = Object.create(ResidueType.StandardTypes);
  this._atoms = [];    // TODO: preallocate
  this._residues = []; // TODO: preallocate
  this._bonds = [];    // TODO: preallocate
  this._sgroups = [];
  this._molecules = [];
  this._maskNeedsUpdate = false;

  this.metadata = {};

  this.symmetry = [];
  this.structures = [new BioStructure(this)];
  this._currentStructure = 0; // default biological structure is the asymmetric unit
}

utils.deriveClass(Complex, DataSource, {
  id: 'Complex'
});

Complex.prototype.name = '';

Complex.prototype.addAtom = function(atom) {
  var index = this._atoms.length;
  this._atoms.push(atom);
  return index;
};

Complex.prototype.addSheet = function(sheet) {
  var index = this._sheets.length;
  this._sheets.push(sheet);
  return index;
};

Complex.prototype.addHelix = function(helix) {
  var index = this._helices.length;
  this._helices.push(helix);
  return index;
};

Complex.prototype.getAtoms = function() {
  return this._atoms;
};

Complex.prototype.getBonds = function() {
  return this._bonds;
};

Complex.prototype.getAtomCount = function() {
  return this._atoms.length;
};

Complex.prototype.addResidue = function(residue) {
  var index = this._residues.length;
  this._residues.push(residue);
  return index;
};

Complex.prototype.updateToFrame = function(frameData) {
  this.forEachChain(function(chain) {
    chain.updateToFrame(frameData);
  });
};

Complex.prototype.addResidueType = function(resName) {
  var rt = this._residueTypes[resName] = new ResidueType(resName, 'Unknown', '');
  return rt;
};

Complex.prototype.getResidueCount = function() {
  return this._residues.length;
};

Complex.prototype.getResidues = function() {
  return this._residues;
};

Complex.prototype.getSGroupCount = function() {
  return this._sgroups.length;
};

Complex.prototype.getSGroups = function() {
  return this._sgroups;
};

/*
   Extract atom by its fullname: #chainName#.#residueId#.#atomName#
   */
Complex.prototype.getAtomByFullname = function(fullName) {
  var parts = fullName.split('.');
  if (parts.length !== 3) {
    return null;
  }

  var chainName = parts[0];
  var resId = parseInt(parts[1], 10);
  if (Number.isNaN(resId)) {
    return null;
  }
  var atomName = parts[2].toUpperCase();

  var currAtom = null;
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
};

/**
 * Create a new chain.
 *
 * @param {string} name - Chain name.
 * @returns {Chain} - Newly created chain.
 */
Complex.prototype.addChain = function(name) {
  var result = new Chain(this, name);
  this._chains.push(result); // TODO: keep chains in dictionary with an (ordered?) array of keys
  return result;
};

Complex.prototype.getChain = function(name) {
  for (var i = 0, n = this._chains.length; i < n; ++i) {
    var chain = this._chains[i];
    if (chain.getName() === name) {
      return chain;
    }
  }
  return null;
};

Complex.prototype.getChainCount = function() {
  return this._chains.length;
};

Complex.prototype.getMolecules = function() {
  return this._molecules;
};

Complex.prototype.getMoleculeCount = function() {
  return this._molecules.length;
};

Complex.prototype.forEachAtom = function(process) {
  var atoms = this._atoms;
  for (var i = 0, n = atoms.length; i < n; ++i) {
    process(atoms[i]);
  }
};

Complex.prototype.forEachBond = function(process) {
  var bonds = this._bonds;
  for (var i = 0, n = bonds.length; i < n; ++i) {
    process(bonds[i]);
  }
};

Complex.prototype.forEachResidue = function(process) {
  var residues = this._residues;
  for (var i = 0, n = residues.length; i < n; ++i) {
    process(residues[i]);
  }
};

Complex.prototype.forEachChain = function(process) {
  var chains = this._chains;
  for (var i = 0, n = chains.length; i < n; ++i) {
    process(chains[i]);
  }
};

Complex.prototype.forEachMolecule = function(process) {
  const molecules = this._molecules;
  const n = molecules.length;
  for (let i = 0; i < n; ++i) {
    process(molecules[i]);
  }
};

Complex.prototype.forEachSGroup = function(process) {
  var groups = this._sgroups;
  for (var i = 0, n = groups.length; i < n; ++i) {
    process(groups[i]);
  }
};

Complex.prototype.forEachComponent = function(process) {
  var components = this._components;
  for (var i = 0, n = components.length; i < n; ++i) {
    process(components[i]);
  }
};

Complex.prototype.forEachVisibleComponent = function(process) {
  var components = this._components;
  for (var i = 0, n = components.length; i < n; ++i) {
    process(components[i]);
  }
};

Complex.prototype.addBond = function(left, right, order, type, fixed) {
  var bond = new Bond(left, right, order, type, fixed);
  this._bonds.push(bond);
  return bond;
};

Complex.prototype.getBondCount = function() {
  return this._bonds.length;
};

Complex.prototype.getResidueType = function(name) {
  return this._residueTypes[name] || null;
};

Complex.prototype._atomNameCompare = function(a, b, hVal) {
  var hydrogenName = Element.ByName.H.name;
  var carbideName = Element.ByName.C.name;

  function snc(str) {
    if (str === carbideName) {
      return String.fromCharCode(1);
    }
    if (str === hydrogenName) {
      return String.fromCharCode(hVal);
    }
    return str;
  }

  var ca = snc(a);
  var cb = snc(b);
  if (ca < cb) {
    return -1;
  }
  if (ca > cb) {
    return 1;
  }
  return 0;
};

Complex.prototype._atomNameCompareCWithH = function(a, b) {
  return this._atomNameCompare(a, b, 2);
};

Complex.prototype._atomNameCompareCWithoutH = function(a, b) {
  return this._atomNameCompare(a, b, 254);
};

Complex.prototype._buildFormulaSimple = function(part, charge) {
  var atoms = part.atoms;
  var element = null;
  var hash = {};
  var out = '';
  var self = this;
  var hydrogenName = Element.ByName.H.name;
  var actualCharge = 0;
  atoms.forEach(function(a) {
    var hc = a.getHydrogenCount();
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
  var k = Object.keys(hash);
  if (hash.C) {
    k.sort(this._atomNameCompareCWithH.bind(this));
  } else {
    k.sort(function(a, b) {
      return self._atomNameCompare(a, b, 'H'.charCodeAt(0));
    });
  }
  k.forEach(function(e) {
    var cname = e.substr(0, 1).toUpperCase() + e.substr(1).toLowerCase();
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
};

Complex.prototype._buildPartFormula = function(part) {
  if ((part.owner instanceof Complex) || (part.owner instanceof Component)) {
    return this._buildFormulaSimple(part, null);
  } else if (part.owner instanceof SGroup) {
    return part.owner.buildChemicalFormula(this, part);
  } else {
    return '';
  }
};

Complex.prototype._partCompareFunc = function(a, b) {
  return this._partCompareFuncInt(a, b, true);
};

Complex.prototype._getCumulativeCharge = function(arr) {
  var n = arr.length;
  var cumCharge = 0;
  for (var i = 0; i < n; i++) {
    cumCharge += arr[i].getCharge();
  }
  return cumCharge;
};

Complex.prototype._partCompareFuncInt = function(a, b, skipH) {
  var self = this;
  var hydroName = Element.ByName.H.name;
  function buildAtomArray(atms, skipHydro) {
    var r = {};
    atms.forEach(function(singleAtom) {
      if (r[singleAtom.element.name]) {
        r[singleAtom.element.name] += 1;
      } else {
        r[singleAtom.element.name] = 1;
      }
      if (!skipHydro) {
        var hCount = singleAtom.getHydrogenCount();
        if (hCount > 0) {
          if (r[hydroName]) {
            r[hydroName] += hCount;
          } else {
            r[hydroName] = hCount;
          }
        }
      }
    });
    var k = Object.keys(r);
    k.sort(self._atomNameCompareCWithoutH.bind(self));
    return {seq: k, data: r};
  }
  var skipArr = [skipH, false];
  var atomDiff;
  for (var i = 0; i < skipArr.length; i++) {
    var skipPar = skipArr[i];

    var aData = buildAtomArray(a.atoms, skipPar);
    var bData = buildAtomArray(b.atoms, skipPar);

    for (var aIdx = 0, bIdx = 0; aIdx < aData.seq.length && bIdx < bData.seq.length;) {
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
};

Complex.prototype._checkFormulaBuildable = function() {
  var atoms = this.getAtoms();
  var nAtoms = atoms.length;
  var i = 0;
  for (; i < nAtoms; i++) {
    var atom = atoms[i];
    if (atom.element.number > Element.ByName.MT.number) {
      return '}\\text{Could not create chemical formula for this structure.}{';
    }
  }
  return '';
};

Complex.prototype.buildChemicalFormula = function() {
  var retDelim = '*';
  var formulaParts = []; //object array
  var currPart = null;
  var pAtoms = null;
  var atomsHash = {};
  var hEntry = null;
  var self = this;
  var formula = this._checkFormulaBuildable();
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
  var atomKeys = Object.keys(atomsHash);
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
  var i = formulaParts.length - 1;
  var j = formulaParts.length - 2;
  while (i >= 0 && j >= 0) {
    var pi = formulaParts[i];
    var pj = formulaParts[j];
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
    var pf = self._buildPartFormula(p);
    if (pf.length > 0) {
      if (formula.length > 0) {
        formula += retDelim;
      }
      formula += pf;
    }
  });
  return formula;
};

Complex.prototype.getUnifiedSerial = function(chain, serial, iCode) {
  /* eslint-disable no-magic-numbers */
  var maxSerial = 65536;
  var chainShift = maxSerial * 256;
  /* eslint-enable no-magic-numbers */
  return serial + iCode * maxSerial + chain * chainShift;
};

Complex.prototype.splitUnifiedSerial = function(uniSerial) {
  /* eslint-disable no-magic-numbers */
  var maxSerial = 65536;
  var chainShift = maxSerial * 256;
  /* eslint-enable no-magic-numbers */
  var chainId = Math.floor(uniSerial / chainShift);
  var remnant = uniSerial - chainId * chainShift;
  var insCode = Math.floor(remnant / maxSerial);
  var ser =  remnant - insCode * maxSerial;
  return {chain: chainId, serial: ser, iCode: insCode};
};

Complex.prototype._fillCmpEdit = function() {
  var self = this;
  var components = this._components;

  function addComp() {
    var comp = new Component(self);
    comp._index = components.length;
    components[comp._index] = comp;
    return comp;
  }

  this.forEachChain(function(chain) {
    var residues = chain._residues;
    var resCount = residues.length;
    if (resCount < 1) {
      return;
    }
    var comp = addComp();
    var currStart = residues[0]._index;

    for (var i = 0; i < resCount; ++i) {
      var currRes = residues[i];
      currRes._component = comp;

      var nextRes = i === resCount - 1 ? null : residues[i + 1];
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
};

// This function was added in the moment of despair
// It was the dark times for miew
Complex.prototype._fillCmpNoedit = function() {
  var comp = new Component(this);
  comp._index = 0;

  var residues = this._residues;
  var resCount = residues.length;
  if (resCount === 0) {
    return;
  }

  var currSubDivs = [];
  var currStart = 0;
  for (var i = 0; i < resCount; ++i) {
    var currRes = residues[i];
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
};

/**
 * Fill components information.
 * @param {boolean} enableEditing - Restructure Complex to enable per-component editing.
 */
Complex.prototype._fillComponents = function(enableEditing) {
  if (enableEditing) {
    this._fillCmpEdit();
  } else {
    this._fillCmpNoedit();
  }
};

Complex.prototype.getCurrentStructure = function() {
  return this._currentStructure;
};

Complex.prototype.getDefaultBoundaries = function() {
  return this.structures[0].getBoundaries();
};

Complex.prototype.getBoundaries = function() {
  return this.structures[this._currentStructure].getBoundaries();
};

Complex.prototype.getTransforms = function() {
  return this.structures[this._currentStructure].getTransforms();
};

Complex.prototype.getSelector = function() {
  return this.structures[this._currentStructure].getSelector();
};

Complex.prototype.resetCurrentStructure = function() {
  this._currentStructure = 0;
  this.setCurrentStructure(1);
};

Complex.prototype.setCurrentStructure = function(newStructure) {
  if (newStructure !== null && newStructure !== undefined &&
      newStructure !== this._currentStructure &&
      newStructure >= 0 &&
      newStructure < this.structures.length) {
    this._currentStructure = newStructure;
    return true;
  }
  return false;
};

Complex.prototype._computeBounds = function() {
  var structures = this.structures;
  for (var i = 0, n = structures.length; i < n; ++i) {
    structures[i].computeBoundaries();
  }
};

Complex.prototype.onAtomPositionChanged = function() {
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
};

Complex.prototype.update = function() {
  if (this._maskNeedsUpdate) {
    this.updateStructuresMask();
    this._maskNeedsUpdate = false;
  }
};

Complex.prototype._finalizeBonds = function() {

  var bonds = this.getBonds();
  var n = bonds.length;
  for (var i = 0; i < n; ++i) {
    bonds[i]._index = i;
  }
};

/**
 * Finalizes complex's inner data(i.e. after parsing).
 * @param {objects} opts - Build bonds automatically.
 * @param {boolean} opts.needAutoBonding     - Build bonds automatically.
 * @param {boolean} opts.detectAromaticLoops - Find/mark aromatic loops.
 * @param {boolean} opts.enableEditing       - Restructure Complex to enable per-component editing.
 * @param {Array<Atom>} [opts.serialAtomMap] - Array of atoms ordered by their serials.
 */
Complex.prototype.finalize = function(opts) {
  opts = opts || {};
  // Put bonds into atoms
  var bonds = this._bonds;
  var i;
  var n;
  //remove invalid bonds
  for (i = bonds.length - 1; i >= 0; i--) {
    let bond = bonds[i];
    if (bond._left === null || bond._right === null) {
      bonds.splice(i, 1);
    } else {
      bond._left._bonds.push(bond);
      bond._right._bonds.push(bond);
    }
  }

  var residues = this._residues;
  for (i = 0, n = residues.length; i < n; ++i) {
    residues[i]._finalize();
  }

  this.forEachChain(function(a) {
    a._finalize();
  });

  // WARNING! this MUST be done BEFORE computeBounds is called
  var structures = this.structures;
  for (i = 0, n = structures.length; i < n; ++i) {
    structures[i].finalize();
  }
  // try setting first biomolecule by defaults
  this.setCurrentStructure(1);

  var helices = this._helices;
  var residueHash = {};
  for (i = 0, n = residues.length; i < n; ++i) {
    var res = residues[i];
    // This code is extremely dangerous for non-PDB formats
    residueHash[this.getUnifiedSerial(
      res.getChain().getName().charCodeAt(0),
      res.getSequence(), res.getICode().charCodeAt(0)
    )] = res;
  }
  for (i = 0, n = helices.length; i < n; ++i) {
    helices[i]._finalize(residueHash, this);
  }
  var sheets = this._sheets;
  for (i = 0, n = sheets.length; i < n; ++i) {
    sheets[i]._finalize(opts.serialAtomMap, residueHash, this);
  }

  // Update bounding sphere and box
  this._computeBounds();

  var atoms = this._atoms;
  for (i = 0, n = atoms.length; i < n; ++i) {
    var currAtom = atoms[i];
    currAtom._index = i;
  }

  if (opts.needAutoBonding) {
    // console.time('AutoBonding');
    var autoConnector = new AutoBond(this);
    autoConnector.build();
    autoConnector.destroy();
    // console.timeEnd('AutoBonding');
  }

  var chains = this._chains;
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

  var marker = new AromaticLoopsMarker(this);
  marker.markCycles();
  if (opts.detectAromaticLoops) { // TODO remove this condition clause, it is for debug purposes only!
    marker.detectCycles(); // TODO add conditional detection
  }

  this._finalizeMolecules();
};

Complex.prototype._finalizeMolecules = function() {
  // add reference to molecule into residue
  for (var i = 0; i < this._molecules.length; i++) {
    var molecule = this._molecules[i];
    var count = molecule._residues.length;
    for (var j = 0; j < count; j++) {
      var residue = molecule._residues[j];
      residue._molecule = molecule;
    }
  }
};

Complex.prototype.updateStructuresMask = function() {
  const updater = (structure) => structure.collectMask();
  this.forEachResidue(updater);
  this.forEachChain(updater);
  this.forEachMolecule(updater);
};

Complex.prototype.countAtomsByMask = function(mask) {
  var count = 0;

  this.forEachAtom(function(atom) {
    if ((atom._mask & mask) !== 0) {
      count++;
    }
  });

  return count;
};

Complex.prototype.getNumAtomsBySelector = function(selector) {
  var count = 0;

  this.forEachAtom(function(atom) {
    if (selector.includesAtom(atom)) {
      count++;
    }
  });

  return count;
};

Complex.prototype.resetAtomMask = function(mask) {
  this.forEachAtom(function(atom) {
    atom._mask = mask;
  });
};

Complex.prototype.markAtoms = function(selector, mask) {
  var setMask = mask;
  var clearMask = ~setMask;
  var count = 0;
  var totalSelector = selectors.keyword('And')(selector, this.getSelector());

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
};

Complex.prototype.markAtomsAdditionally = function(selector, mask) {
  var setMask = mask;
  var count = 0;

  this.forEachAtom(function(atom) {
    if (selector.includesAtom(atom) && (atom._mask & mask) !== mask) {
      atom._mask |= setMask;
      count++;
    }
  });

  return count;
};

Complex.prototype.clearAtomBits = function(mask) {
  const clearMask = ~mask;
  const reseter = a => {
    a._mask &= clearMask;
  };
  this.forEachAtom(reseter);
  this.forEachResidue(reseter);
  this.forEachChain(reseter);
  this.forEachMolecule(reseter);
};

Complex.prototype.getAtomNames = function() {
  if (this.hasOwnProperty('_atomNames')) {
    return this._atomNames;
  }

  var dict = {};
  this.forEachAtom(function(atom) {
    dict[atom._name._name] = 1;
  });
  this._atomNames = Object.keys(dict);

  return this._atomNames;
};

Complex.prototype.getElements = function() {
  if (this.hasOwnProperty('_elements')) {
    return this._elements;
  }

  var dict = {};
  this.forEachAtom(function(atom) {
    dict[atom.element.name] = 1;
  });
  this._elements = Object.keys(dict);

  return this._elements;
};

Complex.prototype.getResidueNames = function() {
  if (this.hasOwnProperty('_residueNames')) {
    return this._residueNames;
  }

  var dict = {};
  this.forEachResidue(function(res) {
    dict[res._type._name] = 1;
  });
  this._residueNames = Object.keys(dict);

  return this._residueNames;
};

Complex.prototype.getChainNames = function() {
  if (this.hasOwnProperty('_chainNames')) {
    return this._chainNames;
  }

  var dict = {};
  this.forEachChain(function(chain) {
    dict[chain._name] = 1;
  });
  this._chainNames = Object.keys(dict);

  return this._chainNames;
};

Complex.prototype.getAltLocNames = function() {
  if (this.hasOwnProperty('_altlocNames')) {
    return this._altlocNames;
  }

  var dict = {};
  this.forEachAtom(function(atom) {
    dict[String.fromCharCode(atom._location)] = 1;
  });
  this._altlocNames = Object.keys(dict);

  return this._altlocNames;
};

Complex.prototype.getVoxelWorld = function() {
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
};

// this function joins multiple complexes into one (this)
// atom, bond, ... objects are reused -- so input complexes are no longer valid
Complex.prototype.joinComplexes = function(complexes) {
  var i, j;

  // clear target complex
  this._chains = [];
  this._components = [];
  this._helices = [];
  this._sheets = [];
  this._atoms = [];
  this._residues = [];
  this._bonds = [];
  this._sgroups = [];

  var atomBias = 0;
  var bondBias = 0;
  var residueBias = 0;
  var chainBias = 0;
  var componentBias = 0;
  for (i = 0; i < complexes.length; ++i) {
    var c = complexes[i];

    // add atoms
    for (j = 0; j < c._atoms.length; ++j) {
      var a = c._atoms[j];
      a._serial += atomBias;
      a._index += atomBias;
      this._atoms.push(a);
    }

    // add bonds
    for (j = 0; j < c._bonds.length; ++j) {
      var b = c._bonds[j];
      b._index += bondBias;
      this._bonds.push(b);
    }

    // add residues
    for (j = 0; j < c._residues.length; ++j) {
      var r = c._residues[j];
      r._index += residueBias;
      this._residues.push(r);
    }

    // add chains
    for (j = 0; j < c._chains.length; ++j) {
      var chain = c._chains[j];
      chain._complex = this;
      chain._index += chainBias;
      this._chains.push(chain);
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
      var comp = c._components[j];
      comp._complex = this;
      comp._index += componentBias;
      this._components.push(comp);
    }

    // merge residue types
    for (var rt in c._residueTypes) {
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
};

/**
 * Replace secondary structure with calculated one.
 *
 * DSSP algorithm implementation is used.
 *
 * Kabsch W, Sander C. 1983. Dictionary of protein secondary structure: pattern recognition of hydrogen-bonded and
 * geometrical features. Biopolymers. 22(12):2577-2637. doi:10.1002/bip.360221211.
 */
Complex.prototype.dssp = function() {
  const ssMap = new SecondaryStructureMap(this);
  const StructureType = SecondaryStructureMap.StructureType;
  const helixTypes = {
    [StructureType.ALPHA_HELIX]: 1,
    [StructureType.HELIX_3_10]: 3,
    [StructureType.PI_HELIX]: 5,
  };

  const helices = [];
  const sheets = [];
  let curHelix = null;
  let curStrand = null;
  for (let i = 0, n = this._residues.length; i < n; ++i) {
    const ssCode = ssMap._ss[i];
    const residue = this._residues[i];
    residue._secondary = null;

    const helixType = helixTypes[ssCode];
    if (helixType) {
      if (curHelix === null) {
        curHelix = new Helix(helices.length + 1, '', residue, residue, helixType, '', 0);
        helices.push(curHelix);
      }
      residue._secondary = curHelix;
      curHelix._residues.push(residue);
      curHelix._end = residue;
      curHelix._length++;
    } else if (curHelix) {
      curHelix = null;
    }

    if (ssCode === StructureType.STRAND) {
      if (curStrand === null) {
        let curSheet = sheets[ssMap._sheet[i]];
        if (curSheet === undefined) {
          curSheet = sheets[ssMap._sheet[i]] = new Sheet('', 0);
        }
        curStrand = new Strand(curSheet, residue, residue, 0, null, null);
        curSheet.addStrand(curStrand);
        curSheet._width++;
      }
      residue._secondary = curStrand;
      curStrand._residues.push(residue);
      curStrand._end = residue;
    } else if (curStrand) {
      curStrand = null;
    }
  }

  this._helices = helices;
  this._sheets = sheets.filter(_sheet => true); // squeeze sheets array
};

export default Complex;

