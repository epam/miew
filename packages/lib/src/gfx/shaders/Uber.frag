#if defined (NORMALS_TO_G_BUFFER)
  #define fragColor gl_FragData[0]
#else
  #define fragColor gl_FragColor
#endif

#ifdef ATTR_ALPHA_COLOR
  varying float alphaCol;
#endif

#ifdef COLOR_FROM_POS
  uniform mat4 world2colorMatrix;
#endif

#if defined(USE_LIGHTS) && defined(SHADOWMAP)
	#if NUM_DIR_LIGHTS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHTS ];
    uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHTS ]; //only for sprites
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHTS ];
		varying vec3 vDirectionalShadowNormal[ NUM_DIR_LIGHTS ];
    vec4 vDirLightWorldCoord[ NUM_DIR_LIGHTS ];
    vec3 vDirLightWorldNormal[ NUM_DIR_LIGHTS ];

    #ifdef SHADOWMAP_PCF_RAND
      // We use 4 instead uniform variable or define because this value is used in for(... i < value; ...) with
      // unroll_loop and unroll_loop has pattern:
      // /#pragma unroll_loop[\s]+?for \( int i \= (\d+)\; i < (\d+)\; i \+\+ \) \{([\s\S]+?)(?=\})\}/g
      uniform vec2 samplesKernel[4]; // 4 is length of _samplesKernel which is defined in UberMaterial.js
      uniform sampler2D noiseTex;
      uniform vec2 noiseTexelSize;
      uniform vec2 srcTexelSize;
      uniform mat4 projectionMatrix;
    #endif
	#endif
#endif

#ifdef ATTR_COLOR
  varying vec3 vColor;
#endif

#ifdef ATTR_COLOR2
  varying vec3 vColor2;
  #ifndef CYLINDER_SPRITE
    varying vec2 vUv;
  #endif
#endif

uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform vec3 fixedColor;
uniform float opacity;
uniform float zClipValue;
uniform float clipPlaneValue;

#ifdef NORMALS_TO_G_BUFFER
  varying vec3 viewNormal;
#endif

#define RECIPROCAL_PI 0.31830988618
#define saturate(a) clamp( a, 0.0, 1.0 )

#ifdef USE_FOG
  uniform vec3 fogColor;
  uniform float fogAlpha;
  uniform float fogNear;
  uniform float fogFar;
#endif

varying vec3 vWorldPosition; // world position of the pixel (invalid when INSTANCED_SPRITE is defined)
varying vec3 vViewPosition;

#if !defined (SPHERE_SPRITE) && !defined (CYLINDER_SPRITE)
  varying vec3 vNormal;
#endif

/////////////////////////////////////////// ZSprites ////////////////////////////////////////////////
#if defined (SPHERE_SPRITE) || defined (CYLINDER_SPRITE)
  uniform float nearPlaneValue;
#endif

#ifdef SPHERE_SPRITE
  varying vec4 spritePosEye;
#endif

#if defined(SPHERE_SPRITE) || defined(CYLINDER_SPRITE)
  uniform float zOffset;

  #if !defined(USE_LIGHTS) || !defined(SHADOWMAP) || !defined(SHADOWMAP_PCF_RAND) || !(NUM_DIR_LIGHTS > 0)
    uniform mat4 projectionMatrix;
  #endif

  float calcDepthForSprites(vec4 pixelPosEye, float zOffset, mat4 projMatrix) {
    vec4 pixelPosScreen = projMatrix * pixelPosEye;
    return 0.5 * (pixelPosScreen.z / pixelPosScreen.w + 1.0) + zOffset;
  }
#endif

#ifdef SPHERE_SPRITE
  varying vec4 instOffset;
  uniform mat4 modelMatrix;
  uniform mat4 modelViewMatrix;
  uniform mat4 invModelViewMatrix;
  uniform mat3 normalMatrix;


  bool intersect_ray_sphere(in vec3 origin, in vec3 ray, out vec3 point, out float frontFaced) {

    // intersect XZ-projected ray with circle
    float a = dot(ray, ray);
    float b = dot(ray, origin);
    float c = dot(origin, origin) - 1.0;
    float det = b * b - a * c;
    if (det < 0.0) return false;
    float t1 = (-b - sqrt(det)) / a;
    float t2 = (-b + sqrt(det)) / a;

    // calculate both intersection points
    vec3 p1 = origin + ray * t1;
    vec3 p2 = origin + ray * t2;

    // choose nearest point inside frustum
    #ifdef ORTHOGRAPHIC_CAMERA
      // orthografic camera is used for dirLight sources. So in it for all spheres the point with smaller 't' is visible
      // t1 is always smaller than t2 (from calculations)
      point = p1;
      frontFaced = 1.0;
      return true;
    #else
      // for perspective camera first intersection can be in front of near plane. If not intersection is p1 else - p2
      // t* = 0.0 corresponds to point of intersection near plane by the ray from camera to curPixel
      if (t1 >= 0.0) {
        point = p1;
        frontFaced = 1.0;
        return true;
      }
      if (t2 >= 0.0) {
        point = p2;
        frontFaced = -1.0;
        return true;
      }
    #endif

    return false;
  }

  bool get_sphere_point(in vec3 pixelPosEye, out vec3 point, out float frontFaced) {
    vec3 origin, ray;

    #ifdef ORTHOGRAPHIC_CAMERA
      // transform vector from sprite center to curPixel into sphere local coords
      origin = pixelPosEye.xyz - spritePosEye.xyz;
      origin = (invModelViewMatrix * vec4(origin, 0.0)).xyz / instOffset.w;

      // transform camera orientation vector into sphere local coords
      ray = (invModelViewMatrix * vec4(0.0, 0.0, -1.0, 0.0)).xyz;
    #else
      // find point of intersection near plane by the ray from camera to curPixel
      vec4 v = vec4(-(nearPlaneValue / pixelPosEye.z) * pixelPosEye, 1.0);

      // transform intersection point into sphere local coords
      v = invModelViewMatrix * v;
      origin = (v.xyz - instOffset.xyz) / instOffset.w;

      // transform vector from camera pos to curPixel into sphere local coords
      ray = (invModelViewMatrix * vec4(pixelPosEye, 0.0)).xyz;
    #endif
    ray = normalize(ray);

    return intersect_ray_sphere(origin, ray, point, frontFaced);
  }
#endif

#ifdef CYLINDER_SPRITE
  varying vec4 matVec1;
  varying vec4 matVec2;
  varying vec4 matVec3;
  varying vec4 invmatVec1;
  varying vec4 invmatVec2;
  varying vec4 invmatVec3;

  uniform mat4 modelMatrix;
  uniform mat4 modelViewMatrix;
  uniform mat4 invModelViewMatrix;
  uniform mat3 normalMatrix;

  varying vec4 spritePosEye;

  bool intersect_ray_cylinder(in vec3 origin, in vec3 ray, out vec3 point, out float frontFaced) {

    // intersect XZ-projected ray with circle
    float a = dot(ray.xz, ray.xz);
    float b = dot(ray.xz, origin.xz);
    float c = dot(origin.xz, origin.xz) - 1.0;
    float det = b * b - a * c;
    if (det < 0.0) return false;
    float t1 = (-b - sqrt(det)) / a;
    float t2 = (-b + sqrt(det)) / a;

    // calculate both intersection points
    vec3 p1 = origin + ray * t1;
    vec3 p2 = origin + ray * t2;

    float halfHeight = 0.5;

    // choose nearest point
    #ifdef ORTHOGRAPHIC_CAMERA
      // orthografic camera is used for dirLight sources. So in it for all cylinders the point with smaller 't' is visible
      // if it is not outside of cylinnder (t1 is always smaller than t2).
      if (p1.y >= -halfHeight && p1.y <= halfHeight) {
        point = p1;
        frontFaced = 1.0;
        return true;
      }
      if (p2.y >= -halfHeight && p2.y <= halfHeight) {
        point = p2;
        frontFaced = -1.0;
        return true;
      }
    #else
      // for perspective camera first intersection can be in front of near plane. If not intersection is p1 else - p2
      // t* = 0.0 corresponds to point of intersection near plane by the ray from camera to curPixel
      if (t1 >= 0.0 && p1.y >= -halfHeight && p1.y <= halfHeight) {
        point = p1;
        frontFaced = 1.0;
        return true;
      }
      if (t2 >= 0.0 && p2.y >= -halfHeight && p2.y <= halfHeight) {
        point = p2;
        frontFaced = -1.0;
        return true;
      }
    #endif

    return false;
  }

  bool get_cylinder_point(in vec3 pixelPosEye, out vec3 point, out float frontFaced) {
    vec3 origin, ray;
    vec4 v;

    #ifdef ORTHOGRAPHIC_CAMERA
      // transform vector from sprite center to curPixel into cylinder local coords
      v = invModelViewMatrix * vec4(pixelPosEye.xyz - spritePosEye.xyz, 0.0);
      origin = vec3(dot(v, invmatVec1), dot(v, invmatVec2), dot(v, invmatVec3));

      // transform camera orientation vector into cylinder local coords
      v = invModelViewMatrix * vec4(0.0, 0.0, -1.0, 0.0);
      ray = vec3(dot(v, invmatVec1), dot(v, invmatVec2), dot(v, invmatVec3));
    #else
      // find point of intersection near plane by the ray from camera to curPixel
      v = vec4(-(nearPlaneValue / pixelPosEye.z) * pixelPosEye, 1.0);

      // transform intersection point into cylinder local coords
      v = invModelViewMatrix * v;
      origin = vec3(dot(v, invmatVec1), dot(v, invmatVec2), dot(v, invmatVec3));

      // transform vector from camera pos to curPixel into cylinder local coords
      v = invModelViewMatrix * vec4(pixelPosEye, 0.0);
      ray = vec3(dot(v, invmatVec1), dot(v, invmatVec2), dot(v, invmatVec3));
    #endif
    ray = normalize(ray);

    return intersect_ray_cylinder(origin, ray, point, frontFaced);
  }
#endif

///////////////////////////////////// Pack and unpack ///////////////////////////////////////////////
const float PackUpscale = 256. / 255.; // fraction -> 0..1 (including 1)
const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)

const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256.,  256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );


const float ShiftRight8 = 1. / 256.;

vec4 packDepthToRGBA( const in float v ) {
  vec4 r = vec4( fract( v * PackFactors ), v );
  r.yzw -= r.xyz * ShiftRight8; // tidy overflow
  return r * PackUpscale;
}

float unpackRGBAToDepth( const in vec4 v ) {
  return dot( v, UnpackFactors );
}

////////////////////////////////////////// All Lighting /////////////////////////////////////////////////
#ifdef TOON_SHADING
  #define LOW_TOON_BORDER 0.0
  #define MEDIUM_TOON_BORDER 0.7
  #define HIGH_TOON_BORDER 1.0

  #define MEDIUM_TOON_RANGE 0.5
  #define HIGH_TOON_RANGE 0.95
#endif
#if defined(USE_LIGHTS) && NUM_DIR_LIGHTS > 0
  struct ReflectedLight {
    vec3 directDiffuse;
    vec3 directSpecular;
    vec3 indirectDiffuse;
  };

  struct BlinnPhongMaterial {
    vec3  diffuseColor;
    vec3  specularColor;
    float specularShininess;
  };

  struct GeometricContext {
    vec3 normal;
    vec3 viewDir;
  };

  struct DirectionalLight {
    vec3 direction;
    vec3 color;
  };
  uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];

  struct DirectionalLightShadow {
     vec2 shadowMapSize;
     float shadowBias;
     float shadowRadius;
   };
  uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHTS ];

  uniform vec3 ambientLightColor;

  /////////////////////////////////////////// Shadowmap ////////////////////////////////////////////////

  #if defined(SHADOWMAP)
  	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
  		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
  	}

    float getShadow( sampler2D shadowMap, DirectionalLightShadow dirLight, vec4 shadowCoord, vec3 vViewPosition, vec3 vNormal ) {
   	  float shadow = 0.0;

      // When shadows for sprites will appear use here for them normals as it done for G-buffer
      shadowCoord.xyz += dirLight.shadowBias * vNormal;
      shadowCoord.xyz /= shadowCoord.w;

      bvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );
      bool inFrustum = all( inFrustumVec );
      bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );
      bool frustumTest = all( frustumTestVec );

      if ( frustumTest ) {
        #ifdef SHADOWMAP_BASIC
      	  shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
      	#endif

      	#ifdef SHADOWMAP_PCF_SHARP
      	  vec2 texelSize = vec2( 1.0 ) / dirLight.shadowMapSize;

            float dx0 = - texelSize.x * dirLight.shadowRadius;
            float dy0 = - texelSize.y * dirLight.shadowRadius;
            float dx1 = + texelSize.x * dirLight.shadowRadius;
            float dy1 = + texelSize.y * dirLight.shadowRadius;

            shadow = (
            	texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
            	texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
            	texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
            	texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
            	texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
            	texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
            	texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
            	texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
            	texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
            ) * ( 1.0 / 9.0 );
        #endif

        #ifdef SHADOWMAP_PCF_RAND
          vec2 texelSize = vec2( 1.0 ) / dirLight.shadowMapSize;

          vec4 vUv = ((projectionMatrix * vec4(vViewPosition, 1.0)) + 1.0) / 2.0;
          vec2 vUvNoise = vUv.xy / srcTexelSize * noiseTexelSize;

          vec2 noiseVec = normalize(texture2D(noiseTex, vUvNoise).rg);
          mat2 mNoise = mat2(noiseVec.x, noiseVec.y, -noiseVec.y, noiseVec.x);

          vec2 offset;
          #pragma unroll_loop_start
          for ( int i = 0; i < 4; i ++ ) { // 4 is length of _samplesKernel which is defined in UberMaterial.js
            offset = mNoise * ( normalize( samplesKernel[ i ]) * texelSize * dirLight.shadowRadius );
            shadow +=  texture2DCompare( shadowMap, shadowCoord.xy + offset, shadowCoord.z );
          }
          #pragma unroll_loop_end
          shadow /= float( 4 ); // 4 is length of _samplesKernel which is defined in UberMaterial.js
        #endif
      }
      return shadow;//(shadow != 1.0) ? 0.5 : 1.0;//vec4(shadow, shadow, shadow, 1.0);
   }
  #endif

  /////////////////////////////////////////// Lighting /////////////////////////////////////////////////

  vec3 BRDF_Diffuse_Lambert( const in vec3 diffuseColor ) {
    return RECIPROCAL_PI * diffuseColor;
  } // validated

  vec3 F_Schlick( const in vec3 specularColor, const in float dotLH ) {
    // Original approximation by Christophe Schlick '94
    //;float fresnel = pow( 1.0 - dotLH, 5.0 );
    // Optimized variant (presented by Epic at SIGGRAPH '13)
    float fresnel = exp2( ( -5.55473 * dotLH - 6.98316 ) * dotLH );
    return ( 1.0 - specularColor ) * fresnel + specularColor;
  } // validated

  float G_BlinnPhong_Implicit( /* const in float dotNL, const in float dotNV */ ) {
    // geometry term is (n dot l)(n dot v) / 4(n dot l)(n dot v)
    return 0.25;
  }

  float D_BlinnPhong( const in float shininess, const in float dotNH ) {
    return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
  }

  vec3 BRDF_Specular_BlinnPhong( const in DirectionalLight incidentLight, const in GeometricContext geometry, const in vec3 specularColor, const in float shininess ) {
    vec3 halfDir = normalize( incidentLight.direction + geometry.viewDir );
    float dotNH = saturate(dot( geometry.normal, halfDir ));
    float dotLH = saturate(dot( incidentLight.direction, halfDir ));

    vec3 F = F_Schlick( specularColor, dotLH );
    float G = G_BlinnPhong_Implicit( /* dotNL, dotNV */ );
    float D = D_BlinnPhong( shininess, dotNH );

    return F * ( G * D );
  } // validated

  void RE_Direct_BlinnPhong( const in DirectionalLight directLight, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight, float penumbra ) {

    float dotNL = saturate( dot( geometry.normal, directLight.direction ));
    #ifdef TOON_SHADING
      if(dotNL < MEDIUM_TOON_RANGE){
        dotNL = LOW_TOON_BORDER;
      }
      else if(dotNL < HIGH_TOON_RANGE){
        dotNL = MEDIUM_TOON_BORDER;
      }
      else{
        dotNL = HIGH_TOON_BORDER;
      }
    #endif

    vec3 irradiance = dotNL * directLight.color;
    reflectedLight.directDiffuse += penumbra * irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );
    reflectedLight.directSpecular += penumbra * irradiance * BRDF_Specular_BlinnPhong( directLight, geometry, material.specularColor, material.specularShininess );
  }

  void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
    reflectedLight.indirectDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );
  }

  vec3 calcLighting(const in GeometricContext geometry, const in BlinnPhongMaterial material, vec3 vViewPosition) {
    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ));
    vec3 irradiance = ambientLightColor;

    float shadowMask = 1.0;
    // see THREE.WebGLProgram.unrollLoops
  	#pragma unroll_loop_start
  	  for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
  	    #ifdef SHADOWMAP
  	      shadowMask = getShadow( directionalShadowMap[ i ], directionalLightShadows[ i ], vDirLightWorldCoord[ i ], vViewPosition, vDirLightWorldNormal[ i ] );
        #endif

  		  if ( shadowMask > 0.0 ) RE_Direct_BlinnPhong( directionalLights[ i ], geometry, material, reflectedLight, shadowMask );
  		}
  		#pragma unroll_loop_end

    RE_IndirectDiffuse_BlinnPhong(irradiance, material, reflectedLight);

    return saturate(reflectedLight.indirectDiffuse + reflectedLight.directDiffuse + reflectedLight.directSpecular);
  }
#endif

/////////////////////////////////////////// Dashed Line ///////////////////////////////////////////////
#ifdef DASHED_LINE
  uniform float dashedLineSize;
  uniform float dashedLinePeriod;
  varying float vLineDistance;
#endif

/////////////////////////////////////////// Main ///////////////////////////////////////////////
void main() {

#ifdef CLIP_PLANE
  if (vViewPosition.z < clipPlaneValue) discard;
#endif

#ifdef ZCLIP
  if (vViewPosition.z < zClipValue) discard;
#endif

#if defined(USE_LIGHTS) && defined(SHADOWMAP)
  #if NUM_DIR_LIGHTS > 0
    // see THREE.WebGLProgram.unrollLoops
    #pragma unroll_loop_start
    for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
      vDirLightWorldCoord[ i ] = vDirectionalShadowCoord[ i ];
      vDirLightWorldNormal[ i ] = vDirectionalShadowNormal[ i ];
    }
    #pragma unroll_loop_end
  #endif
#endif

  vec4 pixelPosWorld = vec4(vWorldPosition, 1.0);
  vec4 pixelPosEye;

#ifdef SPHERE_SPRITE

  vec3 viewNormalSprites;
  float frontFaced = 1.0;
  vec3 normal;

/* quick-and-dirty method
  normal.xy = ' + INSTANCED_SPRITE_OVERSCALE + ' * (2.0 * vUv - 1.0);
  float r2 = dot(normal.xy, normal.xy);
  if (r2 > 1.0) discard;
  float normalZ = sqrt(1.0 - r2);
  normal.z = normalZ;
  normal = normal * ( -1.0 + 2.0 * float( gl_FrontFacing ) );
  pixelPosEye = vec4(spritePosEye.xyz, 1.0);
  pixelPosEye.z += spritePosEye.w * normalZ;
*/

  // ray-trace sphere surface
  {
    vec3 p;
    if (!get_sphere_point(-vViewPosition, p, frontFaced)) discard;
    vec4 v = vec4(instOffset.xyz + p * instOffset.w, 1.0);
    pixelPosWorld = modelMatrix * v;
    pixelPosEye = modelViewMatrix * v;
    normal = normalize(normalMatrix * p);
    #ifdef NORMALS_TO_G_BUFFER
      viewNormalSprites = normalize(mat3(modelViewMatrix)*p);
    #endif

    #if defined(USE_LIGHTS) && defined(SHADOWMAP)
      #if NUM_DIR_LIGHTS > 0
        // see THREE.WebGLProgram.unrollLoops
        #pragma unroll_loop_start
          for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
            vDirLightWorldCoord[ i ] = directionalShadowMatrix[ i ] * pixelPosWorld;
            vDirLightWorldNormal[ i ] = (directionalShadowMatrix[ i ] * (modelMatrix * vec4(p, 0.0))).xyz;
          }
        #pragma unroll_loop_end
      #endif
    #endif
  }
#endif

#ifdef CYLINDER_SPRITE
  vec3 normal;
  vec3 viewNormalSprites;
  float frontFaced = 1.0;
  float cylinderY = 0.0;

  // ray-trace cylinder surface
  {
    vec3 p;
    if (!get_cylinder_point(-vViewPosition, p, frontFaced)) discard;

    cylinderY = 0.5 * (p.y + 1.0);

    vec4 v = vec4(p, 1.0);
    v = vec4(dot(v, matVec1), dot(v, matVec2), dot(v, matVec3), 1.0);
    pixelPosWorld = modelMatrix * v;
    pixelPosEye = modelViewMatrix * v;

    vec3 localNormal = normalize(vec3(p.x, 0.0, p.z));
    normal = vec3(
      dot(localNormal, matVec1.xyz),
      dot(localNormal, matVec2.xyz),
      dot(localNormal, matVec3.xyz));
    #ifdef NORMALS_TO_G_BUFFER
      viewNormalSprites = normalize(mat3(modelViewMatrix)*normal);
    #endif

    #if defined(USE_LIGHTS) && defined(SHADOWMAP)
      #if NUM_DIR_LIGHTS > 0
        // see THREE.WebGLProgram.unrollLoops
        #pragma unroll_loop_start
          for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
            vDirLightWorldCoord[ i ] = directionalShadowMatrix[ i ] * pixelPosWorld;
            vDirLightWorldNormal[ i ] = (directionalShadowMatrix[ i ] * (modelMatrix * vec4(normal, 0.0))).xyz;
          }
        #pragma unroll_loop_end
      #endif
    #endif

    normal = normalize(normalMatrix * normal);
  }
#endif

  #ifdef ATTR_COLOR
    vec3 vertexColor = vColor;
  #else
    vec3 vertexColor = vec3(1.0, 1.0, 1.0);
  #endif

  #ifdef ATTR_COLOR2
    #ifdef CYLINDER_SPRITE
      float colorCoef = cylinderY; // cylinder parameter is calculated from ray-tracing
    #else
      float colorCoef = vUv.y; // cylinder parameter is interpolated as tex coord
    #endif
      // choose either color or color2
    vertexColor = mix(vColor2, vColor, step(0.5, colorCoef));
  #endif

  // negative red component is a special condition
  if (vertexColor.x < 0.0) discard;

  #ifdef DASHED_LINE
    if ( mod( vLineDistance, dashedLinePeriod ) > dashedLineSize ) discard;
  #endif

  // transparency prepass writes only z, so we don't need to calc the color
  #ifdef PREPASS_TRANSP
    fragColor = vec4(1.0, 1.0, 1.0, 1.0);
    #if defined(SPHERE_SPRITE) || defined(CYLINDER_SPRITE)
      gl_FragDepthEXT = calcDepthForSprites(pixelPosEye, zOffset, projectionMatrix);
    #endif
    return;
  #endif

    float totalOpacity = opacity;

  #ifdef ATTR_ALPHA_COLOR
    totalOpacity *= alphaCol;
  #endif

  // discard fully transparent pixels
  if (totalOpacity == 0.0) discard;

  #ifdef FAKE_OPACITY
    // discard pixels in checker pattern
    vec2 dm_coord = floor(gl_FragCoord.xy);
    dm_coord = fract(dm_coord * 0.5);
    if (totalOpacity < 1.0 && (dm_coord.x < 0.5 ^^ dm_coord.y < 0.5)) discard;
    vec4 diffuseColor = vec4(diffuse, 1.0);
  #else
    vec4 diffuseColor = vec4(diffuse, totalOpacity);
  #endif

  float flipNormal;
  #if !defined (SPHERE_SPRITE) && !defined (CYLINDER_SPRITE)
    flipNormal = 1.0;
    #ifdef DOUBLE_SIDED
      flipNormal = float( gl_FrontFacing );
    #endif
    vec3 normal = normalize( vNormal ) * flipNormal;
  #endif

    diffuseColor.rgb *= vertexColor;

  #if defined(SPHERE_SPRITE) || defined(CYLINDER_SPRITE)
    gl_FragDepthEXT = calcDepthForSprites(pixelPosEye, zOffset, projectionMatrix);
  #endif

  #ifdef NORMALS_TO_G_BUFFER
    #if defined (SPHERE_SPRITE) || defined (CYLINDER_SPRITE)
      vec3 viewNormaInColor = viewNormalSprites;
    #else
      vec3 viewNormaInColor = viewNormal;
      float frontFaced = float( gl_FrontFacing );
    #endif
    // [-1, 1] -> [0, 1]
    viewNormaInColor = 0.5 * viewNormaInColor + 0.5;
    gl_FragData[1] = vec4(viewNormaInColor, frontFaced);
  #endif

  #if defined(USE_LIGHTS) && NUM_DIR_LIGHTS > 0
    vec3 viewDir;
    #if defined(SPHERE_SPRITE) || defined(CYLINDER_SPRITE)
      viewDir = -pixelPosEye.xyz;
    #else
      viewDir = vViewPosition;
    #endif
    GeometricContext geometry = GeometricContext(normal, normalize( viewDir ));
    BlinnPhongMaterial material = BlinnPhongMaterial(diffuseColor.rgb, specular, shininess);
    vec3 outgoingLight = calcLighting(geometry, material, viewDir);
  #else
    vec3 outgoingLight = diffuseColor.rgb;
  #endif

  #ifdef COLOR_FROM_DEPTH
    float depth = 0.0;
    #if defined(SPHERE_SPRITE) || defined(CYLINDER_SPRITE)
      gl_FragDepthEXT = calcDepthForSprites(pixelPosEye, zOffset, projectionMatrix);
      depth = gl_FragDepthEXT;
    #else
      depth = gl_FragCoord.z;
    #endif
    fragColor = packDepthToRGBA(depth);
    return;
  #endif

  #ifdef COLOR_FROM_POS
    fragColor = world2colorMatrix * pixelPosWorld;
  #else
    #ifdef OVERRIDE_COLOR
      fragColor = vec4(fixedColor, diffuseColor.a);
    #else
      fragColor = vec4(outgoingLight, diffuseColor.a);//vec4(vNormal, 1.0);
    #endif

    #ifdef USE_FOG
      float viewDistance;
      #if defined(SPHERE_SPRITE) || defined(CYLINDER_SPRITE)
        viewDistance = abs(pixelPosEye.z);
      #else
        viewDistance = vViewPosition.z;
      #endif
      float fogFactor = smoothstep( fogNear, fogFar, viewDistance) * fogAlpha;
      #ifdef FOG_TRANSPARENT
        fragColor.a = fragColor.a * (1.0 - fogFactor);
      #else
        fragColor.rgb = mix( fragColor.rgb, fogColor, fogFactor );
      #endif
    #endif

  #endif
}
