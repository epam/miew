# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.12.0] - 2026-06-09

### Changed

- Replaced the custom Miew viewer implementation with the `miew-react` wrapper component.
- Migrated Redux state management from plain Redux to Redux Toolkit.
- Removed the non-serializable Miew instance from the Redux store; components now access it
  through React context instead.
- Upgraded to React 19.

### Fixed

- Restored the "Fork me on GitHub" ribbon in the application header.

### Internal

- Moved test files next to the source files they cover.
- Updated third-party dependencies.

## [0.11.0] - 2024-08-26

### Added

- Add a [`miew-app`][] package with a new demo application code. The goal is to rewrite the old
  monolith plain JavaScript demo in modular React.js

[`miew-app`]: https://github.com/epam/miew/tree/main/packages/miew-app

[Unreleased]: https://github.com/epam/miew/compare/v0.12.0...HEAD
[0.12.0]: https://github.com/epam/miew/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/epam/miew/compare/v0.9.0...v0.11.0
