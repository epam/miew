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
      toonShading: false,
      side: THREE.DoubleSide
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
      toonShading: false,
      side: THREE.DoubleSide
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
      toonShading: false,
      side: THREE.DoubleSide
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
      toonShading: false,
      side: THREE.DoubleSide
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
      toonShading: false,
      side: THREE.DoubleSide
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
      toonShading: false,
      side: THREE.DoubleSide
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
      depthWrite: true,
      transparent: false,
      toonShading: false,
      side: THREE.BackSide
    }
  }, {
    id: 'TN',
    name: 'Toon',
    shortName: 'Toon',
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
      toonShading: true,
      side: THREE.DoubleSide
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
      side: THREE.DoubleSide
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
