# npm-distribution Specification

## Purpose

Makes steam-fake installable as a public versioned npm package with a stable dual-module build so any consumer can depend on it in integration tests.

## Requirements

### Requirement: Package is public and installable

The system SHALL ship as a public npm package that installs with `pnpm add -D steam-fake` and resolves the `steam-fake` specifier without git URLs or file paths.

#### Scenario: Install from registry

- **WHEN** a consumer runs `pnpm add -D steam-fake@0.0.1` against the npm registry
- **THEN** the install succeeds and `package.json` records a semver dependency

#### Scenario: No private flag blocks publish

- **WHEN** the maintainer runs `pnpm publish --dry-run`
- **THEN** the command does not fail on a `private` restriction

### Requirement: Package metadata identifies the project

The system SHALL declare license MIT, repository, homepage, bugs, keywords, engines, and public access so the registry page is complete and provenance can be verified.

#### Scenario: Registry page is complete

- **WHEN** a user opens the published package page
- **THEN** license, repository link, homepage, and keywords are visible

### Requirement: Dual-module build artefacts are shipped

The system SHALL ship `dist/index.js` (ESM), `dist/index.cjs` (CJS), and `dist/index.d.ts` types behind the `exports["."]` map, with only `dist`, `README.md`, and `LICENSE` packed.

#### Scenario: Import from ESM and CJS

- **WHEN** a consumer imports `steam-fake` from an ESM project and requires it from a CJS project
- **THEN** both resolve to the built entry points with working types

#### Scenario: Packed files are minimal

- **WHEN** the maintainer runs `npm pack --dry-run`
- **THEN** the file list contains only `dist`, `README.md`, `LICENSE`, and `package.json`

### Requirement: Prepublish gate prevents broken releases

The system SHALL run typecheck, format check, lint, tests, and build before any publish so a red tree cannot be released.

#### Scenario: Broken tree blocks publish

- **WHEN** tests fail and the maintainer runs the prepublish gate
- **THEN** the publish aborts before contacting the registry
