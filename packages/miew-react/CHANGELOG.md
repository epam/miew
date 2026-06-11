# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.12.0] - 2026-06-09

### Added

- The `Viewer` component now accepts `className`, `style`, `id`, `title`, event handlers,
  `data-*` and `aria-*` attributes, and other standard HTML `<div>` props, making it easy
  to style and integrate the viewer into any layout.
- Added comprehensive prop validation and error handling to the `Viewer` component.

### Changed

- Upgraded the React peer dependency to version 19.

### Internal

- Updated third-party dependencies.

## [0.11.0] - 2024-08-26

### Added

- Add a [`miew-react`][] package that contains a React.js wrapper component. It is published
  as a separate [miew-react](https://www.npmjs.com/package/miew-react) package on npm.

[`miew-react`]: https://github.com/epam/miew/tree/main/packages/miew-react
[Unreleased]: https://github.com/epam/miew/compare/v0.12.0...HEAD
[0.12.0]: https://github.com/epam/miew/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/epam/miew/compare/v0.9.0...v0.11.0
