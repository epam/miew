varying vec4 screenSpacePos;

void main() {
  screenSpacePos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = screenSpacePos;
}