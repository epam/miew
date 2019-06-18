precision highp float;

uniform sampler2D srcL;
uniform sampler2D srcR;
varying vec2 vUv;

void main() {
  vec4 l = texture2D(srcL, vUv);
  vec4 r = texture2D(srcR, vUv);
  gl_FragColor = vec4(l.r, r.g, r.b, 1.0);
}
