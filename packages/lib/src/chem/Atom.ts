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

interface AtomAttributes {
  residue: any
  name: any
  type: any
  position: any
  role: any
  het: any
  serial: any
  location: any
  occupancy: any
  temperature: any
  charge: any
}

class Atom {
  index: any
  residue: any
  name: any
  element: any
  position: any
  role: any
  mask: any
  het: any
  serial: any
  location: any
  occupancy: any
  temperature: any
  charge: any
  hydrogenCount: any
  radicalCount: any
  valence: any
  bonds: any
  flags: any

  constructor(attributes: AtomAttributes) {
    this.index = -1
    this.residue = attributes.residue
    this.name = attributes.name
    this.element = attributes.type
    this.position = attributes.position
    this.role = attributes.role
    this.mask = 1 | 0

    this.het = attributes.het

    this.serial = attributes.serial
    this.location = (attributes.location || ' ').charCodeAt(0)
    this.occupancy = attributes.occupancy || 1
    this.temperature = attributes.temperature
    this.charge = attributes.charge
    this.hydrogenCount = -1 // explicitly invalid
    this.radicalCount = 0
    this.valence = -1 // explicitly invalid

    this.bonds = []

    this.flags = 0x0000
    if (attributes.type.name === 'H') {
      this.flags |= Atom.Flags.HYDROGEN
    } else if (attributes.type.name === 'C') {
      this.flags |= Atom.Flags.CARBON
    }
  }

  isHet() {
    return this.het
  }

  isHydrogen() {
    return this.element.number === 1
  }

  getVisualName() {
    const { name } = this
    if (name.length > 0) {
      return name
    }
    return this.element.name.trim()
  }

  forEachBond(process: any) {
    const { bonds } = this
    for (let i = 0, n = bonds.length; i < n; ++i) {
      process(bonds[i])
    }
  }

  getFullName() {
    let name = ''
    if (this.residue !== null) {
      if (this.residue._chain !== null) {
        name += `${this.residue._chain.getName()}.`
      }
      name += `${this.residue._sequence}.`
    }
    name += this.name
    return name
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
    NONPOLARH: 0x1008
  }
}

export default Atom
