import path from 'path';
import express from 'express';
import open from 'open';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function serve(root, port) {
  const url = `http://localhost:${port}/build`;
  console.log('Serving at', url);
  const app = express();
  app.use('/', express.static(root));
  app.listen(port, async () => {
    await open(url).catch(console.error);
  });
}

serve(path.join(__dirname, '..'), 8001);
