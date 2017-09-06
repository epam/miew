

/**
 * @author mrdoob / http://mrdoob.com/
 */

import * as THREE from 'three';
function CSS2DObject(element) {
  THREE.Object3D.call(this);
  var self = this;
  this._element = element;
  this._element.style.position = 'absolute';
  this.addEventListener('removed', function() {
    if (self._element.parentNode !== null) {
      self._element.parentNode.removeChild(self._element);
    }
  });
}

CSS2DObject.prototype = Object.create(THREE.Object3D.prototype);
CSS2DObject.prototype.constructor = CSS2DObject;

CSS2DObject.prototype.getElement = function() {
  return this._element;
};

/**
 * Sets label transparency.
 *
 * @param {number} transp    - in [0; 1] 1 means fully transparent
 */
CSS2DObject.prototype.setTransparency = function(transp) {
  var el = this.getElement();
  if (el === null) {
    return;
  }
  if (transp === 1.0) {
    el.style.display = 'none';
    return;
  }
  el.style.display = 'inline';
  var op = 1.0 - transp;
  var top = op.toString();
  var op100 = op * 100;
  el.style.opacity = top;
  el.style.filter = 'alpha(opacity=' + op100 + ')'; // IE fallback
};

CSS2DObject.prototype.clone = function() {
  var obj = new CSS2DObject(this._element);
  obj.copy(this);
  return obj;
};

export default CSS2DObject;

