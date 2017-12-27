import Parser from './Parser';
import chem from '../../chem';
import * as THREE from 'three';
import _ from 'lodash';

var
  Complex = chem.Complex,
  Element = chem.Element,
  Helix = chem.Helix,
  Sheet = chem.Sheet,
  Strand = chem.Strand,
  Assembly = chem.Assembly,
  Molecule = chem.Molecule;

var cRequiredAtomFields = [
  'auth_seq_id',
  'Cartn_x',
  'Cartn_y',
  'Cartn_z',
  'label_atom_id'
];

var cSecondaryCoding = {
  helx: 'helix',
  turn: 'turn',
  strn: 'strand'
};

function getTypeFromId(string) {
  var typeId = /[A-Za-z]+/.exec(string);
  if (!typeId) {
    return null;
  }

  return cSecondaryCoding[typeId[0].toLowerCase()];
}

/**
 * Make valid object an array
 * @param arrayLikeObject
 * @return {array, object} array or object
 */
function arrize(arrayLikeObject) {
  if (arrayLikeObject === null || arrayLikeObject === undefined || _.isArray(arrayLikeObject)) {
    return arrayLikeObject;
  }
  return [arrayLikeObject];
}

function nameToElement(name) {
  // http://www.wwpdb.org/documentation/file-format-content/format33/sect9.html#ATOM
  //
  // http://www.cgl.ucsf.edu/chimera/docs/UsersGuide/tutorials/pdbintro.html#note1
  //
  // Atom names start with element symbols right-justified in columns 13-14
  // as permitted by the length of the name. For example, the symbol FE for
  // iron appears in columns 13-14, whereas the symbol C for carbon appears
  // in column 14 (see Misaligned Atom Names). If an atom name has four
  // characters, however, it must start in column 13 even if the element
  // symbol is a single character (for example, see Hydrogen Atoms).

  var veryLong = name.trim().length === 4;
  return name.slice(0, veryLong ? 1 : 2).trim();
}

function CIFParser(data, options) {
  Parser.call(this, data, options);
  this.asymDict = {};
  this.molecules = [];
  this._options.fileType = 'cif';
}

////////////////////////////////////////////////////////////////////////////
// Inheritance

CIFParser.prototype = Object.create(Parser.prototype);
CIFParser.prototype.constructor = CIFParser;

////////////////////////////////////////////////////////////////////////////
// Class methods

/** @deprecated */
CIFParser.canParse = function(data, options) {
  if (!data) {
    return false;
  }
  return typeof data === 'string' && Parser.checkDataTypeOptions(options, 'cif');
};

CIFParser.canProbablyParse = function(data) {
  return _.isString(data) && /^\s*data_/i.test(data);
};

CIFParser.prototype.parseSync = function() {
  this.logger.info('Parsing CIF file..');
  const ret = CIFParser._parseToObject(this._data);
  if (ret.error) {
    throw new Error(ret.error.message);
  }
  return this._toComplex(ret.data);
};

/**
 * Convert intermediate structure into our valid Complex object
 * @param cifData intermediate CIF object
 * @returns {Complex} complex
 * @private
 */
CIFParser.prototype._toComplex = function(cifData) {
  var complex = new Complex();
  var complexData = cifData[Object.keys(cifData)[0]];
  this._extractAtoms(complex, complexData);
  this._extractSecondary(complex, complexData);
  this._extractAssemblies(complex, complexData);
  this._extractMolecules(complex, complexData);
  complex.finalize({
    needAutoBonding: true,
    detectAromaticLoops: this.settings.now.aromatic,
    enableEditing: this.settings.now.editing,
  });

  return complex;
};

function AtomDataError(message) {
  Error.call(this);
  this.name = 'AtomDataError';
  this.message = message;
}

AtomDataError.prototype = Object.create(Error.prototype);

/**
 * Extract molecules information from CIF structure (should be called strictly after _extractAtoms)
 * @param complexData complex data from CIF file
 * @private
 */
CIFParser.prototype._extractMolecules = function(complex, complexData) {
  var molData = complexData.entity;
  var names = arrize(molData.pdbx_description);
  var count = names.length;
  var i;

  // molecules names from cif
  for (i = 0; i < count; i++) {
    this.molecules[i].name =  names[i];
  }

  // reorganize molecules for complex and check chains
  var molecules = complex.getMolecules();
  for (i = 0; i < count; i++) {
    var molecule = this.molecules[i];
    molecules[i] = new Molecule(complex, molecule.name, i + 1);
    molecules[i]._residues = molecule.residues;
  }
};

/**
 * Extract atom information from CIF structure and fill complex
 * @param {Complex} complex
 * @param complexData complex data from CIF file
 * @private
 */
CIFParser.prototype._extractAtoms = function(complex, complexData) {
  var atomData = complexData.atom_site;
  if (!atomData) {
    throw new AtomDataError('CIF parsing error: atom_site is not specified!');
  }

  // TODO also add length chacks?
  for (var f = 0, n = cRequiredAtomFields.length; f < n; ++f) {
    if (!atomData[cRequiredAtomFields[f]]) {
      throw new AtomDataError('CIF parsing error: requires field ' + cRequiredAtomFields[f] + ' not found!');
    }
  }

  var asymDict = this.asymDict;
  // required fields
  var resIdc = arrize(atomData.auth_seq_id);
  var x = arrize(atomData.Cartn_x);
  var y = arrize(atomData.Cartn_y);
  var z = arrize(atomData.Cartn_z);
  var names = arrize(atomData.label_atom_id);
  var count = names.length;
  // optional fields
  var group = arrize(atomData.group_PDB) || [];
  var chainIdc = arrize(atomData.auth_asym_id) || [];
  var chainLabelIdc = arrize(atomData.label_asym_id) || [];
  var serials = arrize(atomData.id) || [];
  var iCodes = arrize(atomData.pdbx_PDB_ins_code) || [];
  var resNames = arrize(atomData.label_comp_id) || [];
  var elements = arrize(atomData.type_symbol) || [];
  var tempFactors = arrize(atomData.B_iso_or_equiv) || [];
  var occupancies = arrize(atomData.occupancy) || [];
  var charges = arrize(atomData.pdbx_formal_charge) || [];
  var altLocs = arrize(atomData.label_alt_id) || [];
  var models = arrize(atomData.pdbx_PDB_model_num) || [];
  var molecules = arrize(atomData.label_entity_id) || [];

  var chain = null;
  var residue = null;
  for (var i = 0; i < count; ++i) {
    var model = models[i] || 1;
    if (model !== 1) {
      continue;
    }
    var chainID = String(chainIdc[i] || ' ');

    if (!chain || chain.getName() !== chainID) {
      chain = complex.getChain(chainID) || complex.addChain(chainID);
    }
    asymDict[String(chainLabelIdc[i] || ' ')] = chainID;
    var resSeq  = resIdc[i];
    var iCode = String(iCodes[i] || ' ');
    var resName = String(resNames[i] || '');
    if (!residue || residue.getSequence() !== resSeq || residue.getICode() !== iCode) {
      residue = chain.addResidue(resName, resSeq, iCode);

      // store molecule (entity)
      var moleculeIdx = molecules[i] - 1;
      var entity = this.molecules[moleculeIdx];
      if (!entity) {
        this.molecules[moleculeIdx] = {name: '', residues: []};
        entity = this.molecules[moleculeIdx];
      }
      entity.residues.push(residue);
    }

    var name = names[i];
    var element = elements[i] || nameToElement(name);
    var type = Element.getByName(element);
    var role = Element.Role[name.trim()];
    var xyz = new THREE.Vector3(x[i], y[i], z[i]);
    var het = group[i] === 'HETATM' || false;
    var serial = serials[i] || i;
    var tempFactor = tempFactors[i] || 0.0;
    var occupancy = occupancies[i] || 0.0;
    var altLoc = String(altLocs[i] || '');
    var charge = charges[i] || 0;

    residue.addAtom(
      name, type, xyz,
      role, het, serial, altLoc, occupancy, tempFactor, charge
    );

  }
};

/**
 * Extracts secondary structure information from CIF intermediate data
 * and adds it into complex
 * @param {Complex} complex - complex to fill
 * @param complexData - CIF complex data
 * @private
 */
CIFParser.prototype._extractSecondary = function(complex, complexData) {
  if (complexData.struct_conf) {
    this._extractConfs(complex, complexData.struct_conf);
  }
  if (complexData.struct_sheet_range) {
    this._extractSheets(complex, complexData.struct_sheet_range);
  }
};

/**
 * Extracts sheets information from CIF intermediate data
 * and adds it into complex
 * @param {Complex} complex
 * @param sheetData
 * @private
 */
CIFParser.prototype._extractSheets = function(complex, sheetData) {
  var asymDict = this.asymDict;
  if (!sheetData.sheet_id || !sheetData.id || !sheetData.beg_label_seq_id || !sheetData.end_label_seq_id ||
        !sheetData.beg_label_asym_id) {
    return;
  }
  //Strand(sheet, start, end, sense, cur, prev)
  var sheets = complex._sheets;
  function getSheet(name) {
    var i = 0, n = sheets.length;
    for (; i < n; ++i) {
      if (sheets[i]._name === name) {
        return sheets[i];
      }
    }
    sheets[n] = new Sheet(name, 0);
    return sheets[n];
  }

  var sheetNames = arrize(sheetData.sheet_id);
  var strandNames = arrize(sheetData.id);
  var starts = arrize(sheetData.beg_auth_seq_id);
  var ends = arrize(sheetData.end_auth_seq_id);
  var chains = arrize(sheetData.beg_label_asym_id);
  var stICodes = arrize(sheetData.pdbx_beg_PDB_ins_code) || [];
  var endICodes = arrize(sheetData.pdbx_end_PDB_ins_code) || [];

  for (var i = 0, n = strandNames.length; i < n; ++i) {
    var chain = complex.getChain(asymDict[chains[i]]);
    var sheet = getSheet(sheetNames[i]);
    var startIdx = starts[i];
    var endIdx = ends[i];
    var startICode = stICodes[i] || ' ';
    var endICode = endICodes[i] || ' ';

    var start = chain.findResidue(startIdx, startICode);
    var end = chain.findResidue(endIdx, endICode);

    // TODO think about last condition
    if (!start || !end) {
      continue;
    }

    var strand = new Strand(sheet, start[0], end[0], 0, null, null);
    var residues = chain.getResidues();
    for (var r = start[1]; r <= end[1]; ++r) {
      residues[r]._secondary = strand;
    }
    sheet.addStrand(strand);
    sheet._width = sheet._strands.length;
  }
};

/**
 * Extracts helix/turn/strand(?) information from CIF intermediate data
 * and adds it into complex
 * @param {Complex} complex
 * @param helicesData
 * @private
 */
CIFParser.prototype._extractConfs = function(complex, helicesData) {
  var asymDict = this.asymDict;
  if (!helicesData.conf_type_id || !helicesData.beg_label_seq_id || !helicesData.end_label_seq_id ||
      !helicesData.beg_label_asym_id) {
    return;
  }

  var types = arrize(helicesData.conf_type_id);
  var starts = arrize(helicesData.beg_auth_seq_id);
  var stICodes = arrize(helicesData.pdbx_beg_PDB_ins_code) || [];
  var ends = arrize(helicesData.end_auth_seq_id);
  var endICodes = arrize(helicesData.pdbx_end_PDB_ins_code) || [];
  var comments = arrize(helicesData.details) || [];
  var lengths = arrize(helicesData.pdbx_PDB_helix_length) || [];
  var helClasses = arrize(helicesData.pdbx_PDB_helix_class) || [];
  var names = arrize(helicesData.id) || [];
  var chains = arrize(helicesData.beg_label_asym_id);

  for (var i = 0, n  = types.length; i < n; ++i) {
    var type = getTypeFromId(types[i]);
    if (!type) {
      continue;
    }
    var name = names[i] || types[i];
    var chain = complex.getChain(asymDict[chains[i]]);

    var startIdx = starts[i];
    var endIdx = ends[i];
    var startICode = stICodes[i] || ' ';
    var endICode = endICodes[i] || ' ';

    var start = chain.findResidue(startIdx, startICode);
    var end = chain.findResidue(endIdx, endICode);

    // TODO think about last condition
    if (!start || !end) {
      continue;
    }
    var comment = comments[i] || '';
    var length = lengths[i] || 0;
    var helClass = helClasses[i] || ' ';
    var struct;
    // TODO Add turns and strands(!)?
    if (type === 'helix') {
      const idx = complex._helices.length;
      struct = new Helix(idx, name, start[0], end[0], helClass, comment, length);
      complex.addHelix(struct);
    } else {
      struct = null;
    }
    if (!struct) {
      continue;
    }
    var residues = chain.getResidues();
    for (var r = start[1]; r <= end[1]; ++r) {
      residues[r]._secondary = struct;
    }
  }
};

function _getOperations(operList) {
  if (!operList) {
    return null;
  }
  var idc = arrize(operList.id);
  var matrix = operList.matrix;
  var vector = operList.vector;
  if (!idc || !matrix || !vector) {
    return null;
  }

  var ops = [];
  for (var i = 0, n = idc.length; i < n; ++i) {
    var mtx = new THREE.Matrix4();
    var elements = mtx.elements;

    for (var row = 0; row < 3; ++row) {
      var matrixData = matrix[row + 1];
      elements[row]      = arrize(matrixData[1])[i];
      elements[row + 4]  = arrize(matrixData[2])[i];
      elements[row + 8]  = arrize(matrixData[3])[i];
      elements[row + 12] = arrize(vector[row + 1])[i];
    }
    ops[idc[i]] = mtx;
  }

  return ops;
}

function _extractOperations(assemblyGen, opsDict) {
  assemblyGen = _.isString(assemblyGen) ? assemblyGen : '' + assemblyGen;
  var l = assemblyGen.replace(/\)\s*\(/g, '!').replace(/[()']/g, '');
  var groupStr = l.split('!');
  var gps = [];

  for (var grIdx = 0, grCount = groupStr.length; grIdx < grCount; ++grIdx) {
    var gr = groupStr[grIdx].split(',');
    var gp = [];
    var idx = 0;
    for (var i = 0, n = gr.length; i < n; ++i) {
      var s = gr[i];
      if (s.includes('-')) {
        var es = s.split('-');
        var j = parseInt(es[0], 10);
        var m = parseInt(es[1], 10);
        for (; j <= m; ++j) {
          gp[idx++] = opsDict[j];
        }
      } else {
        gp[idx++] = opsDict[s];
      }
    }
    gps.push(gp);
  }

  // traverse all groups from the end of array and make all mults
  var matrices = [];
  var cnt = 0;
  function traverse(level, mtx) {
    for (var ii = 0, nn = gps[level].length; ii < nn; ++ii) {
      var newMtx = mtx ? mtx.clone() : new THREE.Matrix4();
      newMtx.multiplyMatrices(gps[level][ii], newMtx);
      if (level === 0) {
        matrices[cnt++] = newMtx;
      } else {
        traverse(level - 1, newMtx);
      }
    }

  }

  traverse(gps.length - 1);
  return matrices;
}

/**
 * Extract biological assemblies information from CIF structure and fill complex
 * @param {Complex} complex
 * @param complexData complex data from CIF file
 * @private
 */
CIFParser.prototype._extractAssemblies = function(complex, complexData) {
  var asymDict = this.asymDict;
  var asmGen = complexData.pdbx_struct_assembly_gen;
  if (!asmGen) {
    return;
  }

  var asmIdx = arrize(asmGen.assembly_id);
  var asmOper = arrize(asmGen.oper_expression);
  var asmList = arrize(asmGen.asym_id_list);
  if (!asmIdx || !asmOper || !asmList) {
    return;
  }

  var operList = _getOperations(complexData.pdbx_struct_oper_list);
  if (!operList) {
    return;
  }

  for (var i = 0, n = asmIdx.length; i < n; ++i) {
    var asm = new Assembly(complex);
    var assemblyOps = _extractOperations(asmOper[i], operList);
    var entries = asmList[i].split(',');
    for (var ii = 0, nn = entries.length; ii < nn; ++ii) {
      var chain = entries[ii].trim();
      if (chain.length > 0) {
        asm.addChain(asymDict[chain]);
      }
    }
    asm.matrices = assemblyOps;
    complex.structures.push(asm);
  }
};

CIFParser._parseToObject = function(source) {
  var i = 0, j = 0, n = source.length;
  var code = NaN, newline = true, line = 1, column = 1, begin;
  var state = 0; // -1 - stop, 0 - start, 1 - block, 2 - item, 3 - loop, 4 - values, 5 - value, 666 - error
  var err = 'unexpected character';
  var result = {}, block = {};
  var keys = [], keysCount = 0, key = '';
  var values = [], valuesCount = 0, value;

  function _isWhitespace(ch) {
    return ch === 32 || ch === 10 || ch === 13 || ch === 9;
  }

  function _inlineIndexOf(ch0, str, idx) {
    var len = str.length;
    var ch = -1;
    while (idx < len) {
      ch = str.charCodeAt(idx);
      if (ch === ch0 || ch === 10) {
        break;
      }
      ++idx;
    }
    return ch === ch0 ? idx : -1;
  }

  function _parseValue() {
    var val;
    if ((code === 46 || code === 63) && (i + 1 >= n || _isWhitespace(source.charCodeAt(i + 1)))) { // '.' or '?' .....
      // it's a missing value
      ++column;
      ++i;
      return undefined;
    } else if (newline && code === 59) { // ';' ......................................................................
      // parse multi-line string
      j = i;
      var lines = 0;
      do {
        j = _inlineIndexOf(10, source, j + 1); // '\n'
        if (j === -1) {
          err = 'unterminated text block found';
          return null;
        }
        ++lines;
      } while (j + 1 < n && source.charCodeAt(j + 1) !== code || j + 1 >= n);
      val = source.substring(i + 1, j).replace(/\r/g, '');
      i = j + 2;
      line += lines;
      column = 1;
      newline = false;
      return val;
    } else if (code === 39 || code === 34) { // ''' or '"' ...........................................................
      // parse quoted string
      j = i;
      do {
        j = _inlineIndexOf(code, source, j + 1);
        if (j === -1) {
          err = 'unterminated quoted string found';
          return null;
        }
      } while (j + 1 < n && !_isWhitespace(source.charCodeAt(j + 1)));
      val = source.substring(i + 1, j);
      column += j - i + 1;
      i = j + 1;
      return val;
    } else { // ......................................................................................................
      // parse until the first whitespace
      j = i;
      while (j < n && !_isWhitespace(source.charCodeAt(j))) {
        ++j;
      }
      val = source.substring(i, j);
      column += j - i;
      i = j;
      // try to convert to a number
      var num = Number(val);
      if (!Number.isNaN(num)) {
        return num;
      }
      // or leave as an unquoted string
      return val;
    }
  }

  function _storeKey(tag) {
    keys[keysCount++] = tag;
  }

  function _storeValue(val) {
    var keyIndex;
    keyIndex = valuesCount % keysCount;
    values[keyIndex].push(val);
    ++valuesCount;
    return val;
  }

  while (i <= n) {
    code = source.charCodeAt(i); // 'NaN' in place of '<eof>'
    if (code === 13) { // '\r' .......................................................................................
      // just ignore
    } else if (code === 10) { // '\n' ................................................................................
      // take note of new lines
      newline = true;
      ++line;
      column = 1;
    } else {
      // process inline characters
      if (code === 32 || code === 9) { // ' ' or '\t' ................................................................
        // just ignore
      } else if (code === 35) { // '#' ...............................................................................
        // skip the comment until before the end of the line
        i = _inlineIndexOf(10, source, i + 1); // '\n'
        if (i === -1) {
          break;
        } else {
          continue; // don't forget to process the new line
        }
      } else if (state === 0) { // start =============================================================================
        if ((code === 68 || code === 100) && source.substr(i + 1, 4).toLowerCase() === 'ata_') { // 'data_' ..........
          j = i + 5;
          begin = j;
          while (j < n && !_isWhitespace(source.charCodeAt(j))) {
            ++j;
          }
          column += j - i;
          i = j;
          if (begin < i) {
            // add new data block
            result[source.substring(begin, i)] = block = {};
            state = 1; // block
            continue; // don't forget to process the whitespace
          } else {
            err = 'data block name missing';
            state = 666; // error
            break;
          }
        } else if (Number.isNaN(code)) { // <eof> ....................................................................
          break;
        } else { // ..................................................................................................
          err += ' in state ' + state;
          state = 666; // error
          break;
        }
      } else if (state === 1) { // block =============================================================================
        if ((code === 68 || code === 100) && source.substr(i + 1, 4).toLowerCase() === 'ata_') { // 'data_' ..........
          state = 0; // start
          continue; // parse again in a different state
        } else if (code === 95) { // '_' .............................................................................
          j = i + 1;
          begin = j;
          while (j < n && !_isWhitespace(source.charCodeAt(j))) {
            ++j;
          }
          column += j - i;
          i = j;
          if (begin < i) {
            // start new item
            key = source.substring(begin, i);
            state = 2; // item
            continue; // don't forget to process the whitespace
          } else {
            err = 'tag name missing';
            state = 666; // error
            break;
          }
        } else if ((code === 76 || code === 108) && source.substr(i + 1, 4).toLowerCase() === 'oop_') { // 'loop_' ...
          i += 5;
          column += 5;
          if (i < n && !_isWhitespace(source.charCodeAt(i))) {
            err += ' in state ' + state;
            state = 666; // error
            break;
          } else {
            // start new loop
            keys = [];
            keysCount = 0;
            values = [];
            valuesCount = 0;
            state = 3; // loop
            continue; // don't forget to process the whitespace
          }
        } else if (Number.isNaN(code)) { // <eof> ....................................................................
          break;
        } else { // ..................................................................................................
          err += ' in state ' + state;
          state = 666; // error
          break;
        }
      } else if (state === 2) { // item ==============================================================================
        if (Number.isNaN(code)) {
          break;
        } else if ((value = _parseValue()) !== null) {
          _.set(block, key, value);
          state = 1; // block
          continue;
        }
        state = 666;
        break;
      } else if (state === 3) { // loop ==============================================================================
        if (code === 95) { // '_' ....................................................................................
          j = i + 1;
          begin = j;
          while (j < n && !_isWhitespace(source.charCodeAt(j))) {
            ++j;
          }
          column += j - i;
          i = j;
          if (begin < i) {
            // add new key
            _storeKey(source.substring(begin, i));
            continue; // don't forget to process the whitespace
          } else {
            err = 'tag name missing';
            state = 666; // error
            break;
          }
        } else { // ..................................................................................................
          if (keysCount > 0) {
            for (var keyIndex = 0; keyIndex < keysCount; ++keyIndex) {
              value = [];
              values[keyIndex] = value;
              _.set(block, keys[keyIndex], value);
            }
            state = 4;
            continue; // parse again in a different state
          }
          err = 'data tags are missing inside a loop';
          state = 666; // error
          break;
        }
      } else if (state === 4) { // values ============================================================================
        if ((code === 68 || code === 100) && source.substr(i + 1, 4).toLowerCase() === 'ata_') { // 'data_' ..........
          state = 0; // start
        } else if (code === 95) { // '_' .............................................................................
          state = 1; // block
        } else if ((code === 76 || code === 108) && source.substr(i + 1, 4).toLowerCase() === 'oop_') { // 'loop_' ...
          state = 1; // block
        } else if (Number.isNaN(code)) { // <eof> ....................................................................
          state = 0;
        } else { // ..................................................................................................
          if (_storeValue(_parseValue()) !== null) {
            continue;
          }
          state = 666;
          break;
        }
        continue; // parse again in a different state
      } else { // ====================================================================================================
        err = 'unexpected internal state ' + state;
        state = 666; // error
        break;
      }

      newline = false;
      ++column;
    }
    ++i;
  }

  if (state === 2) { // item
    err = 'unexpected end of file in state ' + state;
    state = 666; // error
  }

  var ret = {
    data: result,
  };

  if (state === 666) { // error
    ret.error = {
      line: line,
      column: column,
      message: err
    };
  }

  return ret;
};

CIFParser.formats = ['cif', 'mmcif'];
CIFParser.extensions = ['.cif', '.mmcif'];

export default CIFParser;
