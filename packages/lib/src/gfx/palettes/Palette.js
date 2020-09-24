import _ from 'lodash';

function clamp(x, a, b) {
  return x <= b ? x < 0 ? 0 : x : b;
}

function lerpColor(c1, c2, alpha) {
  const beta = 1 - alpha;
  const r1 = (c1 >> 16) & 0xff;
  const g1 = (c1 >> 8) & 0xff;
  const b1 = c1 & 0xff;
  const r2 = (c2 >> 16) & 0xff;
  const g2 = (c2 >> 8) & 0xff;
  const b2 = c2 & 0xff;
  const r = beta * r1 + alpha * r2;
  const g = beta * g1 + alpha * g2;
  const b = beta * b1 + alpha * b2;
  return (r << 16) | (g << 8) | b;
}

class Palette {
  constructor(name, id) {
    this.name = name || 'Custom';
    this.id = id || 'CP';
  }

  getElementColor(name, asIs = false) {
    const color = this.elementColors[name];
    return color === undefined && !asIs ? this.defaultElementColor : color;
  }

  getResidueColor(name, asIs = false) {
    const color = this.residueColors[name];
    return color === undefined && !asIs ? this.defaultResidueColor : color;
  }

  getChainColor(name) {
    let chain = name.charCodeAt(0);
    chain = ((chain < 0 ? 0 : chain >= 256 ? chain - 256 : chain) & 0x1F)
      % this.chainColors.length;
    return this.chainColors[chain];
  }

  getSecondaryColor(type, asIs = false) {
    const color = this.secondaryColors[type];
    return color === undefined && !asIs ? this.defaultSecondaryColor : color;
  }

  getSequentialColor(index) {
    const { colors } = this;
    const len = colors.length;
    return index < 0 ? colors[(index % len) + len] : colors[index % len];
  }

  getGradientColor(value, gradientName) {
    const gradient = this.gradients[gradientName];
    if (!gradient) {
      return this.defaultNamedColor;
    }
    const count = gradient.length;
    const index = value * (count - 1);
    let left = Math.floor(index);
    const right = clamp(left + 1, 0, count - 1);
    left = clamp(left, 0, count - 1);
    return lerpColor(gradient[left], gradient[right], index - left);
  }

  getNamedColor(name, asIs = false) {
    const color = this.namedColors[name];
    return color === undefined && !asIs ? this.defaultNamedColor : color;
  }
}

_.assign(Palette.prototype, {
  colors: [0xFFFFFF, 0xFF0000, 0x00FF00, 0x0000FF, 0x808080],

  minRangeColor: 0x000000,
  midRangeColor: 0x7F7F7F,
  maxRangeColor: 0xFFFFFF,

  defaultElementColor: 0xFFFFFF,
  elementColors: {},

  defaultResidueColor: 0xFFFFFF,
  residueColors: {},

  chainColors: [0xFFFFFF],

  defaultSecondaryColor: 0xFFFFFF,
  secondaryColors: {},

  defaultGradientColor: 0x000000,

  defaultNamedColor: 0xFFFFFF,
  namedColorsArray: [
    /* eslint-disable no-multi-spaces */
    ['indianred',               0xcd5c5c],
    ['lightcoral',              0xf08080],
    ['salmon',                  0xfa8072],
    ['darksalmon',              0xe9967a],
    ['lightsalmon',             0xffa07a],
    ['crimson',                 0xdc143c],
    ['red',                     0xff0000],
    ['firebrick',               0xb22222],
    ['darkred',                 0x8b0000],
    ['pink',                    0xffc0cb],
    ['lightpink',               0xffb6c1],
    ['hotpink',                 0xff69b4],
    ['deeppink',                0xff1493],
    ['mediumvioletred',         0xc71585],
    ['palevioletred',           0xdb7093],
    ['coral',                   0xff7f50],
    ['tomato',                  0xff6347],
    ['orangered',               0xff4500],
    ['darkorange',              0xff8c00],
    ['orange',                  0xffa500],
    ['gold',                    0xffd700],
    ['yellow',                  0xffff00],
    ['lightyellow',             0xffffe0],
    ['lemonchiffon',            0xfffacd],
    ['lightgoldenrodyellow',    0xfafad2],
    ['papayawhip',              0xffefd5],
    ['moccasin',                0xffe4b5],
    ['peachpuff',               0xffdab9],
    ['palegoldenrod',           0xeee8aa],
    ['khaki',                   0xf0e68c],
    ['darkkhaki',               0xbdb76b],
    ['lavender',                0xe6e6fa],
    ['thistle',                 0xd8bfd8],
    ['plum',                    0xdda0dd],
    ['violet',                  0xee82ee],
    ['orchid',                  0xda70d6],
    ['fuchsia',                 0xff00ff],
    ['magenta',                 0xff00ff],
    ['mediumorchid',            0xba55d3],
    ['mediumpurple',            0x9370db],
    ['rebeccapurple',           0x663399],
    ['blueviolet',              0x8a2be2],
    ['darkviolet',              0x9400d3],
    ['darkorchid',              0x9932cc],
    ['darkmagenta',             0x8b008b],
    ['purple',                  0x800080],
    ['indigo',                  0x4b0082],
    ['slateblue',               0x6a5acd],
    ['mediumslateblue',         0x7b68ee],
    ['darkslateblue',           0x483d8b],
    ['greenyellow',             0xadff2f],
    ['chartreuse',              0x7fff00],
    ['lawngreen',               0x7cfc00],
    ['lime',                    0x00ff00],
    ['limegreen',               0x32cd32],
    ['palegreen',               0x98fb98],
    ['lightgreen',              0x90ee90],
    ['mediumspringgreen',       0x00fa9a],
    ['springgreen',             0x00ff7f],
    ['mediumseagreen',          0x3cb371],
    ['seagreen',                0x2e8b57],
    ['forestgreen',             0x228b22],
    ['green',                   0x008000],
    ['darkgreen',               0x006400],
    ['yellowgreen',             0x9acd32],
    ['olivedrab',               0x6b8e23],
    ['olive',                   0x808000],
    ['darkolivegreen',          0x556b2f],
    ['mediumaquamarine',        0x66cdaa],
    ['darkseagreen',            0x8fbc8f],
    ['lightseagreen',           0x20b2aa],
    ['darkcyan',                0x008b8b],
    ['teal',                    0x008080],
    ['aqua',                    0x00ffff],
    ['cyan',                    0x00ffff],
    ['lightcyan',               0xe0ffff],
    ['paleturquoise',           0xafeeee],
    ['aquamarine',              0x7fffd4],
    ['turquoise',               0x40e0d0],
    ['mediumturquoise',         0x48d1cc],
    ['darkturquoise',           0x00ced1],
    ['cadetblue',               0x5f9ea0],
    ['steelblue',               0x4682b4],
    ['lightsteelblue',          0xb0c4de],
    ['powderblue',              0xb0e0e6],
    ['lightblue',               0xadd8e6],
    ['skyblue',                 0x87ceeb],
    ['lightskyblue',            0x87cefa],
    ['deepskyblue',             0x00bfff],
    ['dodgerblue',              0x1e90ff],
    ['cornflowerblue',          0x6495ed],
    ['royalblue',               0x4169e1],
    ['blue',                    0x0000ff],
    ['mediumblue',              0x0000cd],
    ['darkblue',                0x00008b],
    ['navy',                    0x000080],
    ['midnightblue',            0x191970],
    ['cornsilk',                0xfff8dc],
    ['blanchedalmond',          0xffebcd],
    ['bisque',                  0xffe4c4],
    ['navajowhite',             0xffdead],
    ['wheat',                   0xf5deb3],
    ['burlywood',               0xdeb887],
    ['tan',                     0xd2b48c],
    ['rosybrown',               0xbc8f8f],
    ['sandybrown',              0xf4a460],
    ['goldenrod',               0xdaa520],
    ['darkgoldenrod',           0xb8860b],
    ['peru',                    0xcd853f],
    ['chocolate',               0xd2691e],
    ['saddlebrown',             0x8b4513],
    ['sienna',                  0xa0522d],
    ['brown',                   0xa52a2a],
    ['maroon',                  0x800000],
    ['white',                   0xffffff],
    ['snow',                    0xfffafa],
    ['honeydew',                0xf0fff0],
    ['mintcream',               0xf5fffa],
    ['azure',                   0xf0ffff],
    ['aliceblue',               0xf0f8ff],
    ['ghostwhite',              0xf8f8ff],
    ['whitesmoke',              0xf5f5f5],
    ['seashell',                0xfff5ee],
    ['beige',                   0xf5f5dc],
    ['oldlace',                 0xfdf5e6],
    ['floralwhite',             0xfffaf0],
    ['ivory',                   0xfffff0],
    ['antiquewhite',            0xfaebd7],
    ['linen',                   0xfaf0e6],
    ['lavenderblush',           0xfff0f5],
    ['mistyrose',               0xffe4e1],
    ['gainsboro',               0xdcdcdc],
    ['lightgray',               0xd3d3d3],
    ['silver',                  0xc0c0c0],
    ['darkgray',                0xa9a9a9],
    ['gray',                    0x808080],
    ['dimgray',                 0x696969],
    ['lightslategray',          0x778899],
    ['slategray',               0x708090],
    ['darkslategray',           0x2f4f4f],
    ['black',                   0x000000],
    /* eslint-enable no-multi-spaces */
  ],

  namedColors: {},
  /* eslint-enable no-magic-numbers */

  gradients: {
    rainbow: [
      0x0000ff, // blue
      0x00ffff, // cyan
      0x00ff00, // green
      0xffff00, // yellow
      0xff0000, // red
    ],
    temp: [
      0x0000ff, // blue
      0x007fff, // light-blue
      0xffffff, // white
      0xff7f00, // orange
      0xff0000, // red
    ],
    hot: [
      0xffffff, // white
      0xff7f00, // orange
      0xff0000, // red
    ],
    cold: [
      0xffffff, // white
      0x007fff, // light-blue
      0x0000ff, // blue
    ],
    'blue-red': [
      0x0000ff, // blue
      0xffffff, // white
      0xff0000, // red
    ],
    reds: [
      0xffffff, // white
      0xff0000, // red
    ],
    blues: [
      0xffffff, // white
      0x0000ff, // blue
    ],
  },
});

const { namedColorsArray, namedColors } = Palette.prototype;

for (let i = 0, { length } = namedColorsArray; i < length; ++i) {
  const [name, value] = namedColorsArray[i];
  namedColors[name] = value;
}

export default Palette;
