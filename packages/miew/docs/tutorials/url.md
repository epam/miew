# URL Query String

## Application Setup

The `Miew` object constructor accepts various options as a parameter. You can pass specific values chosen for your
demonstration:

```js
var viewer = new Miew({
  container: document.getElementsByClassName('miew-container')[0],
  load: '1CRN',
  reps: [{
    mode: 'LC',
  }, {
    selector: 'elem S',
    mode: 'VW',
    material: 'TR',
    colorer: ['UN', { color: 0xFFFFFF }],
  }],
  settings: {
    autoRotation: -0.5,
    bg: { color: 0xCCCCCC },
    axes: false,
    fps: false,
  },
});
```

Alternatively, you may allow user to override options with a URL Query String:

```js
var _ = Miew.thirdParty.lodash;
var viewer = new Miew(_.merge({
    container: document.getElementsByClassName('miew-container')[0],
    load: '1CRN',
  }, 
  Miew.options.fromURL(window.location.search)
));
```

and then [pass the same values using a URL](https://miew.opensource.epam.com/?m=LC&m=VW&s=elem+S&mt=TR&c=UN!color:0xFFFFFF&autoRotation=-0.5&bg.color=0xCCCCCC&axes=0&fps=0):

```
?m=LC&m=VW&s=elem+S&mt=TR&c=UN!color:0xFFFFFF&autoRotation=-0.5&bg.color=0xCCCCCC&axes=0&fps=0
```

You may also apply the same options from any source, e.g. data attribute of the container: 

```html
<div class="miew-container" data-miew="m=LC&m=VW&s=elem+S&mt=TR&c=UN!color:0xFFFFFF&autoRotation=-0.5&bg.color=0xCCCCCC&axes=0&fps=0"></div>
```

It does not happen automatically, you need to retrieve and transform the string to an options object. Then combine
options together and pass them to the `Miew` constructor.

```js
var _ = Miew.thirdParty.lodash;
var container = document.getElementsByClassName('miew-container')[0];
var viewer = new Miew(_.merge({
    container: container,
    load: '1CRN',
  }, 
  Miew.options.fromAttr(container.dataset.miew)
));
```

## Query String Format

The easiest way to obtain a URL is to call `miew.getURL()`, however, you may decide to build the URL manually,
step by step. While constructing the string be aware that such special characters as whitespaces,
`+`, `=`, `&`, `:`, `!` must be URL-encoded unless they are a part of formal syntax described below.
You may replace a space with a plus sign (`+`) instead of a `%20` code for better readability. 

### Change Settings

The query string consists of ampersand-separated `key=value` pairs. By default, the application treats them as a global setting
assignment. Use [`autoRotation=0.1`] to enable rotation and set the speed, or [`fog=0`] to switch the fog off. You may even adjust
nested settings such as [`modes.CA.radius=0.05`] to change default tube radius in Cartoon Mode.
See `Settings` object for details.

[`autoRotation=0.1`]: https://miew.opensource.epam.com/?autoRotation=0.1
[`fog=0`]: https://miew.opensource.epam.com/?fog=0
[`modes.CA.radius=0.05`]: https://miew.opensource.epam.com/?modes.CA.radius=0.05

### Execute Commands

Besides changing global setting you may also specify some commands including those that form visual representation
of molecules. The commands operate in a left-to-right order. Some commands have shorter aliases for convenience.

Data source:

  - **l**, **load** = ( _pdbID_ | _source_ **:** _id_ | _url_ )  
    Automatically load specified file or PDB ID on startup: [`l=4xn6`].  
    You may choose a different file source: [`l=cif:4xn6`], [`l=pubchem:serotonin`].

  - **t**, **type** = _typeId_  
    Specify explicit type of the loaded file: [`t=cif&l=https://files.rcsb.org/view/4XN6.cif`].  
    By default, the application determines the data type automatically by the file name (extension) or the
    file source used.

  - **u**, **unit** = _unitIndex_  
    Specify a biological unit to view: [`l=3s95&u=2`].  
    By default, the application shows the first unit if it exists. You may also specify `u=0` to show the asymmetric
    unit stored in the file.

Visual representation:

  - **p**, **preset** = _presetName_  
    Choose one of the predefined visual configurations: [`p=wire`].  
    Unless you adjust representation details, the preset is chosen automatically (`autoPreset=1`)
    based on a data source and type. In case you change selector, mode, coloring, or material,
    the application will use the `default` preset as a base.

  - **s**, **select** = _selectorString_  
    Select a subset of atoms: [`s=residue+ALA,CYS`].  

  - **m**, **mode** = _modeId_  
    Change display mode: [`m=VW`].

  - **c**, **color** = _coloringId_  
    Change coloring rule: [`c=RT`].

  - **mt**, **material** = _materialId_  
    Change material: [`mt=ME`].

  - **r**, **rep** = _repIndex_  
    Explicitly specify a representation to change: [`r=0&m=BS&r=1&m=TU`].

  - **dup**  
    Duplicate the current representation and continue to modify it: [`dup&m=QS&mt=TR`].

  - **v**, **view** = _encodedView_  
    Restore the view parameters: [`v=1%2Bn4pwTVeI8Erh8LAtVogPZLruL4ZnAtAYhl/Pg%3D%3D`].  
    The encoded string is not human readable and is usually obtained via `miew.view()` API call.

[`l=4xn6`]:             https://miew.opensource.epam.com/?l=4xn6
[`l=cif:4xn6`]:         https://miew.opensource.epam.com/?l=cif:4xn6
[`l=pubchem:serotonin`]:https://miew.opensource.epam.com/?l=pubchem:serotonin
[`t=cif&l=https://files.rcsb.org/view/4XN6.cif`]: https://miew.opensource.epam.com/?t=cif&l=https://files.rcsb.org/view/4XN6.cif
[`l=3s95&u=2`]:         https://miew.opensource.epam.com/?l=3s95&u=2
[`p=wire`]:             https://miew.opensource.epam.com/?p=wire
[`s=residue+ALA,CYS`]:  https://miew.opensource.epam.com/?s=residue+ALA,CYS
[`m=VW`]:               https://miew.opensource.epam.com/?m=VW
[`c=RT`]:               https://miew.opensource.epam.com/?c=RT
[`mt=ME`]:              https://miew.opensource.epam.com/?mt=ME
[`r=0&m=BS&r=1&m=TU`]:  https://miew.opensource.epam.com/?r=0&m=BS&r=1&m=TU
[`dup&m=QS&mt=TR`]:     https://miew.opensource.epam.com/?dup&m=QS&mt=TR
[`v=1%2Bn4pwTVeI8Erh8LAtVogPZLruL4ZnAtAYhl/Pg%3D%3D`]: https://miew.opensource.epam.com/?v=1%2Bn4pwTVeI8Erh8LAtVogPZLruL4ZnAtAYhl/Pg%3D%3D

A complex example follows (whitespaces are for better readability):

[l=cif:1rx1 &  
s=not+hetatm & m=CA & c=SS &  
s=hetatm+and+not+water & m=LC & c=EL &  
s=sequence+6:7,17:19,43:45,62:64,77,95:99 & m=CS & mt=PL &  
bg.color=0xCCCCCC](https://miew.opensource.epam.com/?l=cif:1rx1&s=not+hetatm&m=CA&c=SS&s=hetatm+and+not+water&m=LC&c=EL&s=sequence+6:7,17:19,43:45,62:64,77,95:99&m=CS&mt=PL&bg.color=0xCCCCCC)

  - load 1RX1 in cif format;
  - select "`not hetatm`", set Cartoon mode with Secondary Structure coloring;
  - select "`hetatm and not water`", set Licorice mode with coloring by Element;
  - select residues by their sequential numbers, set Contact Surface mode with the previous coloring (by Element)
    and a Plastic material;
  - set `bg.color` global setting to "`0xCCCCCC`" (set light background).

### Compressed Representations

Instead of specifying representation indices explicitly ([`r=0&m=BS&r=1&m=TU`]) you may omit them
([`m=BS&m=TU`]). In such a case the first index is `rep=0` and it increments each time a duplicate key
is encountered. For example:

  - Mode: [`m=BS&m=QS&mt=TR`],  
    means `(m=BS)` + `(m=QS, mt=TR)`.

  - Coloring: [`c=RT&c=RI&m=TU`],  
    means `(c=RT)` + `(c=RI, m=TU)`.

  - Selector: [`l=4xn6&s=water&c=CH&s=residue+CYS&m=VW&c=AT`],  
    means `(s=water, c=CH)` + `(s=residue CYS, m=VW, c=AT)`.

[`m=BS&m=TU`]:          https://miew.opensource.epam.com?m=BS&m=TU
[`m=BS&m=QS&mt=TR`]:    https://miew.opensource.epam.com/?m=BS&m=QS&mt=TR
[`c=RT&c=RI&m=TU`]:     https://miew.opensource.epam.com/?c=RT&c=RI&m=TU
[`l=4xn6&s=water&c=CH&s=residue+CYS&m=VW&c=AT`]: https://miew.opensource.epam.com/?l=4xn6&s=water&c=CH&s=residue+CYS&m=VW&c=AT

### Mode and Coloring Parameters

Some display modes and coloring algorithms have tuning parameters. You may change their values via
URL. Append an exclamation mark and a comma-separated list of `key:value` pairs to the mode or coloring ID:

  - [`m=BS!atom:0.1,bond:0.05,multibond:0`]  
    set Balls and Sticks mode; ball radius is 0.1 of VDW radius, bond radius is 0.05 Å,
    disable double and triple bonds display;

  - [`c=UN!color:0x00FF00`]  
    set Uniform coloing using green color;

[`m=BS!atom:0.1,bond:0.05,multibond:0`]: https://miew.opensource.epam.com/?m=BS!atom:0.1,bond:0.05,multibond:0
[`c=UN!color:0x00FF00`]: https://miew.opensource.epam.com/?c=UN!color:0x00FF00

