/*
 * GLSL Version: ES 1.00 (WebGL 1.0 compatible)
 * No #version directive in this file.
 * Use GLSL1 semantics (`attribute`/`varying`, `texture2D`, `gl_FragColor`).
 * Keep `glslVersion` as default (GLSL1) or set `THREE.GLSL1` explicitly.
 */

precision highp float;

varying vec2 vUv;
uniform sampler2D srcTex;
uniform vec3 aberration;

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  
  gl_FragColor.r = texture2D(srcTex, 0.5 * (uv * aberration[0] + 1.0)).r;
  gl_FragColor.g = texture2D(srcTex, 0.5 * (uv * aberration[1] + 1.0)).g;
  gl_FragColor.b = texture2D(srcTex, 0.5 * (uv * aberration[2] + 1.0)).b;
  gl_FragColor.a = 1.0;
}