

import _ from 'lodash';
import * as THREE from 'three';
import settings from '../settings';

function neutralColor(intensity) {
  return new THREE.Color(intensity, intensity, intensity);
}

var materialList = [
  {
    id: 'DF',
    name: 'Diffuse',
    shortName: 'Diffuse',
    uberOptions: {
      diffuse: neutralColor(1.0),
      specular: neutralColor(0.0),
      shininess: 1,
      opacity: 1.0
    }
  }, {
    id: 'SF',
    name: 'Soft Plastic',
    shortName: 'Soft',
    uberOptions: {
      diffuse: neutralColor(1.0),
      specular: neutralColor(0.1),
      shininess: 30,
      opacity: 1.0
    }
  }, {
    id: 'PL',
    name: 'Glossy Plastic',
    shortName: 'Glossy',
    uberOptions: {
      diffuse: neutralColor(0.56),
      specular: neutralColor(0.28),
      shininess: 100,
      opacity: 1.0
    }
  }, {
    id: 'ME',
    name: 'Metal',
    shortName: 'Metal',
    uberOptions: {
      diffuse: neutralColor(0.56),
      specular: neutralColor(0.55),
      shininess: 30,
      opacity: 1.0
    }
  }, {
    id: 'TR',
    name: 'Transparent',
    shortName: 'Transparent',
    uberOptions: {
      diffuse: neutralColor(1.0),
      specular: neutralColor(0.0),
      shininess: 1,
      opacity: 0.5
    }
  }, {
    id: 'GL',
    name: 'Glass',
    shortName: 'Glass',
    uberOptions: {
      diffuse: neutralColor(0.50),
      specular: neutralColor(0.65),
      shininess: 100,
      opacity: 0.5
    }
  }
];

var materialDict = {};

for (var i = 0, n = materialList.length; i < n; ++i) {
  if (materialList[i].id) {
    materialDict[materialList[i].id] = materialList[i];
  }
}

export default {
  list: materialList,

  descriptions: _.map(materialList, (m) => _.pick(m, ['id', 'name'])),

  any: materialDict[settings.now.presets.default.material] || materialList[0],

  get: function(id) {
    return materialDict[id];
  },
};

