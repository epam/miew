#define MAX_SAMPLES_COUNT 5
uniform float samplesOffsets[MAX_SAMPLES_COUNT];
uniform sampler2D diffuseTexture;
uniform sampler2D aoMap;
uniform sampler2D depthTexture;
uniform vec2      srcTexelSize;

varying vec2 vUv;

void main() {
  float x = vUv.x;
  float y = vUv.y;
  vec4 res = vec4(0.0);
  float pixelDepth = texture2D(depthTexture, vec2(x, y)).x;
  float weightSum = 0.0;
  for (int i = 0; i < MAX_SAMPLES_COUNT; ++i) {
    vec2 samplePos = vec2(x, y + samplesOffsets[i] * srcTexelSize.y);
    float depth = texture2D(depthTexture, samplePos).x;
    float weight = (1.0 / (0.0001 + abs(depth - pixelDepth)));
    res += texture2D(aoMap, vec2(x, y + samplesOffsets[i] * srcTexelSize.y)) * weight;
    weightSum += weight;
  }
  res /= weightSum;
  vec3 color = texture2D(diffuseTexture, vec2(x, y)).rgb;
  gl_FragColor = vec4(color * res.rgb, 1.0);
}