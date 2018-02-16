const glob = require('glob');
const open = require('open');

const sources = process.argv.slice(2);
sources.forEach(function(arg) {
  glob(arg, function(matchError, files) {
    files.forEach(function(file) {
      console.log(file);
      open(file);
    });
  });
});
