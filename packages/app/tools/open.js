const glob = require('glob');
const open = require('open');

const sources = process.argv.slice(2);
sources.forEach((arg) => {
  glob(arg, (matchError, files) => {
    files.forEach((file) => {
      console.log(file);
      open(file);
    });
  });
});
