import * as THREE from 'three';

class RCGroup extends THREE.Group {
  raycast(raycaster, intersects) {
    if (!this.visible) {
      return;
    }

    const { children } = this;
    for (let i = 0, n = children.length; i < n; ++i) {
      children[i].raycast(raycaster, intersects);
    }
  }

  enableSubset(mask, innerOnly) {
    const { children } = this;
    for (let i = 0, n = children.length; i < n; ++i) {
      if (children[i].enableSubset) {
        children[i].enableSubset(mask, innerOnly);
      }
    }
  }

  disableSubset(mask, innerOnly) {
    const { children } = this;
    for (let i = 0, n = children.length; i < n; ++i) {
      if (children[i].disableSubset) {
        children[i].disableSubset(mask, innerOnly);
      }
    }
  }

  isEmpty() {
    return this.children.length === 0;
  }

  updateToFrame(frameData) {
    const { children } = this;
    for (let i = 0, n = children.length; i < n; ++i) {
      if (children[i].updateToFrame) {
        children[i].updateToFrame(frameData);
      }
    }
  }

  getSubset(mask, innerOnly) {
    const totalSubset = [];
    const { children } = this;
    for (let i = 0, n = children.length; i < n; ++i) {
      if (children[i].getSubset) {
        Array.prototype.push.apply(totalSubset, children[i].getSubset(mask, innerOnly));
      }
    }
    return totalSubset;
  }
}

export default RCGroup;
