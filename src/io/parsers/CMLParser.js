import _ from 'lodash';
import Parser from './Parser';
import chem from '../../chem';
import * as THREE from 'three';

var
  Complex = chem.Complex,
  Element = chem.Element,
  AtomName = chem.AtomName,
  SGroup = chem.SGroup,
  Bond = chem.Bond;

var cOrderCharCodes = {
  A: 0,
  S: 1,
  D: 2,
  T: 3
};

function CMLParser(data, options) {
  Parser.call(this, data, options);

  this._complex = null;
  this._sheet = null;
  this._residue = null;
  this._serialAtomMap = null;
  this._modelId = 1;
  this._lastMolId = -1;
  this._readOnlyOneMolecule = false;

  this._options.fileType = 'cml';
}

////////////////////////////////////////////////////////////////////////////
// Inheritance

CMLParser.prototype = Object.create(Parser.prototype);
CMLParser.prototype.constructor = CMLParser;

////////////////////////////////////////////////////////////////////////////
// Class methods

/** @deprecated */
CMLParser.canParse = function(data, options) {
  if (!data) {
    return false;
  }
  const re = new RegExp('^\\s*?\\<\\?xml');
  const re1 = new RegExp('^\\s*?\\<cml');
  const dataHasXML = (typeof data === 'string' || data instanceof String) && (data.match(re) || data.match(re1));
  return (
    dataHasXML &&
    Parser.checkDataTypeOptions(options, 'cml')
  );
};

const cmlStartRegexp = /\s*<\?xml\b[^?>]*\?>\s*<(?:cml|molecule)\b/i;

CMLParser.canProbablyParse = function(data) {
  return _.isString(data) && cmlStartRegexp.test(data);
};

////////////////////////////////////////////////////////////////////////////
// Instance methods

CMLParser.prototype._rebuidBondIndexes = function(atoms, bonds) {
  var count = atoms.length;
  for (var i = 0; i < count; i++) {
    var atomId = atoms[i].id;

    var countBonds = bonds.length;
    for (var j = 0; j < countBonds; j++) {
      var idxs = bonds[j].atomRefs2.split(' ');
      if (idxs[0] === atomId) {
        bonds[j].start = i;
      }

      if (idxs[1] === atomId) {
        bonds[j].end = i;
      }
    }
  }
};

CMLParser.prototype._createSGroup = function(molecule, moleculeArr) {
  var newGroup = new SGroup(
    molecule.id, molecule.fieldData,
    new THREE.Vector3(parseFloat(molecule.x), parseFloat(molecule.y), 0), molecule.atomRefs, molecule
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
};

CMLParser.prototype._extractSGroup = function(molecule, moleculeArr) {
  if (!Array.isArray(moleculeArr)) {
    moleculeArr = [];
  }

  if (molecule) {
    if (Array.isArray(molecule)) {
      var count = molecule.length;
      for (var i = 0; i < count; i++) {
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
};


CMLParser.prototype._extractSGroups = function(molecule, atoms) {
  var moleculeArr = this._extractSGroup(molecule);


  var count = atoms.length;
  var i;
  var j;

  for (i = 0; i < count; i++) {
    var atomId = atoms[i].id;
    for (j = 0; j < moleculeArr.length; j++) {
      var firstAtomRef = moleculeArr[j]._atoms.split(' ')[0];
      if (firstAtomRef === atomId) {
        if (!atoms[i].sgroupRef) {
          atoms[i].sgroupRef = [];
        }
        atoms[i].sgroupRef.push(moleculeArr[j]);
      }
    }
  }
  //build sGroups centers
  var atomMap = {}; //sgrpmap cache
  var mapEntry = null;
  var nLimon = 100000000;
  var bLow = new THREE.Vector3(nLimon, nLimon, nLimon);
  var bHight = new THREE.Vector3(-nLimon, -nLimon, -nLimon);

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

  var atomsRef;
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
};


CMLParser.prototype._traverseData = function(dom) {
  function isArray(o) {
    return Object.prototype.toString.apply(o) === '[object Array]';
  }

  function parseNode(xmlNode, result) {
    if (xmlNode.nodeName === '#text' && xmlNode.nodeValue.trim() === '') {
      return;
    }

    var jsonNode = {};
    jsonNode.xmlNode = xmlNode;
    var existing = result[xmlNode.nodeName];
    if (existing) {
      if (!isArray(existing)) {
        result[xmlNode.nodeName] = [existing, jsonNode];
      } else {
        result[xmlNode.nodeName].push(jsonNode);
      }
    } else {
      result[xmlNode.nodeName] = jsonNode;
    }

    var length;
    var i;
    if (xmlNode.attributes) {
      length = xmlNode.attributes.length;
      for (i = 0; i < length; i++) {
        var attribute = xmlNode.attributes[i];
        jsonNode[attribute.nodeName] = attribute.nodeValue;
      }
    }

    length = xmlNode.childNodes.length;
    for (i = 0; i < length; i++) {
      parseNode(xmlNode.childNodes[i], jsonNode);
    }
  }

  var result = {};
  if (dom.childNodes.length) {
    parseNode(dom.childNodes[0], result);
  }

  return result;
};

CMLParser.prototype._findSuitableMolecule = function(data, molSet) {
  for (var key in data) {
    if (key === 'xmlNode') {
      continue;
    } else if (key === 'molecule') {
      if (data.molecule) {
        if (data.molecule.atomArray && data.molecule.atomArray.atom) {
          molSet.push(data);
        }
        if (Array.isArray(data.molecule)) {
          for (var i = 0; i < data.molecule.length; i++) {
            if (data.molecule[i].atomArray && data.molecule[i].atomArray.atom) {
              molSet.push({molecule: data.molecule[i]});
            }
          }
        }
      }
    } else if (data[key] && data[key] !== null && typeof (data[key]) === 'object') {
      this._findSuitableMolecule(data[key], molSet);
    }
  }
};

CMLParser.prototype._selectComponents = function(text) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(text, 'application/xml');
  var traversedData = this._traverseData(doc);
  var rawData;
  var self = this;

  function prepareComponentCompound(data) {
    var atoms = [];
    if (data.molecule && data.molecule.atomArray && data.molecule.atomArray.atom) {
      if (!Array.isArray(data.molecule.atomArray.atom)) {
        atoms.push(data.molecule.atomArray.atom);
      } else {
        atoms = data.molecule.atomArray.atom;
      }
    } else if (!data.molecule) {
      var ret = {};
      ret.atomLabels = null;
      ret.labelsCount = 1;
      return ret;
    }

    if (data.molecule.molecule) {
      self._extractSGroups(data.molecule.molecule, atoms);
    }

    var atom;
    var count = atoms.length;
    for (let i = 0; i < count; i++) {
      atom = atoms[i];
      atom.edges = [];
    }

    var localBond = [];
    if (data.molecule.bondArray && data.molecule.bondArray.bond) {
      if (!Array.isArray(data.molecule.bondArray.bond)) {
        localBond.push(data.molecule.bondArray.bond);
      } else {
        localBond = data.molecule.bondArray.bond;
      }
    }
    var bond;
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
        //ignore invalid bond
        continue;
      }
      var orderAttr = bond.xmlNode.getAttribute('order');
      var tc = parseInt(orderAttr, 10);
      // the default bond order is unknown
      localBond[i].order = 0;
      localBond[i].type = Bond.BondType.UNKNOWN;
      if (tc > 1) {
        localBond[i].order = tc;
      } else {
        // another option - bond order is a string
        var order = cOrderCharCodes[orderAttr];
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

    var labels = self._breadWidthSearch(atoms, 0); //for now

    var retStruct = {};
    retStruct.atoms = atoms;
    retStruct.bonds = localBond;
    retStruct.labels = labels.atomLabels;
    retStruct.count = Math.min(1, labels.labelsCount); //for now
    retStruct.curr = -1;
    retStruct.originalCML = doc;

    return retStruct;
  }

  if (traversedData.cml) {
    rawData = traversedData.cml;
  } else {
    rawData = traversedData;
  }
  var retData = [];
  var filteredData = [];
  this._findSuitableMolecule(rawData, filteredData);
  if (this._readOnlyOneMolecule && filteredData.length > 1) {
    filteredData.splice(1, filteredData.length - 1);
  }
  filteredData.forEach(function(d) {
    var rd = prepareComponentCompound(d);
    if (rd.atoms.length > 0) {
      retData.push(rd);
    }
  });
  return retData;
};

CMLParser.prototype._packLabel = function(compId, molId) {
  var shift = 16;
  return (molId << shift) + compId;
};

CMLParser.prototype._unpackLabel = function(l) {
  var shift = 16;
  var mask = (1 << shift) - 1;
  return {molId: l >>> shift, compId: l & mask};
};

CMLParser.prototype._breadWidthSearch = function(atoms, molID) {
  var atomLabels = new Array(atoms.length);

  var id;
  for (id = 0; id < atomLabels.length; id++) {
    atomLabels[id] = this._packLabel(0, molID);
  }

  var breadthQueue = [];
  var componentID = 0;
  var labeledAtoms = atoms.length;

  while (labeledAtoms > 0) {
    componentID++;

    var startID = -1;
    for (id = 0; id < atomLabels.length; id++) {
      if (this._unpackLabel(atomLabels[id]).compId === 0) {
        startID = id;
        break;
      }
    }

    if (startID < 0) {
      break;
    }

    //Bread first search
    breadthQueue.push(atoms[startID]);
    atomLabels[startID] = this._packLabel(componentID, molID);
    labeledAtoms--;

    while (breadthQueue.length > 0) {
      var curr = breadthQueue.shift();
      if (!curr) {
        continue;
      }

      for (var i = 0; i < curr.edges.length; i++) {
        if (atomLabels[curr.edges[i]] !== componentID) {
          breadthQueue.push(atoms[curr.edges[i]]);
          atomLabels[curr.edges[i]] = componentID;
          labeledAtoms--;
        }
      }
    }
  }
  var ret = {};
  ret.atomLabels = atomLabels;
  ret.labelsCount = componentID;
  return ret;
};

CMLParser.prototype._parseBond = function(eAtom, mainAtom, order, type) {
  if (eAtom >= 0) {
    var h = [Math.min(eAtom, mainAtom), Math.max(eAtom, mainAtom)];
    this._complex.addBond(h[0], h[1], order, type, true);
  }
};

CMLParser.prototype._fixBondsArray = function() {
  var serialAtomMap = this._serialAtomMap = {};
  var complex = this._complex;

  var atoms = complex._atoms;
  var i = 0, ni = atoms.length;
  for (; i < ni; ++i) {
    var atom = atoms[i];
    serialAtomMap[atom._serial] = atom;
  }

  var bonds = complex._bonds;
  var j = 0, nj = bonds.length;
  var logger = this.logger;
  for (; j < nj; ++j) {
    var bond = bonds[j];
    if (bond._right < bond._left) {
      logger.debug('_fixBondsArray: Logic error.');
    }
    bond._left = serialAtomMap[bond._left] || null;
    bond._right = serialAtomMap[bond._right] || null;
  }
};

CMLParser.prototype._parseSet = function(varData) {
  var complex = this._complex = new Complex();
  var data = varData;
  var currentLabel = data.curr;
  var atoms = data.atoms;
  var labels = data.labels;
  var atom = null;
  var i;
  var j;
  var count = atoms.length;

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

  //    var nodeHText;

  var chains = {};
  //parse atoms in label order
  var reorder = [];
  for (i = 0; i < count; i++) {
    reorder.push(i);
  }
  reorder.sort(function(a, b) {
    return labels[a] - labels[b];
  });
  for (i = 0; i < count; i++) {
    var atomCharge = 0;
    var lLabel = labels[reorder[i]];
    if (this._unpackLabel(lLabel).molId === this._unpackLabel(currentLabel).molId) {

      atom = atoms[reorder[i]];
      var atomHtmlNode = null;

      var atomFullNameStruct = new AtomName(atom.elementType, atomHtmlNode);

      if (atom.sgroupRef) {
        var countRef = atom.sgroupRef.length;
        for (var k = 0; k < countRef; ++k) {
          complex._sgroups.push(atom.sgroupRef[k]);
        }
      }

      if (atom.x3 || atom.x2) {
        var currAtomComp = this._unpackLabel(lLabel).compId;
        // use ' ' by default instead of synthetic creation of chain names
        var chainID = ' '; //= String.fromCharCode('A'.charCodeAt(0) + currAtomComp);
        var resSeq = currAtomComp;
        var iCode = ' ';
        var strLabel = currAtomComp.toString();
        if (strLabel.length === 1) {
          strLabel = '0' + strLabel;
        }
        var resName = 'N' + strLabel;
        var chain = chains[chainID];
        if (!chain || chain.getName() !== chainID) {
          chains[chainID] = chain = this._complex.getChain(chainID) || this._complex.addChain(chainID);
          this._residue = null;
        }

        var residue = this._residue;
        if (!residue || residue.getSequence() !== resSeq || residue.getICode() !== iCode) {
          this._residue = residue = chain.addResidue(resName, resSeq, iCode);
        }

        //_x, _y, _z, mname, mindex, atomNameFull, atomName, chainID, serial, isHet, atlLocInd, atomNameToTypeF
        var xyz = null;
        if (atom.x3) {
          xyz = new THREE.Vector3(parseFloat(atom.x3), parseFloat(atom.y3), parseFloat(atom.z3));
        } else if (atom.x2) {
          xyz = new THREE.Vector3(parseFloat(atom.x2), parseFloat(atom.y2), 0);
        }
        var element = Element.ByName[atom.elementType.toUpperCase()];
        if (!element) {
          element = (JSON.parse(JSON.stringify(Element.ByName[
            Object.keys(Element.ByName)[Object.keys(Element.ByName).length - 1]])));
          element.number += 1;
          element.name = atom.elementType.toUpperCase();
          element.fullName = 'Unknown';
          Element.ByName[atom.elementType.toUpperCase()] = element;
        }
        var atomSerial = parseInt(atom.id.replace(/[^0-9]/, ''), 10);
        var added = residue.addAtom(
          atomFullNameStruct, element, xyz, Element.Role.SG,
          true, atomSerial, ' ', 1.0, 0.0, atomCharge
        );
        if (atom.hydrogenCount) {
          added._hydrogenCount = parseInt(atom.hydrogenCount, 10);
        }
        if (atom.mrvValence) {
          added._valence = parseInt(atom.mrvValence, 10);
        }
        addFunc(added);
      }
    }
  }
  chains = null;//NOSONAR
  for (i = 0; i < data.bonds.length; i++) {
    var cb = data.bonds[i];
    if (this._unpackLabel(labels[cb.start]).molId === this._unpackLabel(currentLabel).molId &&
        this._unpackLabel(labels[cb.end]).molId === this._unpackLabel(currentLabel).molId) {
      atom = atoms[cb.start];
      if (!atom || !(atoms[cb.end])) {
        continue; //skip invalid
      }
      this._parseBond(
        parseInt(atom.id.replace(/[^0-9]/, ''), 10),
        parseInt(atoms[cb.end].id.replace(/[^0-9]/, ''), 10), cb.order, cb.type
      );
    }
  }

  for (i = 0; i < this._complex.getSGroupCount(); i++) {
    var sGrp = this._complex.getSGroups()[i];
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
    serialAtomMap: this._serialAtomMap
  });
  this._serialAtomMap = null;
  this._complex = null;
  return complex;
};

CMLParser.prototype.parseSync = function() {
  // console.time('CML parse');

  var complexes = [];
  var self = this;
  var moleculaSet = this._selectComponents(this._data);
  moleculaSet.forEach(function(molSet) {
    molSet.curr = 2;
    if (molSet.count === 0) {
      molSet.count = 1;
    }
    for (var i = 0; i < molSet.count; i++) {
      molSet.curr = (i + 1);
      complexes.push(self._parseSet(molSet, false));
    }
  });
  // console.timeEnd('CML parse');

  var totalAtomsParsed = 0;
  complexes.forEach(function(c) {
    totalAtomsParsed += c.getAtomCount();
  });
  if (totalAtomsParsed <= 0) {
    throw new Error('The data does not contain valid atoms');
  }

  if (complexes.length > 1) {
    var joinedComplex = new Complex();
    joinedComplex.joinComplexes(complexes);
    joinedComplex.originalCML = complexes[0].originalCML;
    return joinedComplex;
  } else if (complexes.length === 1) {
    return complexes[0];
  } else {
    return new Complex();
  }
};

CMLParser.formats = ['cml'];
CMLParser.extensions = ['.cml'];

export default CMLParser;
