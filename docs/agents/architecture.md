# Architecture

Miew is a high-performance 3D molecular visualization monorepo written in JavaScript/React and WebGL (Three.js), supporting small molecules to massive macromolecular complexes on both desktop and mobile browsers.

## Core Flow

```
+-------------------------------------------------------------+
|             User / Application Layer                        |
|  (packages/miew-app [React 19] | packages/miew-react wrapper) |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                  packages/miew (Core Engine)                |
|                                                             |
|  +----------------+     +-------------------------------+   |
|  |  io/ (Parsers) | --> |  chem/ (Molecular Complex)    |   |
|  |  PDB, CIF, SDF |     |  Atoms, Bonds, Residues       |   |
|  +----------------+     +-------------------------------+   |
|                                         |                   |
|                                         v                   |
|  +----------------+     +-------------------------------+   |
|  | utils/selector | --> |  gfx/ (Graphics Pipeline)     |   |
|  | Jison queries  |     |  Modes + Colorers + Materials |   |
|  +----------------+     +-------------------------------+   |
|                                         |                   |
|                                         v                   |
|  +-------------------------------------------------------+  |
|  | Three.js Scene Graph & Custom WebGL Shaders (Canvas)  |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
```

1. **I/O & Chemical Parsing (`packages/miew/src/io/`, `chem/`)**: Parses input data (PDB, mmCIF, SDF, MOL2, etc.) into a canonical `Complex` molecular data structure (atoms, bonds, residues, chains, secondary structures).
2. **Selection & Representation Pipeline (`packages/miew/src/utils/`, `gfx/`)**: Evaluates atom selection queries (parsed with Jison) and applies visual representations consisting of a geometric **Mode** (Lines, Tube, Cartoon, QuickSurface, etc.), **Colorer** (Element, Chain, Residue, etc.), and **Material** (Shiny, Dull, etc.).
3. **Graphics Engine (`packages/miew/src/gfx/`)**: Builds Three.js geometries, instanced meshes, and custom WebGL shaders rendered on a hardware-accelerated canvas.
4. **App & Integration Layer (`packages/miew-react/`, `packages/miew-app/`)**: Provides a React component wrapper and a feature-rich React 19 application with Redux Toolkit state management and responsive controls.

## Key Packages & Modules

- **`packages/miew`**: Framework-agnostic core library and 3D molecular engine.
  - `src/chem/`: Domain entities and chemical topology (`Complex.js`, `Atom.js`, `Bond.js`, `Residue.js`, `Chain.js`).
  - `src/gfx/`: Visual representation subsystem, rendering modes, colorers, materials, custom shaders, and Three.js scene orchestration (`ComplexVisual.js`, `modes/`, `colorers/`, `materials/`).
  - `src/io/`: Format loaders and parsers (`parsers/`, `loaders/`, `exporters/`).
  - `src/ui/`: Built-in DOM overlays, terminal commands, and toolbars (`MiewUI.js`).
  - `src/utils/`: General math, geometry utilities, and Jison selector grammar (`selector/`).
  - `demo/`: Legacy web viewer demo (kept for compatibility; not actively extended).
  - `examples/`: Standalone integration samples (Webpack, Browserify, HTML).
- **`packages/miew-react`**: React 19 component library wrapping the core `Miew` instance into a declarative `<Miew />` element.
- **`packages/miew-app`**: Modern React 19 demo application replacing the legacy demo. Built with Redux Toolkit, React-Bootstrap, SCSS modules, and mobile/touch responsiveness.

## Architectural Invariants & Patterns

- **Framework-Agnostic Core**: `packages/miew` must remain pure JavaScript/ES6+ and must never import React or application-specific dependencies.
- **Mutable High-Performance State in Core vs Declarative UI**: Core graphics manipulation uses mutable scene graphs and object pooling for 60 FPS performance on 100k+ atom complexes. UI layers (`miew-app`) use immutable Redux state.
- **Pluggable Representation System**: Visual representations are composed of 4 orthogonal parts: `Mode` (geometry), `Colorer` (vertex colors), `Material` (shading/shininess), and `Selector` (atom query).
- **Mobile & Touch Support**: Touch gestures, viewport scaling, and WebGL resource constraints on mobile devices must be supported across all packages.

## Workspace Structure

```
miew/
├── packages/
│   ├── miew/             # Core 3D molecular viewer engine
│   │   ├── src/          # chem/, gfx/, io/, ui/, utils/
│   │   ├── demo/         # Legacy demo application
│   │   ├── examples/     # Integration examples
│   │   └── test/         # Unit and E2E visual regression tests
│   ├── miew-react/       # React 19 wrapper component
│   │   ├── src/          # React component source
│   │   └── types/        # TypeScript declarations
│   └── miew-app/         # Modern React 19 demo application
│       └── src/          # Redux store, components, SCSS modules
└── docs/                 # Agent documentation, architecture, plans
```

