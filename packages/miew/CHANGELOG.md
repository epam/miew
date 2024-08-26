# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.11.0] - 2024-08-26

### Added

- Add a [`miew-react`][] package that contains a React.js wrapper component. It is published
  as a separate [miew-react](https://www.npmjs.com/package/miew-react) package on npm.
- Add a [`miew-app`][] package with a new demo application code. The goal is to rewrite the old
  monolith plain JavaScript demo in modular React.js

[`miew-react`]: https://github.com/epam/miew/tree/main/packages/miew-react
[`miew-app`]: https://github.com/epam/miew/tree/main/packages/miew-app

### Changed

- Support shadows in sprite-based modes (Licorice, Balls and Sticks, VDW, and Trace).
- Clip sprites with near plane instead of culling them.
- Color residue names in the "sequence" example according to the secondary structure.
- Use CIF format in the demo and examples instead of discontinued MMTF.
- **BREAKING CHANGE:** Bump tree.js to r153. Can break your code only if you rely on specific
  three.js API yourself.

### Removed

- **BREAKING CHANGE:** Remove support for `mmtf:` prefix during loading because the format
  is discontinued and files are not served anymore. Parsing local files or specific URLs
  is still supported.
- **BREAKING CHANGE:** The `miew` library no longer intercepts the `S` key. Numpad plus and minus
  are still processed but require the `Alt` key pressed to avoid conflicts. The keys will likely
  be removed in the future versions in favor of event handlers and API calls.

### Fixed

- Don't crash on `addEventListener` call if embedded in a cross-origin IFRAME.
- Create empty molecules correctly.
- Fix `HydrophobicityColorer` behavior.
- Rebuild the geometry after enabling or disabling `zSprite` setting.
- Change event name in the docs: `rebuildingDone` to `buildingDone`.
- Fix "sequence" example to use the proper event.

### Internal

- Use the `main` branch as the main instead of the abandoned `master`.
- Reorganize the project as a monorepo.
- Migrate to Yarn 3.
- Migrate to GitHub Actions for CI builds instead if TravisCI.
- Migrate to Webpack instead of Rollup for building the library.
- Remove IDE files from the repository.
- Support the current Node LTS 18 and 20 for development.
- Create a Dockerfile for building an image.
- Convert several remaining old-style JS files to ES2015 classes.
- Update babel and eslint configurations and fix issues.
- Add more tests.
- Regenerate golden images.
- Translate help document for beginners into English.

## [0.10.0] - 2022-01-25 \[YANKED]

## [0.9.0] - 2020-03-23
### Added
- Add unittests for Atom and Molecule

### Changed - BREAKING CHANGES!
- Move threejs and lodash to external dependencies (halving size of Miew bundle). See examples for migrating ideas.
 
### Removed - BREAKING CHANGES!
- Remove deprecated GXProfiler and Miew.profile
- Remove dispatching of deprecated events
 
### Fixed
- Fix crash in IE when turning on the effects which are not supported by the browser
- Fix crash on uploading molecule with ssao on
- Remove permanent rebuild after Menu close in case when nothing has changed

### Internal
- Make ViewInterpolator being an object to prevent its sharing between several instances of Miew
- Remove primitive getters from Atom and Molecule, use members instead
- Simplify Atom.name
- Remove a code for building chemical formula, it's obsolete
- Implement shadowmaps using common renderer.scene routine for future overcome of threejs restrictions in shadowmaps for zSprites modes 

## [0.8.7] - 2000-02-04
### Fixed
- Fix travis options for npm deployment 

## [0.8.6] - 2020-01-31
### Added
- Add dispatching of new events (https://github.com/epam/miew/blob/master/docs/tutorials/events.md):
   - `translate` fires when molecule is translated with RMB
   - `translatePivot` fires when editing pivot is translated with RMB 
   - `repAdded`, `repChanged`, `repDeleted` fires on a representation set changes
   - `fetching`, `exporting`, `exportingDone`
- Add an example for the events usage and events description document

### Changed
- Refactor Event system (https://github.com/epam/miew/blob/master/docs/tutorials/events.md)
   - Data in `rotate` event is replaced with `quaternion` instead of `angle`
   - Rename `fetchingFinished`->`fetchingDone`, `parsingFinished`->`parsingDone`, old versions are deprecated
   - Rename `parse`->`parsing`, `load`->`loading`, `rebuild`->`rebuilding`, old versions are deprecated
 
### Deprecated
- Deprecate broken animation API until refactoring of animation system: `Miew._startAnimation()`, `Miew._stopAnimation()`, `Miew._pauseAnimation()`, `Miew._continueAnimation()`
- Deprecate using of obsolete performance profiler via `Miew.benchmarkGfx()`
- Deprecate the set of obsolete events: 
   - `onParseDone`, `onParseError`, use `parsingDone`  instead
   - `profile`, due to deprecation of the whole profiling system
   - `mdPlayerStateChanged` due to deprecation of animation system usage
   - `repAdd`, use `repAdded` instead

### Fixed

### Internal
- Decrease a number of unneeded object creations in `ObjectControls`
- Migrate from WebVR to WebXR usage in stereo mode `WEBVR`

## [0.8.5] - 2019-12-27
### Added
- Add parameter of line thickness for Outline effect
- Add example of Rect application that uses Miew

### Changed
- Update a year in copyright

### Fixed
- Fix warnings in console from threejs
- Fix crash after setting a number as a parameter of setting `shadow.on`

### Internal
- Add unit tests for modules `options.js` and `selectors.js`
- Improve maintainability by splitting selectors.js into separate modules 

## [0.8.4] - 2019-11-11
### Added
- Add parser for MOL2 molecular format
- Add exporter for geometry information into FBX unicode format
- Add button 'Export FBX' in Demo application menu 'Tools'
- Add example of using ImmediateLoader

### Changed
- Change all Miew links to https://miew... instead of http://miew...
- Refactor unit tests for settings.js and logger.js

### Fixed
- Fix rendering of electron density in stereo mode
- Fix rendering of electron density bbox with visual effects 
- Fix a crash in modified DNA processing (e.g. 1K1R)

### Internal
- Rafactor normal storage in G-buffer
- Generalize TraceMesh into InstancedMesh
- Refactor the algorithm of simultaneously applying fog and ambient occlusion effects

## [0.8.3] - 2019-09-20
### Added
- Add parsers for GRO molecular formats
- Support shadows effect for the Trace mode

### Fixed
- Fix screenshot orientation in Safari
- Fix screenshot size for HiDPI displays
- Fix disabled button of representation addition in GUI

## [0.8.2] - 2019-08-16
### Added
- The parameter `resolution` now effects image quality for Electron Density.
- Add API and terminal command to center view on selection via `miew.center`.
- Load file in Load dialog after pressing 'Enter'.

### Fixed
- Clear info panel in demo application when data haven't been loaded.
- Fix miew crash when adding representation if data was not loaded.
- Fix bug with incorrect discard behavior in component mode.
- Fix wrong scaling molecules in `DISTORTED` and `SIMPLE` stereo modes.
- Fix 'magic' rectangular lines appearing on laptops with Intel embedded GPU board.
- Fix disappearing of molecule after 'ao' turning off.

### Known issues
- Bounding box lines in Electron Density may disappear when `ao` is tuned on. 

## [0.8.1] - 2019-07-01
### Fixed
- Do not show the last pick information when selection was changed via the terminal.
- Update the selection notification when the displayed unit changes.
- Fix backdrop material so it works for sprite-based modes (B&S, VDW...)
- Fix a bug in Cartoon geometry which led to bad raycasting performance.

### Internal
- Visual regression tests are now run in headless Chrome. This allows lowering error threshold and
  comparing results obtained on different graphics hardware. It is a big step towards distributed
  testing in cloud.

## [0.8.0] - 2019-06-07
### Added
- Add isosurface rendering for electron density maps. As volumetric rendering is still in its alpha, it is done through a global `modes.VD.isoMode` flag.

### Changed
- Show detailed messages for WebGL initialization errors.

### Removed - BREAKING CHANGES!
- Remove deprecated water bonding hack.
- Remove deprecated Complex methods.
- Remove deprecated window.MIEWS array.
- Remove deprecated Settings#override().
- Remove deprecated camera panning.
- Remove deprecated coloring ids.
- Remove deprecated themes.
- Remove deprecated old-fashioned atom labels.
- Remove deprecated API in modes, colorers, materials, palettes.
- Remove deprecated API in loaders and parsers.
- Remove deprecated presets server integration.

### Fixed
- Fix the crash on clicking mode/color panel when representation list is empty.
- Fix DISTORTED and ANAGLYPH stereo modes.
- Fix incorrect shadows when molecule is moved around.
- Fix axes disappearing when fxaa is off and ao is on.
- Fix rendering issues for fxaa + outline + stereo=DISTORTED.
- Fix selection information update when the terminal was used to change selection.
- Fix raycasting performance partially. Another fix is still in progress.

### Internal
- Add rendering regression tests for post-process effects, shadows and stereo modes.
- Fix some code smells and todos found by improved SonarCloud checks, refactor es5 code.

## [0.7.24] - 2019-04-26
### Added
- Add wire frames for electron density volumes.

### Fixed
- Fix `unrol_loop` warning during shader compilation.
- Use `shadow.on` setting to initialize shadowing state.
- Fix some eslint and sonar code smells.

### Changed
- Build geometry with sharper edges for cartoon sheets and helices.
- Reset view interpolator on file load, pause it when miew is paused.

### Internal
- Use only Node.js 10 (the current LTS) environment for CI/CD.
- Remove unrelated TODO/FIXME/HACK comments and get rid of dead code in isosurfaces.

## [0.7.23] - 2019-04-05
### Added
- Support dsn6 prefix for ED maps loading by PDB ID.
- Support non-orthogonal density volumes.
- Host full-screen viewer at a `/v` server path and add a button to launch the app from the lite viewer.
- Add an interactive example showing residue sequences.

### Changed
- Use `https` protocol for data requests.
- Implement soft shadow edges, make the colors more natural and reduce self-shadowing artifacts.
- Use URL options in the corresponding example.
- Add titles to the examples.

### Fixed
- Fix excessive rendering in case if nothing changes.
- Fix disappearing molecule after reloading the page.
- Fix full geometry rebuild when switching shadows on/off.
- Fix low performance of volumetric rendering in the case when a molecule is present in the scene.

## [0.7.22] - 2019-02-28
### Changed
- Make "fullscreen.html" example really full-screen both for desktops and mobiles.
- Add experimental sigma-coloring of volumetric maps.

### Fixed
- Fix background transparency of the terminal.
- Add a temporary workaround for jquery.terminal freeze: don't print square brackets
  into the term, replace them with parentheses
  ([jcubic/jquery.terminal#470](https://github.com/jcubic/jquery.terminal/issues/470)).
- Fix rendering conflicts when `ssao=true` and `fxaa=false` at the same time.

### Internal
- Enforce better ES2015+ with the newer eslint config and fix the issues.

## [0.7.21] - 2019-02-14
### Added
- Add parsers for MOL, SDF and XYZ molecular formats and MAP, MRC and DSN6 electron density maps.
- Add experimental PDB export via `miew.save()` API.
- Molecular geometry can cast shadows now (off by default). The effect still needs
  additional effort to improve the picture and support sprite-based display modes.

### Fixed
- Fix the crash due to zero voxel grid size for very small molecules.
- Fix materials and shaders (pre-pass transparency and the backdrop material).
- Fix electron density maps rendering: now the threshold is set automatically using
  the standard deviation stored in a file or calculated over the data. Color of the
  density map is set to grayscale until further changes to the rendering code are made.

### Internal
- Migrate more parts of code to ES2015 syntax (`gfx/`, `io/`, `checm/`). 

## [0.7.20] - 2018-07-30
### Added
- Add a separate setting for fog color (`fogColor`, `fogColorEnable`) and transparency
  (`fogAlpha`). Now it can be different from the background color and only shade a
  geometry behind the far plane instead of completely hiding it.
- Add `ToonMaterial` and depth-based `outline` full-scene effect for nice
  [cartoon-like rendering][].
- Add `FlatMaterial`, `CarbonColorer`, together with `miew.motm()` API method and
  `motm` script command for reproducing the amazing
  [RCSB PDB Molecule of the Month style][] by [David S. Goodsell][].

### Changed
- Ambient occlusion (SSAO) now uses a Normal screen buffer for precise per-pixel normals.
  This requires multiple render targets output (`WEBGL_draw_buffers` extension) .

### Fixed
- Fix switching WebVR mode on and off.
- Fix wrong screenshot size on high resolution displays.
- Fix fog interpolation for sprites.
- Fix a background color not being restored from URL.

### Internal
- Migrate parts of code to ES2015 syntax (`modes/`, `colorers/`, `meshes/`, `geometries/`, `groups/`, `processors/`).
- Update golden images for e2e regression tests.

[cartoon-like rendering]: https://miew.opensource.epam.com/v0.7.20/?l=1CRN&r=0&s=not+hetatm&m=CA&c=SQ&mt=TN&r=1&s=hetatm+and+not+water&m=BS&c=EL&mt=SF&resolution=high&outline.on=true&outline.threshold=0.02
[RCSB PDB Molecule of the Month style]: https://miew.opensource.epam.com/v0.7.20/?l=pdb:5AT1&r=0&s=not+water+and+chain+C&m=VW&c=CO!subset:elem+C,baseColor:16422548,color:16494255&mt=FL&r=1&s=not+water+and+chain+B&m=VW&c=CO!subset:elem+C,baseColor:8169212,color:9550321&mt=FL&r=2&s=not+water+and+chain+D&m=VW&c=CO!subset:elem+C,baseColor:8112632,color:9888764&mt=FL&r=3&s=not+water+and+hetatm&m=VW&c=CO!subset:elem+C,baseColor:6532453,color:8837511&mt=FL&v=1SuyCwvajDcJvkg3CdGZdPKssNrtig608h/CdPw%3D%3D&fogFarFactor=2&fogColorEnable=true&theme=light&bg.color=13421772&outline.on=true&outline.threshold=0.01
[David S. Goodsell]: http://pdb101.rcsb.org/motm/motm-about
 
## [0.7.19] - 2018-06-18
### Changed
- Demo app uses deferred scripts loading and the stylesheet is extracted to a separate file.
- Finishing transparent background mode: fog affects transparency now, FXAA and SSAO effects support transparency too.
  Transparent materials are not fully supported in this mode due to limitations in rendering pipeline.
  See the [transparent background example](examples/transparent_background.html) for details on proper setup.

### Fixed
- Fix broken spinner after unnoticed package upgrade.
- Pin broken jquery.terminal to version 1.14, will investigate CSS issues later.

### Internal
- Use PostCSS instead of node-sass to get rid of issues with binaries and to make processing faster.

## [0.7.18] - 2018-05-29
### Added
- Add the original patented CPK palette back (`CP` identifier).
- Add the ability to specify a transparent background. Use a boolean `bg.transparent` (`false` by default).
  Some special effects are still in development (FXAA, fogging).

### Changed
- The background color is now specified via `bg.color` setting (an rgb-coded number like 0xFF0000
  for red) instead of themes. Themes are still working until the next major version.

### Deprecated
- Themes in their current implementation (`theme`, `themes.light`, `themes.dark` settings)
  are deprecated as they are related mostly to the UI and demo app, not to the miew core library.
  Use `bg.color` setting directly instead.
- Some methods of refactored lists (loaders, parsers, modes, colorers, materials, palettes) are
  marked as deprecated. Probably you didn't use them.

### Fixed
- Fix mismatched helix types in DSSP (pi- and 3/10-helices).
- Use the real list of supported file extensions in the UI instead of a hardcoded one.
- Update colorers and palettes thumbnails to better reflect the latest changes.

### Internal
- Add a base class for a lists of identifiable entities. Refactor lists of loaders, parsers,
  modes, colorers, materials, palettes to use the new class and API. Old API is deprecated
  and will be removed in the next major version.
- Update dependencies. Note that the new `jquery.terminal` would break the UI.

## [0.7.17] - 2018-05-07
### Added
- Added the Gallery menu panel with a set of predefined molecules / configurations.
- Added a Backdrop Material to the list of available materials. It should be used
  with one of the Surface Modes and the Uniform Colorer to create a background for the
  entire molecule or its parts.
- Added ability to attach a listener and get notified when a particular setting change,
  e.g. `settings.addEventListener('change:palette', myHandler)`. These events are used
  internally to process changes no matter where do they come from (menus, the terminal
  or even API).
- Added other secondary structure types beside helices and strands (turns, bends, bridges).
  Support them in MMTF and CIF format, detect them during DSSP analysis.

### Deprecated
- Deprecate `settings.override()`, use `settings.set()` instead.

### Fixed
- Fixed `utils.objectDiff()` object comparison function.
- Notice even bulk changes in settings.

### Internal
- Performed some internal class/method/property renames.
- Included building Webpack and Browserify examples into the build pipeline.
- Upgraded three.js to r91 (using the version from NPM now with no hacks added).
- Updated other dependencies.

## [0.7.16] - 2018-04-16
### Fixed
- Fix screenshots in stereo mode.
- Clear selection correctly during reset.
- Fix quoted quotes (`"\""`) processing in scripts.
- Keep string values as quoted strings in script.
- Prevent `VERSION` setting field from appearing in script and URL.
- Add delimiter between mode and reps name in result of list command
- Fix abnormal mouse zooming leading to negative scale
- Support `Mouse Wheel + Shift` for cliplane tuning in Firefox and Opera
- Fix text wrapping of a selector on Representation panel.

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

[Unreleased]: https://github.com/epam/miew/compare/v0.11.0...HEAD
[0.11.0]: https://github.com/epam/miew/compare/v0.9.0...v0.11.0
[0.10.0]: https://github.com/epam/miew/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/epam/miew/compare/v0.8.7...v0.9.0
[0.8.7]: https://github.com/epam/miew/compare/v0.8.6...v0.8.7
[0.8.6]: https://github.com/epam/miew/compare/v0.8.5...v0.8.6
[0.8.5]: https://github.com/epam/miew/compare/v0.8.4...v0.8.5
[0.8.4]: https://github.com/epam/miew/compare/v0.8.3...v0.8.4
[0.8.3]: https://github.com/epam/miew/compare/v0.8.2...v0.8.3
[0.8.2]: https://github.com/epam/miew/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/epam/miew/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/epam/miew/compare/v0.7.24...v0.8.0
[0.7.24]: https://github.com/epam/miew/compare/v0.7.23...v0.7.24
[0.7.23]: https://github.com/epam/miew/compare/v0.7.22...v0.7.23
[0.7.22]: https://github.com/epam/miew/compare/v0.7.21...v0.7.22
[0.7.21]: https://github.com/epam/miew/compare/v0.7.20...v0.7.21
[0.7.20]: https://github.com/epam/miew/compare/v0.7.19...v0.7.20
[0.7.19]: https://github.com/epam/miew/compare/v0.7.18...v0.7.19
[0.7.18]: https://github.com/epam/miew/compare/v0.7.17...v0.7.18
[0.7.17]: https://github.com/epam/miew/compare/v0.7.16...v0.7.17
[0.7.16]: https://github.com/epam/miew/compare/v0.7.15...v0.7.16
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
