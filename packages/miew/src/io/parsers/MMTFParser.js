import * as THREE from 'three';
import _ from 'lodash';
import Parser from './Parser';
import chem from '../../chem';
import MMTF from '../../../vendor/js/mmtf';
import StructuralElement from '../../chem/StructuralElement';

const {
  Complex,
  Chain,
  Atom,
  Element,
  Helix,
  Sheet,
  Strand,
  Bond,
  Assembly,
  Molecule,
} = chem;

class ArrayComparator {
  constructor(original) {
    this._original = Array.from(original);
    this._original.sort();

    this._sum = 0;
    for (let i = 0; i < this._original.length; ++i) {
      this._sum += this._original[i];
    }
  }

  compare(candidate) {
    const len = candidate.length;
    if (len !== this._original.length) {
      return false;
    }

    let sum = 0;
    let i;
    for (i = 0; i < len; ++i) {
      sum += candidate[i];
    }

    if (sum !== this._sum) {
      return false;
    }

    const sorted = Array.from(candidate);
    sorted.sort();

    for (i = 0; i < len; ++i) {
      if (sorted[i] !== this._original[i]) {
        return false;
      }
    }

    return true;
  }
}

ArrayComparator.prototype.constructor = ArrayComparator;

const StructuralElementType = StructuralElement.Type;

// see https://github.com/rcsb/mmtf-javascript/blob/master/src/mmtf-traverse.js
const secStructToType = [
  StructuralElementType.HELIX_PI, // 0
  StructuralElementType.BEND, // 1
  StructuralElementType.HELIX_ALPHA, // 2
  StructuralElementType.STRAND, // 3
  StructuralElementType.HELIX_310, // 4
  StructuralElementType.BRIDGE, // 5
  StructuralElementType.TURN, // 6
  StructuralElementType.COIL, // 7
];

function getFirstByte(buf) {
  const bytes = new Uint8Array(buf, 0, 1);
  return bytes[0];
}

class MMTFParser extends Parser {
  constructor(data, options) {
    super(data, options);
    this._options.fileType = 'mmtf';
  }

  static canProbablyParse(data) {
    // check if it's binary MessagePack format containing a map (dictionary)
    // see https://github.com/msgpack/msgpack/blob/master/spec.md
    return _.isArrayBuffer(data) && ((getFirstByte(data) | 1) === 0xDF);
  }

  _onModel(_modelData) {
  }

  _onChain(chainData) {
    if (chainData.modelIndex !== 0) {
      return;
    }

    const chain = new Chain(this._complex, chainData.chainName);
    this._complex._chains[chainData.chainIndex] = chain;
    chain._index = chainData.chainIndex;
  }

  _onGroup(groupData) {
    if (groupData.modelIndex !== 0) {
      return;
    }

    if (this.settings.now.nowater) {
      // skip water
      if (groupData.groupName === 'HOH' || groupData.groupName === 'WAT') {
        return;
      }
    }

    const chain = this._complex._chains[groupData.chainIndex];
    const icode = !groupData.insCode.charCodeAt(0) ? '' : groupData.insCode;
    const residue = chain.addResidue(groupData.groupName, groupData.groupId, icode);
    residue._index = groupData.groupIndex;

    this._updateSecStructure(this._complex, residue, groupData);
  }

  _onAtom(atomData) {
    if (atomData.modelIndex !== 0) {
      return;
    }

    const altLoc = !atomData.altLoc.charCodeAt(0) ? '' : atomData.altLoc;
    const atom = new Atom(
      atomData.groupIndex, // we store residue index here to replace it later with actual reference
      atomData.atomName,
      Element.getByName(atomData.element.toUpperCase()),
      new THREE.Vector3(atomData.xCoord, atomData.yCoord, atomData.zCoord),
      Element.Role[atomData.atomName],
      false, // hetero atoms will be marked later
      atomData.atomId,
      altLoc,
      atomData.occupancy,
      atomData.bFactor,
      atomData.formalCharge,
    );

    this._complex._atoms[atomData.atomIndex] = atom;
    atom.index = atomData.atomIndex;

    this._serialAtomMap[atomData.atomId] = atom;
  }

  _onBond(bondData) {
    const right = Math.max(bondData.atomIndex1, bondData.atomIndex2);
    if (right >= this._complex._atoms.length) {
      return;
    }
    const left = Math.min(bondData.atomIndex1, bondData.atomIndex2);
    this._complex.addBond(
      this._complex._atoms[left],
      this._complex._atoms[right],
      bondData.bondOrder,
      Bond.BondType.UNKNOWN,
      true,
    );
  }

  _updateSecStructure(complex, residue, groupData) {
    const helixClasses = [3, -1, 1, -1, 5];

    if (!_.isUndefined(groupData) && groupData.secStruct === this._ssType) {
      residue._secondary = this._ssStruct;
      if (this._ssStruct) {
        this._ssStruct.term = residue;
      }
      return;
    }

    if (!_.isUndefined(groupData)) {
      // start new secondary structure
      const type = secStructToType[groupData.secStruct];
      this._ssType = groupData.secStruct;
      this._ssStart = residue;

      let struct = null;
      switch (this._ssType) {
        case -1: // undefined
        case 7: // coil
          break;
        case 0: // pi helix
        case 2: // alpha helix
        case 4: // 3-10 helix
          struct = new Helix(helixClasses[this._ssType], residue, residue, 0, '', '', 0);
          complex._helices.push(struct);
          break;
        case 3: { // extended
          const sheet = new Sheet('', 0);
          complex._sheets.push(sheet);
          struct = new Strand(sheet, residue, residue, 0, null, null);
          break;
        }
        default:
          if (type !== undefined) {
            struct = new StructuralElement(type, residue, residue);
          }
          break;
      }

      this._ssStruct = struct;
      residue._secondary = struct;
      if (struct) {
        complex.structures.push(struct);
      }
    }
  }

  _updateMolecules(mmtfData) {
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
      molecule.residues = residues;
      this._complex._molecules[i] = molecule;
    }
  }

  // populate complex with chains, residues and atoms
  _traverse(mmtfData) {
    const self = this;

    // get metadata
    const { metadata } = this._complex;
    metadata.id = mmtfData.structureId;
    metadata.title = [];
    metadata.title[0] = mmtfData.title;
    metadata.date = mmtfData.releaseDate;
    metadata.format = 'mmtf';

    // create event callback functions
    const eventCallbacks = {
      onModel(modelData) {
        self._onModel(modelData);
      },
      onChain(chainData) {
        self._onChain(chainData);
      },
      onGroup(groupData) {
        self._onGroup(groupData);
      },
      onAtom(atomData) {
        self._onAtom(atomData);
      },
      onBond(bondData) {
        self._onBond(bondData);
      },
    };

    // temporary variables used during traversal to track secondary structures
    this._ssType = -1;
    this._ssStruct = null;
    this._ssStart = null;

    // traverse the structure and listen to the events
    MMTF.traverse(mmtfData, eventCallbacks);

    this._updateSecStructure(this._complex);
    this._updateMolecules(mmtfData);
  }

  // During traversal atoms and residues don't come sequentially
  // so a residue for certain atom can be unavailable. Thus we
  // store residue index in atom.
  // This function being called after traversal replaces the index
  // with actual reference, and also populates atom lists in residues.
  _linkAtomsToResidues() {
    for (let i = 0; i < this._complex._atoms.length; ++i) {
      const atom = this._complex._atoms[i];
      const residue = this._complex._residues[atom.residue];
      atom.residue = residue;
      residue._atoms.push(atom);
    }
  }

  _findSynonymousChains() {
    const named = {};
    for (let i = 0; i < this._complex._chains.length; ++i) {
      const chain = this._complex._chains[i];
      const name = chain.getName();
      if (!named.hasOwnProperty(name)) {
        named[name] = [];
      }

      named[name].push(chain._index);
    }

    return named;
  }

  // NOTE: This function relies on original chain indices, so it must be called before any magic happens to chains.
  _parseAssemblyInfo(mmtfData) {
    let i;
    let j;
    let k;
    const assemblies = [];
    const { logger } = this;

    for (i = 0; i < mmtfData.bioAssemblyList.length; ++i) {
      const baInfo = mmtfData.bioAssemblyList[i];
      if (baInfo.transformList.length === 0) {
        continue;
      }

      const chains = baInfo.transformList[0].chainIndexList;
      const chainListCheck = new ArrayComparator(chains);

      // build list of chain names
      const chainNames = {};
      for (j = 0; j < chains.length; ++j) {
        chainNames[this._complex._chains[chains[j]].getName()] = 1;
      }

      // all chains with the same name should belong to assembly if one of them belongs
      const allChains = [];
      let name;
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

      const a = new Assembly(this._complex);

      // add chains to assembly
      for (name in chainNames) {
        if (chainNames.hasOwnProperty(name)) {
          a.addChain(name);
        }
      }

      // add unique matrices to assembly
      a.addMatrix(new THREE.Matrix4().fromArray(baInfo.transformList[0].matrix).transpose());
      for (j = 1; j < baInfo.transformList.length; ++j) {
        const transform = baInfo.transformList[j];

        if (!chainListCheck.compare(transform.chainIndexList)) {
          // list of chains for this transform doesn't match that for other transforms
          // this is illegal in our structure
          logger.debug('MMTF: Chain lists differ for different transforms in one assembly. Skipping...');
          continue;
        }

        const m = new THREE.Matrix4().fromArray(transform.matrix).transpose();

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
  }

  // NOTE: This function relies on original chain indices, so it must be called before any magic happens to chains.
  _markHeteroAtoms(mmtfData) {
    const chainsInModel0 = mmtfData.chainsPerModel[0];
    for (let i = 0; i < mmtfData.entityList.length; ++i) {
      const entity = mmtfData.entityList[i];
      if (entity.type !== 'polymer') {
        for (let j = 0; j < entity.chainIndexList.length; ++j) {
          const chainIndex = entity.chainIndexList[j];
          // skip chains in models other than the first one
          if (chainIndex >= chainsInModel0) {
            continue;
          }
          const chain = this._complex._chains[chainIndex];
          for (let k = 0; k < chain._residues.length; ++k) {
            const res = chain._residues[k];
            for (let m = 0; m < res._atoms.length; ++m) {
              res._atoms[m].het = true;
            }
          }
        }
      }
    }
  }

  // joins chains with the same name into single chain
  _joinSynonymousChains() {
    let i;
    let j;

    const primaryChainsArray = [];
    const primaryChainsHash = {};

    // join chains
    for (i = 0; i < this._complex._chains.length; ++i) {
      const chain = this._complex._chains[i];
      const name = chain.getName();
      if (!primaryChainsHash.hasOwnProperty(name)) {
        // new name -- this is a primary chain
        primaryChainsHash[name] = chain;
        chain._index = primaryChainsArray.length; // update index as this array will later replace original chain list
        primaryChainsArray.push(chain);
        continue;
      }

      // this chain should be joined with the primary chain of the same name
      const primary = primaryChainsHash[name];
      for (j = 0; j < chain._residues.length; ++j) {
        const residue = chain._residues[j];
        primary._residues.push(residue);
        residue._chain = primary;
      }
    }

    // replace chains list with one containing only primary chains
    // dropping references to all chains but primary
    this._complex._chains = primaryChainsArray;
  }

  parseSync() {
    const mmtfData = MMTF.decode(this._data);

    this._complex = new Complex();
    this._serialAtomMap = {}; // filled during traversal

    this._traverse(mmtfData);
    this._linkAtomsToResidues();
    this._markHeteroAtoms(mmtfData);
    this._chainsByName = this._findSynonymousChains();
    Array.prototype.push.apply(this._complex.units, this._parseAssemblyInfo(mmtfData));
    this._joinSynonymousChains();

    this._complex.finalize({
      needAutoBonding: false,
      detectAromaticLoops: this.settings.now.aromatic,
      enableEditing: this.settings.now.editing,
      serialAtomMap: this._serialAtomMap,
    });

    return this._complex;
  }
}

MMTFParser.formats = ['mmtf'];
MMTFParser.extensions = ['.mmtf'];
MMTFParser.binary = true;

export default MMTFParser;
