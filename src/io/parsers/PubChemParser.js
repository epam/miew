

import Parser from './Parser';
import chem from '../../chem';
import * as THREE from 'three';
import _ from 'lodash';

var
  Complex = chem.Complex,
  Element = chem.Element;

function PubChemParser(data, options) {
  Parser.call(this, data, options);
  this._options.fileType = 'pubchem+json';
}

////////////////////////////////////////////////////////////////////////////
// Inheritance

PubChemParser.prototype = Object.create(Parser.prototype);
PubChemParser.prototype.constructor = PubChemParser;

////////////////////////////////////////////////////////////////////////////
// Class methods

/** @deprecated */
PubChemParser.canParse = function(data, options) {
  if (!data) {
    return false;
  }
  var type = options.fileType;
  return (
    _.isString(data) &&
      (type === 'pubchem+json' || (!type && data[0] === '{'))
  );
};

PubChemParser.canProbablyParse = function(data) {
  return _.isString(data) && data[0] === '{';
};

PubChemParser.prototype.parseSync = function() {
  this.logger.info('Parsing PubChem JSON file...');
  return this._toComplex(JSON.parse(this._data));
};

PubChemParser.prototype._toComplex = function(jsonData) {
  var complex = new Complex();
  var complexData = jsonData.PC_Compounds && jsonData.PC_Compounds[0];
  if (complexData) {
    this._extractAtoms(complex, complexData);
    complex.finalize({
      needAutoBonding: false,
      detectAromaticLoops: this.settings.now.aromatic,
      enableEditing: this.settings.now.editing,
    });
  }
  return complex;
};

PubChemParser.prototype._extractAtoms = function(complex, complexData) {
  var aids = complexData.atoms && complexData.atoms.aid;
  var elements = aids && complexData.atoms.element;
  if (!elements || aids.length !== elements.length) {
    throw new Error('Unable to parse atom elements');
  }
  elements = _.fromPairs(_.zip(aids, elements));
  var atoms = {};

  var coords = complexData.coords && complexData.coords[0];
  var model = coords && coords.conformers && coords.conformers[0];
  var xs = model && model.x;
  var ys = model && model.y;
  var zs = model && model.z || [];
  aids = coords && coords.aid;
  if (!aids || !xs || !ys) {
    throw new Error('Coordinates are not found in the file');
  }

  var chain = complex.addChain(' ');
  var residue = chain.addResidue('UNK', 1, ' ');

  for (var i = 0, n = aids.length; i < n; ++i) {
    var aid = aids[i];
    var element = Element.ByAtomicNumber[elements[aid]];
    var xyz = new THREE.Vector3(xs[i], ys[i], zs[i] || 0.0);
    atoms[aid] = residue.addAtom(element.name, element, xyz, undefined, true, aid, ' ', 1.0, 0.0, 0);
  }

  var aids1 = complexData.bonds && complexData.bonds.aid1;
  var aids2 = complexData.bonds && complexData.bonds.aid2;
  var orders = complexData.bonds && complexData.bonds.order || [];
  if (!aids1 || !aids2 || aids1.length !== aids2.length) {
    return;
  }

  for (var j = 0, m = aids1.length; j < m; ++j) {
    complex.addBond(atoms[aids1[j]], atoms[aids2[j]], orders[j] || 1, 0, true);
  }
};

PubChemParser.formats = ['pubchem', 'pubchem+json', 'pc'];
PubChemParser.extensions = ['.json'];

export default PubChemParser;
