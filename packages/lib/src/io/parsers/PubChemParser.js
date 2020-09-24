import * as THREE from 'three';
import _ from 'lodash';
import Parser from './Parser';
import chem from '../../chem';

const { Complex, Element } = chem;

class PubChemParser extends Parser {
  constructor(data, options) {
    super(data, options);
    this._options.fileType = 'pubchem+json';
  }

  static canProbablyParse(data) {
    return _.isString(data) && data[0] === '{';
  }

  parseSync() {
    this.logger.info('Parsing PubChem JSON file...');
    return this._toComplex(JSON.parse(this._data));
  }

  _toComplex(jsonData) {
    const complex = new Complex();
    const complexData = jsonData.PC_Compounds && jsonData.PC_Compounds[0];
    if (complexData) {
      this._extractAtoms(complex, complexData);
      complex.finalize({
        needAutoBonding: false,
        detectAromaticLoops: this.settings.now.aromatic,
        enableEditing: this.settings.now.editing,
      });
    }
    return complex;
  }

  _extractAtoms(complex, complexData) {
    let aids = complexData.atoms && complexData.atoms.aid;
    let elements = aids && complexData.atoms.element;
    if (!elements || aids.length !== elements.length) {
      throw new Error('Unable to parse atom elements');
    }
    elements = _.fromPairs(_.zip(aids, elements));
    const atoms = {};

    const coords = complexData.coords && complexData.coords[0];
    const model = coords && coords.conformers && coords.conformers[0];
    const xs = model && model.x;
    const ys = model && model.y;
    const zs = (model && model.z) || [];
    aids = coords && coords.aid;
    if (!aids || !xs || !ys) {
      throw new Error('Coordinates are not found in the file');
    }

    const chain = complex.addChain(' ');
    const residue = chain.addResidue('UNK', 1, ' ');

    for (let i = 0, n = aids.length; i < n; ++i) {
      const aid = aids[i];
      const element = Element.ByAtomicNumber[elements[aid]];
      const xyz = new THREE.Vector3(xs[i], ys[i], zs[i] || 0.0);
      atoms[aid] = residue.addAtom(element.name, element, xyz, undefined, true, aid, ' ', 1.0, 0.0, 0);
    }

    const aids1 = complexData.bonds && complexData.bonds.aid1;
    const aids2 = complexData.bonds && complexData.bonds.aid2;
    const orders = (complexData.bonds && complexData.bonds.order) || [];
    if (!aids1 || !aids2 || aids1.length !== aids2.length) {
      return;
    }

    for (let j = 0, m = aids1.length; j < m; ++j) {
      complex.addBond(atoms[aids1[j]], atoms[aids2[j]], orders[j] || 1, 0, true);
    }
  }
}

PubChemParser.formats = ['pubchem', 'pubchem+json', 'pc'];
PubChemParser.extensions = ['.json'];

export default PubChemParser;
