const fs = require('fs');
const { addHook } = require('pirates');

addHook(
  (code, filename) => {
    const content = fs.readFileSync(filename, 'utf8');
    return `module.exports = ${JSON.stringify(content)};`;
  },
  { exts: ['.vert', '.frag'] },
);

require('@babel/register')({
  rootMode: 'upward',
});
