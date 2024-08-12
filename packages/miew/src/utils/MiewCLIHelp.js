import palettes from '../gfx/palettes';
import settings from '../settings';

const modeIdDesc = {
  $help: [
    'Rendering mode shortcut',
    '    BS - balls and sticks mode',
    '    LN - lines mode',
    '    LC - licorice mode',
    '    VW - van der waals mode',
    '    TR - trace mode',
    '    TU - tube mode',
    '    CA - cartoon mode',
    '    SA - isosurface mode',
    '    QS - quick surface mode',
    '    SE - solvent excluded mode',
    '    TX - text mode',
  ],
  BS: {
    $help: [
      '   Balls and sticks',
      '      aromrad = <number> #aromatic radius',
      '      atom = <number>    #atom radius',
      '      bond = <number>    #bond radius',
      '      multibond = <bool> #use multibond',
      '      showarom = <bool>  #show aromatic',
      '      space = <number>   #space value\n',
    ],
  },
  CA: {
    $help: [
      '   Cartoon',
      '      arrow = <number>   #arrow size',
      '      depth = <number>   #depth of surface',
      '      heightSegmentsRatio = <number>',
      '      radius = <number>  #tube radius',
      '      tension = <number> #',
      '      width = <number>  #secondary width\n',
    ],
  },
  LN: {
    $help: [
      '   Lines',
      '      atom = <number>    #atom radius',
      '      chunkarom = <number>',
      '      multibond = <bool> #use multibond',
      '      showarom = <bool>  #show aromatic',
      '      offsarom = <number>\n',
    ],
  },
  LC: {
    $help: [
      '   Licorice',
      '      aromrad = <number> #aromatic radius',
      '      bond = <number>    #bond radius',
      '      multibond = <bool> #use multibond',
      '      showarom = <bool>  #show aromatic',
      '      space = <number>   #space value\n',
    ],
  },
  VW: {
    $help: [
      '   Van der Waals',
      '      nothing\n',
    ],
  },
  TR: {
    $help: [
      '   Trace',
      '      radius = <number>  #tube radius\n',
    ],
  },
  TU: {
    $help: [
      '   Tube',
      '      heightSegmentsRatio = <number>',
      '      radius = <number>  #tube radius',
      '      tension = <number> \n',
    ],
  },
  SA: {
    $help: [
      '   Surface',
      '      zClip = <bool> #clip z plane\n',
    ],
  },
  QS: {
    $help: [
      '   Quick surface',
      '      isoValue = <number>',
      '      scale = <number>',
      '      wireframe = <bool>',
      '      zClip = <bool> #clip z plane\n',
    ],
  },
  SE: {
    $help: [
      '   Solvent excluded surface',
      '      zClip = <bool> #clip z plane\n',
    ],
  },
  TX: {
    $help: [
      '   Text mode',
      '      template = <format string> string that can include "{{ id }}"',
      '          it will be replaced by value, id can be one of next:',
      '          serial, name, type, sequence, residue, chain, hetatm, water\n',
      '      horizontalAlign = <string> {"left", "right", "center"}',
      '      verticalAlign = <string> {"top", "bottom", "middle"}',
      '      dx = <number> #offset along x',
      '      dy = <number> #offset along y',
      '      dz = <number> #offset along z',
      '      fg = <string> #text color modificator',
      '           could be keyword, named color or hex',
      '      fg = <string> #back color modificator',
      '           could be keyword, named color or hex',
      '      showBg = <bool> #if set show background',
      '           plate under text',
    ],
  },
};

const colorDesc = {
  $help: [
    'Coloring mode shortcut',
    '    EL - color by element',
    '    CH - color by chain',
    '    SQ - color by sequence',
    '    RT - color by residue type',
    '    SS - color by secondary structure',
    '    UN - uniform',
  ],
  UN: {
    $help: [
      'Parameters of coloring modes customization',
      '   Uniform',
      '      color = <number|color> #RGB->HEX->dec\n',
    ],
    color: {
      $help: Object.keys(palettes.get(settings.now.palette).namedColors).sort().join('\n'),
    },
  },
};

const materialDesc = {
  $help: [
    'Material shortcut',
    '    DF - diffuse',
    '    TR - transparent',
    '    SF - soft plastic',
    '    PL - glossy plastic',
    '    ME - metal',
    '    GL - glass',
  ],
};

const addRepDesc = {
  $help: [
    'Short (packed) representation description as a set of variables',
    '    s=<EXPRESSION>',
    '        selector property',
    '    m=<MODE_ID>[!<PARAMETER>:<VALUE>[,...]]',
    '        render mode property',
    '    c=<COLORER_ID>[!<PARAMETER>:<VALUE>[,...]]',
    '        color mode property',
    '    mt=<MATERIAL_ID>',
    '        material property',
  ],
  s: {
    $help: 'Selection expression string as it is in menu->representations->selection',
  },
  m: modeIdDesc,
  c: colorDesc,
  mt: materialDesc,
};

const setGetParameterDesc = {
  $help: [
    'Parameters of rendering modes customization: modes',
    'Parameters of colorer customization: colorers',
    'Autobuild: autobuild = (<number>|<bool>)',
  ],
  modes: modeIdDesc,
  colorers: colorDesc,
};

const help = {
  $help: [
    'help (<cmd name>| <path to property>)',
    'You can get detailed information about command options',
    '   using "help cmd.opt.opt.[...]"\n',
    '   you can use one line comments',
    '   everything started from (#|//) will be skipped',
    '   Example: >build //some comment\n',
    'List of available commands:',
  ],
  reset: {
    $help: [
      'Reload current object, delete all representations',
      '    Nothing will work until load new object',
    ],
  },
  load: {
    $help: [
      'load (<PDBID>|<URL>|-f [<*.NC FILE URL STRING>])',
      '    Load new pdb object from selected source',
    ],
    PDBID: {
      $help: 'pdb id in remote molecule database',
    },
    URL: {
      $help: 'url to source file',
    },
    f: {
      $help: [
        'open file system dialog to fetch local file',
        'optionally you can determine trajectory file',
        'via URL for *.top model',
      ],
    },
  },
  clear: {
    $help: 'No args. Clear terminal',
  },
  add: {
    $help: [
      'add [<REP_NAME>] [<DESCRIPTION>]',
      '    Add new item to representation set with',
      '    default or <DESCRIPTION> params',
    ],
    REP_NAME: {
      $help: 'Identifier string [_,a-z,A-Z,0-9] can not start from digit',
    },
    DESCRIPTION: addRepDesc,
  },
  rep: {
    $help: [
      'rep [<REP_NAME>|<REP_INDEX>] [<DESCRIPTION>]',
      '    set current representation by name or index',
      '    edit current representation by <DESCRIPTION>',
    ],
    REP_NAME: {
      $help: [
        'Identifier string [_,a-z,A-Z,0-9] can not start from digit',
        'Must be declared before',
      ],
    },
    REP_INDEX: {
      $help: 'Index of available representation',
    },
    DESCRIPTION: addRepDesc,
  },
  remove: {
    $help: [
      'remove (<REP_NAME>|<REP_INDEX>)',
      'Remove representation by name or index',
    ],
    REP_NAME: {
      $help: [
        'Identifier string [_,a-z,A-Z,0-9] can not start from digit',
        'Must be declared before',
      ],
    },
    REP_INDEX: {
      $help: 'Index of available representation',
    },
  },
  selector: {
    $help: [
      'selector <EXPRESSION>',
      '   set selector from EXPRESSION to current representation',
    ],
    EXPRESSION: {
      $help: 'Selection expression string as it is in menu->representations->selection',
    },
  },
  mode: {
    $help: [
      'mode <MODE_ID> [<PARAMETER>=<VALUE>...]',
      '   set rendering mode and apply parameters to current representation',
    ],
    MODE_ID: modeIdDesc,
  },
  color: {
    $help: [
      'color <COLORER_ID> [<PARAMETER>=<VALUE>...]',
      '   set colorer and apply parameters to current representation',
    ],
    COLORER_ID: colorDesc,
  },
  material: {
    $help: [
      'material <MATERIAL_ID>',
      '   set material to current representation',
    ],
    MATERIAL_ID: materialDesc,
  },
  build: {
    $help: 'build help str',
    add: {
      $help: 'build.add',
      new: {
        $help: [
          'add.new',
          'add.new new line 1',
          'add.new new line 2',
          'add.new new line 3',
        ],
      },
    },
    del: {
      $help: 'build.del',
    },
  },
  list: {
    $help: [
      'list [-e|-s|<REP_NAME>|<REP_INDEX>]',
      'Print representations if no args print list of representations',
      '    -e expand list and show all representations',
      '    -s show all user-registered selectors',
      '    <REP_NAME>|<REP_INDEX> show only current representation',
    ],
  },
  hide: {
    $help: [
      'hide (<REP_NAME>|<REP_INDEX>)',
      'Hide representation referenced in args',
    ],
  },
  show: {
    $help: [
      'show (<REP_NAME>|<REP_INDEX>)',
      'Show representation referenced in args',
    ],
  },
  get: {
    $help: [
      'get <PARAMETER>',
      'Print <PARAMETER> value',
      '    <PARAMETER> - path to option use get.PARAMETER to get more info',
    ],
    PARAMETER: setGetParameterDesc,
  },
  set: {
    $help: [
      'set <PARAMETER> <VALUE>',
      'Set <PARAMETER> with <VALUE>',
      '    <PARAMETER> - path to option use set.PARAMETER to get more info',
    ],
    PARAMETER: setGetParameterDesc,
  },
  set_save: {
    $help: [
      'set_save',
      'Save current settings to cookie',
    ],
  },
  set_restore: {
    $help: [
      'set_restore',
      'Load and apply settings from cookie',
    ],
  },
  set_reset: {
    $help: [
      'set_reset',
      'Reset current settings to the defaults',
    ],
  },
  preset: {
    $help: [
      'preset [<PRESET>]',
      'Reset current representation or set preset to <PRESET>',
    ],
    PRESET: {
      $help: [
        'default',
        'wire',
        'small',
        'macro',
      ],
    },
  },
  unit: {
    $help: [
      'unit [<unit_id>]',
      'Change current biological structure view. Zero <unit_id> value means asymmetric unit,',
      'positive values set an assembly with corresponding number.',
      'Being called with no parameters command prints current unit information.',
    ],
  },
  view: {
    $help: [
      'view [<ENCODED_VIEW>]',
      'Get current encoded view or set if ENCODED_VIEW placed as argument',
    ],
    ENCODED_VIEW: {
      $help: [
        'encoded view matrix string (binary code)',
      ],
    },
  },
  rotate: {
    $help: [
      'rotate (x|y|z) [<DEGREES>] [(x|y|z) [<DEGREES>]]...',
      'Rotate scene',
    ],
  },
  scale: {
    $help: [
      'scale <SCALE>',
      'Scale scene',
    ],
  },
  select: {
    $help: [
      'select <SELECTOR_STRING> [as <SELECTOR_NAME>]',
      'Select atoms using selector defined in SELECTOR_STRING',
      '    and if SELECTOR_NAME is defined register it in viewer',
      '    you can use it later as a complex selector',
    ],
  },
  within: {
    $help: [
      'within <DISTANCE> of <SELECTOR_STRING> as <SELECTOR_NAME>',
      'Build within named selector',
      '    DISTANCE        <number>',
      '    SELECTOR_STRING <string(selection language)>',
      '    SELECTOR_NAME   <identifier>',
    ],
  },
  url: {
    $help: [
      'url [-s] [-v]',
      'Report URL encoded scene',
      '    if -s set that include settings in the URL',
      '    if -v set that include view in the URL',
    ],
  },
  screenshot: {
    $help: [
      'screenshot [<WIDTH> [<HEIGHT>]]',
      'Make a screenshot of the scene',
      '    WIDTH  <number> in pixels',
      '    HEIGHT <number> in pixels, equal to WIDTH by default',
    ],
  },
  line: {
    $help: [
      'line <first_atom_path> <second_atom_path> [<PARAMETER>=<VALUE>]',
      'Draw dashed line between two specified atoms',
    ],
  },
  removeobj: {
    $help: [
      'removeobj <id>',
      'Remove scene object by its index. Indices could be obtained by <listobj> command',
    ],
  },
  listobj: {
    $help: [
      'listobj',
      'Display the list of all existing scene objects',
    ],
  },
};

export default help;
