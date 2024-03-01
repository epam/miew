const fs = require('fs');
const os = require('os');
const jison = require('jison');
const glob = require('glob').globSync;

function endsWith(str, sub) {
  return str.substr(-sub.length) === sub;
}

function replaceNewlines(text) {
  text = text.replace(/\r\n?|\n/g, os.EOL);
  if (!endsWith(text, os.EOL)) {
    text += os.EOL;
  }
  return text;
}

function wrapModule(text) {
  return [
    '/* eslint-disable */',
    '// DO NOT EDIT! Automatically generated from .jison',
    text,
    'module.exports = {parser: parser};',
    '',
  ].join(os.EOL);
}

function convertFile(src, dst) {
  fs.readFile(src, { encoding: 'utf8' }, (readError, grammar) => {
    if (readError) {
      throw readError;
    }
    const generator = new jison.Generator(grammar, {
      moduleType: 'js',
      'token-stack': true, // workaround for https://github.com/zaach/jison/issues/351
    });
    let parserSource = generator.generate();

    parserSource = replaceNewlines(parserSource);
    parserSource = wrapModule(parserSource);

    fs.writeFile(dst, parserSource, (writeError) => {
      if (writeError) {
        throw writeError;
      }
    });
  });
}

const sources = process.argv.slice(2);
sources.forEach((arg) => {
  const filenames = glob(arg);
  filenames.forEach((src) => {
    const dst = `${src.replace(/\.jison$/i, '')}.js`;
    console.log(src);
    convertFile(src, dst);
  });
});
