

import * as THREE from 'three';
import utils from '../../utils';
import SceneObject from './SceneObject';
import gfxutils from '../gfxutils';
import UberMaterial from '../shaders/UberMaterial';
import meshes from '../meshes/meshes';

function LinesObj(params, opts) {
  SceneObject.call(this, params, opts);
  if (params.length < 2) {
    throw new Error('Wrong number of argumets on line object creation!');
  }
  this._id1 = params[0];
  this._id2 = params[1];
}

utils.deriveClass(LinesObj, SceneObject, {
  type: 'line'
});

LinesObj.prototype.constructor = LinesObj;

LinesObj.prototype._getAtomFromName = function(complex, atomId) {
  var err = ' - Wrong atom format it must be \'#CHAIN_NAME.#NUMBER.#ATOM_NAME\' (e.g. \'A.38.CO1\')';
  var atom1 = complex.getAtomByFullname(atomId);
  if (!atom1) {
    throw new Error(atomId + err);
  }
  return atom1;
};

LinesObj.prototype.build = function(complex) {
  var geom = new THREE.Geometry();
  this._atom1 = this._getAtomFromName(complex, this._id1);
  this._atom2 = this._getAtomFromName(complex, this._id2);

  geom.vertices[0] = this._atom1._position.clone();
  geom.vertices[1] = this._atom2._position.clone();
  geom.dynamic = true;
  geom.computeLineDistances();
  geom.computeBoundingBox();

  this._line = new meshes.Line(geom, new UberMaterial({lights: false, overrideColor: true, dashedLine: true}));
  this._line.material.setUberOptions({
    fixedColor: new THREE.Color(this.opts.color),
    dashedLineSize: this.opts.dashSize,
    dashedLinePeriod: this.opts.dashSize + this.opts.gapSize,
  });
  this._line.material.updateUniforms();

  this._line.raycast = function(_raycaster, _intersects) {};
  this._mesh = this._line;
  var transforms = complex.getTransforms();
  if (transforms.length > 0) {
    this._mesh = new THREE.Group();
    this._mesh.add(this._line);
    gfxutils.applyTransformsToMeshes(this._mesh, transforms);
  }
};

LinesObj.prototype.updateToFrame = function(frameData) {
  if (!this._atom1 || !this._atom2 || !this._line) {
    return;
  }
  var geo = this._line.geometry;
  geo.vertices[0].copy(frameData.getAtomPos(this._atom1._index));
  geo.vertices[1].copy(frameData.getAtomPos(this._atom2._index));
  //geo.computeBoundingBox();
  geo.computeLineDistances();
  geo.computeBoundingSphere();

  geo.verticesNeedUpdate = true;
};

export default LinesObj;

