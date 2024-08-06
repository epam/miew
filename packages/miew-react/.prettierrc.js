/* eslint-env node */
const os = require('os');

module.exports = {
  printWidth: 100,
  singleQuote: true,
  endOfLine: os.EOL === '\n' ? 'lf' : 'crlf',
};
