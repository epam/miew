/**
 * @author mrdoob / http://mrdoob.com/
 */

import * as THREE from 'three';

class CSS2DObject extends THREE.Object3D {
  constructor(element) {
    super();
    const self = this;
    this._element = element;
    this._element.style.position = 'absolute';
    this.addEventListener('removed', () => {
      if (self._element.parentNode !== null) {
        self._element.parentNode.removeChild(self._element);
      }
    });
  }

  getElement() {
    return this._element;
  }

  /**
   * Sets label transparency.
   *
   * @param {number} transp    - in [0; 1] 1 means fully transparent
   */
  setTransparency(transp) {
    const el = this.getElement();
    if (el === null) {
      return;
    }
    if (transp === 1.0) {
      el.style.display = 'none';
      return;
    }
    el.style.display = 'inline';
    const op = 1.0 - transp;
    const top = op.toString();
    const op100 = op * 100;
    el.style.opacity = top;
    el.style.filter = `alpha(opacity=${op100})`; // IE fallback
  }

  clone() {
    const obj = new CSS2DObject(this._element);
    obj.copy(this);
    return obj;
  }
}

export default CSS2DObject;
