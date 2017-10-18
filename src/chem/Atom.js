

//////////////////////////////////////////////////////////////////////////////
import AtomName from './AtomName';
import Element from './Element';
//////////////////////////////////////////////////////////////////////////////

/**
 * Atom measurements.
 *
 * @param {Residue} residue    - Residue containing the atom
 * @param {AtomName} name        - Name, unique in the residue
 * @param {Element} type      - Chemical element reference
 * @param {THREE.Vector3} position - Registered coordinates
 *
 * @param {number} role        - Role of atom inside monomer: Lead and wing are particularity interesting
 * @param {boolean} het        - Non-standard residue indicator
 *
 * @param {number} serial      - Serial number, unique in the model
 * @param {string} location    - Alternative location indicator (usually space or A-Z)
 * @param {number} occupancy   - Occupancy percentage, from 0 to 1
 * @param {number} temperature - Temperature
 * @param {number} charge      - Charge
 *
 * @exports Atom
 * @constructor
 */
function Atom(residue, name, type, position, role, het, serial, location, occupancy, temperature, charge) {
  this._index = -1;
  this._residue = residue;
  if (name instanceof AtomName) {
    this._name = name;
  } else {
    this._name = new AtomName(name);
  }

  this.element = type;
  this._position = position;
  this._role = role;
  this._mask = 1 | 0;
  this._index = -1;

  this._het = het;

  this._serial = serial;
  this._location = (location || ' ').charCodeAt(0);
  this._occupancy = occupancy || 1;
  this._temperature = temperature;
  this._charge = charge;
  this._hydrogenCount = -1; //explicitly invalid
  this._radicalCount = 0;
  this._valence = -1; //explicitly invalid

  this._bonds = [];

  this.flags = 0x0000;
  if (type.name === 'H') {
    this.flags |= Atom.Flags.HYDROGEN;
  } else if (type.name === 'C') {
    this.flags |= Atom.Flags.CARBON;
  }
}

/**
 * Enumeration of atom flag values.
 *
 * @enum {number}
 * @readonly
 */
Atom.Flags = {
  CARBON: 0x0001,
  // OXYGEN: 0x0002,
  // NITROGEN: 0x0004,
  HYDROGEN: 0x0008,
  /** Non-polar hydrogen (it is also a HYDROGEN) */
  NONPOLARH: 0x1008,
};

/**
 * Get atom full name.
 * @returns {AtomName} Atom full name.
 */
Atom.prototype.getName = function() {
  return this._name;
};

Atom.prototype.getPosition = function() {
  return this._position;
};

Atom.prototype.getResidue = function() {
  return this._residue;
};

Atom.prototype.getSerial = function() {
  return this._serial;
};

Atom.prototype.getBonds = function() {
  return this._bonds;
};

Atom.prototype.isHet = function() {
  return this._het;
};

Atom.prototype.isHydrogen = function() {
  return this.element.number === 1;
};

Atom.prototype.getValence = function() {
  return (this._valence === -1) ? 0 : this._valence;
};

Atom.prototype.getVisualName = function() {
  var name = this.getName();
  if (name.getString().length > 0) {
    return name.getString();
  } else {
    return this.element.name.trim();
  }
};

Atom.prototype.forEachBond = function(process) {
  var bonds = this._bonds;
  for (var i = 0, n = bonds.length; i < n; ++i) {
    process(bonds[i]);
  }
};

/** @deprecated Old-fashioned atom labels, to be removed in the next major version. */
Atom.prototype.isLabelVisible = function() {
  if (this.getName().getNode() !== null) {
    return true;
  }
  if (this.element === null) {
    return false;
  }
  if (this.element.number === Element.ByName.C.number) {
    var n = this.getVisualName();
    if (n === null) {
      return false;
    }
    if (n.length === 1 && n.charCodeAt(0) === 0x43 && this.getBonds().length !== 0) {
      return false;
    }
  }

  return true;
};

Atom.prototype.getHydrogenCountBoron = function() {
  //examples
  //BH3*BH4(1-)*BH2(1+)*BH3(2-)*BH(2+)
  var valence = 3; //hardcoded as 3
  var hc = valence - this.getCharge() - this.getAtomBondsCount() - this._radicalCount;
  return Math.max(0, hc);
};

Atom.prototype.getHydrogenCountTin = function() {
  var valence = this._valence;
  if (valence === -1) {
    valence = this.getAtomBondsCount() - Math.abs(this.getCharge()) + this._radicalCount;
  }

  var defVal = this.findSuitableValence(valence);
  if (this.getCharge() !== 0) {
    defVal = 4;
  }
  //find default valency for our case
  return Math.max(0, defVal - valence);
};

Atom.prototype.getHydrogenCountMetal = function() {
  return 0;
};

Atom.prototype.getHydrogenCountGroup14 = function() {
  var valence = this._valence;
  if (valence === -1) {
    valence = this.getAtomBondsCount() - Math.abs(this.getCharge()) + this._radicalCount;
  }

  var defVal = this.findSuitableValence(valence);
  //find default valency for our case
  return Math.max(0, defVal - valence);
};

Atom.prototype.getHydrogenCountNonMetal = function() {
  // apply from Reaxys Drawing Guidelines (Version 2.04
  // January 2012) Standard Valence – (Valence + Charge + Number of Radical(s))
  var valence = this._valence;
  if (valence === -1) {
    valence = this.getAtomBondsCount() - this.getCharge() + this._radicalCount;
  }
  var defVal = this.findSuitableValence(valence);

  //find default valency for our case
  return Math.max(0, defVal - valence);
};

Atom.prototype.getHydrogenCountHydrogen = function() {
  if (this.getAtomBondsCount() === 0 && this.getCharge() === 0 &&
    this.getValence() === 0 && this._radicalCount === 0) {
    return 1;
  }
  //do add in any other case
  return 0;
};

Atom.prototype.getHydrogenCount = function() {
  if (this._hydrogenCount >= 0) {
    return this._hydrogenCount;
  }

  var element = this.element;
  var val = element.hydrogenValency;
  if (val.length === 1 && val[0] === 0) {
    return 0;
  }

  switch (element.number) {
  case 1:
    return this.getHydrogenCountHydrogen();
  case 3:
  case 11:
  case 19:
  case 37:
  case 55:
  case 87: //group 1
  case 4:
  case 12:
  case 20:
  case 38:
  case 56:
  case 88: //group 2
  case 13:
  case 31:
  case 49:
  case 41: //group 13 but Boron
  case 82:
  case 83: //Bi and Pb
    return this.getHydrogenCountMetal();
  case 6:
  case 14:
  case 32:
  case 51:      //C, Si, Ge, Sb
    return this.getHydrogenCountGroup14();
  case 50:       //Sn
    return this.getHydrogenCountTin();
  case 7:
  case 8:
  case 9:
  case 15:
  case 16:
  case 17:      //N, O, F, P, S, Cl
  case 33:
  case 34:
  case 35:
  case 53:
  case 85:       //As, Se, Br, I, At
    return this.getHydrogenCountNonMetal();
  case 5:
    return this.getHydrogenCountBoron();
  default:
    return 0;
  }
};

function getCylinderCount(bondOrder) {
  return bondOrder < 2 ? 1 : bondOrder;
}

Atom.prototype.getAtomBondsCount = function() {
  var explicitBonds = this.getBonds();
  var ebCount = 0;
  for (var i = 0; i < explicitBonds.length; i++) {
    ebCount += getCylinderCount(explicitBonds[i].getOrder());
  }
  return ebCount;
};

Atom.prototype.findSuitableValence = function(valence) {
  var val = this.element.hydrogenValency;
  var defVal = val[val.length - 1];
  for (var i = 0; i < val.length; i++) {
    if (val[i] >= valence) {
      defVal = val[i];
      break;
    }
  }
  return defVal;
};

Atom.prototype.getCharge = function() {
  return this._charge;
};

Atom.prototype.getLocation = function() {
  return this._location;
};

Atom.prototype.getFullName = function() {
  var name = '';
  if (this._residue !== null) {
    if (this._residue._chain !== null) {
      name += this._residue._chain.getName() + '.';
    }

    name += this._residue._sequence + '.';
  }

  name += this._name.getString();

  return name;
};

export default Atom;

