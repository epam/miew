module.exports = {
  source: {
    include: [
      'packages/miew/README.md',
      'packages/miew/src/Miew.js',
      'packages/miew/src/settings.js',
      'packages/miew/src/chem/StructuralElement.js',
      'packages/miew/src/chem/Helix.js',
      'packages/miew/src/chem/Strand.js',
      // 'src/gfx/modes.js',
      // 'src/gfx/modes/Mode.js',
      // 'src/gfx/colorers.js',
      // 'src/gfx/colorers/Colorer.js',
      // 'src/gfx/colorers/ElementColorer.js',
      'packages/miew/src/io/loaders/LoaderList.js',
      'packages/miew/src/io/parsers/ParserList.js',
      'packages/miew/src/utils/EntityList.js',
      'packages/miew/src/utils/EventDispatcher.js',
      'packages/miew/src/utils/logger.js',
      'packages/miew/src/io/parsers/PDBStream.js',
      'packages/miew/src/io/parsers/GROReader.js',
      'packages/miew/src/io/parsers/GROParser.js'
    ]
  },
  opts: {
    template: 'tools/templates//template',
    tutorials: 'tools/templates//tutorials',
    destination: 'documentation/',
    private: false
  },
  templates: {
    cleverLinks: true,
    monospaceLinks: false,
    default: {
      outputSourceFiles: false,
      outputSourcePath: false,
      staticFiles: {
        include: [
          'tools/templates/template/README.png',
          'node_modules/jsdoc/templates/default/static',
          'tools/templates//template/static'
        ]
      }
    }
  },
  plugins: ['plugins/underscore', 'plugins/markdown']
}
