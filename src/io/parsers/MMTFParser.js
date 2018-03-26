

import Parser from './Parser';
import chem from '../../chem';
import * as THREE from 'three';
import _ from 'lodash';
import MMTF from 'mmtf';

var
  Complex = chem.Complex,
  Chain = chem.Chain,
  Atom = chem.Atom,
  AtomName = chem.AtomName,
  Element = chem.Element,
  Helix = chem.Helix,
  Sheet = chem.Sheet,
  Strand = chem.Strand,
  Bond = chem.Bond,
  Assembly = chem.Assembly,
  Molecule = chem.Molecule;

function ArrayComparator(original) {
  this._original = Array.from(original);
  this._original.sort();

  this._sum = 0;
  for (var i = 0; i < this._original.length; ++i) {
    this._sum += this._original[i];
  }
}

ArrayComparator.prototype.constructor = ArrayComparator;

ArrayComparator.prototype.compare = function(candidate) {
  var len = candidate.length;
  if (len !== this._original.length) {
    return false;
  }

  var sum = 0, i;
  for (i = 0; i < len; ++i) {
    sum += candidate[i];
  }

  if (sum !== this._sum) {
    return false;
  }

  var sorted = Array.from(candidate);
  sorted.sort();

  for (i = 0; i < len; ++i) {
    if (sorted[i] !== this._original[i]) {
      return false;
    }
  }

  return true;
};


function MMTFParser(data, options) {
  Parser.call(this, data, options);

  this._options.fileType = 'mmtf';
}

////////////////////////////////////////////////////////////////////////////
// Inheritance

MMTFParser.prototype = Object.create(Parser.prototype);
MMTFParser.prototype.constructor = MMTFParser;

////////////////////////////////////////////////////////////////////////////
// Class methods

/** @deprecated */
MMTFParser.canParse = function(data, options) {
  if (!data) {
    return false;
  }

  return data instanceof ArrayBuffer && Parser.checkDataTypeOptions(options, 'mmtf');
};

function getFirstByte(buf) {
  const bytes = new Uint8Array(buf, 0, 1);
  return bytes[0];
}

MMTFParser.canProbablyParse = function(data) {
  // check if it's binary MessagePack format containing a map (dictionary)
  // see https://github.com/msgpack/msgpack/blob/master/spec.md
  return _.isArrayBuffer(data) && ((getFirstByte(data) | 1) === 0xDF);
};

MMTFParser.prototype._onModel = function(_modelData) {
};

MMTFParser.prototype._onChain = function(chainData) {
  if (chainData.modelIndex !== 0) {
    return;
  }

  var chain = new Chain(this._complex, chainData.chainName);
  this._complex._chains[chainData.chainIndex] = chain;
  chain._index = chainData.chainIndex;
};

MMTFParser.prototype._onGroup = function(groupData) {
  if (groupData.modelIndex !== 0) {
    return;
  }

  if (this.settings.now.nowater) {
    // skip water
    if (groupData.groupName === 'HOH' || groupData.groupName === 'WAT') {
      return;
    }
  }

  var chain = this._complex._chains[groupData.chainIndex];
  var icode = !groupData.insCode.charCodeAt(0) ? '' : groupData.insCode;
  var residue = chain.addResidue(groupData.groupName, groupData.groupId, icode);
  residue._index = groupData.groupIndex;

  this._updateSecStructure(this._complex, residue, groupData);
};

MMTFParser.prototype._onAtom = function(atomData) {
  if (atomData.modelIndex !== 0) {
    return;
  }

  var altLoc =  !atomData.altLoc.charCodeAt(0) ? '' : atomData.altLoc;
  var atom = new Atom(
    atomData.groupIndex, // we store residue index here to replace it later with actual reference
    new AtomName(atomData.atomName),
    Element.getByName(atomData.element.toUpperCase()),
    new THREE.Vector3(atomData.xCoord, atomData.yCoord, atomData.zCoord),
    Element.Role[atomData.atomName],
    false, // hetero atoms will be marked later
    atomData.atomId,
    altLoc,
    atomData.occupancy,
    atomData.bFactor,
    atomData.formalCharge
  );

  this._complex._atoms[atomData.atomIndex] = atom;
  atom._index = atomData.atomIndex;

  this._serialAtomMap[atomData.atomId] = atom;
};

MMTFParser.prototype._onBond = function(bondData) {
  var right = Math.max(bondData.atomIndex1, bondData.atomIndex2);
  if (right >= this._complex._atoms.length) {
    return;
  }
  var left = Math.min(bondData.atomIndex1, bondData.atomIndex2);
  this._complex.addBond(
    this._complex._atoms[left], this._complex._atoms[right],
    bondData.bondOrder, Bond.BondType.UNKNOWN, true
  );
};

MMTFParser.prototype._updateSecStructure = function(complex, residue, groupData) {
  var helixTypes = [3, -1, 1, -1, 5];

  if (!_.isUndefined(groupData) &&
        groupData.secStruct === this._ssType) {
    residue._secondary = this._ssStruct;

    if (this._ssStruct instanceof Helix ||
          this._ssStruct instanceof Strand) {
      this._ssStruct._residues.push(residue);
    }
    return;
  }

  // finish current secondary structure
  if (this._ssType !== -1) {
    if (this._ssStruct instanceof Helix ||
          this._ssStruct instanceof Strand) {
      this._ssStruct._end = this._ssStruct._residues[this._ssStruct._residues.length - 1];
    }
  }

  if (!_.isUndefined(groupData)) {
    // start new secondary structure
    this._ssType = groupData.secStruct;
    this._ssStart = residue;

    var struct = null;
    switch (this._ssType) {
    case -1:
      break;
    case 0:
    case 2:
    case 4:
      struct = new Helix(0, '', residue, null, helixTypes[this._ssType], '', 0);
      complex._helices.push(struct);
      break;
    case 3:
      var sheet = new Sheet('', 0);
      complex._sheets.push(sheet);
      struct = new Strand(sheet, residue, null, 0);
      break;
    default:
      struct = {type: 'mmtf' + this._ssType};
      break;
    }

    this._ssStruct = struct;
    residue._secondary = struct;
  }
};

MMTFParser.prototype._updateMolecules = function(mmtfData) {
  const entities = mmtfData.entityList;
  if (!entities) {
    return;
  }

  const chainsInModel0 = mmtfData.chainsPerModel[0];
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const chains = entity.chainIndexList;
    let residues = [];
    for (let j = 0; j < chains.length; j++) {
      const chainIndex = chains[j];
      // skip chains in models other than the first one
      if (chainIndex >= chainsInModel0) {
        continue;
      }
      const chain = this._complex._chains[chainIndex];
      residues = residues.concat(chain._residues.slice());
    }
    const molecule = new Molecule(this._complex, entity.description, i + 1);
    molecule._residues = residues;
    this._complex._molecules[i] = molecule;
  }
};

// populate complex with chains, residues and atoms
MMTFParser.prototype._traverse = function(mmtfData) {
  var self = this;

  // create event callback functions
  var eventCallbacks = {
    onModel: function(modelData) { self._onModel(modelData); },
    onChain: function(chainData) { self._onChain(chainData); },
    onGroup: function(groupData) { self._onGroup(groupData); },
    onAtom: function(atomData) { self._onAtom(atomData); },
    onBond: function(bondData) { self._onBond(bondData); }
  };

    // temporary variables used during traversal to track secondary structures
  this._ssType = -1;
  this._ssStruct = null;
  this._ssStart = null;

  // traverse the structure and listen to the events
  MMTF.traverse(mmtfData, eventCallbacks);

  this._updateSecStructure(this._complex);
  this._updateMolecules(mmtfData);
};

// During traversal atoms and residues don't come sequentially
// so a residue for certain atom can be unavailable. Thus we
// store residue index in atom.
// This function being called after traversal replaces the index
// with actual reference, and also populates atom lists in residues.
MMTFParser.prototype._linkAtomsToResidues = function() {
  for (var i = 0; i < this._complex._atoms.length; ++i) {
    var atom = this._complex._atoms[i];
    var residue = this._complex._residues[atom._residue];
    atom._residue = residue;
    residue._atoms.push(atom);
  }
};

MMTFParser.prototype._findSynonymousChains = function() {
  var named = {};
  for (var i = 0; i < this._complex._chains.length; ++i) {
    var chain = this._complex._chains[i];
    var name = chain.getName();
    if (!named.hasOwnProperty(name)) {
      named[name] = [];
    }

    named[name].push(chain._index);
  }

  return named;
};

// NOTE: This function relies on original chain indices, so it must be called before any magic happens to chains.
MMTFParser.prototype._parseAssemblyInfo = function(mmtfData) {
  var i, j, k;
  var assemblies = [];
  var logger = this.logger;

  for (i = 0; i < mmtfData.bioAssemblyList.length; ++i) {
    var baInfo = mmtfData.bioAssemblyList[i];
    if (baInfo.transformList.length === 0) {
      continue;
    }

    var chains = baInfo.transformList[0].chainIndexList;
    var chainListCheck = new ArrayComparator(chains);

    // build list of chain names
    var chainNames = {};
    for (j = 0; j < chains.length; ++j) {
      chainNames[this._complex._chains[chains[j]].getName()] = 1;
    }

    // all chains with the same name should belong to assembly if one of them belongs
    var allChains = [];
    var name;
    for (name in chainNames) {
      if (chainNames.hasOwnProperty(name)) {
        // just concat arrays -- there should be no duplicates
        Array.prototype.push.apply(allChains, this._chainsByName[name]);
      }
    }
    if (!chainListCheck.compare(allChains)) {
      // assembly is missing some of the chains
      logger.debug('MMTF: Assembly is missing some of the synonymous chains. Skipping...');
    }

    var a = new Assembly(this._complex);

    // add chains to assembly
    for (name in chainNames) {
      if (chainNames.hasOwnProperty(name)) {
        a.addChain(name);
      }
    }

    // add unique matrices to assembly
    a.addMatrix(new THREE.Matrix4().fromArray(baInfo.transformList[0].matrix).transpose());
    for (j = 1; j < baInfo.transformList.length; ++j) {
      var transform = baInfo.transformList[j];

      if (!chainListCheck.compare(transform.chainIndexList)) {
        // list of chains for this transform doesn't match that for other transforms
        // this is illegal in our structure
        logger.debug('MMTF: Chain lists differ for different transforms in one assembly. Skipping...');
        continue;
      }

      var m = new THREE.Matrix4().fromArray(transform.matrix).transpose();

      // check if matrix is already in the list
      for (k = 0; k < a.matrices.length; ++k) {
        if (a.matrices[k].equals(m)) {
          break;
        }
      }

      if (k === a.matrices.length) {
        a.addMatrix(m);
      }
    }

    a.finalize();
    assemblies.push(a);
  }

  return assemblies;
};

// NOTE: This function relies on original chain indices, so it must be called before any magic happens to chains.
MMTFParser.prototype._markHeteroAtoms = function(mmtfData) {
  var chainsInModel0 = mmtfData.chainsPerModel[0];
  for (var i = 0; i < mmtfData.entityList.length; ++i) {
    var entity = mmtfData.entityList[i];
    if (entity.type !== 'polymer') {
      for (var j = 0; j < entity.chainIndexList.length; ++j) {
        var chainIndex = entity.chainIndexList[j];
        // skip chains in models other than the first one
        if (chainIndex >= chainsInModel0) {
          continue;
        }
        var chain = this._complex._chains[chainIndex];
        for (var k = 0; k < chain._residues.length; ++k) {
          var res = chain._residues[k];
          for (var m = 0; m < res._atoms.length; ++m) {
            res._atoms[m]._het = true;
          }
        }
      }
    }
  }
};

// joins chains with the same name into single chain
MMTFParser.prototype._joinSynonymousChains = function() {
  var i, j;

  var primaryChainsArray = [];
  var primaryChainsHash = {};

  // join chains
  for (i = 0; i < this._complex._chains.length; ++i) {
    var chain = this._complex._chains[i];
    var name = chain.getName();
    if (!primaryChainsHash.hasOwnProperty(name)) {
      // new name -- this is a primary chain
      primaryChainsHash[name] = chain;
      chain._index = primaryChainsArray.length; // update index as this array will later replace original chain list
      primaryChainsArray.push(chain);
      continue;
    }

    // this chain should be joined with the primary chain of the same name
    var primary = primaryChainsHash[name];
    for (j = 0; j < chain._residues.length; ++j) {
      var residue = chain._residues[j];
      primary._residues.push(residue);
      residue._chain = primary;
    }
  }

  // replace chains list with one containing only primary chains
  // dropping references to all chains but primary
  this._complex._chains = primaryChainsArray;
};

MMTFParser.prototype.parseSync = function() {
  const mmtfData = MMTF.decode(this._data);

  this._complex = new Complex();
  this._serialAtomMap = {}; // filled during traversal

  this._traverse(mmtfData);
  this._linkAtomsToResidues();
  this._markHeteroAtoms(mmtfData);
  this._chainsByName = this._findSynonymousChains();
  Array.prototype.push.apply(this._complex.structures, this._parseAssemblyInfo(mmtfData));
  this._joinSynonymousChains();

  this._complex.finalize({
    needAutoBonding: false,
    detectAromaticLoops: this.settings.now.aromatic,
    enableEditing: this.settings.now.editing,
    serialAtomMap: this._serialAtomMap
  });

  return this._complex;
};

MMTFParser.formats = ['mmtf'];
MMTFParser.extensions = ['.mmtf'];
MMTFParser.binary = true;

export default MMTFParser;
