varying vec3 pos;

void main() {
  // we're assuming local position is in [-0.5, 0.5]
  // we need to offset it to be represented in RGB
  pos = position.xyz + 0.5;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}