# Code Style & Patterns

Coding conventions, tooling standards, and testing patterns for the Miew monorepo.

## Package Manager & Tooling

- **Yarn 3 (Berry)**: Workspaces enabled (`packages/*`). Run commands via `yarn workspace <pkg> <script>` or from package directories.
- **Node.js**: Targets Node 22, 24, 26.

## JavaScript & React Conventions

- Follow the **Airbnb JavaScript Style Guide** via ESLint 9.
- Use modern ES6+ features (arrow functions, destructuring, template literals, optional chaining).
- In `packages/miew` (core):
  - Framework-agnostic pure ES6+.
  - Class-based architecture for chemical entities, visualizers, parsers, and loaders.
  - Event-driven communication using `EventDispatcher`.
- In `packages/miew-app` & `packages/miew-react`:
  - Functional React 19 components with React hooks.
  - Redux Toolkit for centralized UI and viewer state management.
  - PropTypes and TypeScript definitions (`types/index.d.ts`) for public API contracts.

## Formatting & Styling

- **SCSS**: Stylelint 17 with `stylelint-config-standard-scss`.
- **CSS Modules**: `.module.scss` for scoped component styling in `miew-app`.
- **Prettier**: Configured in `miew-react`. Run `yarn lint-fix` to auto-format.

## Naming Conventions

- **Files & Components**:
  - Class files and React components: PascalCase (e.g. `ComplexVisual.js`, `AboutPanel.jsx`, `Miew.js`).
  - SCSS Modules: PascalCase (e.g. `AboutPanel.module.scss`).
  - Helper functions and utilities: camelCase (e.g. `settings.js`, `palette.js`).
- **Variables & Functions**: camelCase (e.g. `rebuildObjects()`, `currentSelection`).
- **Constants & Enums**: UPPER_SNAKE_CASE for true constants (e.g. `DEFAULT_SETTINGS`, `MAX_ATOMS`).

## Error Handling & Memory Management

- **Parser & Loader Safety**: Validate and sanitize input streams in `src/io/parsers/`. Handle malformed records gracefully without halting the WebGL render loop.
- **WebGL / Three.js Resource Disposal**: Explicitly dispose of Three.js geometries, buffer attributes, and materials when destroying or rebuilding representation modes to prevent GPU memory leaks.

## Testing

- **Core Library (`packages/miew`)**:
  - Test Runner: Mocha with Chai assertions and NYC for coverage.
  - Commands: `yarn test`, `yarn test-cover`, `yarn test:e2e` (visual regression).
- **React Packages (`miew-app`, `miew-react`)**:
  - Test Runner: Jest with `@testing-library/react`.
  - Commands: `yarn test`, `yarn test-cover`.

## Commits & History

- See [AGENTS.md](../../AGENTS.md) for commit message and history conventions (single source of truth).

