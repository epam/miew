# Getting Started with Miew Development: The Beginner's Guide

Copyright (c) 2015–2025 [EPAM Systems, Inc.](https://www.epam.com/)

![Miew screenshot](https://github.com/epam/miew/raw/master/README.png)

Table of contents:

<!-- TOC depthFrom:2 depthTo:6 withLinks:1 updateOnSave:1 orderedList:0 -->

- [Getting Started with Miew Development: The Beginner's Guide](#getting-started-with-miew-development-the-beginners-guide)
  - [Project Overview](#project-overview)
    - [Web Application](#web-application)
    - [Embeddable Component](#embeddable-component)
    - [Display Modes](#display-modes)
    - [Source Data](#source-data)
  - [Biochemistry](#biochemistry)
    - [Proteins](#proteins)
    - [Nucleic Acids](#nucleic-acids)
  - [Development Tools](#development-tools)
    - [Git](#git)
    - [Node.js](#nodejs)
    - [JavaScript](#javascript)
    - [IDE](#ide)
  - [Usage](#usage)

<!-- /TOC -->

Quick Links:

-   promo site: <https://epa.ms/miew/>
-   demo-application: <https://miew.opensource.epam.com/>
-   source code: <https://github.com/epam/miew/>

Disclaimer: this text was written in 2018 for students that likely didn't know
much about Git, JavaScript, et al. In 2023 we translated it in English as-is,
so some passages may sound archaic or outdated now. Still, it contains
a pretty good background overview and introduction to Miew development.


## Project Overview

### Web Application

Miew --- is an application that allows you to view three-dimensional images
of molecules directly in a web browser, manipulate them, analyze various
characteristics. It is primarily concerned with complex biological molecules: 
[proteins][] and [nucleic acids][] (DNA, RNA). Of course, other
chemical compounds can be displayed. In the program, 
it is possible to view not just individual molecules, but entire molecular
complexes/structures that consist of interacting proteins, RNA/DNA and small
molecules ([ligands][]). In this way, users can visualize how the different
parts of the molecules are arranged in space relative to each other, and what
interactions are possible between them.

> Example of a complex structure: [Nucleosome Particles in Complex with DNA-binding Ligands][].

[proteins]: https://en.wikipedia.org/wiki/Protein
[nucleic acids]: https://en.wikipedia.org/wiki/Nucleic_acid
[ligands]: https://en.wikipedia.org/wiki/Ligand_(biochemistry)
[Nucleosome Particles in Complex with DNA-binding Ligands]: https://miew.opensource.epam.com/?l=1M19&v=1Vo4FwggsB8JxfTXCR/aAPGbfmz84oF09uY4UvA%3D%3D


### Embeddable Component

At the same time, Miew is not only a full-fledged application, but also a
separate library that provides the same molecular viewing capabilities, 
designed to be integrated into third-party products as a component. This 
embedding functionality allows to extend the scope of the application by 
making Miew a visualization element in more complex scientific programs.

Both the component itself and the demonstration application are designed 
with an eye toward [adaptive web design][] to be equally usable on devices 
with different screen sizes, from smartphones to large monitors. We support 
the latest versions of all [modern browsers][] for desktop and mobile 
platforms.

> Example of embedding a component: [Miew in a Responsive Grid Layout][].

[adaptive web design]: https://en.wikipedia.org/wiki/Responsive_web_design
[modern browsers]: https://browsehappy.com/
[Miew in a Responsive Grid Layout]: https://miew.opensource.epam.com/examples/grid.html


### Display Modes

When dealing with small molecules, it's common to represent atoms as spheres 
and bonds between them as cylinders using the [Balls and Sticks][] mode. The 
size of the spheres can also be adjusted to reflect the ["size" of the atom][]. 
However, when studying larger molecules like proteins, the arrangement of 
individual atoms isn't as crucial. Instead, it's more important to focus on 
the groups of atoms, or [monomers][], that make up the polymer and their typical 
configurations. In the "Cartoon" mode, these monomers can be connected by 
segments or a smooth spline of varying thickness to display their [secondary structure][]. 
Additionally, researchers may find it useful to view the ["surface" of the molecule][], 
which is also an available mode. Finally, there are various other supported data 
formats and modes for molecule display.

It is possible to display either the entire molecule or only a specific portion of it. 
The constructed geometry can be colored in a variety of ways, providing additional 
details such as the chemical element or monomer type, as well as characteristics 
like temperature factor or [hydrophobicity][]. These settings, including mode, 
coloring, and subset of atoms, comprise a data _representation_. Different representations can be merged 
to present various sections of the molecule in different modes.

> Example of combination of representations: [Hemoglobin][].

[Balls and Sticks]: https://en.wikipedia.org/wiki/Ball-and-stick_model
["size" of the atom]: https://en.wikipedia.org/wiki/Van_der_Waals_radius
[monomers]: https://en.wikipedia.org/wiki/Monomer
["surface" of the molecule]: https://en.wikipedia.org/wiki/Accessible_surface_area
[hydrophobicity]: https://en.wikipedia.org/wiki/Hydrophobicity_scales
[Hemoglobin]: https://miew.opensource.epam.com/?l=2hhb&m=TU&c=CH&m=CS&c=UN!color:0xFF00&mt=TR&s=chain+A&s=sequence+52:72&m=TU!radius:0.8&c=UN!color:0xFF0000&s=sequence+52:72+and+not+name+C,N,O&m=LC&c=EL&mt=ME


### Source Data

Source data for the visualization are files that contain atom coordinates along 
with other essential information. Multiple file formats exist, but for 
proteins, the [Protein Data Bank][] serves as a centralized database. This 
database gathers results from [crystallography][] experiments of molecular 
complexes and assigns them unique identifiers of four letters and digits. For 
instance, one of the smallest protein, [crambin][], is identified as [1CRN][] 
and consists of 327 atoms, while a huge ribosome is stored as
[4V88][] and has over 400,000 atoms. Importantly, the same molecules can appear 
in the database multiple times, each with different coordinates from various 
experiments conducted by different individuals. For example, the crambin protein 
is found in more than ten coordinate files, including 1CRN, 1EJG, 3NIR, and so on.

The primary format used in the protein bank is text [PDB][], but it has its 
limitations in terms of the number of atoms and residues. As a result, it has 
been replaced by the more verbose [CIF][] and binary 
[BCIF][]. To load data directly from the bank, Miew supports using the unique 
identifier (`1CRN`) and a format specifier (`cif:1CRN`, `pdb:1CRN`).

Small molecules can be found in various formats such as [MOL/SDF][], CML, or 
others. The [PubChem][] site is the primary source for coordinate files of common 
chemical compounds. With Miew, you can easily load data by entering the compound 
name. For example, `pc:aspirin` will load the 3D coordinates of [aspirin][].

Miew is capable of supporting a distinct type of raw data - volumetric [electron density][] 
data, which is stored as a three-dimensional [scalar field][] in [CCP4][] format, 
for instance. The corresponding electron density file for certain 
proteins from the Protein Data Bank can be loaded effortlessly using their identifier, 
such as `ccp4:3C9L`.

Moreover, Miew permits loading data from a local file or requesting it through a 
specific URL. Future plans include supporting [numerous formats][] and even other 
data types, such as loading 3D geometry in widely used formats.

[Protein Data Bank]: http://www.rcsb.org/
[crystallography]: https://en.wikipedia.org/wiki/X-ray_crystallography
[crambin]: https://en.wikipedia.org/wiki/Crambin
[1CRN]: https://www.rcsb.org/structure/1crn
[4V88]: https://www.rcsb.org/structure/4v88
[PDB]: http://www.wwpdb.org/documentation/file-format-content/format33/v3.3.html
[CIF]: http://mmcif.wwpdb.org/
[BCIF]: https://github.com/molstar/BinaryCIF
[MOL/SDF]: http://www.wwpdb.org/documentation/file-format-content/format33/v3.3.html
[PubChem]: https://pubchem.ncbi.nlm.nih.gov/
[aspirin]: https://pubchem.ncbi.nlm.nih.gov/compound/2244
[electron density]: https://en.wikipedia.org/wiki/Electron_density
[scalar field]: https://en.wikipedia.org/wiki/Scalar_field
[CCP4]: http://structure.usc.edu/ccp4/
[numerous formats]: https://en.wikipedia.org/wiki/Chemical_file_format


## Biochemistry

### Proteins

[Proteins][] are macromolecules (hundreds to hundreds of thousands of atoms) that
perform many functions in a living organism. They represent
long [polymer chains][], consisting of [amino acid residues][],
possibly compactly folded in space. There are 21 basic
amino acids, each of them has a similar structure, differing only in the "tail".
Each amino acid has a name, as well as abbreviation of three-letter and
single-letter code for ease of notation.

Amino acids are linked to each other by [peptide bonds][] in linear
chains (these are ordinary [covalent bonds][] like most others in a molecule).
A given sequence of amino acids in a protein (e.g. `Phe Leu Ser Cis...`)
called the [primary structure][] of the protein.

Being located in space, the residues hold on to each other by [hydrogen
bonds][], forming the characteristic configurations that make up the [secondary
structure][] of a protein: [helices][], [layers][], turns, loops... In general
it is impossible to predict in advance which secondary structures
forms protein when folded.

The [alpha-carbon][], located at the center of each amino acid, serves as 
the starting point for the residue. Some data files for large molecules contain only coordinates 
for these atoms, as it is difficult to reconstruct the rest of the molecule's 
coordinates with low measurement accuracy.

Video tutorials:

1.  [Introduction to Biochemistry](https://youtu.be/CHJsaq2lNjU)
2.  [Amino Acids](https://youtu.be/J6R8zDAl_vw)
3.  [Protein Structure](https://youtu.be/EweuU2fEgjw)

[proteins]: https://en.wikipedia.org/wiki/Protein
[polymer chains]: https://en.wikipedia.org/wiki/Polymer
[amino acid residues]: https://en.wikipedia.org/wiki/Amino_acid
[peptide bonds]: https://en.wikipedia.org/wiki/Peptide_bond
[primary structure]: https://en.wikipedia.org/wiki/Protein_primary_structure
[hydrogen bonds]: https://en.wikipedia.org/wiki/Hydrogen_bond
[secondary structure]: https://en.wikipedia.org/wiki/Protein_secondary_structure
[helices]: https://en.wikipedia.org/wiki/Alpha_helix
[layers]: https://en.wikipedia.org/wiki/Beta_sheet
[alpha-carbon]: https://en.wikipedia.org/wiki/Alpha_and_beta_carbon


### Nucleic Acids

Proteins are built using the genetic information stored in DNA. DNA is a pair of 
helical [polymer chains][] composed of hundreds of millions of [nucleotides][] of four types: 
cytosine (C), guanine (G), adenine (A), and thymine (T). The chains of nucleotides are 
paired together by [hydrogen bonds][], specifically G-C and A-T. 

Most of the DNA is non-coding, and only small sections, called [genes][], are 
utilized in the creation of RNA during transcription. [RNA][] is then used 
in the subsequent construction of proteins during translation. [Codons][] are 
triplets of nucleotides in RNA that correspond to one amino acid residue. Some 
triplets encode the same amino acids, while others are service commands such as 
start and stop codons.

Errors can occur during DNA [replication][], both randomly and induced. Some 
of these errors are automatically corrected, while others lead to [mutations][]. 
These mutations can range from harmless to slightly altering the protein's 
function in the body. In some cases, mutations can cause a stop codon, leading 
to the loss of a portion of the protein.

Video tutorials:

1.  [DNA and RNA](https://youtu.be/6NhDY3IDp00)
2.  [From DNA to Protein](https://youtu.be/bKIpDtJdK8Q)

[nucleotides]: https://en.wikipedia.org/wiki/Nucleotide
[genes]: https://en.wikipedia.org/wiki/Gene
[Codons]: https://en.wikipedia.org/wiki/Genetic_code
[replication]: https://en.wikipedia.org/wiki/DNA_replication
[mutations]: https://en.wikipedia.org/wiki/Mutation


## Development Tools

To effectively contribute to the project's development, it would be beneficial 
to review the file labeled [CONTRIBUTING.md][] as it outlines essential 
suggestions and requests for the working process.

[CONTRIBUTING.md]: https://github.com/epam/miew/blob/master/CONTRIBUTING.md


### Git

Source code is meant to be stored in a [version control system][].
We use [Git][] for this, while [GitHub][] serves as the
main repository. You should install the following applications for successful 
work: 

-   [GitHub Desktop][] and/or [SourceTree][] as a friendly user interface for git,
-   [Git for Windows][] if you prefer to work  in command line in Windows (see 
[Git Downloads][] for other OS).

What to read in addition:

-   [Pro Git Book](https://git-scm.com/book/en/v2),
-   [GitHub Guides](https://guides.github.com/).

[version control system]: https://en.wikipedia.org/wiki/Version_control
[Git]: https://git-scm.com/
[GitHub]: https://github.com/epam/miew
[GitHub Desktop]: https://desktop.github.com/
[SourceTree]: https://www.atlassian.com/software/sourcetree
[Git for Windows]: https://gitforwindows.org/
[Git Downloads]: https://git-scm.com/downloads


### Node.js

Our project runs solely on the client-side, meaning that all of its code is 
executed in the browser. To achieve this, we utilized [JavaScript][], a scripting 
language specifically designed for this purpose. Over time, this language has 
evolved and is now a fully-fledged general-purpose [scripting language][], alongside 
[Python][], [Ruby][], and [Perl][]. JavaScript programs can now be executed 
not only in browsers but also in command line through an interpreter/compiler.

Why do we use JavaScript in command line? The reason is that there are certain tasks involved 
in project development and preparation for publication that can be automated. 
This automation can either be integrated into the development environment (IDE) 
or implemented independently using a scripting language. [Windows Batch Files][] 
or [Linux Shell Scripts][] are not portable to other platforms. So why not use 
JavaScript, which you are already familiar with and using for your project, 
instead of Python or Perl?

[Node.js][] is a platform that comes in handy as it provides an interpreter 
and execution environment for JavaScript scripts. The platform offers a standard 
library of functions, and you can also leverage third-party libraries (packages) 
that are available through the Node.js Package Manager ([NPM][]) repository. You 
can even create your own package that depends on others, implementing some useful 
functionality - which is what we did with [Miew][].

JS is used for building projects as well as for the project itself in 
the browser. You can use NPM to load third-party packages or opt for the alternative 
[Yarn][] manager, which works with the same repository but is faster and better. 
For more information on building the project, refer to [CONTRIBUTING.md][].

[JavaScript]: https://en.wikipedia.org/wiki/JavaScript
[scripting language]: https://en.wikipedia.org/wiki/Scripting_language
[Python]: https://www.python.org/
[Ruby]: https://www.ruby-lang.org/
[Perl]: https://www.perl.org/
[Windows Batch Files]: https://en.wikipedia.org/wiki/Batch_file
[Linux Shell Scripts]: https://en.wikipedia.org/wiki/Shell_script
[Node.js]: https://nodejs.org/
[NPM]: https://www.npmjs.com/
[Miew]: https://www.npmjs.com/package/miew
[Yarn]: https://yarnpkg.com/


### JavaScript


JS is a general purpose object-oriented scripting language. A program
in this language, when executed, is compiled into an intermediate representation, and
then executed in the virtual machine, whether in the browser or from the command line.

The language uses an unusual approach to the object-oriented paradigm, 
unlike C++, there are no classes in the original sense of the word, 
instead everything is built on [prototype objects][]. The language evolved. 
The syntax of the language was changed to add the `class` keyword and much more for
developers with C++ or Java-like background. It looks as if there are classes now.
**Note!** The approach to object-oriented programming has not changed, it 
is still prototype.

You will often see two language standards mentioned.

- Old ES5 (ECMAScript) which is supported by all browsers except 
	very ancient IE. This is the basic syntax.

- New ES6, ES2015, ES2015+ which is supported by browsers [but not all and not completely][].
At the same time, it constantly is developing. Every year 
[new features are added][] to the language, passing complex and lengthy [selection and approval process][].

To write portable programs, you either have to use the old standard
ES5 language, or write in a new language and use "transpilers" --- a kind of
compilers that translate from one language to another. An example is
[Babel.js][], which is now used in our project. Basically Miew code
was written in ES5, and is now being translated to ES2015+ (as
necessary and possible).

Useful links to study:

-   [Modern Javascript Tutorial](https://learn.javascript.ru/) (in Russian).
-   [Eloquent JavaScript](http://eloquentjavascript.net/).
-   [JavaScript best practices](https://www.w3.org/wiki/JavaScript_best_practices).
-   [Learn ES2015](https://babeljs.io/learn-es2015/).

[prototype objects]: https://en.wikipedia.org/wiki/Prototype-based_programming
[but not all and not completely]: http://kangax.github.io/compat-table/es6/#ie11
[new features are added]: https://github.com/tc39/proposals
[selection and approval process]: https://tc39.github.io/process-document/
[Babel.js]: https://babeljs.io/


### IDE

In principle, for development it is enough to write text in Notepad, compile from
command line with npm scripts, and debug the program with built-in browser
means. A more convenient solution is to use a suitable development environment.

A good development environment for web projects is, for example, [WebStorm][] from
JetBrains. This is a commercial program that requires a personal or corporate
license. At the same time, for academic projects, students are offered
[free license][], which can be renewed every year while you study.

> ...use software for [non-commercial, educational purposes only][], including
> conducting academic research or providing educational services.

If you do not have a license for WebStorm, or your task does not fit its conditions,
then you should choose an alternative development environment. For example, editors with
open source [Visual Studio Code][] or [Atom][] (they, by the way,
themselves written in JavaScript).

[WebStorm]: https://www.jetbrains.com/webstorm/
[free license]: http://www.jetbrains.com/student/
[non-commercial, educational purposes only]: http://www.jetbrains.com/student/license_educational.html
[Visual Studio Code]: https://code.visualstudio.com/
[Atom]: https://atom.io/


## Usage

Here should be an example of Miew usage...
