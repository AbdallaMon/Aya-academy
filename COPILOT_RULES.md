## Copilot Rules — Project Standards (must/should)

Overview
- These are mandatory rules for making changes in this repository. Follow them strictly unless a reviewer gives explicit approval for exceptions.

Must (required)
- Must follow existing architecture and folder structure. Do not move or rename unrelated files.
- Must not invent APIs, endpoints, or server modules that do not exist in the repo.
- Must keep changes minimal and focused to the requested task.
- Must include a concise description of changes and a testing checklist with every PR.

Should (recommended)
- Should use strict TypeScript types. Avoid `any`; when unavoidable, justify in code comments and PR description.
- Should place feature types in a `types.ts` file inside the feature, and shared types in `src/shared/types`.

Naming & structure
- Should follow existing patterns under `app/src/features/*` and `Server/modules/*`.
- For new frontend features, create:
	- `index.tsx`, `types.ts`, `service.ts`, `components/`, and `hooks/` if needed.
- For new server modules, follow the pattern:
	- `<module>.routes.ts`, `<module>.service.ts`, `<module>.validators.ts`, `<module>.types.ts`.

Good vs Bad examples
- Good: Add `app/src/features/notes/index.tsx`, a `service.ts` that uses `shared/lib/fetchers/get.ts`, and small components under `components/`.
- Bad: Add new endpoints on the server without registering routes or add logic to unrelated files; large, unreviewed refactors.

Safety and no-breaking-change rules
- Must not introduce breaking changes to public APIs without versioning and documentation.
- Must not remove fields or change response shapes consumed by existing clients without coordinated updates.
- Must run typecheck and lint before finalizing a change.

Checklist (required before finishing any task)
- Typecheck: `npm run build` or `tsc` (relevant workspace).
- Lint: `npm run lint` in `app/` and server lint if configured.
- Manual smoke test: run frontend (`npm run dev` in `app/`) and server (`npm run dev` in `Server/`) if the change affects runtime behavior.
- Tests: run unit/integration tests if present.
- Files changed: include a list of modified files in PR description.

PR description requirements
- Brief summary of intent.
- Files changed and rationale.
- How to test manually (commands and quick checklist).
- If any `any` or type relaxations are used, explain why and where.

When in doubt
- If you are unsure about a change that touches architecture, ask for a design review before implementing.

