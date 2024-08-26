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
  
  <link rel="stylesheet" href="https://unpkg.com/miew@0.11.0/dist/Miew.min.css">
  <script src="https://unpkg.com/@babel/polyfill@7/dist/polyfill.min.js"></script>
  <script src="https://unpkg.com/lodash@^4.17.21/lodash.js"></script>
  <script src="https://unpkg.com/three@0.153.0/build/three.min.js"></script>
  <script src="https://unpkg.com/miew@0.11.0/dist/Miew.min.js"></script>
</head>
<body>
  <h1>Use Miew via browser globals</h1>
  <div class="miew-container" style="width:640px; height:480px"></div>

  <script>
    (function() {
      var viewer = new Miew({ load: '1CRN' });
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

  <link rel="stylesheet" href="https://unpkg.com/miew@0.11.0/dist/Miew.min.css">
  <script src="https://unpkg.com/@babel/polyfill@7/dist/polyfill.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.4/require.min.js"></script>
</head>
<body>
  <h1>Use Miew via Require.js</h1>
  <div class="miew-container" style="width:640px; height:480px"></div>

  <script>
    require.config({
      paths: {
        'lodash': 'https://unpkg.com/lodash@^4.17.21/lodash',
        'three': 'https://unpkg.com/three@0.153.0/build/three.min',
      }
    });
    require(['https://unpkg.com/miew@0.11.0/dist/Miew.min.js'], function(Miew) {
      var viewer = new Miew({ load: '1CRN' });
      if (viewer.init()) {
        viewer.run();
      }
    });
  </script>
</body>
</html>
```

## Node.js Limited Support

_index.js_

```js
var Miew = require('miew');
console.log(Miew.VERSION);
```

_package.json_

```json
{
  "dependencies": {
    "miew": "0.9.0"
  }
}
```

## Browserify

_index.html_

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Miew via Browserify</title>

  <link rel="stylesheet" href="https://unpkg.com/miew@0.11.0/dist/Miew.min.css">
  <script src="https://unpkg.com/@babel/polyfill@7/dist/polyfill.min.js"></script>
  <script src="bundle.js"></script>
</head>
<body>
  <h1>Use Miew via Browserify</h1>
  <div class="miew-container" style="width:640px; height:480px"></div>
</body>
</html>
```

_index.js_

```js
var Miew = require('miew');

window.onload = function () {
  var viewer = new Miew({ load: '1CRN' });
  if (viewer.init()) {
    viewer.run();
  }
};
```

_package.json_

```json
{
  "dependencies": {
    "miew": "0.9.0"
  }
}
```

## Webpack

_index.html_

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Miew via Webpack</title>

  <script src="https://unpkg.com/@babel/polyfill@7/dist/polyfill.min.js"></script>
  <script src="dist/main.js"></script>
</head>
<body>
  <h1>Use Miew via Webpack</h1>
  <div class="miew-container" style="width:640px; height:480px"></div>
</body>
</html>
```

_index.js_

```js
import Miew from 'miew';
import './index.css';

window.onload = function () {
  var viewer = new Miew({ load: '1CRN' });
  if (viewer.init()) {
    viewer.run();
  }
};
```

_index.css_

```css
@import "miew";
```

_webpack.config.js_

```js
module.exports = {
  entry: './index.js',
  module: {
    rules: [{
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    }],
  },
};
```

_package.json_

```json
{
  "dependencies": {
    "css-loader": "6.8.1",
    "miew": "0.9.0",
    "style-loader": "3.3.3",
    "webpack": "5.88.2",
    "webpack-cli": "5.1.4"
  }
}
```