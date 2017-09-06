

//////////////////////////////////////////////////////////////////////////////
import Residue from './Residue';
//////////////////////////////////////////////////////////////////////////////

/**
 * Helical secondary structure of a protein.
 *
 * @param {number} serial  -
 * @param {string} name    -
 * @param {Residue} start  -
 * @param {Residue} end    -
 * @param {number} type    -
 * @param {string} comment -
 * @param {number} length  -
 *
 * @exports Helix
 * @constructor
 */
function Helix(serial, name, start, end, type, comment, length) {
  this._serial = serial;
  this._name = name;
  this._start = start;
  this._end = end;
  this._type = type;
  this._comment = comment;
  this._length = length;

  this._residues = []; // TODO: list or range? is it correct to use ranges?
}

Helix.prototype.type = 'helix';

Helix.prototype.getName = function() {
  return this._name;
};

Helix.prototype._finalize = function(residueHash, complex) {
  if (this._start instanceof Residue &&
        this._end instanceof Residue) {
    // no need to convert unified serial numbers to actual references
    return;
  }

  var start = complex.splitUnifiedSerial(this._start);
  var end = complex.splitUnifiedSerial(this._end);
  for (var chainId = start.chain; chainId <= end.chain; chainId++) {
    for (var serId = start.serial; serId <= end.serial; serId++) {
      for (var iCodeId = start.iCode; iCodeId <= end.iCode; iCodeId++) {
        var midCode = complex.getUnifiedSerial(chainId, serId, iCodeId);
        if (typeof residueHash[midCode] !== 'undefined') {
          var res = residueHash[midCode];
          res._secondary = this;
          this._residues.push(res);
        }
      }
    }
  }
  //Replace unfined serials by objects
  this._start = residueHash[this._start];
  this._end = residueHash[this._end];
};

export default Helix;

