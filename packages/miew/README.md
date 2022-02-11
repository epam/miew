# Miew – 3D Molecular Viewer

[![npm version](https://img.shields.io/npm/v/miew.svg)](https://www.npmjs.com/package/miew)
[![Linux Build Status](https://img.shields.io/travis/epam/miew/master.svg?label=linux)](https://travis-ci.org/epam/miew)
[![Windows Build Status](https://img.shields.io/appveyor/ci/paulsmirnov/miew/master.svg?label=windows)](https://ci.appveyor.com/project/paulsmirnov/miew/branch/master)
[![Snyk badge](https://snyk.io/test/github/epam/miew/badge.svg)](https://snyk.io/test/github/epam/miew)
[![Coverage Status](https://coveralls.io/repos/github/epam/miew/badge.svg)](https://coveralls.io/github/epam/miew)
[![Code Climate](https://codeclimate.com/github/epam/miew/badges/gpa.svg)](https://codeclimate.com/github/epam/miew)
[![SonarCloud Maintainability](https://sonarcloud.io/api/project_badges/measure?project=epam:miew&metric=sqale_rating)](https://sonarcloud.io/component_measures?id=epam:miew&metric=Maintainability)
[![SonarCloud Reliability](https://sonarcloud.io/api/project_badges/measure?project=epam:miew&metric=reliability_rating)](https://sonarcloud.io/component_measures?id=epam:miew&metric=Reliability)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=epam:miew&metric=alert_status)](https://sonarcloud.io/dashboard?id=epam:miew)

Copyright (c) 2015–2022 [EPAM Systems, Inc.](https://www.epam.com/)

Miew is a high performance web library for advanced visualization and manipulation of molecular
structures.

![Screenshot](README.png)

It provides a full-featured set of tools for 3D visualization and editing of small molecules as
well as large molecular complexes, including means to view, analyze, and modify the 3D structure
of a molecule. It integrates as a component into your web pages.

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
var Miew = require('miew')
console.log(Miew.VERSION)
```

You may also download the [minified library](dist/miew.min.js) and access it from the browser's
`<SCRIPT>` tag, or asynchronously include it via [Require.js].

There is also a [demo application] available in the git repository.

[demo application]: https://miew.opensource.epam.com/
[require.js]: http://requirejs.org/
[webpack]: https://webpack.js.org/
[browserify]: http://browserify.org/
[rollup]: https://rollupjs.org/
[node.js]: https://nodejs.org/
[npm]: https://www.npmjs.com/
[yarn]: https://yarnpkg.com/

## Contributing

Please read [Contributing Guide](../../CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License

[MIT](../../LICENSE.md)
