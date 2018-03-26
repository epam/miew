# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.7.15] - 2018-03-26
### Fixed
- Fix a crash when a non-integer unit index is set.
- Fix message about current unit after try to change.
- Use default gradient color for the case of no temperature/occupancy.
- Use average temperature and occupancy for residue coloring.
- Use `groupId` as a sequence index for MMTF.

## [0.7.14] - 2018-03-12
### Added
- Add GitHub and EPAM urls to the demo app menu.

### Fixed
- Fix copyright year in docs and in the menu.
- Fix source maps location in the minified build.
- Do not rebuild QS and CS surface modes when the menu is opened/closed.
- Workaround a crash in three.js when rendering empty geometry with wireframe.

### Internal
- Migrated to Webpack 4, updated other dependencies.

## [0.7.13] - 2018-02-19
### Added
- Add basic support for HTC Vive controllers in VR.

### Changed
- Replace Gulp with direct NPM scripts (#32).

## [0.7.12] - 2018-02-05
### Added
- Add `Miew#exportCML()` method to retrieve a CML contents (including modified atom coordiantes) if
  a CML file was loaded.
- Add a secondary structure assignment routine (#30): `Miew#dssp()` method and `dssp` script command.
  Available from UI too.

### Changed
- Automatic bonding uses a faster approach (voxel grid).

### Fixed
- Fix a crash in library when TextMode is used.
- Fix a couple of bugs with parameters of surface modes in UI.

## [0.7.11] - 2018-01-17
### Fixed
- Fixed a loading error in IE11 when a relative URL is used.
- Fixed an FBX export.
- Renamed files and classes to match and fixed other code smells found by SonarCloud.

## [0.7.10] - 2017-12-25
### Added
- Add more unit tests for loaders.
- Add WebVR stereo mode (still in PoC stage).

### Changed
- Refactor loaders API and switch to the new way of loader auto detection.
    - You may load electron density data by PDB ID using prefixed notation, e.g. "ccp4:3C9L"
      (the full list of prefixes is pdb, cif, mmtf, ccp4). In the case the prefix is omitted,
      it is a "pdb".
    - Another prefix is "pc" (or "pubchem") which allows loading a compound from PubChem database,
      e.g. "pc:serotonin".
    - Otherwise, the source string is assumed to contain a URL, either absolute or relative to
      the current page location.

### Fixed
- Fix loading electron density presets from a server.

## [0.7.9] - 2017-12-11
### Added
- Add an `ImmediateLoader` for loading structures from pre-fetched data.
- Add loader unit tests.

### Changed
- Sequence colorer uses white color as default for files where "sequence" is not applicable.
- CML files are parsed with default temperature of 0 and default chain id `' '` (space).
- Support different line endings in PDB format: LF, CR+LF, CR.
- Refactor parsers API and switch to the new way of parser auto detection.
- `Loader#load()` now returns a promise.
- Process a request to abort the parsing stage in a base class.
- Changed appearance of the terminal window to make it conform to the overall style and to avoid
  attempts to click on transparent areas.

### Deprecated
- Deprecated old `io.parsers` methods and `Parser.canParse()`, replaced them with alternatives.
- Callbacks in loading methods should be avoided, please use promises.

### Fixed
- Fix a crash in water bonding hack.
- Limit the number of representations correctly.
- Fix parser unit tests.

## [0.7.8] - 2017-11-27
### Added
- Show the chain/molecule information when pick mode is set to chain/molecule. 

### Fixed
- Fix a crash during typing in the Load panel introduced with the previous release. 
- Fix a hangup caused by uppercase letters in terminal commands.
- Fix a picking near the terminal window border. 
- Fix incorrect formatting in terminal (upgraded jquery.terminal to v1.10.1).
- Fix surface parameter values in UI. Now they are not global and belong to a mode instance as they
  should be.
- Fix useless assignments in the code.

## [0.7.7] - 2017-11-20

Demo application was accidentally broken in this release. Hotfix is available
in [0.7.7+hotfix] and later releases.

### Added
- `Parser#parseSync()` - a synchronous method for parsing.
- Unit tests for the `Parser` class.

### Changed
- `Parser#parse()` now returns a promise.

### Deprecated
- Callbacks in parsing methods should be avoided, please use promises.

### Fixed
- Fix a crash at non-protein molecules which contain a lone residue.
- Fix the context menu appearing when you move the molecule using right mouse button.
- Fix UI scale on mobile devices.
- Fix molecule offset on mobile devices.
- Fix theme changes from the terminal.
- Fix `Parser.checkDataTypeOptions()`, it shouldn't accept a file with a matching extension if the
  explicitly given type is different.
- Fix the incorrect error message about currently supported file types in the `Load` UI Panel.

## [0.7.6] - 2017-11-13
### Changed
- Upgrade three.js to r87.
- Log errors as console errors instead of normal text.
- Refactor and rename private methods. Make loading pipeline implementation easier to understand.
  Public API should not be affected (yet).
 
### Deprecated
- Camera panning API should not be used.

### Removed
- Remove old profiling methods.

### Fixed
- Fix a 100% crash in animation.
- Change float texture format to RGBA32F which should be available if `OES_texture_float` extension
  is present. Firefox should be able to display volumetric data now. 
- Check for floating point render target support, which is required for volumetric rendering. Note
  that the support is not available on iOS devices.
- Re-render and re-calculate the center after a file was unloaded.
- Fix warnings during shader compilation on iOS.
- Fix component movement during editing.

## [0.7.5] - 2017-10-30
### Added
- Display a lone residue in Cartoon-like modes.
- Add Deuterium (D), Tritium (T) atoms and heavy water (DOD) residue.
- Add `miew` global variable in the demo app.
- Add an automatic lookup for a container using `#miew-container` id or `.miew-container` class.
- Add and index page for examples. It can be accessed at `/examples/` url.
- Start adding e2e tests for API.

### Deprecated
- Old-fashioned atom labels are hidden from the UI and should not be used Use Text Mode instead.
- The `MIEWS[]` global array should not be used in the demo app, use a single `miew` variable. 

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

[Unreleased]: https://github.com/epam/miew/compare/v0.7.15...HEAD
[0.7.15]: https://github.com/epam/miew/compare/v0.7.14...v0.7.15
[0.7.14]: https://github.com/epam/miew/compare/v0.7.13...v0.7.14
[0.7.13]: https://github.com/epam/miew/compare/v0.7.12...v0.7.13
[0.7.12]: https://github.com/epam/miew/compare/v0.7.11...v0.7.12
[0.7.11]: https://github.com/epam/miew/compare/v0.7.10...v0.7.11
[0.7.10]: https://github.com/epam/miew/compare/v0.7.9...v0.7.10
[0.7.9]: https://github.com/epam/miew/compare/v0.7.8...v0.7.9
[0.7.8]: https://github.com/epam/miew/compare/v0.7.7...v0.7.8
[0.7.7+hotfix]: https://github.com/epam/miew/tree/v0.7.7+hotfix
[0.7.7]: https://github.com/epam/miew/compare/v0.7.6...v0.7.7
[0.7.6]: https://github.com/epam/miew/compare/v0.7.5...v0.7.6
[0.7.5]: https://github.com/epam/miew/compare/v0.7.4...v0.7.5
[0.7.4]: https://github.com/epam/miew/compare/v0.7.3...v0.7.4
[0.7.3]: https://github.com/epam/miew/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/epam/miew/compare/v0.7.1...v0.7.2
