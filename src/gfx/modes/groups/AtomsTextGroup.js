

import AtomsGroup from './AtomsGroup';
import utils from '../../../utils';

function adjustColor(color) {
  var r = (color >> 16) & 255;
  var g = (color >> 8) & 255;
  var b = color & 255;

  if (0.2126 * r + 0.7152 * g + 0.0722 * b > 127) {
    r = r * 3 / 10;
    g = g * 3 / 10;
    b = b * 3 / 10;
  } else {
    r = 255 - ((255 - r) * 3 / 10);
    g = 255 - ((255 - g) * 3 / 10);
    b = 255 - ((255 - b) * 3 / 10);
  }

  return (r << 16) | (g << 8) | b;
}

function inverseColor(color) {
  var r = (color >> 16) & 255;
  var g = (color >> 8) & 255;
  var b = color & 255;

  return ((255 - r) << 16) | ((255 - g) << 8) | (255 - b);
}

function getAtomText(atom) {
  if (atom.getName().getNode() !== null) {
    return atom.getName().getNode();
  }

  if (!atom.isLabelVisible()) {
    return null;
  }

  return atom.getVisualName();
}

var colorMappings = {
  none: function(c) {
    return c;
  },
  adjust: adjustColor,
  inverse: inverseColor,
};

function propagateColor(color, rule) {
  var result;
  if (colorMappings.hasOwnProperty(rule)) {
    result = utils.hexColor(colorMappings[rule](color));
  } else {
    var val = parseInt(rule, 16);
    if (!Number.isNaN(val) && rule.toLowerCase().startsWith('0x')) {
      result = utils.hexColor(val);
    } else {
      result = '#000000';
    }
  }
  return result;
}

var templateMappings = {
  serial: function(a) {
    return a.getSerial();
  },
  name: function(a) {
    return a.getVisualName();
  },
  elem: function(a) {
    return a.element.name;
  },
  residue: function(a) {
    return a._residue.getType().getName();
  },
  sequence: function(a) {
    return a._residue.getSequence();
  },
  chain: function(a) {
    return a._residue.getChain().getName();
  },
  hetatm: function(a) {
    return a.isHet();
  },
  water: function(a) {
    return a._residue.getType().getName() === 'HOH' || a._residue.getType().getName() === 'WAT';
  },
};

var parseTemplate = function(atom, str) {
  return str.replace(/\{\{(\s*\w+\s*)\}\}/g, function(m) {
    var key = m.replace(/\s+/g, '');
    key = key.substring(2, key.length - 2).toLowerCase();

    if (templateMappings.hasOwnProperty(key)) {
      return templateMappings[key](atom);
    }
    return 'null';
  });
};

function AtomsTextGroup(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
  this._geoArgs = this._makeGeoArgs(selection, mode, colorer, polyComplexity);
  AtomsGroup.call(this, geoParams, selection, colorer, mode, transforms, polyComplexity, material);
}

AtomsTextGroup.prototype = Object.create(AtomsGroup.prototype);
AtomsTextGroup.prototype.constructor = AtomsTextGroup;

AtomsTextGroup.prototype._makeGeoArgs = function(selection, mode, _colorer, _polyComplexity) {
  var opts = mode.getLabelOpts();
  return [selection.chunks.length, opts];
};

AtomsTextGroup.prototype._build = function() {
  var opts = this._mode.getLabelOpts();
  // TODO is it correct to filter atoms here?
  var atomsIdc  = this._selection.chunks;
  var atoms = this._selection.atoms;
  var parent = this._selection.parent;
  var colorer = this._colorer;
  var geo = this._geo;
  for (var i = 0, n = atomsIdc.length; i < n; ++i) {
    var atom = atoms[atomsIdc[i]];
    var text = opts.template ? parseTemplate(atom, opts.template) : getAtomText(atom);
    if (!text) {
      continue;
    }
    var color = colorer.getAtomColor(atom, parent);
    var fgColor =  parseInt(propagateColor(color, opts.fg).substring(1), 16);
    var bgColor = opts.showBg ? parseInt(propagateColor(color, opts.bg).substring(1), 16) : 'transparent';
    geo.setItem(i, atom.getPosition(), text);
    geo.setColor(i, fgColor, bgColor);
  }
  geo.finalize();
};

AtomsTextGroup.prototype.updateToFrame = function(frameData) {
  // TODO This method looks like a copy paste. However, it
  // was decided to postpone animation refactoring until GFX is fixed.
  var opts = this._mode.getLabelOpts();
  // TODO is it correct to filter atoms here?
  var atomsIdc  = this._selection.chunks;
  var atoms = this._selection.atoms;
  var colorer = this._colorer;
  var geo = this._geo;
  var updateColor = frameData.needsColorUpdate(colorer);
  for (var i = 0, n = atomsIdc.length; i < n; ++i) {
    var atom = atoms[atomsIdc[i]];
    var text = opts.template ? parseTemplate(atom, opts.template) : getAtomText(atom);
    if (!text) {
      continue;
    }
    var color = frameData.getAtomColor(colorer, atom);
    var fgColor =  parseInt(propagateColor(color, opts.fg).substring(1), 16);
    var bgColor = opts.showBg ? parseInt(propagateColor(color, opts.bg).substring(1), 16) : 'transparent';
    geo.setItem(i, frameData.getAtomPos(atomsIdc[i]), text);
    if (updateColor) {
      geo.setColor(i, fgColor, bgColor);
    }
  }

  geo.finalize();
};

export default AtomsTextGroup;

