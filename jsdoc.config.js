module.exports = {
  source: {
    include: [
      'packages/lib/README.md',
      'packages/lib/src/Miew.js',
      'packages/lib/src/settings.js',
      'packages/lib/src/chem/StructuralElement.js',
      'packages/lib/src/chem/Helix.js',
      'packages/lib/src/chem/Strand.js',
      // 'src/gfx/modes.js',
      // 'src/gfx/modes/Mode.js',
      // 'src/gfx/colorers.js',
      // 'src/gfx/colorers/Colorer.js',
      // 'src/gfx/colorers/ElementColorer.js',
      'packages/lib/src/io/loaders/LoaderList.js',
      'packages/lib/src/io/parsers/ParserList.js',
      'packages/lib/src/utils/EntityList.js',
      'packages/lib/src/utils/EventDispatcher.js',
      'packages/lib/src/utils/logger.js',
      'packages/lib/src/io/parsers/PDBStream.js',
      'packages/lib/src/io/parsers/GROReader.js',
      'packages/lib/src/io/parsers/GROParser.js'
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
