/**
 * Atom name: simple and cooked.
 *
 * @param {string} name    - Simple atom name as a sting
 * @param {object} node    - Cooked name for pretty printing
 *
 * @exports Atom
 * @constructor
 */

class AtomName {
  constructor(name, node) {
    this._node = node || null;
    this._name = name || null;
    if (this._node === null && this._name === null) {
      this._name = 'Unknown';
    }
  }

  /**
   * Get atom full name.
   * @returns {string} Atom simple name.
   */
  getString() {
    return this._name || 'unknown';
  }

  /**
   * Get atom full pretty name.
   * @returns {object} Atom simple name.
   */
  getNode() {
    return this._node || null;
  }
}

export default AtomName;

