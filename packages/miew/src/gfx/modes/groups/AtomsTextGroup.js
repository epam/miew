import AtomsGroup from './AtomsGroup';
import utils from '../../../utils';

function adjustColor(color) {
  let r = (color >> 16) & 255;
  let g = (color >> 8) & 255;
  let b = color & 255;

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
  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;

  return ((255 - r) << 16) | ((255 - g) << 8) | (255 - b);
}

function getAtomText(atom) {
  if (atom.name.getNode() !== null) {
    return atom.name.getNode();
  }

  return atom.getVisualName();
}

const colorMappings = {
  none(c) {
    return c;
  },
  adjust: adjustColor,
  inverse: inverseColor,
};

function propagateColor(color, rule) {
  let result;
  if (colorMappings.hasOwnProperty(rule)) {
    result = utils.hexColor(colorMappings[rule](color));
  } else {
    const val = parseInt(rule, 16);
    if (!Number.isNaN(val) && rule.toLowerCase().startsWith('0x')) {
      result = utils.hexColor(val);
    } else {
      result = '#000000';
    }
  }
  return result;
}

const templateMappings = {
  serial(a) {
    return a.serial;
  },
  name(a) {
    return a.getVisualName();
  },
  elem(a) {
    return a.element.name;
  },
  residue(a) {
    return a.residue.getType().getName();
  },
  sequence(a) {
    return a.residue.getSequence();
  },
  chain(a) {
    return a.residue.getChain().getName();
  },
  hetatm(a) {
    return a.isHet();
  },
  water(a) {
    return a.residue.getType().getName() === 'HOH' || a.residue.getType().getName() === 'WAT';
  },
};

const parseTemplate = function (atom, str) {
  return str.replace(/\{\{(\s*\w+\s*)\}\}/g, (m) => {
    let key = m.replace(/\s+/g, '');
    key = key.substring(2, key.length - 2).toLowerCase();

    if (templateMappings.hasOwnProperty(key)) {
      return templateMappings[key](atom);
    }
    return 'null';
  });
};

class AtomsTextGroup extends AtomsGroup {
  _makeGeoArgs() {
    const opts = this._mode.getLabelOpts();
    return [this._selection.chunks.length, opts];
  }

  _build() {
    const opts = this._mode.getLabelOpts();
    const atomsIdc = this._selection.chunks;
    const { atoms, parent } = this._selection;
    const colorer = this._colorer;
    const geo = this._geo;
    for (let i = 0, n = atomsIdc.length; i < n; ++i) {
      const atom = atoms[atomsIdc[i]];
      const text = opts.template ? parseTemplate(atom, opts.template) : getAtomText(atom);
      if (!text) {
        continue;
      }
      const color = colorer.getAtomColor(atom, parent);
      const fgColor = parseInt(propagateColor(color, opts.fg).substring(1), 16);
      const bgColor = opts.showBg ? parseInt(propagateColor(color, opts.bg).substring(1), 16) : 'transparent';
      geo.setItem(i, atom.position, text);
      geo.setColor(i, fgColor, bgColor);
    }
    geo.finalize();
  }

  updateToFrame(frameData) {
    // This method looks like a copy paste. However, it
    // was decided to postpone animation refactoring until GFX is fixed.
    const opts = this._mode.getLabelOpts();
    const atomsIdc = this._selection.chunks;
    const { atoms } = this._selection;
    const colorer = this._colorer;
    const geo = this._geo;
    const updateColor = frameData.needsColorUpdate(colorer);
    for (let i = 0, n = atomsIdc.length; i < n; ++i) {
      const atom = atoms[atomsIdc[i]];
      const text = opts.template ? parseTemplate(atom, opts.template) : getAtomText(atom);
      if (!text) {
        continue;
      }
      const color = frameData.getAtomColor(colorer, atom);
      const fgColor = parseInt(propagateColor(color, opts.fg).substring(1), 16);
      const bgColor = opts.showBg ? parseInt(propagateColor(color, opts.bg).substring(1), 16) : 'transparent';
      geo.setItem(i, frameData.getAtomPos(atomsIdc[i]), text);
      if (updateColor) {
        geo.setColor(i, fgColor, bgColor);
      }
    }
    geo.finalize();
  }
}

export default AtomsTextGroup;
