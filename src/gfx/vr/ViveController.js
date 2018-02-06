/**
 * @author mrdoob / http://mrdoob.com
 * @author stewdio / http://stewd.io
 */
import * as THREE from 'three';

export default class ViveController extends  THREE.Object3D {

  constructor(id) {
    super();

    this.gamepad  = null;

    this.axes = [0, 0];
    this.thumbpadIsPressed = false;
    this.triggerIsPressed = false;
    this.gripsArePressed = false;
    this.menuIsPressed = false;

    this.matrixAutoUpdate = false;
    this.contrId = id;
  }

  getGamepad() {
    return this.gamepad;
  }

  getButtonState(button) {

    if (button === 'thumbpad') return this.thumbpadIsPressed;
    if (button === 'trigger') return this.triggerIsPressed;
    if (button === 'grips') return this.gripsArePressed;
    if (button === 'menu') return this.menuIsPressed;

    return null;
  }

  findGamepad(id) {
    // Iterate across gamepads as Vive Controllers may not be
    // in position 0 and 1.
    const gamepads = navigator.getGamepads && navigator.getGamepads();
    for (let i = 0, j = 0; i < gamepads.length; i++) {
      const gpad = gamepads[i];
      if (gpad && (gpad.id === 'OpenVR Gamepad' || gpad.id.startsWith('Oculus Touch') ||
          gpad.id.startsWith('Spatial Controller'))) {
        if (j === id) {
          return gpad;
        }
        j++;
      }
    }
    return null;
  }

  update() {

    this.gamepad = this.findGamepad(this.contrId);
    if (this.gamepad && this.gamepad.pose) {
      if (this.gamepad.pose === null) {
        return; // No user action yet
      }

      //  Position and orientation.
      const pose = this.gamepad.pose;
      if (pose.position !== null) this.position.fromArray(pose.position);
      if (pose.orientation !== null) this.quaternion.fromArray(pose.orientation);
      this.matrix.compose(this.position, this.quaternion, this.scale);
      this.matrixWorldNeedsUpdate = true;
      this.visible = true;

      //  Thumbpad and Buttons.
      if (this.axes[0] !== this.gamepad.axes[0] || this.axes[1] !== this.gamepad.axes[1]) {
        this.axes[0] = this.gamepad.axes[0]; //  X axis: -1 = Left, +1 = Right.
        this.axes[1] = this.gamepad.axes[1]; //  Y axis: -1 = Bottom, +1 = Top.
        this.dispatchEvent({type: 'axischanged', axes: this.axes});
      }

      if (this.thumbpadIsPressed !== this.gamepad.buttons[0].pressed) {
        this.thumbpadIsPressed = this.gamepad.buttons[0].pressed;
        this.dispatchEvent({type: this.thumbpadIsPressed ? 'thumbpaddown' : 'thumbpadup', axes: this.axes});
      }

      if (this.triggerIsPressed !== this.gamepad.buttons[1].pressed) {
        this.triggerIsPressed = this.gamepad.buttons[1].pressed;
        this.dispatchEvent({type: this.triggerIsPressed ? 'triggerdown' : 'triggerup'});
      }

      if (this.gripsArePressed !== this.gamepad.buttons[2].pressed) {
        this.gripsArePressed = this.gamepad.buttons[2].pressed;
        this.dispatchEvent({type: this.gripsArePressed ? 'gripsdown' : 'gripsup'});
      }

      if (this.menuIsPressed !== this.gamepad.buttons[3].pressed) {
        this.menuIsPressed = this.gamepad.buttons[3].pressed;
        this.dispatchEvent({type: this.menuIsPressed ? 'menudown' : 'menuup'});
      }

    } else {
      this.visible = false;
    }
  }
}

