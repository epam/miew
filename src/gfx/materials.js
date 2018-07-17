import _ from 'lodash';
import * as THREE from 'three';
import EntityList from '../utils/EntityList';

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
      transparent: false,
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
      transparent: false,
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
      transparent: false,
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
      transparent: false,
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
  }, {
    id: 'FL',
    name: 'Flat',
    shortName: 'Flat',
    uberOptions: {
      diffuse: neutralColor(1.0),
      specular: neutralColor(0.0),
      shininess: 0,
      opacity: 1.0
    },
    values: {
      lights: false,
      fog: true,
      depthWrite: true,
      transparent: false,
    }
  }
];

const materials = new EntityList(materialList);

/** @deprecated */
Object.defineProperty(materials, 'list', {
  get: function() {
    return this.all;
  },
});

/** @deprecated */
Object.defineProperty(materials, 'any', {
  get: function() {
    return this.first;
  },
});

/** @deprecated */
Object.defineProperty(materials, 'descriptions', {
  get: function() {
    return _.map(this._list, (m) => _.pick(m, ['id', 'name']));
  },
});

export default materials;
