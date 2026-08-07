const { addHook } = require('pirates');

addHook(
  (code) => `module.exports = ${JSON.stringify(code)};`,
  { exts: ['.vert', '.frag'] },
);

const babelRegisterModule = require('@babel/register');

const babelRegister = babelRegisterModule.default || babelRegisterModule;

babelRegister({
  rootMode: 'upward',
});
