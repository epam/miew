precision highp float;

// edge end finding algorithm parameters
#define FXAA_QUALITY_PS 8
#define FXAA_QUALITY_P0 1.0
#define FXAA_QUALITY_P1 1.5
#define FXAA_QUALITY_P2 2.0
#define FXAA_QUALITY_P3 2.0
#define FXAA_QUALITY_P4 2.0
#define FXAA_QUALITY_P5 2.0
#define FXAA_QUALITY_P6 4.0
#define FXAA_QUALITY_P7 12.0
// constants
float fxaaQualityEdgeThreshold = 0.125;
float fxaaQualityEdgeThresholdMin = 0.0625;
float fxaaQualitySubpix = 0.7; //0.65;
// global params
uniform sampler2D srcTex;
uniform vec2 srcTexelSize;
uniform vec3 bgColor;
// from vs
varying vec2 vUv;
//=====================================================================//
// calc luminance from rgb
//'float FxaaLuma(vec3 rgb) {return rgb.y * (0.587/0.299) + rgb.x; } // Lotte's idea about game luminance
float FxaaLuma(vec3 rgb) {return dot(rgb, vec3(0.299, 0.587, 0.114)); } // real luminance calculation
                                                                           // for non-real scene rendering
// texture sampling by pixel position(coords) and offset(in pixels)
 vec3 FxaaTex(sampler2D tex, vec2 pos, vec2 off,  vec2 res ) {
  #ifdef BG_TRANSPARENT
    vec4 color = texture2D( tex, pos + off * res );
    return mix(color.rgb, bgColor, 1.0 - color.a);
  #else
    return texture2D( tex, pos + off * res ).xyz;
  #endif
}
vec3 FxaaTexTop(sampler2D tex, vec2 pos) {
  #ifdef BG_TRANSPARENT
    vec4 color = texture2D( tex, pos );
    return mix(color.rgb, bgColor, 1.0 - color.a);
  #else
    return texture2D( tex, pos).xyz;
  #endif
}
vec4 FxaaTexTopAlpha(sampler2D tex, vec2 pos) {
  return texture2D( tex, pos);
}

//=====================================================================//
void main() {
  // renaming
  vec2 posM = vUv;
  // get luminance for neighbours
  float lumaS = FxaaLuma(FxaaTex(srcTex, posM, vec2( 0.0, 1.0 ), srcTexelSize));
  float lumaE = FxaaLuma(FxaaTex(srcTex, posM, vec2( 1.0, 0.0 ), srcTexelSize));
  float lumaN = FxaaLuma(FxaaTex(srcTex, posM, vec2( 0.0, -1.0 ), srcTexelSize));
  float lumaW = FxaaLuma(FxaaTex(srcTex, posM, vec2( -1.0, 0.0 ), srcTexelSize));
  float lumaM = FxaaLuma(FxaaTexTop(srcTex, posM));
  // find max and min luminance
  float rangeMax = max(max(lumaN, lumaW), max(lumaE, max(lumaS, lumaM)));
  float rangeMin = min(min(lumaN, lumaW), min(lumaE, min(lumaS, lumaM)));
  // calc maximum non-edge range
  float rangeMaxScaled = rangeMax * fxaaQualityEdgeThreshold;
  float range = rangeMax - rangeMin;
  float rangeMaxClamped = max(fxaaQualityEdgeThresholdMin, rangeMaxScaled);
  // exit when luma contrast is small (is not edge)
  if(range < rangeMaxClamped){
    gl_FragColor = FxaaTexTopAlpha(srcTex, posM);
    return;
  }
  float subpixRcpRange = 1.0/range;
  // note: the sampling coordinates can be calculated in vertex shader but the approach doesn't affect performance
  // visibly, thus we decided to leave calculation here for better readability.
  // calc other neighbours luminance
  float lumaNE = FxaaLuma(FxaaTex(srcTex, posM, vec2(  1.0, -1.0 ), srcTexelSize));
  float lumaSW = FxaaLuma(FxaaTex(srcTex, posM, vec2( -1.0,  1.0 ), srcTexelSize));
  float lumaSE = FxaaLuma(FxaaTex(srcTex, posM, vec2(  1.0,  1.0 ), srcTexelSize));
  float lumaNW = FxaaLuma(FxaaTex(srcTex, posM, vec2( -1.0, -1.0 ), srcTexelSize));
/*--------------span calculation and subpix amount calulation-----------------*/
  float lumaNS = lumaN + lumaS;
  float lumaWE = lumaW + lumaE;
  float subpixNSWE = lumaNS + lumaWE;
  float edgeHorz1 = (-2.0 * lumaM) + lumaNS;
  float edgeVert1 = (-2.0 * lumaM) + lumaWE;
/*--------------------------------------------------------------------------*/
  float lumaNESE = lumaNE + lumaSE;
  float lumaNWNE = lumaNW + lumaNE;
  float edgeHorz2 = (-2.0 * lumaE) + lumaNESE;
  float edgeVert2 = (-2.0 * lumaN) + lumaNWNE;
/*--------------------------------------------------------------------------*/
  float lumaNWSW = lumaNW + lumaSW;
  float lumaSWSE = lumaSW + lumaSE;
  float edgeHorz4 = (abs(edgeHorz1) * 2.0) + abs(edgeHorz2);
  float edgeVert4 = (abs(edgeVert1) * 2.0) + abs(edgeVert2);
  float edgeHorz3 = (-2.0 * lumaW) + lumaNWSW;
  float edgeVert3 = (-2.0 * lumaS) + lumaSWSE;
  float edgeHorz = abs(edgeHorz3) + edgeHorz4;
  float edgeVert = abs(edgeVert3) + edgeVert4;
/*--------------------subpix amount calulation------------------------------*/
  float subpixNWSWNESE = lumaNWSW + lumaNESE;
  float lengthSign = srcTexelSize.x;
  bool horzSpan = edgeHorz >= edgeVert;
   // debug  code edge span visualization
/*'  if (horzSpan)
      gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
  else
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  return;*/
  float subpixA = subpixNSWE * 2.0 + subpixNWSWNESE;
/*--------------------------------------------------------------------------*/
  if(!horzSpan) lumaN = lumaW;
  if(!horzSpan) lumaS = lumaE;
  if(horzSpan) lengthSign = srcTexelSize.y;
  float subpixB = (subpixA * (1.0/12.0)) - lumaM;
/*--------------------------------------------------------------------------*/
  float gradientN = lumaN - lumaM;
  float gradientS = lumaS - lumaM;
  float lumaNN = lumaN + lumaM;
  float lumaSS = lumaS + lumaM;
  bool pairN = abs(gradientN) >= abs(gradientS);
  float gradient = max(abs(gradientN), abs(gradientS));
  if(pairN) lengthSign = -lengthSign;
  float subpixC = clamp(abs(subpixB) * subpixRcpRange, 0.0, 1.0);
/*--------------------------------------------------------------------------*/
  vec2 posB;
  posB = posM;
  vec2 offNP;
  offNP.x = (!horzSpan) ? 0.0 : srcTexelSize.x;
  offNP.y = ( horzSpan) ? 0.0 : srcTexelSize.y;
  if(!horzSpan) posB.x += lengthSign * 0.5;
  if( horzSpan) posB.y += lengthSign * 0.5;
/*--------------------------------------------------------------------------*/
  vec2 posN;
  posN = posB - offNP * FXAA_QUALITY_P0;
  vec2 posP;
  posP = posB + offNP * FXAA_QUALITY_P0;
  float subpixD = ((-2.0)*subpixC) + 3.0;
  float lumaEndN = FxaaLuma(FxaaTexTop(srcTex, posN));
  float subpixE = subpixC * subpixC;
  float lumaEndP = FxaaLuma(FxaaTexTop(srcTex, posP));
/*--------------------------------------------------------------------------*/
  if(!pairN) lumaNN = lumaSS;
  float gradientScaled = gradient * 1.0/4.0;
  float lumaMM = lumaM - lumaNN * 0.5;
  float subpixF = subpixD * subpixE;
  bool lumaMLTZero = lumaMM < 0.0;
/*---------------------looped edge-end search-------------------------------*/
  lumaEndN -= lumaNN * 0.5;
  lumaEndP -= lumaNN * 0.5;
  bool doneN = abs(lumaEndN) >= gradientScaled;
  bool doneP = abs(lumaEndP) >= gradientScaled;
  if(!doneN) posN -= offNP * FXAA_QUALITY_P1;
  bool doneNP = (!doneN) || (!doneP);
  if(!doneP) posP += offNP * FXAA_QUALITY_P1;
/*--------------------------------------------------------------------------*/
  if(doneNP) {
    if(!doneN) lumaEndN = FxaaLuma(FxaaTexTop(srcTex, posN.xy));
    if(!doneP) lumaEndP = FxaaLuma(FxaaTexTop(srcTex, posP.xy));
    if(!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
    if(!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
    doneN = abs(lumaEndN) >= gradientScaled;
    doneP = abs(lumaEndP) >= gradientScaled;
    if(!doneN) posN -= offNP * FXAA_QUALITY_P2;
    doneNP = (!doneN) || (!doneP);
    if(!doneP) posP += offNP * FXAA_QUALITY_P2;
/*--------------------------------------------------------------------------*/
    #if (FXAA_QUALITY_PS > 3)
      if(doneNP) {
        if(!doneN) lumaEndN = FxaaLuma(FxaaTexTop(srcTex, posN.xy));
        if(!doneP) lumaEndP = FxaaLuma(FxaaTexTop(srcTex, posP.xy));
        if(!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
        if(!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
        doneN = abs(lumaEndN) >= gradientScaled;
        doneP = abs(lumaEndP) >= gradientScaled;
        if(!doneN) posN -= offNP * FXAA_QUALITY_P3;
        doneNP = (!doneN) || (!doneP);
        if(!doneP) posP += offNP * FXAA_QUALITY_P3;
/*--------------------------------------------------------------------------*/
        #if (FXAA_QUALITY_PS > 4)
          if(doneNP) {
            if(!doneN) lumaEndN = FxaaLuma(FxaaTexTop(srcTex, posN.xy));
            if(!doneP) lumaEndP = FxaaLuma(FxaaTexTop(srcTex, posP.xy));
            if(!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
            if(!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
            doneN = abs(lumaEndN) >= gradientScaled;
            doneP = abs(lumaEndP) >= gradientScaled;
            if(!doneN) posN -= offNP * FXAA_QUALITY_P4;
            doneNP = (!doneN) || (!doneP);
            if(!doneP) posP += offNP * FXAA_QUALITY_P4;
/*--------------------------------------------------------------------------*/
            #if (FXAA_QUALITY_PS > 5)
               if(doneNP) {
                 if(!doneN) lumaEndN = FxaaLuma(FxaaTexTop(srcTex, posN.xy));
                 if(!doneP) lumaEndP = FxaaLuma(FxaaTexTop(srcTex, posP.xy));
                 if(!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
                 if(!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
                 doneN = abs(lumaEndN) >= gradientScaled;
                 doneP = abs(lumaEndP) >= gradientScaled;
                 if(!doneN) posN -= offNP * FXAA_QUALITY_P5;
                 doneNP = (!doneN) || (!doneP);
                 if(!doneP) posP += offNP * FXAA_QUALITY_P5;
/*--------------------------------------------------------------------------*/
                 #if (FXAA_QUALITY_PS > 6)
                   if(doneNP) {
                     if(!doneN) lumaEndN = FxaaLuma(FxaaTexTop(srcTex, posN.xy));
                     if(!doneP) lumaEndP = FxaaLuma(FxaaTexTop(srcTex, posP.xy));
                     if(!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
                     if(!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
                     doneN = abs(lumaEndN) >= gradientScaled;
                     doneP = abs(lumaEndP) >= gradientScaled;
                     if(!doneN) posN -= offNP * FXAA_QUALITY_P6;
                     doneNP = (!doneN) || (!doneP);
                     if(!doneP) posP += offNP * FXAA_QUALITY_P6;
/*--------------------------------------------------------------------------*/
                     #if (FXAA_QUALITY_PS > 7)
                       if(doneNP) {
                         if(!doneN) lumaEndN = FxaaLuma(FxaaTexTop(srcTex, posN.xy));
                         if(!doneP) lumaEndP = FxaaLuma(FxaaTexTop(srcTex, posP.xy));
                         if(!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
                         if(!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
                         doneN = abs(lumaEndN) >= gradientScaled;
                         doneP = abs(lumaEndP) >= gradientScaled;
                         if(!doneN) posN -= offNP * FXAA_QUALITY_P7;
                         doneNP = (!doneN) || (!doneP);
                         if(!doneP) posP += offNP * FXAA_QUALITY_P7;
/*--------------------------------------------------------------------------*/
                       }
                     #endif
                   }
                 #endif
               }
             #endif
           }
         #endif
      }
    #endif
  }
/*----------------calculate subpix offset due to edge ends-------------------*/
  float dstN = posM.x - posN.x;
  float dstP = posP.x - posM.x;
  if(!horzSpan) dstN = posM.y - posN.y;
  if(!horzSpan) dstP = posP.y - posM.y;
/*--------------------------------------------------------------------------*/
  bool goodSpanN = (lumaEndN < 0.0) != lumaMLTZero;
  float spanLength = (dstP + dstN);
  bool goodSpanP = (lumaEndP < 0.0) != lumaMLTZero;
  float spanLengthRcp = 1.0 / spanLength;
/*--------------------------------------------------------------------------*/
  bool directionN = dstN < dstP;
  float dst = min(dstN, dstP);
  bool goodSpan = directionN ? goodSpanN : goodSpanP;
  float subpixG = subpixF * subpixF;
  float pixelOffset = (dst * (-spanLengthRcp)) + 0.5;
  float subpixH = subpixG * fxaaQualitySubpix;
/*-----------------calc texture offest using subpix-------------------------*/
  float pixelOffsetGood = goodSpan ? pixelOffset : 0.0;
  float pixelOffsetSubpix = max(pixelOffsetGood, subpixH);

  float offset = pixelOffsetSubpix * lengthSign;
  #ifdef BG_TRANSPARENT
    // get original texel
    vec4 rgbaA = FxaaTexTopAlpha(srcTex, posM);
    // calc step to blended texel
    vec2 step = sign((!horzSpan) ? vec2 (offset, 0.0) : vec2 (0.0, offset));
    // get neighboring texel
    vec4 rgbaB = FxaaTexTopAlpha(srcTex, posM + step * srcTexelSize);
    //  calc blend factor from offset
    float f = (!horzSpan) ? offset / srcTexelSize.x : offset / srcTexelSize.y;
    f = abs(f);
    // calc alpha (special formula to emulate blending with bg)
    gl_FragColor.a = 1.0 - mix(1.0 - rgbaA.a, 1.0 - rgbaB.a, f);
    // calc color (special formula to emulate blending with bg)
    gl_FragColor.rgb = mix(rgbaA.rgb * rgbaA.a, rgbaB.rgb * rgbaB.a, f) / gl_FragColor.a;
  #else
    if(!horzSpan) {
       posM.x += offset;
    } else {
       posM.y += offset;
    }
    gl_FragColor = FxaaTexTopAlpha(srcTex, posM);
  #endif
  return;
}
