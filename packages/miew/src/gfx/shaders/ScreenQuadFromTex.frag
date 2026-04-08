/*
 * GLSL Version: ES 1.00 (WebGL 1.0 compatible)
 * No #version directive in this file.
 * Use GLSL1 semantics (`attribute`/`varying`, `texture2D`, `gl_FragColor`).
 * Keep `glslVersion` as default (GLSL1) or set `THREE.GLSL1` explicitly.
 */

precision highp float;

varying vec2 vUv;
uniform sampler2D srcTex;
uniform float opacity;

void main() {
  vec4 color = texture2D(srcTex, vUv);
  gl_FragColor = vec4(color.xyz, color.a * opacity);
}
