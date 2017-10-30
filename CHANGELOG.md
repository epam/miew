# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.7.5] - 2017-10-30
### Added
- Display a lone residue in Cartoon-like modes.
- Add Deuterium (D), Tritium (T) atoms and heavy water (DOD) residue.
- Add `miew` global variable in the demo app.
- Add an automatic lookup for a container using `#miew-container` id or `.miew-container` class.
- Add and index page for examples. It can be accessed at `/examples/` url.
- Start adding e2e tests for API.

### Fixed
- Fix a crash in IE due to a read-only style assignment.
- Fix a crash in Text Mode with the fog turned off.
- Fix a crash in MMTF parser for NMR models.
- Fix the fog update and reorder updating other visual attributes.
- Fix Temperature coloring in the case when min equals max.
- Sort labels in Text Mode by distance to the camera (only roughly, using z-index CSS property).
- Hide text labels behind the camera.
- Assign radius of 1 to unknown atoms.
- Use the default preset when auto detection is off (`autoPreset=0`).
- Fix the version number in a demo built by Travis CI: '-mod' suffix should not appear anymore.

### Deprecated
- Old-fashioned atom labels are hidden from the UI and should not be used Use Text Mode instead.
- The `MIEWS[]` global array should not be used in the demo app, use a single `miew` variable. 

## [0.7.4] - 2017-10-16
### Added
- Add e2e tests with golden images using Selenium WebDriver. Run `npm run e2e` or `gulp test:e2e`,
  then examine the results with `gulp show:e2e`.
- Recognize pi-helices in PDB files (class 3) and color them dark violet.

### Fixed
- Fix unlit geometry (Lines Mode, Lines Objects) rendering for IE and Edge.
- Fix clipping of electron density volumes.
- Fix `build all` script command when autobuild is disabled.
- Fix the current material highlight in UI when changing it from the terminal.
- Fix the `list` script command when a missing rep is specified.
- Prevent 's' key from appearing in the terminal when it is closed.
- Fix screenshots in case when the height is greater than the width.
- Fix curved surfaces on iPad and similar hardware, choose appropriate shader precision automatically.

### Changed
- Use webpack dev server for `npm start` command.

## [0.7.3] - 2017-10-02
### Added
- Add functional tests for parsing PDB, CIF, MMTF, PubChem, CCP4.
- Add automatic deployment to a tomcat server via SSH.

### Changed
- Mark GLY residue as a `nonpolar` one.
- Extract PDBStream as a separate module.
- Specify supported browsers list explicitly in `package.json`.
- Use `env` Babel preset as recommended by authors.
- Configure webpack to produce multiple chunks for better caching.
- Upgrade to Yarn v1.0.2, update other dependencies.

### Fixed
- Fix parsing of CCP4 files with symmetry operations stored.
- Fix parsing of CCP4 files from a typed array.
- Take volumetric data into account when calculating a bounding box and centering on the screen.
- Fix volume faces and add a plane for correct volumetric rendering during zoom.
- Resolve some minor issues found by Sonar.
- Make NPM package public.

## [0.7.2] - 2017-09-19
### Added
- Add integration with online services: Travis CI, AppVeyor, Coveralls, CodeClimate, SonarCloud, BitHound.
- Add automatic tagged version deployment to NPM.
- Add a code of conduct.

### Changed
- Use Jmol secondary structure colors for DNA and RNA, shades of pink instead of light gray.
- Change `rep <idx>` command behavior in the case when the specified representation is missing.
- Use `babel-polyfill` to support ES6 features (Promises and `Number.isNaN` at the moment).
  The polyfill is not included in the library build, use any implementation you'd like.
- Upgrade to jQuery 3.
- Update dependencies to the latest supported versions.

## 0.7.1 - 2017-09-06
### Changed
- Update dependencies to the latest supported versions.
- Move the project to GitHub.

[Unreleased]: https://github.com/epam/miew/compare/v0.7.5...HEAD
[0.7.5]: https://github.com/epam/miew/compare/v0.7.4...v0.7.5
[0.7.4]: https://github.com/epam/miew/compare/v0.7.3...v0.7.4
[0.7.3]: https://github.com/epam/miew/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/epam/miew/compare/v0.7.1...v0.7.2
