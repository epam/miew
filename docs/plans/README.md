# Plans

Durable implementation plans live here as `docs/plans/<kebab-feature>.md`.

Ephemeral single-session planning may use a root `PLAN.md`; anything spanning sessions or reviewers belongs here.

Plan structure:

- **Summary**: 1-2 sentences on the task and chosen approach
- **Context**: key findings — existing patterns, relevant files, constraints
- **System Impact**: how the change affects source of truth, data flow, lifecycle
- **Approach**: high-level design decision and why
- **Changes**: `path/to/file.ts` — what changes and why (one bullet per file)
- **Verification**: how to test end-to-end, relevant test commands, edge cases
