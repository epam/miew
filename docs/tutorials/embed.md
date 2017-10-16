# Embedding the Viewer

Miew is available as a [UMD module] thus being compatible with the
most popular module loading schemes:

  - `<script>` tag defining a global variable `Miew`,
  - [Require.js] AMD module `Miew`,
  - CommonJS module for [Node.js], [Browserify], and [Webpack],
  - ES2015 module for [Rollup].

Please note that Miew does not work under [Node.js] directly since the major viewer requirement
is WebGL rendering. However, you still can install it via [NPM] and `require` it in your
browserify or webpack-based projects.

[UMD module]: https://github.com/umdjs/umd
[Require.js]: http://requirejs.org/
[Node.js]: https://nodejs.org/
[Webpack]: https://webpack.js.org/
[Browserify]: http://browserify.org/
[Rollup]: https://rollupjs.org/
[NPM]: https://www.npmjs.com/

## Browser Globals

_index.html_

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Miew via Global</title>
  
  <link rel="stylesheet" href="Miew.min.css">
  <script src="https://unpkg.com/babel-polyfill@6.26.0/dist/polyfill.min.js"></script>
  <script src="Miew.min.js"></script>
</head>
<body>
  <div class="miew-container" style="width:640px; height:480px"></div>

  <script>
    (function() {
      var viewer = new Miew({
        container: document.getElementsByClassName('miew-container')[0],
        load: '1CRN',
      });

      if (viewer.init()) {
        viewer.run();
      }
    })();
  </script>
</body>
</html>
```

## Require.js Module

_index.html_

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Miew via Require.js</title>

  <link rel="stylesheet" href="Miew.min.css">
  <script src="https://unpkg.com/babel-polyfill@6.26.0/dist/polyfill.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.4/require.min.js"></script>
</head>
<body>
  <div class="miew-container" style="width:640px; height:480px"></div>

  <script>
    require(['Miew.min'], function(Miew) {
      var viewer = new Miew({
        container: document.getElementsByClassName('miew-container')[0],
        load: '1CRN',
      });

      if (viewer.init()) {
        viewer.run();
      }
    });
  </script>
</body>
</html>
```

## Node.js

_index.js_

```js
var Miew = require('miew');
console.log(Miew.VERSION);
```

## Browserify

_index.html_

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Miew via Browserify</title>

  <link rel="stylesheet" href="Miew.min.css">
  <script src="https://unpkg.com/babel-polyfill@6.26.0/dist/polyfill.min.js"></script>
  <script src="bundle.js"></script>
</head>
<body>
  <div class="miew-container" style="width:640px; height:480px"></div>
</body>
</html>
```

_index.js_

```js
var Miew = require('miew');

window.onload = function() {
  var viewer = new Miew({
    container: document.getElementsByClassName('miew-container')[0],
    load: '1CRN',
  });

  if (viewer.init()) {
    viewer.run();
  }
};
```

## Webpack

_index.html_

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Miew via Webpack</title>
  <script src="https://unpkg.com/babel-polyfill@6.26.0/dist/polyfill.min.js"></script>
  <script src="bundle.js"></script>
</head>
<body>
  <div class="miew-container" style="width:640px; height:480px"></div>
</body>
</html>
```

_index.js_

```js
require('Miew.min.css');

var Miew = require('miew');

window.onload = function() {
  var viewer = new Miew({
    container: document.getElementsByClassName('miew-container')[0],
    load: '1CRN',
  });

  if (viewer.init()) {
    viewer.run();
  }
};
```

_webpack.config.js_

```js
module.exports = {
  entry: './index.js',
  output: {
    filename: 'bundle.js'
  },
  module: {
    rules: [{
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    }],
  },
};
```
