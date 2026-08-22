# AGENTS.md

Guidance for AI coding agents working in the Miew monorepo.

**Living documentation**: When you make a mistake or discover non-obvious behavior, record it in [Lessons Learned](docs/agents/lessons-learned.md). When defining or clarifying domain terms, update [CONTEXT.md](CONTEXT.md).

## Subsystems & Invariants

- **Core Library (`packages/miew`)**: Pure ES6+ / Three.js 0.153 3D visualization engine. Framework-agnostic (never import React). Mutable scene graph and object pooling for 60 FPS performance on large complexes.
- **React Components (`packages/miew-react`)**: Declarative React 19 wrapper component (`<Miew />`).
- **Modern Web App (`packages/miew-app`)**: React 19 + Redux Toolkit + React-Bootstrap web application replacing the legacy demo. Requires responsive mobile and touch support.

## Critical Guardrails & Patterns

- **Framework Isolation**: Never import React or UI framework packages into `packages/miew`.
- **Three.js Resource Disposal**: Explicitly dispose of Three.js geometries, buffer attributes, and materials when destroying or rebuilding visual representation modes to prevent GPU memory leaks.
- **File Naming & Colocation**: PascalCase for class files, React components, and SCSS modules (`AboutPanel.module.scss`). camelCase for utilities (`settings.js`). Colocate test files adjacent to source with `.test.js` suffix.
- **Single Responsibility**: Dedicated, colocated modules for new concerns (components, hooks, utilities, parsers) rather than appending to existing files.

## Context Pointers

- `Architecture`: Data pipeline, package responsibilities, and Three.js scene graph lifecycle → [docs/agents/architecture.md](docs/agents/architecture.md)
- `Code Style`: ESLint 9, SCSS modules, Stylelint 17, testing frameworks, and resource disposal → [docs/agents/code-style.md](docs/agents/code-style.md)
- `Domain Language`: Canonical terminology and forbidden synonyms → [CONTEXT.md](CONTEXT.md)
- `Design System`: Visual tokens, UI architecture, responsive and touch guidelines → [DESIGN.md](DESIGN.md)

## Commands

- Monorepo full CI: `yarn ci`
- Fast core validation: `cd packages/miew && yarn ci-fast`
- Package scripts: `yarn workspace <miew|miew-app|miew-react> <lint|test|build|...>`
- Run project checks through package scripts, not raw tool binaries.

## Git & Commits

- Imperative commit subject line (50 chars or less, no trailing period), e.g. `Add mmCIF secondary structure parser`.
- Keep commits atomic and informative. Preserve clean rebase history; squash only temporary work.
