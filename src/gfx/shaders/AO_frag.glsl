#define MAX_SAMPLES_COUNT 32

uniform vec3 samplesKernel[MAX_SAMPLES_COUNT];
uniform sampler2D noiseTexture;
uniform vec2      noiseTexelSize;
uniform sampler2D diffuseTexture;
uniform sampler2D depthTexture;
uniform vec2      srcTexelSize;
uniform vec2      camNearFar;
uniform mat4      projMatrix;

uniform float aspectRatio;
uniform float tanHalfFOV;

uniform float kernelRadius;
uniform float depthThreshold;
uniform float factor;

uniform vec2 fogNearFar;
varying vec2 vUv;

float CalcViewZ(vec2 screenPos)
{
  float depth = texture2D(depthTexture, screenPos).x;
  // [0, 1]->[-1, 1]
  float clipedZ = 2.0 * depth - 1.0;
  // see THREE.js camera.makeFrustum for projection details
  return (- projMatrix[3][2] / (clipedZ + projMatrix[2][2]));
}

vec3 ViewPosFromDepth(vec2 screenPos)
{
  vec3 viewPos;
  viewPos.z = CalcViewZ(screenPos);
  //[0, 1]->[-1, 1]
  vec2 projPos = 2.0 * screenPos - 1.0;
  vec2 viewRay = vec2(projPos.x * aspectRatio * tanHalfFOV, projPos.y * tanHalfFOV); // TODO mode to vs
  // reconstruct viewposition in right-handed sc with z from viewer
  viewPos.xy = vec2(viewRay.x * viewPos.z, viewRay.y * viewPos.z);
  return viewPos;
}

vec3 GetDerivative( vec3 p0, vec3 p1, vec3 p2 )
{
  vec3 v1 = p1 - p0;
  vec3 v2 = p0 - p2;
  return ( dot( v1, v1 ) < dot( v2, v2 ) ) ? v1 : v2;
}

vec3 RestoreNormalFromDepth(vec2 texcoords, vec3 p) {

  vec2 offset1 = vec2(srcTexelSize.x, 0.0);
  vec2 offset2 = vec2(0.0, srcTexelSize.y);

  vec3 p1 = ViewPosFromDepth(texcoords + offset1);
  vec3 p2 = ViewPosFromDepth(texcoords + offset2);
  vec3 p3 = ViewPosFromDepth(texcoords - offset1);
  vec3 p4 = ViewPosFromDepth(texcoords - offset2);

  vec3 dx = GetDerivative(p, p3, p1);
  vec3 dy = GetDerivative(p, p4, p2);
  vec3 normal = cross(dx, dy);
  return normalize(normal);
}

void main() {
  vec3 viewPos = ViewPosFromDepth(vUv);
  // remap coordinates to prevent noise exture rescale
  vec2 vUvNoise = vUv / srcTexelSize * noiseTexelSize;
  // restore normal from depth buffer
  vec3 normal = RestoreNormalFromDepth(vUv, viewPos); 
  // get random vector for sampling sphere rotation
  vec3 randN = texture2D(noiseTexture, vUvNoise).rgb * 2.0 - 1.0;
  randN = normalize(randN);
  // build TBN (randomly rotated around normal)
  vec3 tangent   = normalize(randN - normal * dot(randN, normal));
  vec3 bitangent = cross(tangent, normal);
  mat3 TBN = mat3(tangent, bitangent, normal);
  // calc AO value
  float AO = 0.0;
  for (int i = 0 ; i < MAX_SAMPLES_COUNT ; i++) {
    // rotate sampling kernel around normal
    vec3 reflectedSample = TBN * samplesKernel[i];
    // get sample
    vec3 samplePos = viewPos + reflectedSample * kernelRadius;
    // project sample to screen to get sample's screen pos
    vec4 offset = vec4(samplePos, 1.0);
    offset = projMatrix * offset;
    offset.xy /= offset.w;
    offset.xy = (-offset.xy + vec2(1.0)) * 0.5;
    // get view z for sample projected to the objct surface
    float sampleDepth = CalcViewZ(offset.xy);
    // calc occlusion made by object surface at the sample
    AO += step(samplePos.z, sampleDepth);
  }
  // add fog to the AO value
  AO *= 1.0 - smoothstep(fogNearFar.x, fogNearFar.y, - viewPos.z);
  // calc result AO-map color
  AO = 1.0 - max(0.0, AO / 32.0 * factor); // TODO use MAX_SAMPLES_COUNT
  vec3 color = texture2D(diffuseTexture, vUv).rgb;
  // check if the fragment doesn't belong to background
  if (abs(- viewPos.z - camNearFar.y) < 0.1) { // FIXME remove temporal fix for background darkening
    gl_FragColor = vec4(1.0);
    return;
  }
  // write value to AO-map
  gl_FragColor = vec4(AO, AO, AO, 1.0);
}