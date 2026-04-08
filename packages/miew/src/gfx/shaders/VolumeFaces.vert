/*
 * GLSL Version: ES 1.00 (WebGL 1.0 compatible)
 * No #version directive in this file.
 * Use GLSL1 semantics (`attribute`/`varying`, `texture2D`, `gl_FragColor`).
 * Keep `glslVersion` as default (GLSL1) or set `THREE.GLSL1` explicitly.
 */

varying vec3 pos;

void main() {
  // we're assuming local position is in [-0.5, 0.5]
  // we need to offset it to be represented in RGB
  pos = position.xyz + 0.5;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}