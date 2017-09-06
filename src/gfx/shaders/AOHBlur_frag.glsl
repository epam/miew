#define MAX_SAMPLES_COUNT 5
uniform float samplesOffsets[MAX_SAMPLES_COUNT];
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
    vec2 samplePos = vec2(x + samplesOffsets[i] * srcTexelSize.x, y);
    float depth = texture2D(depthTexture, samplePos).x;
    float weight = (1.0 / (0.0001 + abs(depth - pixelDepth)));
    res += texture2D(aoMap, vec2(x + samplesOffsets[i] * srcTexelSize.x, y )) * weight;
    weightSum += weight;
  }
  gl_FragColor = res / weightSum;
}
