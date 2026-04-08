/*
 * GLSL Version: ES 1.00 (WebGL 1.0 compatible)
 * No #version directive in this file.
 * Use GLSL1 semantics (`attribute`/`varying`, `texture2D`, `gl_FragColor`).
 * Keep `glslVersion` as default (GLSL1) or set `THREE.GLSL1` explicitly.
 */

precision highp float;

varying vec2 vUv;
uniform sampler2D srcTex;
uniform float coef;

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  float r2 = dot(uv, uv);
  vec2 tc = uv * (1.0 + coef * r2);
  if (!all(lessThan(abs(tc), vec2(1.0))))
    discard;
  tc = 0.5 * (tc + 1.0);
  gl_FragColor = texture2D(srcTex, tc);
}
