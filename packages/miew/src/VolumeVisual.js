import * as THREE from 'three';
import VolumeMesh from './gfx/VolumeMesh';
import VolumeBounds from './gfx/VolumeBounds';
import VolumeFarPlane from './gfx/VolumeFarPlane';
import Visual from './Visual';
import settings from './settings';

class VolumeVisual extends Visual {
  constructor(name, dataSource) {
    super(name, dataSource);
    this._mesh = new VolumeMesh();
    this._mesh.setDataSource(dataSource);
    this.add(this._mesh);

    this._frame = new VolumeBounds(this.getBoundaries().boundingBox, this._mesh.volumeInfo);
    this.add(this._frame.getMesh());
    this.showFrame(settings.now.modes.VD.frame);

    this._farPlane = new VolumeFarPlane(this._mesh, 2, 2);
    this.add(this._farPlane.getMesh());
  }

  getBoundaries() {
    const box = this._dataSource.getBox();
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);

    return {
      boundingBox: box,
      boundingSphere: sphere,
    };
  }

  getMesh() {
    return this._mesh;
  }

  showFrame(needShow) {
    this._frame.getMesh().material.visible = needShow;
  }
}

export default VolumeVisual;
