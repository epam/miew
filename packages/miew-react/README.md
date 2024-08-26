# miew-react

[![Version](https://img.shields.io/npm/v/miew-react)](https://www.npmjs.com/package/miew-react?activeTab=versions)
[![Downloads](https://img.shields.io/npm/dm/miew-react)](https://www.npmjs.com/package/miew-react?activeTab=versions)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE.md)

Miew is a high performance web tool for advanced visualization and manipulation
of molecular structures.

The `miew-react` package contains only a React.js wrapper component.
Please refer to the topmost [README][] for an overview of the entire project.

[README]: https://github.com/epam/miew#readme

![Screenshot](README.png)

## Installation and Usage

The component is available as an [npm package](https://www.npmjs.com/package/miew-react).

```sh
# npm create vite@latest .
npm i miew-react
```

src/main.jsx

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Viewer from 'miew-react';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Viewer options={{ load: '1crn' }} />
  </StrictMode>,
);
```

index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <div id="root" style="width:640px; height:480px"></div>
    <script type="module" src="src/main.jsx"></script>
  </body>
</html>
```

### Props

The component accepts the following optional props:

- **onInit**: a callback function which recieves an instance of Miew, and called after initialization of Miew instance inside the Viewer component. With a help of this prop you can access Miew methods and fields.
- **options**: an object containing representation settings for Miew and initial structure to be shown (all the fields are also optional, when not provided, default settings are applied)
- **theme**: ignored

## Contribution

Please read [CONTRIBUTING.md](../../CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## License

[MIT](LICENSE.md)

Copyright (c) 2015–2024 [EPAM Systems, Inc.](https://www.epam.com/)
