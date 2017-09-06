

import _ from 'lodash';
import * as THREE from 'three';
import CSS2DObject from '../CSS2DObject';
import utils from '../../utils';

function TextMesh(geometry, _material) {
  THREE.Group.call(this);
  this.geometry = geometry;

  var self = this;
  self.initialized = false;
  this.geometry.addEventListener('update', function() {
    self.update();
  });
}

TextMesh.prototype = Object.create(THREE.Group.prototype);
TextMesh.prototype.constructor = TextMesh;

TextMesh.prototype.init = function() {
  var children = this.children;
  var i = children.length - 1;
  for (; i >= 0; --i) {
    this.remove(children[i]);
  }

  var items = this.geometry.items;
  var userData = this.geometry.userData;
  var n = items.length;
  for (i = 0; i < n; ++i) {
    var srcItem = items[i];
    if (!srcItem) {
      continue;
    }
    var item = utils.shallowCloneNode(srcItem);
    var label = new CSS2DObject(item);
    label.userData = _.clone(userData);
    var el = label.getElement();
    el.style.visibility = 'visible';
    label.source = srcItem;
    this.add(label);
  }
  this.initialized = true;
};

TextMesh.prototype.update = function() {
  var geo = this.geometry;
  if (!geo.needsUpdate) {
    return;
  }
  var children = this.children;
  if (!this.initialized) {
    this.init();
  }

  for (var i = 0, n = children.length; i < n; ++i) {
    var child = children[i];
    var item = child.source;
    child.position.copy(item.worldPos);
    child.userData.color = item.opts.color;
    child.userData.background = item.opts.background;
  }
};

export default TextMesh;

