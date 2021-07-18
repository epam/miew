import * as THREE from 'three';
import SceneObject from './SceneObject';
import meshutils from '../meshutils';
import UberMaterial from '../shaders/UberMaterial';
import meshes from '../meshes/meshes';
import settings from '../../settings';

class LinesObj extends SceneObject {
  constructor(params, opts) {
    super(params, opts);
    if (params.length < 2) {
      throw new Error('Wrong number of argumets on line object creation!');
    }
    [this._id1, this._id2] = params;
  }

  _getAtomFromName(complex, atomId) {
    const err = ' - Wrong atom format it must be \'#CHAIN_NAME.#RESIDUE_NUMBER.#ATOM_NAME\' (e.g. \'A.38.CO1\')';
    const atom1 = complex.getAtomByFullname(atomId);
    if (!atom1) {
      throw new Error(atomId + err);
    }
    return atom1;
  }

  build(complex) {
    const geom = new THREE.BufferGeometry();
    this._atom1 = this._getAtomFromName(complex, this._id1);
    this._atom2 = this._getAtomFromName(complex, this._id2);

    const p1 = this._atom1.position;
    const p2 = this._atom2.position;
    const vertices = new Float32Array([
      p1.x, p1.y, p1.z,
      p2.x, p2.y, p2.z,
    ]);

    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.computeBoundingBox();

    this._line = new meshes.Line(geom, new UberMaterial({
      lights: false,
      overrideColor: true,
      dashedLine: true,
      fogTransparent: settings.now.bg.transparent,
    }));
    this._line.computeLineDistances();
    this._line.material.setUberOptions({
      fixedColor: new THREE.Color(this.opts.color),
      dashedLineSize: this.opts.dashSize,
      dashedLinePeriod: this.opts.dashSize + this.opts.gapSize,
    });
    this._line.material.updateUniforms();

    this._line.raycast = function (_raycaster, _intersects) {};
    this._mesh = this._line;
    const transforms = complex.getTransforms();
    if (transforms.length > 0) {
      this._mesh = new THREE.Group();
      this._mesh.add(this._line);
      meshutils.applyTransformsToMeshes(this._mesh, transforms);
    }
  }

  updateToFrame(frameData) {
    if (!this._atom1 || !this._atom2 || !this._line) {
      return;
    }

    const geo = this._line.geometry;
    geo.vertices[0].copy(frameData.getAtomPos(this._atom1.index));
    geo.vertices[1].copy(frameData.getAtomPos(this._atom2.index));
    this._line.computeLineDistances();
    geo.computeBoundingSphere();

    geo.verticesNeedUpdate = true;
  }
}

LinesObj.prototype.constructor = LinesObj;
LinesObj.prototype.type = 'line';

export default LinesObj;
