import * as THREE from 'three';
import RCGroup from '../../RCGroup';
import CSS2DObject from '../../CSS2DObject';

/*
 * TODO
 * This file is a greeting from the past. Refactor it and/or destroy.
 */

/** @deprecated Old-fashioned atom labels, to be removed in the next major version. */
function _buildLabel2D(pos, color, fieldTxt) {
  const text = document.createElement('div');
  text.className = 'label label-sgroup';
  text.style.color = color;
  if (typeof fieldTxt === 'string') {
    const spanText = document.createElement('span');
    spanText.style.fontSize = '150%';
    const spanNodeP = document.createElement('span');
    const spanNodeText = document.createTextNode(fieldTxt);
    spanNodeP.appendChild(spanNodeText);
    spanText.appendChild(spanNodeP);
    text.appendChild(spanText);
  } else {
    text.appendChild(fieldTxt);
    //text.style.paddingTop = '10px';
  }

  const label = new CSS2DObject(text);
  label.position.copy(pos);
  label.userData = {
    translation: 'translate(-50%, -50%)',
    color: color
  };
  const el = label.getElement();
  el.style.visibility = 'visible';
  el.style.textAlign = 'center';
  el.style.verticalAlign = 'middle';
  return label;
}

/** @deprecated Old-fashioned atom labels, to be removed in the next major version. */
class SGroupProcessor extends RCGroup {
  constructor(AtomsGroup, geoParams, complex, _colorer, _mode, _polyComplexity, _mask, _material) {
    super();

    const markColor = 0xFFFF00;
    const groupLetters = new RCGroup();

    for (let i = 0; i < complex.getSGroupCount(); i++) {
      const sGroup = complex.getSGroups()[i];
      if (sGroup._center !== null) {
        const actPos = (new THREE.Vector3()).copy(sGroup._position);
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
}

export default SGroupProcessor;
