precision highp float;

varying vec2 vUv;
uniform sampler2D srcTex;
uniform float opacity;

void main() {
  vec4 color = texture2D(srcTex, vUv);
  gl_FragColor = vec4(color.xyz, color.a * opacity);
}
