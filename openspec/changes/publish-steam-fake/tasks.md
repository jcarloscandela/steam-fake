# Tasks

## 1. Package metadata and build contract

- [x] 1.1 Set `version` to `0.0.1`, remove `private`, add `license/licenseFile`, `author`, `repository/homepage/bugs`, `keywords`, `publishConfig.access=public`, and `prepublishOnly` gate in `package.json`, then verify `pnpm install` and `npm pkg get` show the new fields
- [x] 1.2 Review `files` whitelist vs `.npmignore`, trim duplication, and verify with `npm pack --dry-run` that only `dist`, `README.md`, `LICENSE`, `package.json` are packed
- [x] 1.3 Run `pnpm build` and verify `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts` exist and a scratch ESM + CJS import of the packed tarball both resolve with types

## 2. Contributor governance

- [x] 2.1 Create `AGENTS.md` with 0.x versioning policy (minor = feat-or-breaking, patch = fix, `1.0.0` reserved), per-change bump + changelog rule, `pnpm check` gates, and OpenSpec workflow, then verify every rule maps to a `contributor-governance` spec scenario
- [x] 2.2 Create `CHANGELOG.md` with `0.0.1` baseline entry noting the reset from unpublished `0.1.0`, and verify `openspec validate --strict` passes
- [x] 2.3 Update `README.md` status section (public install, scope limits, adapter boundary, non-goals) and verify `pnpm test` still passes `src/readme.test.ts`

## 3. GitHub and release pipeline

- [x] 3.1 Create initial commit on `main`, add GitHub remote, push with `git status` clean, and verify `git log --oneline` and `git remote -v` show the expected state
- [x] 3.2 Check `npm view steam-fake` availability, document fallback scope if taken, and verify the chosen name in `package.json`
- [x] 3.3 Add CI publish workflow with provenance (`pnpm check` + `pnpm build` + publish on tag `v*`) and verify with a dry-run or `actionlint` equivalent
- [ ] 3.4 Tag `v0.0.1`, publish with `--provenance --access public`, and verify install from registry in a scratch directory

## 4. Integration readiness verification

- [x] 4.1 Verify `dist/*.d.ts` contains no `paths` alias leakage and `pnpm check` (typecheck + format:check + lint + test) is fully green
- [x] 4.2 Draft the consumer-side adapter interface note for `steam-cards-bot` (mapping table fake ⇄ Steam shapes) as docs only, and verify each row traces to a `consumer-contract` requirement

## Workflow follow-up

- Archive the change after review and confirm specs land under `openspec/specs/`.
- File a follow-up change in `steam-cards-bot` to implement the async test adapter against `steam-fake@0.0.1`.
