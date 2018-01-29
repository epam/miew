export default [{
  // just small protein loaded by default
  name: '1CRN',
  formats: ['pdb', 'cif', 'mmtf'],
  num: {
    atoms: 327,
    bonds: 337,
    residues: 46,
    chains: 1,
    molecules: 1,
    structures: 2,
    symmetries: {pdb: 2},
    helices: {mmtf: 3, default: 2},
    sheets: {mmtf: 2, default: 1},
  },
}, {
  // hydrogens, waters, ligands, altloc, all aminoacids, biomolecules, symmetry, ANISOU, LINK
  name: '4NRE',
  formats: ['pdb', 'cif', 'mmtf'],
  num: {
    atoms: 11306,
    bonds: {pdb: 11093, cif: 11083, mmtf: 11066},  // = 11093 in VMD, but they are not all valid
    residues: 1063,  // =  1068 in VMD!!!
    chains: 1,
    molecules: {pdb: 1, default: 7},
    structures: 3,
    symmetries: {pdb: 18},
    helices: {mmtf: 34, default: 33},
    sheets: {mmtf: 19, default: 6},
  },
}, {
  // lots of chains, models (+hydrogens)
  name: '2MPZ',
  formats: ['pdb', 'cif', 'mmtf'],
  num: {
    atoms: 10422,
    bonds: {mmtf: 10395, default: 10449},
    residues: 702,
    chains: 27,
    molecules: 1,
    structures: 2,
    symmetries: {pdb: 0},
    helices: 0,
    sheets: {mmtf: 54, default: 6},
  },
}, {
  // virus = biomolecule with lots of transformations, symmetry
  name: '1MVA',
  formats: ['pdb', 'cif', 'mmtf'],
  num: {
    atoms: 3112,
    bonds: 2940,
    residues: 610,
    chains: 3,
    molecules: {pdb: 1, default: 2},
    structures: {pdb: 2, default: 7},
    symmetries: {pdb: 18},
    helices: 10,
    sheets: {mmtf: 18, default: 6},
  },
}, {
  // DNA, molecules
  name: '5B40',
  formats: ['pdb', 'cif', 'mmtf'],
  num: {
    atoms: 11817,
    bonds: 12621,
    residues: 1031,
    chains: 10,
    molecules: 5,
    structures: 2,
    symmetries: {pdb: 3},
    helices: 36,
    sheets: {mmtf: 20, default: 10},
  },
}, {
  // small molecule
  name: 'serotonin',
  formats: ['pubchem'],
  num: {
    atoms: 25,
    bonds: 26,
    residues: 1,
    chains: 1,
    molecules: 0,
    structures: 1,
    symmetries: 0,
    helices: 0,
    sheets: 0,
  },
}];
