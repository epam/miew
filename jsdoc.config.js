module.exports = {
  source: {
    include: [
      'README.md',
      'src/Miew.js',
      'src/settings.js',
      // 'src/gfx/modes.js',
      // 'src/gfx/modes/Mode.js',
      // 'src/gfx/colorers.js',
      // 'src/gfx/colorers/Colorer.js',
      // 'src/gfx/colorers/ElementColorer.js',
      'src/utils/EventDispatcher.js',
      'src/utils/logger.js',
    ],
  },
  opts: {
    template: 'docs/template',
    tutorials: 'docs/tutorials',
    destination: 'build/docs',
    private: false,
  },
  templates: {
    cleverLinks: false,
    monospaceLinks: false,
    default: {
      outputSourceFiles: false,
      outputSourcePath: false,
      staticFiles: {
        include: [
          'README.png',
          'node_modules/jsdoc/templates/default/static',
          'docs/template/static',
        ],
      },
    },
  },
  plugins: [
    'plugins/underscore',
    'plugins/markdown',
  ],
};
