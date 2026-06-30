const { addHook } = require('pirates');

addHook(
  (code) => `module.exports = ${JSON.stringify(code)};`,
  { exts: ['.vert', '.frag'] },
);

require('@babel/register')({
  rootMode: 'upward',
});
