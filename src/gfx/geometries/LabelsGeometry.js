

import * as THREE from 'three';
import EventDispatcher from '../../utils/EventDispatcher';

function createLabel(fieldTxt, className) {
  var text = document.createElement('div');
  text.className = className;

  if (typeof fieldTxt === 'string') {
    var spanText = document.createElement('span');
    spanText.style.fontSize = '150%';
    var strings = fieldTxt.split('\n');

    for (var i = 0, n = strings.length; i < n; ++i) {
      var spanNodeP = document.createElement('span');
      var spanNodeText = document.createTextNode(strings[i]);
      spanNodeP.appendChild(spanNodeText);
      spanText.appendChild(spanNodeP);
      if (i < n - 1) {
        spanText.appendChild(document.createElement('br'));
      }
    }

    text.appendChild(spanText);
  } else {
    text.appendChild(fieldTxt);
    //text.style.paddingTop = '10px';
  }
  text.worldPos = new THREE.Vector3();
  return text;
}

function LabelsGeometry(instanceCount, opts) {
  EventDispatcher.call(this);
  this._opts = opts;
  this.items = [];
  this.needsUpdate = false;

  var xTranslation = -50;
  var yTranslation = -50;
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

  // TODO is code above OK?
  var deltaPos = new THREE.Vector3(opts.dx || 0, opts.dy || 0, opts.dz || 0);
  this.userData = {
    translation: 'translate(' + xTranslation + '%, ' + yTranslation + '%)',
    offset: deltaPos,
  };
}

LabelsGeometry.prototype = Object.create(EventDispatcher.prototype);
LabelsGeometry.prototype.constructor = LabelsGeometry;

LabelsGeometry.prototype.setItem = function(itemIdx, itemPos, fieldTxt) {
  var opts = this._opts;
  var labels = opts.labels;
  var text = this.items[itemIdx] || createLabel(fieldTxt, 'label label-' + labels);

  text.worldPos.copy(itemPos);
  text.style.textAlign = opts.horizontalAlign;
  text.style.verticalAlign = opts.verticalAlign;
  this.items[itemIdx] = text;
};

LabelsGeometry.prototype.setColor = function(itemIdx, fColor, bColor) {
  var text = this.items[itemIdx];
  text.opts = {
    color: fColor,
    background: bColor,
  };
};

LabelsGeometry.prototype.startUpdate = function() {
  return true;
};

LabelsGeometry.prototype.finishUpdate = function() {
  this.needsUpdate = true;
  this.dispatchEvent({type: 'update'});
};

LabelsGeometry.prototype.finalize = function() {
  this.finishUpdate();
};

// unimplemented functions
LabelsGeometry.prototype.raycast = function() {
};

LabelsGeometry.prototype.setOpacity = function() {

};

LabelsGeometry.prototype.getSubset = function() {
  return [];
};

export default LabelsGeometry;

