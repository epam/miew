# Lessons Learned

Hard-won knowledge from building this codebase. When you make a mistake or discover non-obvious behavior, record it here.

## Architecture & Subsystems

- **Core Framework Agnosticism**: Never import React or frontend framework packages into `packages/miew`. The core viewer must remain a standalone, framework-agnostic WebGL library.
- **Legacy Demo vs Modern App**: `packages/miew/demo/` contains the legacy demo and is not actively developed. All new UI features and modern demo capabilities belong in `packages/miew-app` (React 19).
- **Selector Grammar Compilation**: The selection query parser in `packages/miew/src/utils/selector/` is generated using Jison. When modifying `.jison` grammar files, run `yarn jison` to regenerate the parser.

## WebGL & Performance

- **GPU Memory Management**: Three.js geometries, buffer attributes, and materials must be explicitly disposed of via `.dispose()` when complex visuals or representation modes are destroyed or rebuilt.
- **Mobile & Touch Devices**: Always account for touch gestures, device pixel ratios, and mobile WebGL hardware limitations in viewer controls and UI layout.

## Tooling & Workflows

- **CLI Markdown Hygiene**: When passing multi-line Markdown or text containing backticks and code blocks to CLI tools (such as `gh issue create` or `gh issue comment`), write to a temporary file first and use `--body-file <path>` (or API `-F body=@<path>`) to prevent shell character mangling across different terminal environments.

