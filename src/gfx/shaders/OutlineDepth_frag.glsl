uniform sampler2D srcTex; //depthTexture
uniform vec2 srcTexSize;
varying vec2 vUv;

void main() {

  vec2 pixelSize = vec2(1, 1) / srcTexSize;

  float c00 = texture2D(srcTex, vUv + vec2(-pixelSize.x,-pixelSize.y)).x;
  float c01 = texture2D(srcTex, vUv + vec2(0,-pixelSize.y)).x;
  float c02 = texture2D(srcTex, vUv + vec2(pixelSize.x,-pixelSize.y)).x;
  float c10 = texture2D(srcTex, vUv + vec2(-pixelSize.x,0)).x;
  float c12 = texture2D(srcTex, vUv + vec2(pixelSize.x,0)).x;
  float c20 = texture2D(srcTex, vUv + vec2(-pixelSize.x,pixelSize.y)).x;
  float c21 = texture2D(srcTex, vUv + vec2(0,pixelSize.y)).x;
  float c22 = texture2D(srcTex, vUv + vec2(pixelSize.x,pixelSize.y)).x;

  float horizEdge = - c00 - 2.0 * c01 - c02 + c20 + 2.0 * c21 + c22;
  float vertEdge  = - c00 - 2.0 * c10 - c20 + c02 + 2.0 * c12 + c22;

  float color = sqrt(horizEdge * horizEdge + vertEdge * vertEdge);

  //grad.a = 1.0;
  color *= 10.0;
  gl_FragColor = vec4(color, color, color, 1.0);//grad;
 //gl_FragColor = texture2D(srcTex, vUv);
// gl_FragColor.a = 1.0;
  //gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);

}
