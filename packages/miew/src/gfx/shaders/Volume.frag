uniform mat4 projectionMatrix;

// 3D volume texture
uniform vec3 volumeDim;    // volume dimensions, pixels
uniform sampler2D tileTex; // tiled texture containing all Z-slices of a 3D data
uniform vec2 tileTexSize;  // size of tiled texture, pixels
uniform vec2 tileStride;   // UV stride between slices in tile tex, pixels

uniform vec3 boxAngles;//value of angles({x: alpha, y:beta, z:gamma}) types 1 - if angle is obtuse, 0 - if acute
uniform vec3 delta; //Projection box delta's from non-orthogonal origin axes; {x: XY, y : XZ, z: YZ}

uniform vec3 _isoLevel0;
uniform float _flipV;
uniform sampler2D _BFLeft;
uniform sampler2D _BFRight;
uniform sampler2D _FFLeft;
uniform sampler2D _FFRight;
uniform sampler2D _WFFLeft;
uniform sampler2D _WFFRight;

varying vec4 screenSpacePos;

#define NO_COLOR vec4(0., 0., 0., 0.)

vec4 sample3DTexture(vec3 texCoord) {
  // a pair of Z slices is determined by nearest slice border
  float zSliceBorder = floor(texCoord.z * volumeDim.z + 0.5);
  float zSliceNumber1 = max(zSliceBorder - 1.0, 0.0);
  float zSliceNumber2 = min(zSliceBorder, volumeDim.z - 1.0);

  float rowTiles = floor(tileTexSize.x / tileStride.x);

  // calculate coords in tile texture for both slices
  vec2 tileOffset = vec2(mod(zSliceNumber1, rowTiles), floor(zSliceNumber1 / rowTiles));
  vec2 texCoordSlice1 = (texCoord.xy * volumeDim.xy + tileOffset * tileStride) / tileTexSize.xy;
  tileOffset = vec2(mod(zSliceNumber2, rowTiles), floor(zSliceNumber2 / rowTiles));
  vec2 texCoordSlice2 = (texCoord.xy * volumeDim.xy + tileOffset * tileStride) / tileTexSize.xy;

  // bilinear filtering
  vec4 colorSlice1 = texture2D(tileTex, texCoordSlice1);
  vec4 colorSlice2 = texture2D(tileTex, texCoordSlice2);
  float weightSlice2 = texCoord.z * volumeDim.z - (zSliceNumber1 + 0.5);
  return mix(colorSlice1, colorSlice2, weightSlice2);
}

vec4 sample3DTextureInclined(vec3 boxCoord) { // delta:{ x: XY, y : XZ, z: YZ }
  vec3 textCoord = boxCoord;
  vec2 currDelta = mix(boxCoord.zz, vec2(1., 1.) - boxCoord.zz, boxAngles.yx) * delta.yz;

  textCoord.y = (boxCoord.y  - currDelta.y) / (1. - delta.z);
  if (textCoord.y < 0.0 || textCoord.y > 1.0)
    return NO_COLOR;

  currDelta.x += mix(textCoord.y, 1.0 - textCoord.y, boxAngles.z) * delta.x;

  textCoord.x = (boxCoord.x - currDelta.x) / (1. - delta.x - delta.y);
  if (textCoord.x < 0.0 || textCoord.x > 1.0)
    return NO_COLOR;

  return sample3DTexture(textCoord);
}

float CalcColor(vec3 iter, vec3 dir) {
  float d = 1. / 128.;
  vec3 dx = vec3(d, 0.0, 0.0);
  vec3 dy = vec3(0.0, d, 0.0);
  vec3 dz = vec3(0.0, 0.0, d);

  // #Opt: coordInc.x:(iter + dx).x > 1. ? 0.: sample3DTextureInclined(iter + dx).x,
  vec3 coordInc = mix(
    vec3(
      sample3DTextureInclined(iter + dx).x,
      sample3DTextureInclined(iter + dy).x,
      sample3DTextureInclined(iter + dz).x
    ),
    vec3(0. ,0. , 0.),
    vec3(floor((iter + dx).x), floor((iter + dy).y), floor((iter + dz).z))
  );

  // #Opt: coordDec.x:(iter - dx).x < 0. ? 0.: sample3DTextureInclined(iter - dx).x,
  vec3 coordDec = mix(
    vec3(0. ,0. , 0.),
    vec3(
      sample3DTextureInclined(iter - dx).x,
      sample3DTextureInclined(iter - dy).x,
      sample3DTextureInclined(iter - dz).x
    ),
    vec3(ceil((iter - dx).x), ceil((iter - dy).y), ceil((iter - dz).z))
  );

  vec3 N = normalize(coordInc - coordDec);
  float dif = max(0.0, dot(N, dir));
  return dif;
}

vec3 AccuracyIso(vec3 left, vec3 right, float volLeft, float threshold) {
  for (int i = 0; i < 5; i++) {
    vec3 iterator = 0.5 * (left + right);
    float vol = sample3DTextureInclined(iterator).r;
    if ((volLeft - threshold) * (vol - threshold) < 0.)
      right = iterator;
    else
      left = iterator;
  }
  return 0.5 * (left + right);
}

vec3 CorrectIso(vec3 left, vec3 right, float tr) {
  for (int j = 0; j < 5; j++) {
    vec3 iterator = 0.5 * (left + right);
    float vol = sample3DTextureInclined(iterator).r;
    if (vol < tr)
      right = iterator;
    else
      left = iterator;
  }
  return 0.5 * (left + right);
}

vec4 GetIso1(vec3 start, vec3 back, float molDist, vec3 dir, float tr, int count) {
  float vol, stepSize = (float(count) + 2.) / float(STEPS_COUNT);
  vec3 step = stepSize * dir, iterator = start, left, right;
  vec4 acc = NO_COLOR;

  for (int i = 0; i < STEPS_COUNT; i++) {
    iterator = iterator + step;
    vol = sample3DTextureInclined(iterator).r;
    if (length(iterator - back) <= stepSize || (vol > tr))
      break;
  }

  if (vol > tr)
    acc = vec4(CorrectIso(iterator, iterator - step, tr).xyz, 1.);

  return acc;
}

float easeOut(float x0, float x1, float x) {
  float t = clamp((x - x0) / (x1 - x0), 0.0, 1.0);
  return 1.0 - (1.0 - t) * (1.0 - t);
}

float easeIn(float x0, float x1, float x) {
  float t = clamp((x - x0) / (x1 - x0), 0.0, 1.0);
  return t * t;
}

vec3 GetColSimple(float vol) {
  float t = easeOut(_isoLevel0.x, _isoLevel0.y, vol);
  float s = easeIn(_isoLevel0.y, _isoLevel0.z, vol);
  return vec3(0.5, 0.6, 0.7) * (1.0 - t) + 2.0 * vec3(s, 0, 0);
}

vec4 VolRender(vec3 start, vec3 back, float molDist, vec3 dir) {
  vec4 acc = NO_COLOR, iso;
  vec3 iterator = start, sumColor = vec3(0., 0., 0.);
  float stepSize, alpha, sumAlpha = 0.0, vol, curStepSize, molD;
  vec3 step, col, colOld, right;
  float tr0 = _isoLevel0.x;
  float dif, r, kd, finish;
  int count = 0, stopMol = 0;

  for (int k = 0; k < 3; k++) {
    stepSize = (float(k) + 2.) / float(STEPS_COUNT);
    kd = 140. * tr0 * stepSize;
    r = 1. - kd;
    step = stepSize * dir;
    iso = GetIso1(iterator, back, molDist, dir, tr0, k);
    if (iso.a < 0.1 || length(iso.xyz - start) > molDist)
      break;
    iterator = iso.xyz;
    dif = 1.;// CalcColor(iterator, dir);
    colOld = GetColSimple(tr0);
    curStepSize = stepSize;
    for (int i = 0; i < STEPS_COUNT; i++) {
      iterator = iterator + step;
      molD = length(iterator - start);
      vol = sample3DTextureInclined(iterator).r;
      finish = distance(iterator, back) - stepSize;
      if (finish < 0.0 || vol < tr0 || (sumAlpha > 0.97) || molD > molDist)
        break;
      alpha = (1. - r);
      col = GetColSimple(vol);
      vol = sample3DTextureInclined(iterator - 0.5 * step).r;
      vec3 colMid = GetColSimple(vol);
      sumColor += (1. - sumAlpha) * (colOld + 4.* colMid + col) * alpha / 6.;
      sumAlpha += (1. - sumAlpha) * alpha;// *(1. - 1.0*dif*dif);
      colOld = col;
    } // for i

    if (finish < 0.0 || sumAlpha > 0.97)
      break;

    if (molD > molDist) {
      curStepSize = stepSize - (molD - molDist);
      right = iterator - (molD - molDist) * dir;
      vol = sample3DTextureInclined(right).r;
    } else {
      vec3 left = iterator - step;
      right = CorrectIso(left, iterator, tr0);
      curStepSize = distance(left, right);
      vol = tr0;
    }

    alpha = (1. - r) * curStepSize / stepSize;
    dif = 1.;// CalcColor(right, dir);
    col = GetColSimple(vol);
    vol = sample3DTextureInclined(iterator - 0.5 * curStepSize / stepSize * step).r;
    vec3 colMid = GetColSimple(vol);
    sumColor += (1. - sumAlpha) * (colOld + 4. * colMid + col) * alpha / 6.;
    sumAlpha += (1. - sumAlpha) * alpha;// *(1. - 1.0*dif*dif);

    if (molD > molDist)
      break;
  } // for k
  acc.rgb = 1. * sumColor / sumAlpha;
  acc.a = sumAlpha;
  return acc;
}

vec4 VolRender1(vec3 start, vec3 back, float molDist, vec3 dir) {
  float stepSize = 1.0 / float(STEPS_COUNT);
  float len = length(back - start);
  vec3 step = stepSize * dir;
  vec3 iterator = start;
  float acc = 0.0;

  for (int i = 0; i < STEPS_COUNT; i++) {
    if (float(i) * stepSize > len)
      break;
    iterator = iterator + step;
    if (sample3DTextureInclined(iterator).r > _isoLevel0.x)
      acc += 10. * sample3DTextureInclined(iterator).r / float(STEPS_COUNT);
  }

  return vec4(1.,1.,1., acc);
}

vec4 IsoRender(vec3 start, vec3 back, float molDist, vec3 dir) {
  vec4 tst = GetIso1(start, back, 2., dir, _isoLevel0.x, 0);
  vec4 col = NO_COLOR;

  if (length(tst.xyz - start) < molDist && tst.a > 0.1) {
    float dif =  CalcColor(tst.xyz, dir);
    dif = 0.9 * dif * dif;
    col = vec4(dif, dif, dif, 1);
  }
  return col;
}

vec4 VolRender2(vec3 start, vec3 back, float molDist, vec3 dir) {
  return sample3DTexture(start);
}

void main() {
  vec3 tc = screenSpacePos.xyz / screenSpacePos.w * 0.5 + 0.5;

  if (_flipV > 0.0) {
    tc.y = 1.0 - tc.y;
  }

  vec3 start;
  vec3 back;
  vec3 molBack;
  if (projectionMatrix[0][2] < 0.0) {
    start = texture2D(_FFLeft, tc.xy).xyz;
    back = texture2D(_BFLeft, tc.xy).xyz;
    molBack = texture2D(_WFFLeft, tc.xy).xyz;
  } else {
    start = texture2D(_FFRight, tc.xy).xyz;
    back = texture2D(_BFRight, tc.xy).xyz;
    molBack = texture2D(_WFFRight, tc.xy).xyz;
  }

  vec3 dir = normalize(back - start);

  float molDist = 2.0;
  if (length(molBack) > 0.001) {
    molDist = distance(start, molBack);
  }

  #ifdef ISO_MODE
    gl_FragColor = IsoRender(start, back, molDist, dir);
  #else
    gl_FragColor = VolRender(start, back, molDist, dir);
  #endif
}
