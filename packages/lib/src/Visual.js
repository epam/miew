import gfxutils from './gfx/gfxutils'
import { Box3, Sphere, Vector3 } from 'three'

const _defaultBoundaries = {
  boundingBox: new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1)),
  boundingSphere: new Sphere(new Vector3(0, 0, 0), 1)
}

class Visual extends gfxutils.RCGroup {
  constructor(name, dataSource) {
    super(name, dataSource)
    this.name = name
    this._dataSource = dataSource
  }

  release() {
    if (this.parent) {
      this.parent.remove(this)
    }
  }

  getDataSource() {
    return this._dataSource
  }

  getBoundaries() {
    return _defaultBoundaries
  }
}

export default Visual
