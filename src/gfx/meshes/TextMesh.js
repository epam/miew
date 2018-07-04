

import _ from 'lodash';
import * as THREE from 'three';
import CSS2DObject from '../CSS2DObject';
import utils from '../../utils';

function TextMesh(geometry, _material) {
  THREE.Group.call(this);
  this.geometry = geometry;

  let self = this;
  self.initialized = false;
  this.geometry.addEventListener('update', function() {
    self.update();
  });
}

TextMesh.prototype = Object.create(THREE.Group.prototype);
TextMesh.prototype.constructor = TextMesh;

TextMesh.prototype.init = function() {
  const children = this.children;
  let i = children.length - 1;
  for (; i >= 0; --i) {
    this.remove(children[i]);
  }

  const items = this.geometry.items;
  const userData = this.geometry.userData;
  const n = items.length;
  for (i = 0; i < n; ++i) {
    const srcItem = items[i];
    if (!srcItem) {
      continue;
    }
    const item = utils.shallowCloneNode(srcItem);
    const label = new CSS2DObject(item);
    label.userData = _.clone(userData);
    const el = label.getElement();
    el.style.visibility = 'visible';
    label.source = srcItem;
    this.add(label);
  }
  this.initialized = true;
};

TextMesh.prototype.update = function() {
  const geo = this.geometry;
  if (!geo.needsUpdate) {
    return;
  }
  const children = this.children;
  if (!this.initialized) {
    this.init();
  }

  for (let i = 0, n = children.length; i < n; ++i) {
    const child = children[i];
    const item = child.source;
    child.position.copy(item.worldPos);
    child.userData.color = item.opts.color;
    child.userData.background = item.opts.background;
  }
};

export default TextMesh;

