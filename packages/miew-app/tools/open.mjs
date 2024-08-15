import { globSync } from 'glob';
import open from 'open';

const sources = process.argv.slice(2);
sources.forEach((arg) => {
  const files = globSync(arg);
  files.forEach((file) => {
    console.log(file);
    open(file);
  });
});
