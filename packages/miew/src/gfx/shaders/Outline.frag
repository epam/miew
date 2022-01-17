precision highp float;

uniform sampler2D srcTex;
uniform vec2 srcTexSize;
uniform vec2 thickness;
varying vec2 vUv;

#ifdef DEPTH_OUTLINE
  uniform sampler2D srcDepthTex; //depthTexture
  uniform vec3 color;
  uniform float threshold;
#endif

void main() {

  vec2 pixelSize = thickness / srcTexSize;

  #ifdef DEPTH_OUTLINE
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

    float grad = sqrt(horizEdge * horizEdge + vertEdge * vertEdge);

    gl_FragColor = ( grad > threshold ) ? vec4(color.rgb, 1.0) : gl_FragColor = texture2D(srcTex, vUv);

  #else
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
  #endif
}
