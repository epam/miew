const path = require('path');
const express = require('express');
const open = require('open');

function serve(root, port) {
  const url = `http://localhost:${port}/build`;
  console.log('Serving at', url);
  const app = express();
  app.use('/', express.static(root));
  app.listen(port, () => {
    open(url);
  });
}

serve(path.join(__dirname, '..'), 8001);
