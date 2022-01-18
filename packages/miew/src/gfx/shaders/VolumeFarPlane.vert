varying vec4 volPos;
uniform float aspectRatio;
uniform float farZ;
uniform float tanHalfFOV;
uniform mat4  matWorld2Volume;

void main() {
  // rescale plane to fill in the whole far plane area seen from camera
  vec3 pos = position.xyz;
  pos.x = pos.x * tanHalfFOV * farZ * aspectRatio;
  pos.y = pos.y * tanHalfFOV * farZ;
  // common transformation
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  // calc pos in volume CS
  volPos = matWorld2Volume * modelMatrix * vec4(pos, 1.0);
  // we're assuming local position is in [-0.5, 0.5]
  // we need to offset it to be represented in RGB
  volPos = volPos + 0.5;
  volPos.w = 0.5;
}
