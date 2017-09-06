

//////////////////////////////////////////////////////////////////////////////
import Strand from './Strand';
//////////////////////////////////////////////////////////////////////////////

/**
 * Sheet secondary structure of a protein.
 *
 * @param {string} name -
 * @param {number} width -
 *
 * @exports Sheet
 * @constructor
 */
function Sheet(name, width) {
  this._name = name;
  this._width = width;

  this._strands = [];
}

// Getters and setters
Sheet.prototype.getName = function() {
  return this._name;
};

Sheet.prototype.getWidth = function() {
  return this._width;
};

Sheet.prototype.addStrand = function(strand) {
  this._strands.push(strand);
};

Sheet.prototype.addEmptyStrand = function() {
  this._strands.push(new Strand(null, null, null, null, null, null));
};

Sheet.prototype._finalize = function(serialAtomMap, residueHash, complex) {
  const s = this._strands;
  for (let i = 0, n = s.length; i < n; ++i) {
    s[i]._finalize(serialAtomMap, residueHash, complex);
  }
  if (!this._width) {
    this._width = s.length;
  }
  if (s.length !== this._width) {
    throw new Error('Sheet ' + this._name + ' is inconsistent.');
  }

};

export default Sheet;

