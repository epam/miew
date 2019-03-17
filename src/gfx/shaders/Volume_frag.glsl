uniform mat4 projectionMatrix;

// 3D volume texture
uniform vec3 volumeDim;    // volume dimensions, pixels
uniform sampler2D tileTex; // tiled texture containing all Z-slices of a 3D data
uniform vec2 tileTexSize;  // size of tiled texture, pixels
uniform vec2 tileStride;   // UV stride between slices in tile tex, pixels

uniform vec3 boxSize;
uniform vec3 boxAngles;
uniform float deltaXZ;
uniform float deltaXY;
uniform float deltaYZ;

uniform vec3 _isoLevel0;
uniform float _flipV;
uniform sampler2D _BFLeft;
uniform sampler2D _BFRight;
uniform sampler2D _FFLeft;
uniform sampler2D _FFRight;
uniform sampler2D _WFFLeft;
uniform sampler2D _WFFRight;

varying vec4 screenSpacePos;

const float PI = 3.1415926535898;

vec4 sample3DTexture(vec3 texCoord)
{
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

vec4 boxToTextCoord(vec3 boxCoord) {
  /***************** YOZ *********************/
  float currDeltaYZ = (1. - boxCoord.z) * deltaYZ;
  if (PI / 2. - boxAngles.x > 0.) {
    currDeltaYZ = boxCoord.z * deltaYZ;
  }
  if (currDeltaYZ > boxCoord.y  || boxCoord.y > 1. - deltaYZ + currDeltaYZ)
    return vec4(0., 0., 0., 0);
  boxCoord.y = (boxCoord.y   - currDeltaYZ) / (1. - deltaYZ);

  /***************** XOZ *********************/
  float currDeltaXZ = (1. - boxCoord.z) * deltaXZ;
  if (PI / 2. - boxAngles.y > 0.) {
    currDeltaXZ = boxCoord.z * deltaXZ;
  }
  if (currDeltaXZ > boxCoord.x  || boxCoord.x > 1. - deltaXZ + currDeltaXZ)
       return vec4(0., 0., 0., 0);

  /***************** XOY *********************/
  float currDeltaXY = (1. - boxCoord.y) * deltaXY;
  if (PI / 2. - boxAngles.z > 0.) {
    currDeltaXY = boxCoord.y * deltaXY;
  }
  if (currDeltaXY + currDeltaXZ > boxCoord.x  || boxCoord.x > 1. - deltaXY + currDeltaXY - deltaXZ + currDeltaXZ)
       return vec4(0., 0., 0., 0);
  boxCoord.x = (boxCoord.x   - currDeltaXY - currDeltaXZ) / (1. - deltaXY - deltaXZ);

  return sample3DTexture(boxCoord);
}

float CalcColor(vec3 iter, vec3 dir)
{
  float d = 1.0 / 128.0;
  vec3 dx = vec3(d, 0.0, 0.0);
  vec3 dy = vec3(0.0, d, 0.0);
  vec3 dz = vec3(0.0, 0.0, d);
  vec3 N;
  N.x = boxToTextCoord(iter + dx).r - boxToTextCoord(iter - dx).r;
  N.y = boxToTextCoord(iter + dy).r - boxToTextCoord(iter - dy).r;
  N.z = boxToTextCoord(iter + dz).r - boxToTextCoord(iter - dz).r;
  N = normalize(N);
  float dif = max(0.0, dot(N,dir));
  return dif;
}

vec3 AccuracyIso(vec3 left, vec3 right, float volLeft, float threshold)
{
  for (int i = 0; i < 5; i++)
  {
    vec3 iterator = 0.5*(left + right);
    float vol = boxToTextCoord(iterator).r;
    if ((volLeft - threshold)*(vol - threshold) < 0.)
      right = iterator;
    else
      left = iterator;
  }
  return 0.5 * (left + right);
}

vec4 GetIso1(vec3 start, vec3 back, float molDist, vec3 dir, float tr, int count)
{
  float vol, stepSize = (0.5*float(count) + 1.) / 85.;
  //    		float vol, stepSize = (0.5*count + 1.) / 64.;// 128.;
  vec3 step = stepSize*dir, iterator = start, left, right;
  vec4 acc = vec4(0., 0., 0., 0.);
    for (int i=0; i < 200; i++)
    {
      iterator = iterator + step;
      vol = boxToTextCoord(iterator).r;
      if (length(iterator - back) < stepSize || vol > tr)
        break;
    }
    if (vol > tr)
    {
      left = iterator - step;
      right = iterator;
      for (int j = 0; j < 5; j++)
      {
        iterator = 0.5 * (left + right);
        float vol = boxToTextCoord(iterator).r;
        if (vol > tr)
          right = iterator;
        else
          left = iterator;
      }
      acc = vec4(0.5*(left + right), 1.);
    }

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

vec3 GetColSimple(float vol)
{
  float t = easeOut(_isoLevel0.x, _isoLevel0.y, vol);
  float s = easeIn(_isoLevel0.y, _isoLevel0.z, vol);
  return vec3(0.5, 0.6, 0.7) * (1.0 - t) + 2.0 * vec3(s, 0, 0);
}

vec3 CorrectIso(vec3 left, vec3 right, float tr)
{
  for (int j = 0; j < 5; j++)
  {
    vec3 iterator = 0.5*(left + right);
    float vol = boxToTextCoord(iterator).r;
    if (vol < tr)
      right = iterator;
    else
      left = iterator;
  }
  return 0.5*(left + right);
}

vec4 VolRender(vec3 start, vec3 back, float molDist, vec3 dir)
{
  vec4 acc = vec4(0., 0., 0., 0.), iso;
  vec3 iterator = start, sumColor = vec3(0., 0., 0.);
  //				float stepSize = 1. / 110., alpha, sumAlpha = 0, vol, curStepSize = stepSize, molD;
  float stepSize = 1. / 170., alpha, sumAlpha = 0.0, vol, curStepSize = stepSize, molD;
  vec3 step = stepSize*dir, col, colOld, right;
  float tr0 = _isoLevel0.x;
  float dif, r, kd, finish;
  int count = 0, stopMol = 0;
  kd = 140. * tr0 * stepSize;
  r = 1. - kd;

  for (int k = 0; k < 3; k++)
  {
    stepSize = (0.5 * float(k) + 1.) / 85.;
    kd = 140. * tr0 * stepSize;
    r = 1. - kd;
    step = stepSize * dir;
    iso = GetIso1(iterator, back, molDist, dir, tr0, k);
    if (iso.a < 0.1 || length(iso.rgb - start) > molDist)
      break;
    iterator = iso.rgb;
    dif = 1.;// CalcColor(iterator, dir);
    colOld = GetColSimple(tr0);
    curStepSize = stepSize;
    for (int i = 0; i < 200; i++)
    {
      iterator = iterator + step;
      molD = length(iterator - start);
      vol = boxToTextCoord(iterator).r;
      finish = distance(iterator, back) - stepSize;
      if (finish < 0.0 || vol < tr0 || (sumAlpha > 0.97) || molD > molDist)
        break;
      alpha = (1. - r);
      col = GetColSimple(vol);
      vol = boxToTextCoord(iterator - 0.5*step).r;
      vec3 colMid = GetColSimple(vol);
      sumColor += (1. - sumAlpha)*(colOld + 4.*colMid + col)*alpha / 6.;
      sumAlpha += (1. - sumAlpha)*alpha;// *(1. - 1.0*dif*dif);
      colOld = col;
    } // for i
    if (finish < 0.0 || sumAlpha > 0.97)
      break;
    if (molD > molDist)
    {
      curStepSize = stepSize - (molD - molDist);
      right = iterator - (molD - molDist)*dir;
      vol = boxToTextCoord(right).r;
    }
    else
    {
      vec3 left = iterator - step;
      right = CorrectIso(left, iterator, tr0);
      curStepSize = distance(left, right);
      vol = tr0;
    }
    alpha = (1. - r)*curStepSize / stepSize;
    dif = 1.;// CalcColor(right, dir);
    col = GetColSimple(vol);
    vol = boxToTextCoord(iterator - 0.5 * curStepSize / stepSize * step).r;
    vec3 colMid = GetColSimple(vol);
    sumColor += (1. - sumAlpha) * (colOld + 4. * colMid + col) * alpha / 6.;
    sumAlpha += (1. - sumAlpha) * alpha;// *(1. - 1.0*dif*dif);
    if (molD > molDist)
      break;
  } // for k
  acc.rgb = 1.*sumColor / sumAlpha;
  acc.a = sumAlpha;
  return acc;
}

vec4 VolRender1(vec3 start, vec3 back, float molDist, vec3 dir)
{
  float stepSize = 1.0 / 200.0;
  float len = length(back - start);
  vec3 step = stepSize * dir;
  vec3 iterator = start;
  float acc = 0.0;

  for (int i=0; i < 200; i++)
  {
    if (float(i) * stepSize > len) break;
    iterator = iterator + step;
    if (boxToTextCoord(iterator).r > _isoLevel0.x)
      acc += boxToTextCoord(iterator).r / 200.0;
  }

  return vec4(1,1,1, acc);
}

vec4 VolRender2(vec3 start, vec3 back, float molDist, vec3 dir)
{
  vec4 tst = GetIso1(start, back, 2., dir, 0.28, 0);
  vec4 col = vec4(0, 0., 0., 0.);
  if (tst.a > 0.1)
  {
   float dif = CalcColor(tst.rgb, dir);
   col = vec4(dif, 0., 0., 1.);
  }
  return col;
}

vec4 VolRender3(vec3 start, vec3 back, float molDist, vec3 dir)
{
  return boxToTextCoord(start);
}

void main()
{
  vec3 tc = screenSpacePos.xyz / screenSpacePos.w * 0.5 + 0.5;

  if (_flipV > 0.0) {
    tc.y = 1.0 - tc.y;
  }

  vec3 start;
  vec3 back;
  vec3 molBack;
  if (projectionMatrix[0][2] < 0.0)
  {
    start = texture2D(_FFLeft, tc.xy).xyz;
    back = texture2D(_BFLeft, tc.xy).xyz;
    molBack = texture2D(_WFFLeft, tc.xy).xyz;
  }
  else
  {
    start = texture2D(_FFRight, tc.xy).xyz;
    back = texture2D(_BFRight, tc.xy).xyz;
    molBack = texture2D(_WFFRight, tc.xy).xyz;
  }

  vec3 dir = normalize(back - start);

  float molDist = 2.0;
  if (length(molBack) > 0.001)
  {
    molDist = distance(start, molBack);
  }

  //gl_FragColor = texture2D(_WFFLeft, tc.xy);
  //gl_FragColor = texture2D(tileTex, tc.xy);
  gl_FragColor = VolRender(start, back, molDist, dir);
}
