# Server Guide — Ayah Server

Reference
- See the server sketch at [Server/Readme.md](Server/Readme.md#L1) which documents module layout and conventions.

Key technologies (detected)
- Runtime: Node + TypeScript. See [Server/package.json](Server/package.json#L1).
- HTTP framework: Express (v5) with middleware patterns.
- DB: Prisma ORM (see `Server/prisma` and `prisma.config.ts`).
- Auth: JWT via `jsonwebtoken` and password hashing via `bcrypt`.

Project structure (observed)
- `Server/src` — application entry (`server.ts`, `app.ts`).
- `Server/middlewares` — auth, error, validation middleware (files referenced in [Server/Readme.md](Server/Readme.md#L1)).
- `Server/modules` — feature modules (pattern: `auth/`, `chat/`, etc.). Each module typically contains route, service, validators, and types.
- `Server/routes` — route wiring.
- `Server/prisma` & `prisma.config.ts` — Prisma setup.

How modules are structured (recommended to follow existing pattern)
- Routes: `modules/<module>/<module>.routes.ts` — express Router exposing endpoints.
- Controller / handler (optional): `modules/<module>/<module>.controller.ts` — lightweight request/response mapping.
- Service: `modules/<module>/<module>.service.ts` — business logic, DB calls, transactions.
- Validators: `modules/<module>/<module>.validators.ts` — request validation schemas.
- Types: `modules/<module>/<module>.types.ts` — module-specific types & DTOs.

Auth + RBAC approach
- JWT: tokens are issued and validated by middleware (`auth.middleware.ts`).
- Roles are defined under `shared/constants/roles.ts` (see server sketch). Enforce RBAC in services/middleware; do not rely on frontend for security.

Error handling & response format
- Centralized error middleware exists (`error.middleware.ts`) that maps thrown errors to structured responses — follow `ApiError` and `response.ts` utilities (see server sketch).
- Services should throw `ApiError` (or similar) for known error conditions; middleware converts them to HTTP status and JSON.

Prisma & DB patterns
- Use the Prisma client instance (pattern in `Server/prisma/client.ts` or via `prisma.config.ts`).
- Keep transactional logic inside service layer; use Prisma transactions for multi-step operations.
- Prefer explicit selects and typed results to avoid leaking unwanted fields (e.g., exclude password hashes when returning user objects).

How to add a new module endpoint (server)
1. Create `Server/modules/<module>/` folder.
2. Add `<module>.routes.ts` with an express Router and endpoints.
3. Add `<module>.service.ts` implementing business logic and DB interactions.
4. Add `<module>.validators.ts` for request validations and wire them into route handlers via `validate.middleware.ts`.
5. Add `<module>.types.ts` for DTOs and shared type definitions.
6. Register the router in `Server/src/app.ts` or the central route loader in `Server/routes`.
7. Add unit tests (if present), run `npm run dev` in `Server/` to test locally.

Example skeleton for a new module (server)
- `Server/modules/notes/`
  - `notes.routes.ts` — Router with endpoints.
  - `notes.service.ts` — create/read/update/delete logic, Prisma calls, transactions.
  - `notes.validators.ts` — request schema for create/update.
  - `notes.types.ts` — types for request/response.

Notes & best practices
- Keep controllers thin — all DB logic should be in services.
- Throw errors using centralized `ApiError` utilities.
- Use transactions for multi-step writes and release DB connections promptly.
- Follow existing module layout in `Server/modules` and the sketch in [Server/Readme.md](Server/Readme.md#L1).
