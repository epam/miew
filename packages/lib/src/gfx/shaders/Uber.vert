float INSTANCED_SPRITE_OVERSCALE = 1.3;

attribute vec3 normal;

#ifdef NORMALS_TO_G_BUFFER
  varying vec3 viewNormal;
#endif
#if !defined (SPHERE_SPRITE) && !defined (CYLINDER_SPRITE)
  varying vec3 vNormal;
#endif

#ifdef THICK_LINE
  attribute vec4 position; // W contains vert pos or neg offset
#else
  attribute vec3 position;
#endif

varying vec3 vWorldPosition;
varying vec3 vViewPosition;

#ifdef ATTR_ALPHA_COLOR
  attribute float alphaColor;
  varying float alphaCol;
#endif

#if defined(USE_LIGHTS) && defined(SHADOWMAP)
	#if NUM_DIR_LIGHTS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHTS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHTS ];
		varying vec3 vDirectionalShadowNormal[ NUM_DIR_LIGHTS ];
	#endif
#endif

#ifdef ATTR_COLOR
  attribute vec3 color;
  varying vec3 vColor;
#endif

#ifdef ATTR_COLOR2
  attribute vec3 color2;
  varying vec3 vColor2;
  attribute vec2 uv;
  #ifndef CYLINDER_SPRITE
    varying vec2 vUv;
  #endif
#endif

#ifdef INSTANCED_POS
  attribute vec4 offset;
  #ifdef SPHERE_SPRITE
    varying vec4 instOffset;
  varying vec4 spritePosEye;
  #endif
#endif

#ifdef INSTANCED_MATRIX
  attribute vec4 matVector1;
  attribute vec4 matVector2;
  attribute vec4 matVector3;
  attribute vec4 invmatVector1;
  attribute vec4 invmatVector2;
  attribute vec4 invmatVector3;

  #ifdef CYLINDER_SPRITE
    varying vec4 matVec1;
    varying vec4 matVec2;
    varying vec4 matVec3;
    varying vec4 invmatVec1;
    varying vec4 invmatVec2;
    varying vec4 invmatVec3;
    varying vec4 spritePosEye;
  #endif
#endif

uniform mat4 modelViewMatrix; // optional
uniform mat4 projectionMatrix; // optional
uniform mat3 normalMatrix; // optional
uniform mat4 modelMatrix; // optional

#ifdef DASHED_LINE
  attribute float lineDistance;
  varying float vLineDistance;
#endif

#ifdef THICK_LINE
  attribute vec3 direction;
  uniform mat4 projMatrixInv;
  uniform vec2 viewport;
  uniform float lineWidth;

  vec4 transform(vec4 coord){
    return projectionMatrix * modelViewMatrix * coord;
  }

  vec2 project(vec4 device){
    vec3 device_normal = device.xyz/device.w;
    vec2 clip_pos = (device_normal*0.5+0.5).xy;
    return clip_pos * viewport;
  }

  vec4 unproject(vec2 screen, float z, float w){
    vec2 clip_pos = screen/viewport;
    vec2 device_normal = clip_pos*2.0-1.0;
    return vec4(device_normal*w, z, w);
  }
#endif


/////////////////////////////////////////// Main ///////////////////////////////////////////////
void main() {

#ifdef ATTR_ALPHA_COLOR
  alphaCol = alphaColor;
#endif

#ifdef INSTANCED_MATRIX
  vec3 objectNormal = vec3(
    dot(normal, matVector1.xyz),
    dot(normal, matVector2.xyz),
    dot(normal, matVector3.xyz));
#else
  vec3 objectNormal = vec3( normal );
#endif

vec3 transformedNormal = normalMatrix * objectNormal;

#if !defined (SPHERE_SPRITE) && !defined (CYLINDER_SPRITE)
  vNormal = normalize(transformedNormal);
#endif

#ifdef NORMALS_TO_G_BUFFER
  viewNormal = normalize(mat3(modelViewMatrix)*objectNormal);
#endif

  vec4 localPos = vec4(position.xyz, 1.0);
  vec4 worldPos = modelMatrix * localPos;
  vec4 mvPosition = modelViewMatrix * localPos;

// make thick line offset
#ifdef THICK_LINE
   // get screen pos
   vec4 dPos = transform(vec4(position.xyz, 1.0));
   vec2 sPos = project(dPos);
   // move pos forward
   vec3 position2 = position.xyz + direction.xyz * 0.5;
   // get screen offset pos
   vec4 dPos2 = transform(vec4(position2.xyz, 1.0));
   vec2 sPos2 = project(dPos2);
   // screen line direction
   vec2 sDir = normalize(sPos2 - sPos);
   // vertex offset (orthogonal to line direction)
   vec2 offset1 = vec2(-sDir.y, sDir.x);
   // move screen vertex
   vec2 newPos = sPos + offset1 * position.w * lineWidth;
   // get moved pos in view space
   vec4 dNewPos =  unproject(newPos, dPos.z, dPos.w);
   mvPosition.xyz = (projMatrixInv * dNewPos).xyz;
#endif // THICK_LINE

#ifdef INSTANCED_POS
  #ifdef SPHERE_SPRITE
    instOffset = offset;

    vec4 posEye = modelViewMatrix * vec4( offset.xyz, 1.0 );
    float scale = length(modelViewMatrix[0]);
    mvPosition = posEye + vec4( position.xyz * offset.w * scale * INSTANCED_SPRITE_OVERSCALE, 0.0 );
    posEye.w = offset.w * scale;

    spritePosEye = posEye;
 #else
    localPos = vec4( offset.xyz + position.xyz * offset.w, 1.0 );
    worldPos = modelMatrix * localPos;
    mvPosition = modelViewMatrix * localPos;
  #endif
#endif

#ifdef INSTANCED_MATRIX
  #ifdef CYLINDER_SPRITE
    matVec1 = matVector1;
    matVec2 = matVector2;
    matVec3 = matVector3;
    invmatVec1 = invmatVector1;
    invmatVec2 = invmatVector2;
    invmatVec3 = invmatVector3;

    // calculate eye coords of cylinder endpoints
    vec4 v = vec4(0, -0.5, 0, 1);
    vec4 p1 = modelViewMatrix * vec4(dot(v, matVector1), dot(v, matVector2), dot(v, matVector3), 1.0);
    v.y = 0.5;
    vec4 p2 = modelViewMatrix * vec4(dot(v, matVector1), dot(v, matVector2), dot(v, matVector3), 1.0);

    // sprite is placed at the center of cylinder
    vec4 posEye;
    posEye.xyz = mix(p1.xyz, p2.xyz, 0.5);
    posEye.w = 1.0;
    spritePosEye = posEye;

    // cylinder radius in eye space
    float rad = length(modelViewMatrix[0]) * length(vec3(matVector1.x, matVector2.x, matVector3.x));
    vec2 spriteSize;
    #ifdef ORTHOGRAPHIC_CAMERA
      // In ortho projection we skip z coordinate
      // basic sprite size at screen plane (covers only cylinder axis)
      vec2 spriteSizeScreen = abs(p2.xy - p1.xy);

      spriteSize = vec2(1.0, 1.0) * INSTANCED_SPRITE_OVERSCALE * (spriteSizeScreen + 2.0 * rad);
    #else
      // basic sprite size at screen plane (covers only cylinder axis)
      vec2 spriteSizeScreen = abs(p2.xy / p2.z - p1.xy / p1.z);

      // full sprite size in eye coords
      float minZ = min(abs(p1.z), abs(p2.z));
      spriteSize = vec2(1.0, 1.0) * INSTANCED_SPRITE_OVERSCALE * abs(posEye.z) * (spriteSizeScreen + 2.0 * rad / minZ);
    #endif

    mvPosition = posEye + vec4( position.xy * 0.5 * spriteSize, 0, 0 );
  #else
    localPos = vec4(dot(localPos, matVector1), dot(localPos, matVector2), dot(localPos, matVector3), 1.0);
    worldPos = modelMatrix * localPos;
    mvPosition = modelViewMatrix * localPos;
  #endif
#endif

  gl_Position = projectionMatrix * mvPosition;

  vWorldPosition = worldPos.xyz;
  vViewPosition = - mvPosition.xyz;

#if defined(USE_LIGHTS) && defined(SHADOWMAP)
	#if NUM_DIR_LIGHTS > 0
	  vec4 worldPosition;
	  // see THREE.WebGLProgram.unrollLoops
	  #pragma unroll_loop_start
	  for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
      vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * vec4(vWorldPosition, 1.0);
      vDirectionalShadowNormal[ i ] = (directionalShadowMatrix[ i ] * (modelMatrix * vec4(objectNormal, 0.0))).xyz;
	  }
	  #pragma unroll_loop_end
	#endif
#endif

#ifdef ATTR_COLOR
  vColor = color.xyz;
#endif

#ifdef ATTR_COLOR2
  vColor2 = color2;
  #ifndef CYLINDER_SPRITE
    vUv = uv;
  #endif
#endif

#ifdef DASHED_LINE
  vLineDistance = lineDistance;
#endif
}
