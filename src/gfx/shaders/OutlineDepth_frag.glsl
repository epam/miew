uniform sampler2D srcTex;
uniform sampler2D srcDepthTex; //depthTexture
uniform vec2 srcTexSize;
varying vec2 vUv;

uniform vec3 color;
uniform float saturation;
uniform float threshold;

void main() {

  vec2 pixelSize = vec2(1, 1) / srcTexSize;

  float c00 = texture2D(srcDepthTex, vUv + vec2(-pixelSize.x,-pixelSize.y)).x;
  float c01 = texture2D(srcDepthTex, vUv + vec2(0,-pixelSize.y)).x;
  float c02 = texture2D(srcDepthTex, vUv + vec2(pixelSize.x,-pixelSize.y)).x;
  float c10 = texture2D(srcDepthTex, vUv + vec2(-pixelSize.x,0)).x;
  float c12 = texture2D(srcDepthTex, vUv + vec2(pixelSize.x,0)).x;
  float c20 = texture2D(srcDepthTex, vUv + vec2(-pixelSize.x,pixelSize.y)).x;
  float c21 = texture2D(srcDepthTex, vUv + vec2(0,pixelSize.y)).x;
  float c22 = texture2D(srcDepthTex, vUv + vec2(pixelSize.x,pixelSize.y)).x;

  float horizEdge = - c00 - 2.0 * c01 - c02 + c20 + 2.0 * c21 + c22;
  float vertEdge  = - c00 - 2.0 * c10 - c20 + c02 + 2.0 * c12 + c22;

  float grad = saturation * sqrt(horizEdge * horizEdge + vertEdge * vertEdge);

  if(grad > threshold){
    gl_FragColor = vec4(color.rgb * grad, 1.0);
  } else{
    gl_FragColor = texture2D(srcTex, vUv);
  }
}
