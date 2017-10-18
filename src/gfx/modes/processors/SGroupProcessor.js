

import * as THREE from 'three';
import RCGroup from '../../RCGroup';
import CSS2DObject from '../../CSS2DObject';

/*
 * TODO
 * This file is a greeting from the past. Refactor it and/or destroy.
 */

/** @deprecated Old-fashioned atom labels, to be removed in the next major version. */
function _buildLabel2D(pos, color, fieldTxt) {
  var text = document.createElement('div');
  text.className = 'label label-sgroup';
  text.style.color = color;
  if (typeof fieldTxt === 'string') {
    var spanText = document.createElement('span');
    spanText.style.fontSize = '150%';
    var spanNodeP = document.createElement('span');
    var spanNodeText = document.createTextNode(fieldTxt);
    spanNodeP.appendChild(spanNodeText);
    spanText.appendChild(spanNodeP);
    text.appendChild(spanText);
  } else {
    text.appendChild(fieldTxt);
    //text.style.paddingTop = '10px';
  }

  var label = new CSS2DObject(text);
  label.position.copy(pos);
  label.userData = {
    translation: 'translate(-50%, -50%)',
    color: color
  };
  var el = label.getElement();
  el.style.visibility = 'visible';
  el.style.textAlign = 'center';
  el.style.verticalAlign = 'middle';
  return label;
}

/** @deprecated Old-fashioned atom labels, to be removed in the next major version. */
function SGroupProcessor(AtomsGroup, geoParams, complex, _colorer, _mode, _polyComplexity, _mask, _material) {
  var self = this;
  RCGroup.call(self);

  var markColor = 0xFFFF00;
  var groupLetters = new RCGroup();

  for (var i = 0; i < complex.getSGroupCount(); i++) {
    var sGroup = complex.getSGroups()[i];
    if (sGroup._center !== null) {
      var actPos = (new THREE.Vector3()).copy(sGroup._position);
      actPos.add(sGroup._center);
      groupLetters.add(_buildLabel2D(actPos, markColor, sGroup._name));
    } else {
      groupLetters.add(_buildLabel2D(
        (new THREE.Vector3()).copy(sGroup._position),
        markColor, sGroup._name
      ));
    }
  }

  this.add(groupLetters);
}

SGroupProcessor.prototype = Object.create(RCGroup.prototype);

export default SGroupProcessor;

