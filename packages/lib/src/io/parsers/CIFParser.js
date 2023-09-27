import * as THREE from 'three';
import _ from 'lodash';
import Parser from './Parser';
import chem from '../../chem';
import StructuralElement from '../../chem/StructuralElement';
import readCIF from './readCIF';

const {
  Complex,
  Element,
  Helix,
  Sheet,
  Strand,
  Assembly,
  Molecule,
} = chem;

const cRequiredAtomFields = [
  'auth_seq_id',
  'Cartn_x',
  'Cartn_y',
  'Cartn_z',
  'label_atom_id',
];

const cSecondaryCoding = {
  helx: 'helix',
  turn: 'turn',
  strn: 'strand',
};

function getTypeFromId(string) {
  const typeId = /[A-Za-z]+/.exec(string);
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

  const veryLong = name.trim().length === 4;
  return name.slice(0, veryLong ? 1 : 2).trim();
}

class AtomDataError extends Error {
  constructor(message) {
    super();
    this.name = 'AtomDataError';
    this.message = message;
  }
}

function _getOperations(operList) {
  if (!operList) {
    return null;
  }
  const idc = arrize(operList.id);
  const { matrix, vector } = operList;
  if (!idc || !matrix || !vector) {
    return null;
  }

  const ops = [];
  for (let i = 0, n = idc.length; i < n; ++i) {
    const mtx = new THREE.Matrix4();
    const { elements } = mtx;

    for (let row = 0; row < 3; ++row) {
      const matrixData = matrix[row + 1];
      elements[row] = arrize(matrixData[1])[i];
      elements[row + 4] = arrize(matrixData[2])[i];
      elements[row + 8] = arrize(matrixData[3])[i];
      elements[row + 12] = arrize(vector[row + 1])[i];
    }
    ops[idc[i]] = mtx;
  }
  return ops;
}

function _extractOperations(assemblyGen, opsDict) {
  assemblyGen = _.isString(assemblyGen) ? assemblyGen : `${assemblyGen}`;
  const l = assemblyGen.replace(/\)\s*\(/g, '!').replace(/[()']/g, '');
  const groupStr = l.split('!');
  const gps = [];

  for (let grIdx = 0, grCount = groupStr.length; grIdx < grCount; ++grIdx) {
    const gr = groupStr[grIdx].split(',');
    const gp = [];
    let idx = 0;
    for (let i = 0, n = gr.length; i < n; ++i) {
      const s = gr[i];
      if (s.includes('-')) {
        const es = s.split('-');
        let j = parseInt(es[0], 10);
        const m = parseInt(es[1], 10);
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
  const matrices = [];
  let cnt = 0;
  function traverse(level, mtx) {
    for (let ii = 0, nn = gps[level].length; ii < nn; ++ii) {
      const newMtx = mtx ? mtx.clone() : new THREE.Matrix4();
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

class CIFParser extends Parser {
  constructor(data, options) {
    super(data, options);
    this.asymDict = {};
    this.molecules = [];
    this._options.fileType = 'cif';
  }

  static canProbablyParse(data) {
    return _.isString(data) && /^\s*data_/i.test(data);
  }

  parseSync() {
    this.logger.info('Parsing CIF file..');
    const data = readCIF(this._data);
    return this._toComplex(data);
  }

  /**
   * Convert intermediate structure into our valid Complex object
   * @param cifData intermediate CIF object
   * @returns {Complex} complex
   * @private
   */
  _toComplex(cifData) {
    const complex = new Complex();
    const complexData = cifData[Object.keys(cifData)[0]];
    this._extractAtoms(complex, complexData);
    this._extractSecondary(complex, complexData);
    this._extractAssemblies(complex, complexData);
    this._extractMolecules(complex, complexData);
    this._extractMetadata(complex, complexData);
    complex.finalize({
      needAutoBonding: true,
      detectAromaticLoops: this.settings.now.aromatic,
      enableEditing: this.settings.now.editing,
    });

    return complex;
  }

  /**
   * Extract metadata
   * @param complex structure to fill
   * @param complexData complex data from CIF file
   * @private
   */

  _extractMetadata(complex, complexData) {
    const { metadata } = complex;
    metadata.id = complexData.entry.id;
    metadata.classification = complexData.struct_keywords.pdbx_keywords;
    const databaserev = complexData.database_PDB_rev;
    metadata.date = (databaserev && databaserev.date_original) ? databaserev.date_original : '';
    metadata.format = 'cif';
    metadata.title = [];
    metadata.title[0] = complexData.struct.title;
  }

  /**
   * Extract molecules information from CIF structure (should be called strictly after _extractAtoms)
   * @param complexData complex data from CIF file
   * @private
   */
  _extractMolecules(complex, complexData) {
    const molData = complexData.entity;
    const names = arrize(molData.pdbx_description);
    const count = names.length;
    let i;

    // molecules names from cif
    for (i = 0; i < count; i++) {
      if (this.molecules[i]) { // molecule was created during atoms processing
        this.molecules[i].name = names[i];
      } else { // molecule wasn't created, because there is no atom which is contained
        this.molecules[i] = { name: names[i], residues: [] };
      }
    }

    // reorganize molecules for complex and check chains
    const molecules = complex.getMolecules();
    for (i = 0; i < count; i++) {
      const molecule = this.molecules[i];
      molecules[i] = new Molecule(complex, molecule.name, i + 1);
      molecules[i].residues = molecule.residues;
    }
  }

  /**
   * Extract atom information from CIF structure and fill complex
   * @param {Complex} complex
   * @param complexData complex data from CIF file
   * @private
   */
  _extractAtoms(complex, complexData) {
    const atomData = complexData.atom_site;
    if (!atomData) {
      throw new AtomDataError('CIF parsing error: atom_site is not specified!');
    }

    for (let f = 0, n = cRequiredAtomFields.length; f < n; ++f) {
      if (!atomData[cRequiredAtomFields[f]]) {
        throw new AtomDataError(`CIF parsing error: requires field ${cRequiredAtomFields[f]} not found!`);
      }
    }

    const { asymDict } = this;
    // required fields
    const resIdc = arrize(atomData.auth_seq_id);
    const x = arrize(atomData.Cartn_x);
    const y = arrize(atomData.Cartn_y);
    const z = arrize(atomData.Cartn_z);
    const names = arrize(atomData.label_atom_id);
    const count = names.length;
    // optional fields
    const group = arrize(atomData.group_PDB) || [];
    const chainIdc = arrize(atomData.auth_asym_id) || [];
    const chainLabelIdc = arrize(atomData.label_asym_id) || [];
    const serials = arrize(atomData.id) || [];
    const iCodes = arrize(atomData.pdbx_PDB_ins_code) || [];
    const resNames = arrize(atomData.label_comp_id) || [];
    const elements = arrize(atomData.type_symbol) || [];
    const tempFactors = arrize(atomData.B_iso_or_equiv) || [];
    const occupancies = arrize(atomData.occupancy) || [];
    const charges = arrize(atomData.pdbx_formal_charge) || [];
    const altLocs = arrize(atomData.label_alt_id) || [];
    const models = arrize(atomData.pdbx_PDB_model_num) || [];
    const molecules = arrize(atomData.label_entity_id) || [];

    let chain = null;
    let residue = null;
    for (let i = 0; i < count; ++i) {
      const model = models[i] || 1;
      if (model !== 1) {
        continue;
      }
      const chainID = String(chainIdc[i] || ' ');

      if (!chain || chain.getName() !== chainID) {
        chain = complex.getChain(chainID) || complex.addChain(chainID);
      }
      asymDict[String(chainLabelIdc[i] || ' ')] = chainID;
      const resSeq = resIdc[i];
      const iCode = String(iCodes[i] || ' ');
      const resName = String(resNames[i] || '');
      if (!residue || residue.getSequence() !== resSeq || residue.getICode() !== iCode) {
        residue = chain.addResidue(resName, resSeq, iCode);

        // store residue in appropriate molecule
        const moleculeIdx = molecules[i] - 1;
        let entity = this.molecules[moleculeIdx];
        if (!entity) { // create new molecule if it hasn't been created
          this.molecules[moleculeIdx] = { name: '', residues: [] };
          entity = this.molecules[moleculeIdx];
        }
        entity.residues.push(residue);
      }

      const name = names[i];
      const element = elements[i] || nameToElement(name);
      const type = Element.getByName(element);
      const role = Element.Role[name.trim()];
      const xyz = new THREE.Vector3(x[i], y[i], z[i]);
      const het = group[i] === 'HETATM' || false;
      const serial = serials[i] || i;
      const tempFactor = tempFactors[i] || 0.0;
      const occupancy = occupancies[i] || 0.0;
      const altLoc = String(altLocs[i] || '');
      const charge = charges[i] || 0;

      residue.addAtom(
        name,
        type,
        xyz,
        role,
        het,
        serial,
        altLoc,
        occupancy,
        tempFactor,
        charge,
      );
    }
  }

  /**
   * Extracts secondary structure information from CIF intermediate data
   * and adds it into complex
   * @param {Complex} complex - complex to fill
   * @param complexData - CIF complex data
   * @private
   */
  _extractSecondary(complex, complexData) {
    if (complexData.struct_conf) {
      this._extractConfs(complex, complexData.struct_conf);
    }
    if (complexData.struct_sheet_range) {
      this._extractSheets(complex, complexData.struct_sheet_range);
    }
  }

  /**
   * Extracts sheets information from CIF intermediate data
   * and adds it into complex
   * @param {Complex} complex
   * @param sheetData
   * @private
   */
  _extractSheets(complex, sheetData) {
    const { asymDict } = this;
    if (!sheetData.sheet_id || !sheetData.id || !sheetData.beg_label_seq_id || !sheetData.end_label_seq_id
      || !sheetData.beg_label_asym_id) {
      return;
    }
    // Strand(sheet, start, end, sense, cur, prev)
    const sheets = complex._sheets;

    function getSheet(name) {
      const n = sheets.length;
      for (let i = 0; i < n; ++i) {
        if (sheets[i]._name === name) {
          return sheets[i];
        }
      }
      sheets[n] = new Sheet(name, 0);
      return sheets[n];
    }

    const sheetNames = arrize(sheetData.sheet_id);
    const strandNames = arrize(sheetData.id);
    const starts = arrize(sheetData.beg_auth_seq_id);
    const ends = arrize(sheetData.end_auth_seq_id);
    const chains = arrize(sheetData.beg_label_asym_id);
    const stICodes = arrize(sheetData.pdbx_beg_PDB_ins_code) || [];
    const endICodes = arrize(sheetData.pdbx_end_PDB_ins_code) || [];

    for (let i = 0, n = strandNames.length; i < n; ++i) {
      const chain = complex.getChain(asymDict[chains[i]]);
      const sheet = getSheet(sheetNames[i]);
      const startIdx = starts[i];
      const endIdx = ends[i];
      const startICode = stICodes[i] || ' ';
      const endICode = endICodes[i] || ' ';

      const start = chain.findResidue(startIdx, startICode);
      const end = chain.findResidue(endIdx, endICode);

      // TODO think about last condition
      if (!start || !end) {
        continue;
      }

      const strand = new Strand(sheet, start[0], end[0], 0, null, null);
      const residues = chain.getResidues();
      for (let r = start[1]; r <= end[1]; ++r) {
        residues[r]._secondary = strand;
      }
      sheet.addStrand(strand);
      complex.structures.push(strand);
    }
  }

  /**
   * Extracts helix/turn/strand(?) information from CIF intermediate data
   * and adds it into complex
   * @param {Complex} complex
   * @param helicesData
   * @private
   */
  _extractConfs(complex, helicesData) {
    const { asymDict } = this;
    if (!helicesData.conf_type_id || !helicesData.beg_label_seq_id || !helicesData.end_label_seq_id
      || !helicesData.beg_label_asym_id) {
      return;
    }

    const types = arrize(helicesData.conf_type_id);
    const starts = arrize(helicesData.beg_auth_seq_id);
    const stICodes = arrize(helicesData.pdbx_beg_PDB_ins_code) || [];
    const ends = arrize(helicesData.end_auth_seq_id);
    const endICodes = arrize(helicesData.pdbx_end_PDB_ins_code) || [];
    const comments = arrize(helicesData.details) || [];
    const lengths = arrize(helicesData.pdbx_PDB_helix_length) || [];
    const helixClasses = arrize(helicesData.pdbx_PDB_helix_class) || [];
    const names = arrize(helicesData.id) || [];
    const chains = arrize(helicesData.beg_label_asym_id);

    for (let i = 0, n = types.length; i < n; ++i) {
      const type = getTypeFromId(types[i]);
      if (!type) {
        continue;
      }
      const name = names[i] || types[i];
      const chain = complex.getChain(asymDict[chains[i]]);

      const startIdx = starts[i];
      const endIdx = ends[i];
      const startICode = stICodes[i] || ' ';
      const endICode = endICodes[i] || ' ';

      const start = chain.findResidue(startIdx, startICode);
      const end = chain.findResidue(endIdx, endICode);

      // TODO think about last condition
      if (!start || !end) {
        continue;
      }
      const comment = comments[i] || '';
      const length = lengths[i] || 0;
      const helixClass = helixClasses[i] || ' ';
      let struct;
      if (type === 'helix') {
        const idx = complex._helices.length;
        struct = new Helix(helixClass, start[0], end[0], idx, name, comment, length);
        complex.addHelix(struct);
        complex.structures.push(struct);
      } else if (type === 'turn') {
        struct = new StructuralElement(StructuralElement.Type.TURN, start[0], end[0]);
        complex.structures.push(struct);
      } else {
        struct = null;
      }
      if (!struct) {
        continue;
      }
      const residues = chain.getResidues();
      for (let r = start[1]; r <= end[1]; ++r) {
        residues[r]._secondary = struct;
      }
    }
  }

  /**
   * Extract biological assemblies information from CIF structure and fill complex
   * @param {Complex} complex
   * @param complexData complex data from CIF file
   * @private
   */
  _extractAssemblies(complex, complexData) {
    const { asymDict } = this;
    const asmGen = complexData.pdbx_struct_assembly_gen;
    if (!asmGen) {
      return;
    }

    const asmIdx = arrize(asmGen.assembly_id);
    const asmOper = arrize(asmGen.oper_expression);
    const asmList = arrize(asmGen.asym_id_list);
    if (!asmIdx || !asmOper || !asmList) {
      return;
    }

    const operList = _getOperations(complexData.pdbx_struct_oper_list);
    if (!operList) {
      return;
    }

    for (let i = 0, n = asmIdx.length; i < n; ++i) {
      const asm = new Assembly(complex);
      const assemblyOps = _extractOperations(asmOper[i], operList);
      const entries = asmList[i].split(',');
      for (let ii = 0, nn = entries.length; ii < nn; ++ii) {
        const chain = entries[ii].trim();
        if (chain.length > 0) {
          asm.addChain(asymDict[chain]);
        }
      }
      asm.matrices = assemblyOps;
      complex.units.push(asm);
    }
  }
}

CIFParser.formats = ['cif', 'mmcif'];
CIFParser.extensions = ['.cif', '.mmcif'];

export default CIFParser;
