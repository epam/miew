/*
 * GLSL Version: ES 1.00 (WebGL 1.0 compatible)
 * No #version directive in this file.
 * Use GLSL1 semantics (`attribute`/`varying`, `texture2D`, `gl_FragColor`).
 * Keep `glslVersion` as default (GLSL1) or set `THREE.GLSL1` explicitly.
 */

varying vec3 pos;

void main() {
  gl_FragColor = vec4(pos, 0.5);
}