import * as THREE from 'three';
import EventDispatcher from '../../utils/EventDispatcher';

function createLabel(fieldTxt, className) {
  const text = document.createElement('div');
  text.className = className;

  if (typeof fieldTxt === 'string') {
    const spanText = document.createElement('span');
    spanText.style.fontSize = '150%';
    const strings = fieldTxt.split('\n');

    for (let i = 0, n = strings.length; i < n; ++i) {
      const spanNodeP = document.createElement('span');
      const spanNodeText = document.createTextNode(strings[i]);
      spanNodeP.appendChild(spanNodeText);
      spanText.appendChild(spanNodeP);
      if (i < n - 1) {
        spanText.appendChild(document.createElement('br'));
      }
    }

    text.appendChild(spanText);
  } else {
    text.appendChild(fieldTxt);
  }
  text.worldPos = new THREE.Vector3();
  return text;
}
class LabelsGeometry extends EventDispatcher {
  constructor(instanceCount, opts) {
    super();
    this._opts = opts;
    this.items = [];
    this.needsUpdate = false;

    let xTranslation = -50;
    let yTranslation = -50;
    switch (opts.horizontalAlign) {
      case 'left':
        xTranslation = 0;
        break;
      case 'right':
        xTranslation = -100;
        break;
      default:
        break;
    }

    switch (opts.verticalAlign) {
      case 'top':
        yTranslation = -100;
        break;
      case 'bottom':
        yTranslation = 0;
        break;
      default:
        break;
    }

    const deltaPos = new THREE.Vector3(opts.dx || 0, opts.dy || 0, opts.dz || 0);
    this.userData = {
      translation: `translate(${xTranslation}%, ${yTranslation}%)`,
      offset: deltaPos,
    };
  }

  setItem(itemIdx, itemPos, fieldTxt) {
    const opts = this._opts;
    const text = this.items[itemIdx] || createLabel(fieldTxt, 'label');

    text.worldPos.copy(itemPos);
    text.style.textAlign = opts.horizontalAlign;
    text.style.verticalAlign = opts.verticalAlign;
    this.items[itemIdx] = text;
  }

  setColor(itemIdx, fColor, bColor) {
    const text = this.items[itemIdx];
    text.opts = {
      color: fColor,
      background: bColor,
    };
  }

  startUpdate() {
    return true;
  }

  finishUpdate() {
    this.needsUpdate = true;
    this.dispatchEvent({ type: 'update' });
  }

  finalize() {
    this.finishUpdate();
  }

  // unimplemented functions
  raycast() {
  }

  setOpacity() {

  }

  getSubset() {
    return [];
  }
}

export default LabelsGeometry;
