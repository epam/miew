/* eslint-env node */

import yargs from 'yargs';
import {spawnSync} from 'child_process';
import packageJson from '../package.json';
import config from './config';

const version = {
  base: packageJson.version,
  date: new Date().toISOString()
    .replace(/[-:]|\..+/gi, '')
    .replace(/T/, '.'),
};

if (config.roServer) {
  version.base += (version.base.indexOf('-') === -1 ? '-' : '.') + 'ro';
}

if (process.env.NODE_ENV === 'production' || yargs.argv.release) {
  version.combined = version.base;
} else {
  version.hash = (function() {
    function stdout(cmd) {
      return cmd.stdout === null ? 'nogit' : String(cmd.stdout).trim();
    }

    var gitLogHash = stdout(spawnSync('git', ['log', '-n1', '--pretty=format:%h']));
    var gitStatus = stdout(spawnSync('git', ['status', '-s']));

    return gitLogHash + (gitLogHash !== 'nogit' && gitStatus ? '-mod' : '');
  })();
  version.combined = version.base + '+' + version.date + '.' + version.hash;
}

version.copyright = packageJson.description + ' v' + version.combined + ' Copyright (c) 2015-' +
  (new Date().getFullYear()) + ' ' + packageJson.author;

if (require.main === module) {
  process.stdout.write(version.copyright);
}

export default version;
