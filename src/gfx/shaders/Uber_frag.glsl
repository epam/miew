#ifdef ATTR_ALPHA_COLOR
  varying float alphaCol;
#endif

#ifdef COLOR_FROM_POS
  uniform mat4 world2colorMatrix;
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

#define PI 3.14159265359
#define RECIPROCAL_PI 0.31830988618
#define saturate(a) clamp( a, 0.0, 1.0 )

#ifdef USE_FOG
  uniform vec3 fogColor;
  uniform float fogNear;
  uniform float fogFar;
#endif

varying vec3 vWorldPosition; // world position of the pixel (invalid when INSTANCED_SPRITE is defined)
varying vec3 vViewPosition;

#if !defined (SPHERE_SPRITE) && !defined (CYLINDER_SPRITE)
  varying vec3 vNormal;
#endif

/////////////////////////////////////////// ZSprites ////////////////////////////////////////////////
#ifdef SPHERE_SPRITE
  varying vec4 spritePosEye;
#endif

#if defined(SPHERE_SPRITE) || defined(CYLINDER_SPRITE)
  uniform float zOffset;
  uniform mat4 projectionMatrix;

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

  float intersect_ray_sphere(in vec3 origin, in vec3 ray, out vec3 point) {

    // intersect XZ-projected ray with circle
    float a = dot(ray, ray);
    float b = dot(ray, origin);
    float c = dot(origin, origin) - 1.0;
    float det = b * b - a * c;
    if (det < 0.0) return -1.0;
    float t1 = (-b - sqrt(det)) / a;
    float t2 = (-b + sqrt(det)) / a;

    // calculate both intersection points
    vec3 p1 = origin + ray * t1;
    vec3 p2 = origin + ray * t2;

    // choose nearest point
    if (t1 >= 0.0) {
      point = p1;
      return t1;
    }
    if (t2 >= 0.0) {
      point = p2;
      return t2;
    }

    return -1.0;
  }

  float get_sphere_point(in vec3 pixelPosEye, out vec3 point) {
    // transform camera pos into sphere local coords
    vec4 v = invModelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec3 origin = (v.xyz - instOffset.xyz) / instOffset.w;

    // transform (camera -> pixel) ray into cylinder local coords
    v = invModelViewMatrix * vec4(pixelPosEye, 0.0);
    vec3 ray = normalize(v.xyz);

    return intersect_ray_sphere(origin, ray, point);
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

  float intersect_ray_cylinder(in vec3 origin, in vec3 ray, out vec3 point) {

    // intersect XZ-projected ray with circle
    float a = dot(ray.xz, ray.xz);
    float b = dot(ray.xz, origin.xz);
    float c = dot(origin.xz, origin.xz) - 1.0;
    float det = b * b - a * c;
    if (det < 0.0) return -1.0;
    float t1 = (-b - sqrt(det)) / a;
    float t2 = (-b + sqrt(det)) / a;

    // calculate both intersection points
    vec3 p1 = origin + ray * t1;
    vec3 p2 = origin + ray * t2;

    // choose nearest point
    float halfHeight = 0.5;
    if (t1 >= 0.0 && p1.y >= -halfHeight && p1.y <= halfHeight) {
      point = p1;
      return t1;
    }
    if (t2 >= 0.0 && p2.y >= -halfHeight && p2.y <= halfHeight) {
      point = p2;
      return t2;
    }

    return -1.0;
  }

  float get_cylinder_point(in vec3 pixelPosEye, out vec3 point) {
    // transform camera pos into cylinder local coords
    vec4 v = invModelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec3 origin = vec3(
      dot(v, invmatVec1),
      dot(v, invmatVec2),
      dot(v, invmatVec3));

    // transform (camera -> pixel) ray into cylinder local coords
    v = invModelViewMatrix * vec4(pixelPosEye, 0.0);
    vec3 ray = vec3(
      dot(v, invmatVec1),
      dot(v, invmatVec2),
      dot(v, invmatVec3));
    ray = normalize(ray);

    return intersect_ray_cylinder(origin, ray, point);
  }
#endif

/////////////////////////////////////////// Lighting ////////////////////////////////////////////////
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
  uniform vec3 ambientLightColor;

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

  void RE_Direct_BlinnPhong( const in DirectionalLight directLight, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {

    float dotNL = saturate( dot( geometry.normal, directLight.direction ));
    vec3 irradiance = dotNL * directLight.color * PI;
    reflectedLight.directDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );
    reflectedLight.directSpecular += irradiance * BRDF_Specular_BlinnPhong( directLight, geometry, material.specularColor, material.specularShininess );
  }

  void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
    reflectedLight.indirectDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );
  }

  vec3 calcLighting(const in GeometricContext geometry, const in BlinnPhongMaterial material) {
    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ));
    vec3 irradiance = ambientLightColor * PI;

    // use loop for number
    #if NUM_DIR_LIGHTS > 1
      for (int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
        RE_Direct_BlinnPhong(directionalLights[i], geometry, material, reflectedLight);
    #else
        RE_Direct_BlinnPhong(directionalLights[0], geometry, material, reflectedLight);
    #endif

        RE_IndirectDiffuse_BlinnPhong(irradiance, material, reflectedLight);

    #if NUM_DIR_LIGHTS > 1
      }
    #endif

    return reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular;
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

  vec4 pixelPosWorld = vec4(vWorldPosition, 1.0);
  vec4 pixelPosEye;

#ifdef SPHERE_SPRITE

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
    if (get_sphere_point(-vViewPosition, p) < 0.0) discard;
    pixelPosWorld = modelMatrix * vec4(instOffset.xyz + p * instOffset.w, 1.0);
    // pixelPosEye = modelViewMatrix * vec4(instOffset.xyz + p * instOffset.w, 1.0);
    pixelPosEye = vec4(spritePosEye.xyz, 1.0);
    pixelPosEye.z += instOffset.w *
      (modelViewMatrix[0][2] * p.x +
       modelViewMatrix[1][2] * p.y +
       modelViewMatrix[2][2] * p.z);
    normal = normalize(normalMatrix * p);
  }

#endif

#ifdef CYLINDER_SPRITE
  vec3 normal;
  float cylinderY = 0.0;

  // ray-trace cylinder surface
  {
    vec3 p;
    if (get_cylinder_point(-vViewPosition, p) < 0.0) discard;

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
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
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

#if !defined (SPHERE_SPRITE) && !defined (CYLINDER_SPRITE)
  #ifdef DOUBLE_SIDED
    float flipNormal = ( float( gl_FrontFacing ) * 2.0 - 1.0 );
  #else
    float flipNormal = 1.0;
  #endif
  vec3 normal = normalize( vNormal ) * flipNormal;
#endif

  diffuseColor.rgb *= vertexColor;

#if defined(USE_LIGHTS) && NUM_DIR_LIGHTS > 0
  GeometricContext geometry = GeometricContext(normal, normalize( vViewPosition ));
  BlinnPhongMaterial material = BlinnPhongMaterial(diffuseColor.rgb, specular, shininess);
  vec3 outgoingLight = calcLighting(geometry, material);
#else
  vec3 outgoingLight = diffuseColor.rgb;
#endif

#ifdef COLOR_FROM_POS
  gl_FragColor = world2colorMatrix * pixelPosWorld;
#else
  #ifdef OVERRIDE_COLOR
    gl_FragColor = vec4(fixedColor, diffuseColor.a);
  #else
    gl_FragColor = vec4(outgoingLight, diffuseColor.a);
  #endif

  #ifdef USE_FOG
    float fogFactor = smoothstep( fogNear, fogFar, vViewPosition.z );
    gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
  #endif
#endif

#if defined(SPHERE_SPRITE) || defined(CYLINDER_SPRITE)
  gl_FragDepthEXT = calcDepthForSprites(pixelPosEye, zOffset, projectionMatrix);
#endif
}
