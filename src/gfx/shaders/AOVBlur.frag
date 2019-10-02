precision highp float;

#define MAX_SAMPLES_COUNT 5
uniform float samplesOffsets[MAX_SAMPLES_COUNT];
uniform sampler2D diffuseTexture;
uniform sampler2D aoMap;
uniform sampler2D depthTexture;
uniform vec2      srcTexelSize;

uniform mat4  projMatrix;
uniform float aspectRatio;
uniform float tanHalfFOV;

uniform vec2 fogNearFar;
uniform vec4 fogColor;
varying vec2 vUv;

float CalcViewZ(vec2 screenPos)
{
  float depth = texture2D(depthTexture, screenPos).x;
  // [0, 1]->[-1, 1]
  float clipedZ = 2.0 * depth - 1.0;
  // see THREE.js camera.makeFrustum for projection details
  return (-projMatrix[3][2] / (clipedZ + projMatrix[2][2]));
}

vec3 ViewPosFromDepth(vec2 screenPos)
{
  vec3 viewPos;
  viewPos.z = CalcViewZ(screenPos);
  //[0, 1]->[-1, 1]
  vec2 projPos = 2.0 * screenPos - 1.0;
  // reconstruct viewposition in right-handed sc with z to viewer
  viewPos.xy = vec2(
  projPos.x * aspectRatio * tanHalfFOV * abs(viewPos.z),
  projPos.y * tanHalfFOV * abs(viewPos.z)
  );
  return viewPos;
}

void main() {
  vec3 viewPos = ViewPosFromDepth(vUv);
  float x = vUv.x;
  float y = vUv.y;
  vec4 color = texture2D(diffuseTexture, vec2(x, y));
  vec4 res = vec4(0.0);
  res.a = texture2D(aoMap, vec2(x, y )).a;
  // return for background fragments (0.0 in alpha component means that it is background fragment)
  if (res.a < 0.000000001) {
    gl_FragColor = color;
    return;
  }

  float pixelDepth = texture2D(depthTexture, vec2(x, y)).x;
  float weightSum = 0.0;
  for (int i = 0; i < MAX_SAMPLES_COUNT; ++i) {
    if (texture2D(aoMap, vec2(x, y + samplesOffsets[i] * srcTexelSize.y)).a < 0.000000001) {
      continue;
    }
    vec2 samplePos = vec2(x, y + samplesOffsets[i] * srcTexelSize.y);
    float depth = texture2D(depthTexture, samplePos).x;
    float weight = (1.0 / (0.0001 + abs(depth - pixelDepth)));
    res.rgb += texture2D(aoMap, vec2(x, y + samplesOffsets[i] * srcTexelSize.y)).rgb * weight;
    weightSum += weight;
  }
  res.rgb /= weightSum;

  // add fog to the AO value
  // goal:    gl_FragColor = fragColor*AO*(1-fogFactor) + fogColor*fogFactor
  // exists:  AO, fogFactor, fogColor,
  //          color = fragColor*(1-fogFactor) + fogColor*fogFactor
  // simplify:
  //          fragColor*AO*(1-fogFactor) + fogColor*fogFactor =
  //        = [fragColor*(1-fogFactor) = color - fogColor*fogFactor] =
  //        = (color - fogColor*fogFactor)*AO + fogColor*fogFactor =
  //        = color*AO + fogColor*fogFactor*(1 - AO)
  // result:  gl_FragColor = color*AO + fogColor*fogFactor*(1 - AO)
  float fogFactor = smoothstep(fogNearFar.x, fogNearFar.y, - viewPos.z) * fogColor.a;
  gl_FragColor.rgb = color.rgb * res.rgb + fogColor.rgb * fogFactor *(vec3(1.0, 1.0, 1.0) - res.rgb);
  gl_FragColor.a = color.a;
}
