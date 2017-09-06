

/* eslint-disable no-magic-numbers */
import * as THREE from 'three';
import utils from '../../utils';

var DITHER_MATRIX_POWER = 3;
var DITHER_MATRIX_SIZE = 1 << DITHER_MATRIX_POWER;

var uniforms = THREE.UniformsUtils.merge([
  THREE.UniformsLib.common,
  THREE.UniformsLib.aomap,
  THREE.UniformsLib.lightmap,
  THREE.UniformsLib.emissivemap,
  THREE.UniformsLib.bumpmap,
  THREE.UniformsLib.normalmap,
  THREE.UniformsLib.displacementmap,
  THREE.UniformsLib.fog,
  THREE.UniformsLib.lights,
  THREE.UniformsLib.shadowmap,

  {
    'emissive': {type: 'c', value: new THREE.Color(0x000000)},
    'specular': {type: 'c', value: new THREE.Color(0x202020)},
    'shininess': {type: 'f', value: 30},
    'smooth_clipping': {type: 'i', value: 0}
  }
]);

var vertexShader = [

  '#define PHONG',

  'varying vec3 vViewPosition;',

  '#ifndef FLAT_SHADED',

  '  varying vec3 vNormal;',

  '#endif',

  THREE.ShaderChunk.common,
  THREE.ShaderChunk.uv_pars_vertex,
  THREE.ShaderChunk.uv2_pars_vertex,
  THREE.ShaderChunk.displacementmap_pars_vertex,
  THREE.ShaderChunk.envmap_pars_vertex,
  // THREE.ShaderChunk.lights_phong_pars_vertex,
  THREE.ShaderChunk.color_pars_vertex,
  THREE.ShaderChunk.morphtarget_pars_vertex,
  THREE.ShaderChunk.skinning_pars_vertex,
  THREE.ShaderChunk.shadowmap_pars_vertex,
  THREE.ShaderChunk.logdepthbuf_pars_vertex,
  'attribute vec3 color;',
  'varying vec2 vUv;',
  'varying vec3 col;',

  'void main() {',

  THREE.ShaderChunk.uv_vertex,
  THREE.ShaderChunk.uv2_vertex,
  THREE.ShaderChunk.color_vertex,

  THREE.ShaderChunk.beginnormal_vertex,
  THREE.ShaderChunk.morphnormal_vertex,
  THREE.ShaderChunk.skinbase_vertex,
  THREE.ShaderChunk.skinnormal_vertex,
  THREE.ShaderChunk.defaultnormal_vertex,

  '#ifndef FLAT_SHADED', // Normal computed with derivatives when FLAT_SHADED

  '  vNormal = normalize( transformedNormal );',

  '#endif',

  THREE.ShaderChunk.begin_vertex,
  THREE.ShaderChunk.displacementmap_vertex,
  THREE.ShaderChunk.morphtarget_vertex,
  THREE.ShaderChunk.skinning_vertex,
  THREE.ShaderChunk.project_vertex,
  THREE.ShaderChunk.logdepthbuf_vertex,

  '  vViewPosition = - mvPosition.xyz;',

  THREE.ShaderChunk.worldpos_vertex,
  THREE.ShaderChunk.envmap_vertex,
  // THREE.ShaderChunk.lights_phong_vertex,
  THREE.ShaderChunk.shadowmap_vertex,

  'vUv = uv;',
  'col = color;',
  'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',

  '}'

].join('\n');

var fragmentShader = [

  '#define PHONG',
  '#define DITHER_SIZE ' + DITHER_MATRIX_SIZE,

  'uniform vec3 diffuse;',
  'uniform vec3 emissive;',
  'uniform vec3 specular;',
  'uniform float shininess;',
  'uniform float opacity;',
  'uniform int  smooth_clipping;',
  'uniform sampler2D ditherMatrix;',

  THREE.ShaderChunk.common,
  THREE.ShaderChunk.color_pars_fragment,
  THREE.ShaderChunk.uv_pars_fragment,
  THREE.ShaderChunk.uv2_pars_fragment,
  THREE.ShaderChunk.map_pars_fragment,
  THREE.ShaderChunk.alphamap_pars_fragment,
  THREE.ShaderChunk.aomap_pars_fragment,
  THREE.ShaderChunk.lightmap_pars_fragment,
  THREE.ShaderChunk.emissivemap_pars_fragment,
  THREE.ShaderChunk.envmap_pars_fragment,
  THREE.ShaderChunk.fog_pars_fragment,
  THREE.ShaderChunk.lights_phong_pars_fragment,
  THREE.ShaderChunk.shadowmap_pars_fragment,
  THREE.ShaderChunk.bumpmap_pars_fragment,
  THREE.ShaderChunk.normalmap_pars_fragment,
  THREE.ShaderChunk.specularmap_pars_fragment,
  THREE.ShaderChunk.logdepthbuf_pars_fragment,
  'varying vec3 col;',
  'varying vec2 vUv;',

  'void main() {',

  '  vec3 outgoingLight = vec3( 0.0 );',
  '  vec4 diffuseColor = vec4( col, opacity );',
  '  vec3 totalAmbientLight = ambientLightColor;',
  '  vec3 totalEmissiveLight = emissive;',
  '  vec3 shadowMask = vec3( 1.0 );',

  THREE.ShaderChunk.logdepthbuf_fragment,
  THREE.ShaderChunk.map_fragment,
  THREE.ShaderChunk.color_fragment,
  THREE.ShaderChunk.alphamap_fragment,
  THREE.ShaderChunk.alphatest_fragment,
  THREE.ShaderChunk.specularmap_fragment,
  THREE.ShaderChunk.normal_phong_fragment,
  THREE.ShaderChunk.lightmap_fragment,
  THREE.ShaderChunk.hemilight_fragment,
  THREE.ShaderChunk.aomap_fragment,
  THREE.ShaderChunk.emissivemap_fragment,

  THREE.ShaderChunk.lights_phong_fragment,
  THREE.ShaderChunk.shadowmap_fragment,

  'totalDiffuseLight *= shadowMask;',
  'totalSpecularLight *= shadowMask;',

  '#ifdef METAL',

  '  outgoingLight += diffuseColor.rgb * ( totalDiffuseLight + totalAmbientLight ) * specular +',
  ' totalSpecularLight + totalEmissiveLight;',

  '#else',

  '  outgoingLight += diffuseColor.rgb * ( totalDiffuseLight + totalAmbientLight ) + ',
  ' totalSpecularLight + totalEmissiveLight;',

  '#endif',

  THREE.ShaderChunk.envmap_fragment,
  THREE.ShaderChunk.linear_to_gamma_fragment,
  THREE.ShaderChunk.fog_fragment,

  // discard pixels using dither matrix (imitate opacity)
  '   float depth_coef = 1.0;',
  '   if (smooth_clipping != 0) depth_coef = min(2.0 * gl_FragCoord.z, 1.0);',

  '   vec2 dm_coord = vec2(floor(gl_FragCoord.x), floor(gl_FragCoord.y));',
  '   dm_coord = fract((dm_coord + 0.5)/ float(DITHER_SIZE));',
  '   float threshold = texture2D(ditherMatrix, dm_coord).x;',
  '   if (depth_coef * diffuseColor.a < threshold) discard;',


  '  gl_FragColor = vec4( outgoingLight, diffuseColor.a );',

  '}'

].join('\n');

function buildDitherMatrix(powerOf2) {
  var mat = [];
  var dim = 1 << powerOf2;
  for (var y = 0; y < dim; ++y) {
    for (var x = 0; x < dim; ++x) {
      var v = 0;
      var mask = powerOf2 - 1;
      var xc = x ^ y;
      for (var bit = 0; bit < (2 * powerOf2); --mask) { //NOSONAR
        v |= ((y >> mask) & 1) << bit++;
        v |= ((xc >> mask) & 1) << bit++;
      }
      mat.push(v);
    }
  }
  return mat;
}

function createDitherTexture(powerOf2) {
  var size = 1 << powerOf2;
  var dm = buildDitherMatrix(powerOf2);

  // copy matrix values to red component of RGBA buffer (scale to 0..255)
  var bufRGBA = utils.allocateTyped(Uint32Array, size * size);
  for (var i = 0; i < size * size; ++i) {
    bufRGBA[i] = dm[i] * 255.0 / (size * size);
  }

  // create texture from buffer data
  var t = new THREE.DataTexture(utils.allocateTyped(Uint8Array, bufRGBA.buffer), size, size, THREE.RGBAFormat);
  t.needsUpdate = true;
  return t;
}

function createIsoSurfaceMaterial() {
  var defUniforms = THREE.UniformsUtils.clone(uniforms);
  defUniforms.ditherMatrix = {type: 't', value: createDitherTexture(DITHER_MATRIX_POWER)};

  var material = new THREE.ShaderMaterial({
    uniforms : defUniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: THREE.DoubleSide,
    transparent: false,
    fog: true,
    lights: true
  });
  return material;
}
export default createIsoSurfaceMaterial;

