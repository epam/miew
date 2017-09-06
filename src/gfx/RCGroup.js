

import * as THREE from 'three';
function RCGroup() {
  THREE.Group.call(this);
}

RCGroup.prototype = Object.create(THREE.Group.prototype);
RCGroup.prototype.constructor = RCGroup;
RCGroup.prototype.raycast = function(raycaster, intersects) {
  if (!this.visible) {
    return;
  }

  var children = this.children;
  for (var i = 0, n = children.length; i < n; ++i) {
    children[i].raycast(raycaster, intersects);
  }
};

RCGroup.prototype.enableSubset = function(mask, innerOnly) {
  var children = this.children;
  for (var i = 0, n = children.length; i < n; ++i) {
    if (children[i].enableSubset) {
      children[i].enableSubset(mask, innerOnly);
    }
  }
};

RCGroup.prototype.disableSubset = function(mask, innerOnly) {
  var children = this.children;
  for (var i = 0, n = children.length; i < n; ++i) {
    if (children[i].disableSubset) {
      children[i].disableSubset(mask, innerOnly);
    }
  }
};

RCGroup.prototype.isEmpty = function() {
  return this.children.length === 0;
};

RCGroup.prototype.updateToFrame = function(frameData) {
  var children = this.children;
  for (var i = 0, n = children.length; i < n; ++i) {
    if (children[i].updateToFrame) {
      children[i].updateToFrame(frameData);
    }
  }
};

RCGroup.prototype.getSubset = function(mask, innerOnly) {
  var totalSubset = [];
  var children = this.children;
  for (var i = 0, n = children.length; i < n; ++i) {
    if (children[i].getSubset) {
      Array.prototype.push.apply(totalSubset, children[i].getSubset(mask, innerOnly));
    }
  }
  return totalSubset;
};

export default RCGroup;

