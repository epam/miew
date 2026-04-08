/*
 * GLSL Version: ES 1.00 (WebGL 1.0 compatible)
 * No #version directive in this file.
 * Use GLSL1 semantics (`varying`, `texture2D`, `gl_FragColor`).
 * Keep `glslVersion` as default (GLSL1) or set `THREE.GLSL1` explicitly.
 */

precision highp float;

uniform sampler2D srcL;
uniform sampler2D srcR;
varying vec2 vUv;

void main() {
  vec4 l = texture2D(srcL, vUv);
  vec4 r = texture2D(srcR, vUv);
  gl_FragColor = vec4(l.r, r.g, r.b, 1.0);
}
