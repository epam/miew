# Skills Config

Decisions from the setup interview. Engine skills (`bootstrap-agents-md`, `design-md`) read this file first; anything recorded here is settled — do not re-ask it. Re-run `setup` to revise a decision.

## Harness

- Target harness(es): all (Universal AGENTS.md + .agents/skills/ for Antigravity, Claude Code, Cursor, Codex, Copilot)
- Skills directory: .agents/skills/
- CLAUDE.md strategy: stub file

## Docs

- Docs root: docs/
- Plans: docs/plans/
- Release notes: docs/release.md

## Tracker

- Issue tracker: github
- Conventions worth encoding: GitHub Issues and PRs; prefer preserving clean commit history (rebase and non-ff merge) and squash only if commit history is messy or rewrite commits; imperative commit message subject (<= 50 chars, no trailing period), descriptive body when needed.

## Design

- Frontend detected: yes (React 19 + React-Bootstrap + SCSS in `packages/miew-app`, React wrapper component in `packages/miew-react`, legacy demo in `packages/miew/demo`)
- design-md mode: A document
- Notes: `packages/miew/demo` is legacy and not updated; `packages/miew-app` is the modern React-based replacement; responsive design and mobile/touch device support is a must.

## Domain

- CONTEXT.md: seeded — terms confirmed in interview
- Domain notes: Complex is a molecular complex (chemical data structure of one or more related/interacting molecules containing atoms, bonds, residues, chains, and secondary structures).
