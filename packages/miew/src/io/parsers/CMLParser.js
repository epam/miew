import _ from 'lodash';
import * as THREE from 'three';
import Parser from './Parser';
import chem from '../../chem';

const {
  Complex,
  Element,
  SGroup,
  Bond,
} = chem;

const cOrderCharCodes = {
  A: 0,
  S: 1,
  D: 2,
  T: 3,
};

const cmlStartRegexp = /\s*<\?xml\b[^?>]*\?>\s*<(?:cml|molecule)\b/i;

class CMLParser extends Parser {
  constructor(data, options) {
    super(data, options);
    this._complex = null;
    this._residue = null;
    this._serialAtomMap = null;
    this._modelId = 1;
    this._lastMolId = -1;
    this._readOnlyOneMolecule = false;
    this._options.fileType = 'cml';
  }

  static canProbablyParse(data) {
    return _.isString(data) && cmlStartRegexp.test(data);
  }

  _rebuidBondIndexes(atoms, bonds) {
    const count = atoms.length;
    for (let i = 0; i < count; i++) {
      const atomId = atoms[i].id;

      const countBonds = bonds.length;
      for (let j = 0; j < countBonds; j++) {
        const idxs = bonds[j].atomRefs2.split(' ');
        if (idxs[0] === atomId) {
          bonds[j].start = i;
        }

        if (idxs[1] === atomId) {
          bonds[j].end = i;
        }
      }
    }
  }

  _createSGroup(molecule, moleculeArr) {
    const newGroup = new SGroup(
      molecule.id,
      molecule.fieldData,
      new THREE.Vector3(parseFloat(molecule.x), parseFloat(molecule.y), 0),
      molecule.atomRefs,
      molecule,
    );
    if (molecule.placement === 'Relative') {
      newGroup._center = new THREE.Vector3(0, 0, 0);
    }
    if (molecule.fieldName === 'MDLBG_FRAGMENT_CHARGE') {
      newGroup._charge = parseInt(molecule.fieldData, 10) || 0;
    }
    if (molecule.fieldName === 'MDLBG_FRAGMENT_COEFFICIENT') {
      newGroup._repeat = parseInt(molecule.fieldData, 10) || 1;
    }
    moleculeArr.push(newGroup);
  }

  _extractSGroup(molecule, moleculeArr) {
    if (!Array.isArray(moleculeArr)) {
      moleculeArr = [];
    }

    if (molecule) {
      if (Array.isArray(molecule)) {
        const count = molecule.length;
        for (let i = 0; i < count; i++) {
          if (molecule[i].molecule) {
            moleculeArr = moleculeArr.concat(this._extractSGroup(molecule[i].molecule));
          }
          this._createSGroup(molecule[i], moleculeArr);
        }
      } else {
        if (molecule.molecule) {
          if (molecule.molecule) {
            moleculeArr = moleculeArr.concat(this._extractSGroup(molecule.molecule));
          }
        }
        this._createSGroup(molecule, moleculeArr);
      }
    }

    return moleculeArr;
  }

  _extractSGroups(molecule, atoms) {
    const moleculeArr = this._extractSGroup(molecule);

    const count = atoms.length;
    let i;
    let j;

    for (i = 0; i < count; i++) {
      const atomId = atoms[i].id;
      for (j = 0; j < moleculeArr.length; j++) {
        const firstAtomRef = moleculeArr[j]._atoms.split(' ')[0];
        if (firstAtomRef === atomId) {
          if (!atoms[i].sgroupRef) {
            atoms[i].sgroupRef = [];
          }
          atoms[i].sgroupRef.push(moleculeArr[j]);
        }
      }
    }
    // build sGroups centers
    let atomMap = {}; // sgrpmap cache
    let mapEntry = null;
    const nLimon = 100000000;
    const bLow = new THREE.Vector3(nLimon, nLimon, nLimon);
    const bHight = new THREE.Vector3(-nLimon, -nLimon, -nLimon);

    function cycleFuncInner(e) {
      mapEntry = atomMap[e];
      if (mapEntry) {
        moleculeArr[j]._atoms.push(mapEntry.a);
      }
    }

    function cycleFunc(e) {
      mapEntry = atomMap[e];
      if (mapEntry) {
        bLow.set(Math.min(bLow.x, mapEntry.x), Math.min(bLow.y, mapEntry.y), Math.min(bLow.z, mapEntry.z));
        bHight.set(Math.max(bHight.x, mapEntry.x), Math.max(bHight.y, mapEntry.y), Math.max(bHight.z, mapEntry.z));
        cycleFuncInner(e);
      }
    }

    for (i = 0; i < atoms.length; i++) {
      atomMap[atoms[i].id] = {};
      atomMap[atoms[i].id].x = atoms[i].x2;
      if (atoms[i].x3) {
        atomMap[atoms[i].id].x = atoms[i].x3;
      }
      atomMap[atoms[i].id].x = parseFloat(atomMap[atoms[i].id].x);
      atomMap[atoms[i].id].y = atoms[i].y2;
      if (atoms[i].y3) {
        atomMap[atoms[i].id].y = atoms[i].y3;
      }
      atomMap[atoms[i].id].y = parseFloat(atomMap[atoms[i].id].y);
      atomMap[atoms[i].id].z = '0.0';
      if (atoms[i].z3) {
        atomMap[atoms[i].id].z = atoms[i].z3;
      }
      atomMap[atoms[i].id].z = parseFloat(atomMap[atoms[i].id].z);
      atomMap[atoms[i].id].a = atoms[i];
    }

    let atomsRef;
    for (j = 0; j < moleculeArr.length; j++) {
      if (moleculeArr[j]._center !== null) {
        bLow.set(nLimon, nLimon, nLimon);
        bHight.set(-nLimon, -nLimon, -nLimon);
        atomsRef = moleculeArr[j]._atoms.split(' ');
        moleculeArr[j]._atoms = [];
        atomsRef.forEach(cycleFunc);

        moleculeArr[j]._center.addVectors(bLow, bHight);
        moleculeArr[j]._center.multiplyScalar(0.5);
      } else {
        atomsRef = moleculeArr[j]._atoms.split(' ');
        moleculeArr[j]._atoms = [];
        atomsRef.forEach(cycleFuncInner);
      }
    }
    atomMap = null;
  }

  _traverseData(dom) {
    function isArray(o) {
      return Object.prototype.toString.apply(o) === '[object Array]';
    }

    function parseNode(xmlNode, result) {
      if (xmlNode.nodeName === '#text' && xmlNode.nodeValue.trim() === '') {
        return;
      }

      const jsonNode = {};
      jsonNode.xmlNode = xmlNode;
      const existing = result[xmlNode.nodeName];
      if (existing) {
        if (!isArray(existing)) {
          result[xmlNode.nodeName] = [existing, jsonNode];
        } else {
          result[xmlNode.nodeName].push(jsonNode);
        }
      } else {
        result[xmlNode.nodeName] = jsonNode;
      }

      let length;
      let i;
      if (xmlNode.attributes) {
        ({ length } = xmlNode.attributes);
        for (i = 0; i < length; i++) {
          const attribute = xmlNode.attributes[i];
          jsonNode[attribute.nodeName] = attribute.nodeValue;
        }
      }

      ({ length } = xmlNode.childNodes);
      for (i = 0; i < length; i++) {
        parseNode(xmlNode.childNodes[i], jsonNode);
      }
    }

    const result = {};
    if (dom.childNodes.length) {
      parseNode(dom.childNodes[0], result);
    }

    return result;
  }

  _findSuitableMolecule(data, molSet) {
    for (const key in data) {
      if (key === 'xmlNode') {
        continue;
      } else if (key === 'molecule') {
        if (data.molecule) {
          if (data.molecule.atomArray && data.molecule.atomArray.atom) {
            molSet.push(data);
          }
          if (Array.isArray(data.molecule)) {
            for (let i = 0; i < data.molecule.length; i++) {
              if (data.molecule[i].atomArray && data.molecule[i].atomArray.atom) {
                molSet.push({ molecule: data.molecule[i] });
              }
            }
          }
        }
      } else if (data[key] && data[key] !== null && typeof (data[key]) === 'object') {
        this._findSuitableMolecule(data[key], molSet);
      }
    }
  }

  _selectComponents(text) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'application/xml');
    const traversedData = this._traverseData(doc);
    let rawData;
    const self = this;

    function prepareComponentCompound(data) {
      let atoms = [];
      if (data.molecule && data.molecule.atomArray && data.molecule.atomArray.atom) {
        if (!Array.isArray(data.molecule.atomArray.atom)) {
          atoms.push(data.molecule.atomArray.atom);
        } else {
          atoms = data.molecule.atomArray.atom;
        }
      } else if (!data.molecule) {
        const ret = {};
        ret.atomLabels = null;
        ret.labelsCount = 1;
        return ret;
      }

      if (data.molecule.molecule) {
        self._extractSGroups(data.molecule.molecule, atoms);
      }

      let atom;
      let count = atoms.length;
      for (let i = 0; i < count; i++) {
        atom = atoms[i];
        atom.edges = [];
      }

      let localBond = [];
      if (data.molecule.bondArray && data.molecule.bondArray.bond) {
        if (!Array.isArray(data.molecule.bondArray.bond)) {
          localBond.push(data.molecule.bondArray.bond);
        } else {
          localBond = data.molecule.bondArray.bond;
        }
      }
      let bond;
      count = localBond.length;
      self._rebuidBondIndexes(atoms, localBond);

      function addCurrBond(index) {
        bond = localBond[index];
        atom = atoms[bond.start];
        if (!atom) {
          return false;
        }
        atom.edges.push(bond.end);
        atom = atoms[bond.end];
        if (!atom) {
          return false;
        }
        atom.edges.push(bond.start);
        return true;
      }

      for (let i = 0; i < count; i++) {
        if (!addCurrBond(i)) {
          // ignore invalid bond
          continue;
        }
        const orderAttr = bond.xmlNode.getAttribute('order');
        const tc = parseInt(orderAttr, 10);
        // the default bond order is unknown
        localBond[i].order = 0;
        localBond[i].type = Bond.BondType.UNKNOWN;
        if (tc > 1) {
          localBond[i].order = tc;
        } else {
          // another option - bond order is a string
          const order = cOrderCharCodes[orderAttr];
          if (order !== undefined) {
            localBond[i].order = order;
            if (orderAttr === 'A') {
              localBond[i].type = Bond.BondType.AROMATIC;
            }
          }
        }
      }

      count = atoms.length;
      for (let i = 0; i < count; i++) {
        atom = atoms[i];
        atom.edges.sort();
      }

      const labels = self._breadWidthSearch(atoms, 0); // for now

      const retStruct = {};
      retStruct.atoms = atoms;
      retStruct.bonds = localBond;
      retStruct.labels = labels.atomLabels;
      retStruct.count = Math.min(1, labels.labelsCount); // for now
      retStruct.curr = -1;
      retStruct.originalCML = doc;

      return retStruct;
    }

    if (traversedData.cml) {
      rawData = traversedData.cml;
    } else {
      rawData = traversedData;
    }
    const retData = [];
    const filteredData = [];
    this._findSuitableMolecule(rawData, filteredData);
    if (this._readOnlyOneMolecule && filteredData.length > 1) {
      filteredData.splice(1, filteredData.length - 1);
    }
    filteredData.forEach((d) => {
      const rd = prepareComponentCompound(d);
      if (rd.atoms.length > 0) {
        retData.push(rd);
      }
    });
    return retData;
  }

  _packLabel(compId, molId) {
    const shift = 16;
    return (molId << shift) + compId;
  }

  _unpackLabel(l) {
    const shift = 16;
    const mask = (1 << shift) - 1;
    return { molId: l >>> shift, compId: l & mask };
  }

  _breadWidthSearch(atoms, molID) {
    const atomLabels = new Array(atoms.length);

    let id;
    for (id = 0; id < atomLabels.length; id++) {
      atomLabels[id] = this._packLabel(0, molID);
    }

    const breadthQueue = [];
    let componentID = 0;
    let labeledAtoms = atoms.length;

    while (labeledAtoms > 0) {
      componentID++;

      let startID = -1;
      for (id = 0; id < atomLabels.length; id++) {
        if (this._unpackLabel(atomLabels[id]).compId === 0) {
          startID = id;
          break;
        }
      }

      if (startID < 0) {
        break;
      }

      // Bread first search
      breadthQueue.push(atoms[startID]);
      atomLabels[startID] = this._packLabel(componentID, molID);
      labeledAtoms--;

      while (breadthQueue.length > 0) {
        const curr = breadthQueue.shift();
        if (!curr) {
          continue;
        }

        for (let i = 0; i < curr.edges.length; i++) {
          if (atomLabels[curr.edges[i]] !== componentID) {
            breadthQueue.push(atoms[curr.edges[i]]);
            atomLabels[curr.edges[i]] = componentID;
            labeledAtoms--;
          }
        }
      }
    }
    const ret = {};
    ret.atomLabels = atomLabels;
    ret.labelsCount = componentID;
    return ret;
  }

  _parseBond(eAtom, mainAtom, order, type) {
    if (eAtom >= 0) {
      const h = [Math.min(eAtom, mainAtom), Math.max(eAtom, mainAtom)];
      this._complex.addBond(h[0], h[1], order, type, true);
    }
  }

  _fixBondsArray() {
    const serialAtomMap = this._serialAtomMap = {};
    const complex = this._complex;

    const atoms = complex._atoms;
    for (let i = 0, ni = atoms.length; i < ni; ++i) {
      const atom = atoms[i];
      serialAtomMap[atom.serial] = atom;
    }

    const bonds = complex._bonds;
    const { logger } = this;
    for (let j = 0, nj = bonds.length; j < nj; ++j) {
      const bond = bonds[j];
      if (bond._right < bond._left) {
        logger.debug('_fixBondsArray: Logic error.');
      }
      bond._left = serialAtomMap[bond._left] || null;
      bond._right = serialAtomMap[bond._right] || null;
    }
  }

  _parseSet(varData) {
    const complex = this._complex = new Complex();
    const data = varData;
    const currentLabel = data.curr;
    const { atoms, labels } = data;
    let atom = null;
    let i;
    let j;
    const count = atoms.length;

    function addFunc(a) {
      a.xmlNodeRef = atom;
      if (atom.x2) {
        atom.x3 = atom.x2;
        delete atom.x2;
      }
      if (atom.y2) {
        atom.y3 = atom.y2;
        delete atom.y2;
      }
      if (!(atom.z3)) {
        atom.z3 = '0.0';
      }
      atom.complexAtom = a;
    }

    let chains = {};
    // parse atoms in label order
    const reorder = [];
    for (i = 0; i < count; i++) {
      reorder.push(i);
    }
    reorder.sort((a, b) => labels[a] - labels[b]);
    for (i = 0; i < count; i++) {
      const atomCharge = 0;
      const lLabel = labels[reorder[i]];
      if (this._unpackLabel(lLabel).molId === this._unpackLabel(currentLabel).molId) {
        atom = atoms[reorder[i]];
        const atomFullNameStruct = atom.elementType;

        if (atom.sgroupRef) {
          const countRef = atom.sgroupRef.length;
          for (let k = 0; k < countRef; ++k) {
            complex._sgroups.push(atom.sgroupRef[k]);
          }
        }

        if (atom.x3 || atom.x2) {
          const currAtomComp = this._unpackLabel(lLabel).compId;
          // use ' ' by default instead of synthetic creation of chain names
          const chainID = ' '; //= String.fromCharCode('A'.charCodeAt(0) + currAtomComp);
          const resSeq = currAtomComp;
          const iCode = ' ';
          let strLabel = currAtomComp.toString();
          if (strLabel.length === 1) {
            strLabel = `0${strLabel}`;
          }
          const resName = `N${strLabel}`;
          let chain = chains[chainID];
          if (!chain || chain.getName() !== chainID) {
            chains[chainID] = chain = this._complex.getChain(chainID) || this._complex.addChain(chainID);
            this._residue = null;
          }

          let residue = this._residue;
          if (!residue || residue.getSequence() !== resSeq || residue.getICode() !== iCode) {
            this._residue = residue = chain.addResidue(resName, resSeq, iCode);
          }

          // _x, _y, _z, mname, mindex, atomNameFull, atomName, chainID, serial, isHet, atlLocInd, atomNameToTypeF
          let xyz = null;
          if (atom.x3) {
            xyz = new THREE.Vector3(parseFloat(atom.x3), parseFloat(atom.y3), parseFloat(atom.z3));
          } else if (atom.x2) {
            xyz = new THREE.Vector3(parseFloat(atom.x2), parseFloat(atom.y2), 0);
          }
          let element = Element.ByName[atom.elementType.toUpperCase()];
          if (!element) {
            element = (JSON.parse(JSON.stringify(Element.ByName[
              Object.keys(Element.ByName)[Object.keys(Element.ByName).length - 1]])));
            element.number += 1;
            element.name = atom.elementType.toUpperCase();
            element.fullName = 'Unknown';
            Element.ByName[atom.elementType.toUpperCase()] = element;
          }
          const atomSerial = parseInt(atom.id.replace(/[^0-9]/, ''), 10);
          const added = residue.addAtom(
            atomFullNameStruct,
            element,
            xyz,
            Element.Role.SG,
            true,
            atomSerial,
            ' ',
            1.0,
            0.0,
            atomCharge,
          );
          if (atom.hydrogenCount) {
            added.hydrogenCount = parseInt(atom.hydrogenCount, 10);
          }
          if (atom.mrvValence) {
            added.valence = parseInt(atom.mrvValence, 10);
          }
          addFunc(added);
        }
      }
    }
    chains = null;// NOSONAR
    for (i = 0; i < data.bonds.length; i++) {
      const cb = data.bonds[i];
      if (this._unpackLabel(labels[cb.start]).molId === this._unpackLabel(currentLabel).molId
          && this._unpackLabel(labels[cb.end]).molId === this._unpackLabel(currentLabel).molId) {
        atom = atoms[cb.start];
        if (!atom || !(atoms[cb.end])) {
          continue; // skip invalid
        }
        this._parseBond(
          parseInt(atom.id.replace(/[^0-9]/, ''), 10),
          parseInt(atoms[cb.end].id.replace(/[^0-9]/, ''), 10),
          cb.order,
          cb.type,
        );
      }
    }

    for (i = 0; i < this._complex.getSGroupCount(); i++) {
      const sGrp = this._complex.getSGroups()[i];
      for (j = 0; j < sGrp._atoms.length; j++) {
        sGrp._atoms[j] = sGrp._atoms[j].complexAtom;
      }
    }
    for (i = 0; i < count; i++) {
      if (this._unpackLabel(labels[i]).molId === this._unpackLabel(currentLabel).molId) {
        atom = atoms[i];
        atom.complexAtom = null;
        delete atom.complexAtom;
      }
    }
    this._complex.originalCML = data.originalCML;
    this._fixBondsArray();
    complex.finalize({
      needAutoBonding: false,
      detectAromaticLoops: this.settings.now.aromatic,
      enableEditing: this.settings.now.editing,
      serialAtomMap: this._serialAtomMap,
    });
    this._serialAtomMap = null;
    this._complex = null;
    return complex;
  }

  parseSync() {
    const complexes = [];
    const self = this;
    const moleculaSet = this._selectComponents(this._data);
    moleculaSet.forEach((molSet) => {
      molSet.curr = 2;
      if (molSet.count === 0) {
        molSet.count = 1;
      }
      for (let i = 0; i < molSet.count; i++) {
        molSet.curr = (i + 1);
        complexes.push(self._parseSet(molSet, false));
      }
    });

    let totalAtomsParsed = 0;
    complexes.forEach((c) => {
      totalAtomsParsed += c.getAtomCount();
    });
    if (totalAtomsParsed <= 0) {
      throw new Error('The data does not contain valid atoms');
    }

    if (complexes.length > 1) {
      const joinedComplex = new Complex();
      joinedComplex.joinComplexes(complexes);
      joinedComplex.originalCML = complexes[0].originalCML;
      return joinedComplex;
    }
    if (complexes.length === 1) {
      return complexes[0];
    }
    return new Complex();
  }
}

CMLParser.formats = ['cml'];
CMLParser.extensions = ['.cml'];

export default CMLParser;
