

import _JM from './palettes/JmolPalette';
import _VM from './palettes/VmdPalette'; // FIXME: deps for amdclean

var paletteList = [];
var paletteDict = {};
var ag = [_JM, _VM];

for (var i = 0, n = ag.length; i < n; ++i) {
  var palette = ag[i];
  paletteList.push(palette);
  if (palette.id) {
    paletteDict[palette.id] = palette;
  }
}

export default {
  list: paletteList,

  any: paletteList[0],

  get: function(name) {
    return paletteDict[name];
  }
};

