/**
 * Atom measurements.
 *
 * @param {Residue} residue    - (required) Residue containing the atom
 * @param {string} name        - (required) Name, unique in the residue
 * @param {Element} type       - (required) Chemical element reference
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

class Atom {
  constructor(residue, name, type, position, role, het, serial, location, occupancy, temperature, charge) {
    this.index = -1;
    this.residue = residue;
    this.name = name;
    this.element = type;
    this.position = position;
    this.role = role;
    this.mask = 1 | 0;

    this.het = het;

    this.serial = serial;
    this.location = (location || ' ').charCodeAt(0);
    this.occupancy = occupancy || 1;
    this.temperature = temperature;
    this.charge = charge;
    this.hydrogenCount = -1; // explicitly invalid
    this.radicalCount = 0;
    this.valence = -1; // explicitly invalid

    this.bonds = [];

    this.flags = 0x0000;
    if (type.name === 'H') {
      this.flags |= Atom.Flags.HYDROGEN;
    } else if (type.name === 'C') {
      this.flags |= Atom.Flags.CARBON;
    }
  }

  isHet() {
    return this.het;
  }

  isHydrogen() {
    return this.element.number === 1;
  }

  getVisualName() {
    const { name } = this;
    if (name.length > 0) {
      return name;
    }
    return this.element.name.trim();
  }

  forEachBond(process) {
    const { bonds } = this;
    for (let i = 0, n = bonds.length; i < n; ++i) {
      process(bonds[i]);
    }
  }

  getFullName() {
    let name = '';
    if (this.residue !== null) {
      if (this.residue._chain !== null) {
        name += `${this.residue._chain.getName()}.`;
      }
      name += `${this.residue._sequence}.`;
    }
    name += this.name;
    return name;
  }

  /**
   * Enumeration of atom flag values.
   *
   * @enum {number}
   * @readonly
   */
  static Flags = {
    CARBON: 0x0001,
    // OXYGEN: 0x0002,
    // NITROGEN: 0x0004,
    HYDROGEN: 0x0008,
    /** Non-polar hydrogen (it is also a HYDROGEN) */
    NONPOLARH: 0x1008,
  };
}

export default Atom;
