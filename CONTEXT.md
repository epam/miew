# Miew

High-performance 3D molecular visualization system for rendering chemical structures and macromolecular complexes in WebGL.

## Language

### Chemical Structure

**Complex**:
A complete molecular hierarchy comprising atoms, bonds, residues, chains, and secondary structures.
_Avoid_: Molecule, structure, model

**Residue**:
A monomeric building block within a macromolecular chain, such as an amino acid, nucleotide, or solvent molecule.
_Avoid_: Monomer, unit, component

**Chain**:
A continuous polymer sequence of bonded residues within a Complex.
_Avoid_: Polymer, strand, subunit

**Secondary Structure**:
The local spatial conformation of a macromolecular chain backbone, primarily alpha-helices and beta-sheets.
_Avoid_: Fold, motif

### Visualization

**Viewer**:
The primary 3D WebGL engine and canvas orchestrator controlling scene rendering, cameras, animations, and input events.
_Avoid_: Canvas, player, window

**Representation**:
A visual entity defining how a selected subset of a Complex is rendered, combining a Mode, Colorer, Material, and Selector.
_Avoid_: Visual, style preset, display

**Mode**:
A geometric representation algorithm that generates 3D geometry from chemical topology, such as Cartoon, Lines, Balls & Sticks, or QuickSurface.
_Avoid_: Geometry, shape, style

**Colorer**:
A strategy for assigning color attributes to atoms, residues, or surfaces based on chemical or physical properties.
_Avoid_: Palette, theme, color scheme

**Material**:
A shader and optical surface definition specifying properties such as shininess, roughness, opacity, and wireframe display.
_Avoid_: Shader, texture, finish

**Selector**:
A domain query expression that evaluates and filters atoms and residues within a Complex.
_Avoid_: Filter, query, mask

### Data Pipeline

**Parser**:
A format-specific deserializer that transforms chemical file data into a Complex.
_Avoid_: Reader, importer, decoder

**Loader**:
An I/O provider responsible for retrieving raw molecular data from remote repositories or local sources.
_Avoid_: Fetcher, downloader
