uniform sampler2D srcTex;
uniform vec2 srcTexSize;
varying vec2 vUv;

void main() {

  vec2 pixelSize = vec2(1, 1) / srcTexSize;

  vec4 c00 = texture2D(srcTex, vUv + vec2(-pixelSize.x,-pixelSize.y));
  vec4 c01 = texture2D(srcTex, vUv + vec2(0,-pixelSize.y));
  vec4 c02 = texture2D(srcTex, vUv + vec2(pixelSize.x,-pixelSize.y));
  vec4 c10 = texture2D(srcTex, vUv + vec2(-pixelSize.x,0));
  vec4 c12 = texture2D(srcTex, vUv + vec2(pixelSize.x,0));
  vec4 c20 = texture2D(srcTex, vUv + vec2(-pixelSize.x,pixelSize.y));
  vec4 c21 = texture2D(srcTex, vUv + vec2(0,pixelSize.y));
  vec4 c22 = texture2D(srcTex, vUv + vec2(pixelSize.x,pixelSize.y));

  vec4 horizEdge = - c00 - 2.0 * c01 - c02 + c20 + 2.0 * c21 + c22;
  vec4 vertEdge  = - c00 - 2.0 * c10 - c20 + c02 + 2.0 * c12 + c22;

  vec4 grad = sqrt(horizEdge * horizEdge + vertEdge * vertEdge);

  gl_FragColor = grad;
}
