

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
    },
    values: {
      lights: true,
      fog: true,
      depthWrite: true,
      transparent: true,
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
    },
    values: {
      lights: true,
      fog: true,
      depthWrite: true,
      transparent: true,
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
    },
    values: {
      lights: true,
      fog: true,
      depthWrite: true,
      transparent: true,
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
    },
    values: {
      lights: true,
      fog: true,
      depthWrite: true,
      transparent: true,
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
    },
    values: {
      lights: true,
      fog: true,
      depthWrite: true,
      transparent: true,
    }
  }, {
    id: 'GL',
    name: 'Glass',
    shortName: 'Glass',
    depthWrite: true,
    uberOptions: {
      diffuse: neutralColor(0.50),
      specular: neutralColor(0.65),
      shininess: 100,
      opacity: 0.5
    },
    values: {
      lights: true,
      fog: true,
      depthWrite: true,
      transparent: true,
    }
  }, {
    id: 'BA',
    name: 'Backdrop',
    shortName: 'Backdrop',
    uberOptions: {
      opacity: 1.0,
    },
    values: {
      lights: false,
      fog: false,
      depthWrite: false,
      transparent: false,
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

