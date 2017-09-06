import utils from './utils';
import VolumeMesh from './gfx/VolumeMesh';
import Visual from './Visual';

function VolumeVisual(name, dataSource) {
  Visual.call(this, name, dataSource);

  this._mesh = new VolumeMesh();
  this._mesh.setDataSource(dataSource);
  this.add(this._mesh);
}

utils.deriveClass(VolumeVisual, Visual);

VolumeVisual.prototype.getBoundaries = function() {
  var box = this._dataSource.getBox();

  return {
    boundingBox: box,
    boundingSphere: box.getBoundingSphere()
  };
};

VolumeVisual.prototype.getMesh = function() {
  return this._mesh;
};

export default VolumeVisual;

