See [AGENTS.md](../AGENTS.md) — single source of truth for full agent instructions, architecture, and design docs.

<!-- CODE COMPLETION CACHE: The rules below are mirrored from AGENTS.md for inline code completion engines that do not load external files. -->

## Core Invariants
- `packages/miew` is framework-agnostic pure ES6+ (Three.js 0.153). Never import React into core.
- `packages/miew-app` and `packages/miew-react` use React 19, Redux Toolkit, and SCSS modules.
- Explicitly dispose Three.js geometries, buffer attributes, and materials on teardown or mode rebuilds to avoid GPU memory leaks.

## Conventions
- PascalCase: Classes, React components, SCSS modules (`ComplexVisual.js`, `AboutPanel.module.scss`).
- camelCase: Utilities, helpers, hooks (`settings.js`, `useViewer.js`).
- Test files: Colocate adjacent to source (`*.test.js`).
