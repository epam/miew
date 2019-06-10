precision highp float;

varying vec2 vUv;
uniform sampler2D srcTex;
uniform float opacity;

//////////////////////////////////////// Unpack ///////////////////////////////////////////////
const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1);
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256.,  256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );

float unpackRGBAToDepth( const in vec4 v ) {
  return dot( v, UnpackFactors );
}

/////////////////////////////////////////// Main ///////////////////////////////////////////////
void main() {
  vec4 color = texture2D(srcTex, vUv);
  float depth = unpackRGBAToDepth(color);
  gl_FragColor = vec4(depth, depth, depth, opacity);
}
