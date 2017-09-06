

//////////////////////////////////////////////////////////////////////////////
import Residue from './Residue';
//////////////////////////////////////////////////////////////////////////////

/**
 * A single strand of a sheet in a protein secondary structure.
 *
 * @param {Sheet} sheet   -
 * @param {Residue} start -
 * @param {Residue} end   -
 * @param {number} sense  -
 * @param {Atom} cur      -
 * @param {Atom} prev     -
 *
 * @exports Strand
 * @constructor
 */
function Strand(sheet, start, end, sense, cur, prev) {
  this._sheet = sheet;
  this._start = start;
  this._end = end;
  this._sense = sense;
  this._cur = cur;
  this._prev = prev;

  this._residues = [];
}

Strand.prototype.type = 'strand';

// Getters and setters
Strand.prototype.getSheet = function() {
  return this._name;
};

Strand.prototype.setSheet = function(sheet) {
  this._sheet = sheet;
};

Strand.prototype.getStart = function() {
  return this._width;
};

Strand.prototype._finalize = function(serialAtomMap, residueHash, complex) {
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
  var as = this._cur;
  if (!Number.isNaN(as)) {
    this._cur = serialAtomMap[as];
  }
  as = this._prev;
  if (!Number.isNaN(as)) {
    this._prev = serialAtomMap[as];
  }
  //Replace unfined serials by objects
  this._start = residueHash[this._start];
  this._end = residueHash[this._end];
};

export default Strand;

