# Miew – 3D Molecular Viewer

[![Build Status](https://travis-ci.org/epam/miew.svg?branch=master)](https://travis-ci.org/epam/miew)
[![Coverage Status](https://coveralls.io/repos/github/epam/miew/badge.svg)](https://coveralls.io/github/epam/miew)

Copyright (c) 2015–2017 [EPAM Systems, Inc.](https://www.epam.com/)

Miew is a high performance web tool for advanced visualization and manipulation of molecular
structures.

![Miew - 3D Molecular Viewer](docs/demo.png)

It provides a full-featured set of tools for 3D visualization and editing of small molecules as
well as large molecular complexes, including means to view, analyze, and modify the 3D structure
of a molecule. It works as a standalone HTML5 web application or integrates as a component into
your web pages. The [latest versions](https://browsehappy.com/) of WebGL-enabled desktop (Chrome,
Firefox, Safari, Opera, Edge, IE11) and mobile (iOS, Android) browsers are supported.

## Installation and Usage

Miew library is available as an [NPM] package. Install it either with NPM:

```sh
npm install --save miew
```

or [Yarn]:

```sh
yarn add miew
```

Then use it in your [Webpack] / [Browserify] / [Rollup] setup, or just test it right in the Node
environment.

```js
var Miew = require('miew');
console.log(Miew.VERSION);
```

You may also download the [minified library](dist/Miew.min.js) and access it from the browser's
`<SCRIPT>` tag, or asynchronously include it via [Require.js]. Refer to the [tutorials],
[examples] and API docs for more details.

There's also a [demo application] available in the git repository.

[tutorials]: docs/tutorials/embed.md
[examples]: examples/
[demo application]: http://miew.opernsource.epam.com/

[Require.js]: http://requirejs.org/
[Webpack]: https://webpack.js.org/
[Browserify]: http://browserify.org/
[Rollup]: https://rollupjs.org/
[Node.js]: https://nodejs.org/
[NPM]: https://www.npmjs.com/
[Yarn]: https://yarnpkg.com/

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License

[MIT](LICENSE.md)
