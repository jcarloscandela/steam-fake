# contributor-governance Specification

## Purpose

Defines contributor rules owned by AGENTS.md for 0.x versioning, per-change bumps, and quality gates so every release is traceable and repeatable.

## Requirements

### Requirement: Zero-x versioning policy is documented

The system SHALL document that in `0.Y.Z` the minor `Y` covers both features and breaking changes, patch `Z` covers compatible fixes, and `1.0.0` is reserved for a stable API.

#### Scenario: Contributor picks a version

- **WHEN** a contributor lands a breaking test-API rename before `1.0.0`
- **THEN** the documented rule directs a minor bump (for example `0.1.0` to `0.2.0`), not a major bump

#### Scenario: Fix picks a patch

- **WHEN** a contributor lands a compatible bug fix
- **THEN** the documented rule directs a patch bump (for example `0.2.0` to `0.2.1`)

### Requirement: Every change bumps the version

The system SHALL require that each OpenSpec change that alters runtime behaviour or the public surface also bumps `package.json` version and adds a `CHANGELOG.md` entry.

#### Scenario: Change without bump is rejected

- **WHEN** a change modifies `src/` but leaves version and changelog untouched
- **THEN** review guidance in `AGENTS.md` marks it incomplete

### Requirement: Quality gates are mandatory

The system SHALL require `pnpm check` (typecheck plus format check plus lint plus tests) to pass before commit and before publish.

#### Scenario: Unformatted code fails the gate

- **WHEN** a contributor commits unformatted sources
- **THEN** the format check step fails with the offending files listed
