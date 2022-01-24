# miew-react

[![npm version](https://img.shields.io/npm/v/miew-react)](https://www.npmjs.com/package/miew-react)
[![Downloads](https://img.shields.io/npm/dm/miew-react)](https://www.npmjs.com/package/miew-react)
[![License](https://img.shields.io/badge/MIT%20-blue.svg)](https://opensource.org/licenses/MIT)

Copyright (c) 2022 [EPAM Systems, Inc.](https://www.epam.com/)

Miew is a high performance web library for advanced visualization and manipulation of molecular structures.

For more details please look at the following [link](https://github.com/epam/miew/blob/master/README.md).

The miew-react package contains only the functionality necessary to define components. It is used together with [miew](https://www.npmjs.com/package/miew).

## Installation

The miew-react library is available as an [NPM](https://www.npmjs.com/) package. Install it either with NPM:

```sh
npm install --save miew-react
```

or [Yarn](https://yarnpkg.com/):

```sh
yarn add miew-react
```

## Usage

```js
import Viewer from 'miew-react'

const MyComponent = () => {
  return (
    <Viewer />
  )
}
```

### Props

Imported component accepts the following optional props:  
+ **options**: an object containing representation settings for Miew and initial structure to be shown (all the fields are also optional, when not provided, default settings are applied)
+ **onInit**: a callback function which recieves an instance of Miew, and called after initialization of Miew instance inside the Viewer component. With a help of this prop you can access Miew methods and fields.
+ **theme**: an object containing theme which should be used inside the Viewer component (all the fields are also optional, when not provided, default theme is applied)

