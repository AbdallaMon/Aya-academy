# Align aya-academy code conventions to reference projects — Design / Conversion Playbook

**Date:** 2026-06-29
**Branch:** `refactor/align-conventions` (cut from `master`)
**Status:** Approved design → playbook for implementation

## 1. Goal

Make **the way code is written** in aya-academy match the reference projects
`C:\coding\school-system` and `C:\coding\Transaction-app`, for both backend and
frontend. This is a *convention / idiom* migration, **not** a behavior change and
**not** a re-architecture. The architecture already matches; we are aligning
idioms and a few shared utilities.

When the two references differ, **school-system is canonical** (per decision).

## 2. Non-goals (DO NOT TOUCH)

- Authentication / `authenticate` / `auth.middleware` internals.
- Authorization: `requirePermissions`, permission codes, object-scope checkers,
  `subscriptionAccess` guard. **Routes' guard chains stay byte-for-byte.**
- The Prisma **schema** (`packages/db/prisma/schema.prisma`) — no field renames,
  no model changes. Field names stay (`isActive`, `*Ar`/`*En`, etc.).
- The **i18n system** and `[lng]` locale routing — kept as-is. Text continues to
  come from aya's per-feature `useXText()` / `txt` objects, **not** `t()` /
  i18next namespaces.
- **Audit log** — was removed from aya; it is NOT reintroduced (schema/behavior).
- Encryption-at-rest wiring, crypto, attachments/S3 behavior.
- The HTTP **response envelope** shape `{ success, message, data, translationKey }`
  and the **message-code contract** — already matches; do not change codes.

**Behavior must be preserved exactly.** Every endpoint returns the same status,
same envelope, same data shape the frontend already consumes. Every screen renders
and behaves identically.

## 3. Decisions (locked)

| # | Decision | Choice |
|---|----------|--------|
| 1 | i18n | Keep aya's (`[lng]` routing + per-feature text). Not migrated. |
| 2 | Rollout | Big-bang across all modules/features on the branch, in safe waves. |
| 3 | Canonical reference when they differ | **school-system** |
| 4 | TypeScript | Convert the 3 `.tsx` files → `.jsx`, switch `tsconfig`→`jsconfig` (pure JS) |
| 5 | `useMultiRequest` / `AppForm` | **Keep `useMultiRequest`** (clean, already standard). Standardize forms to the school-system **manual-RHF-in-FormDialog** idiom; stop introducing new `AppForm`-config-driven dialogs. Existing `AppForm` stays available; migrate dialogs that already use it to the manual idiom where reasonable. |

## 4. Canonical BACKEND idiom (target) — from `school-system/.../departments/*`

Reference files locked in this session:
`school-system/server/src/modules/departments/{controller,usecase,repo,dto,route}.js`,
`school-system/server/src/shared/{http/response.js, utility/helper.js}`.

### 4.1 Controller
- Class with **`async methodName(req, res) {}`** methods (NOT arrow-property fields).
- Export **both** singleton and class: `export const xController = new XController(); export { XController };`
- Read auth as **`req.auth`** directly (no `authUser(req)` helper).
- List: destructure `const { page, limit, ...filters } = req.query;` then call
  `usecase.listX({ page: parseInt(page) || 1, limit: parseInt(limit) || 10, filters })`.
- Create: `usecase.createX({ ...req.body, authUser: req.auth })`.
- Update: `usecase.updateX({ id: parseInt(req.params.id, 10), ...req.body, authUser: req.auth })`.
- Respond only via helpers: `ok / created / updated / deleted` with `(res, data, CODE, TK)`.
- `const TK = messagesNames.xMessages;` at top; import codes directly from `@aya/shared`
  (drop the per-module `x.messages.js` re-export indirection).

```js
import { ok, created, updated } from "../../shared/http/response.js";
import { xMessagesCodes, messagesNames } from "@aya/shared";
import { xUsecase } from "./x.usecase.js";
const TK = messagesNames.xMessages;
class XController {
  async listX(req, res) {
    const { page, limit, ...filters } = req.query;
    const result = await xUsecase.listX({ page: parseInt(page) || 1, limit: parseInt(limit) || 10, filters });
    return ok(res, result, xMessagesCodes.LIST_FETCHED, TK);
  }
  async createX(req, res) {
    const row = await xUsecase.createX({ ...req.body, authUser: req.auth });
    return created(res, row, xMessagesCodes.CREATED, TK);
  }
}
export const xController = new XController();
export { XController };
```

> Routes pass `asyncHandler(xController.listX)`. Safe because methods reference the
> usecase **singleton**, never `this`. Keep each route's existing guard chain
> (`requirePermissions`, special checkers, `validate`) **unchanged**.

### 4.2 Usecase
- Class, named methods, flattened params object in, business logic + `AppError`.
- List: call repo, map rows through DTO, return `{ items, total, page, pageSize }`.
- Build the `where`/pagination in the **repo**, not the usecase (move it down a layer).
- Multi-write → `prisma.$transaction`. **No `audit()` calls** (audit is gone).
  Single-write usecases call the repo directly (no transaction needed).
- Return shaped output via `xDto.toDetail(...)` / `xDto.toListItem`.

### 4.3 Repo
- Prisma I/O only. Methods take a **single object** with optional `client`:
  `async createX({ data, client }) { return (client ?? prisma).x.create({ data }); }`
- List method owns filtering + pagination and returns `{ items, total, page, pageSize }`:
  ```js
  async listX({ page, limit, search, isActive, client } = {}) {
    const db = client ?? prisma;
    const { skip, take, page: currentPage } = paginate({ page, limit });
    const where = {};
    const searchWhere = buildSearchQuery({ searchType: "multiKeySearch",
      keysValues: [{ key: "nameAr", value: search }, { key: "nameEn", value: search }] });
    if (searchWhere.OR) where.OR = searchWhere.OR;
    const activeFilter = buildIsActiveFilter({ isActive });        // see 5.1 note
    if (activeFilter !== undefined) where.isActive = activeFilter; // aya field = isActive
    const [items, total] = await Promise.all([
      db.x.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, select: xSelect }),
      db.x.count({ where }),
    ]);
    return { items, total, page: currentPage, pageSize: take };
  }
  ```
- **Keep existing `select` projections** where they guard sensitive fields
  (e.g. `publicUserSelect` excluding `passwordHash`) or trim payloads. The DTO
  transformer shapes the *output*; the `select` controls the *fetch*. Both coexist.

### 4.4 DTO
- Add transformer functions; export as an object:
  ```js
  function toListItem(row) { if (!row) return null; return { id: row.id, /* ... */ }; }
  export const xDto = { toListItem, toDetail: toListItem };
  ```
- Keep existing `*Select` consts (used by repos). DTO file holds both the select
  consts and the transformer object.

### 4.5 Shared backend foundations (Wave 0)
Align aya's shared utils to school-system's **API shape** (keep aya field names/values):
- `shared/http/response.js`: add `updated`, `deleted`, `noContent`, `paginated`
  (copy school-system signatures; keep `@aya/shared` import). Keep `ok`/`created`.
- `shared/utility/helper.js`: replace aya's `buildSearchQuery({search,keys})→array`
  with school-system's full API: `buildSearchQuery({searchType,search,keysValues,keyOr})→{OR}|{}`,
  `buildFilterQuery`, `buildIsActiveFilter`, `buildDateRangeFilter`, `buildOrderBy`,
  `parseIdList`, `excludeIdsFromString`, `normalizeText`. **Caveat:** aya's boolean
  field is `isActive` and the frontend currently sends `ALL|true|false`. To preserve
  the data contract, `buildIsActiveFilter` must accept aya's values — keep a thin
  adapter (`"ALL"|""|undefined → undefined`; `"true"/"active"→true`; `"false"/"inactive"→false`)
  rather than school-system's `active|inactive`-only parsing. Retain `parseBooleanFilter`
  as an alias if any call site still needs it.
- `shared/utility/pagination.js`: already compatible (`paginate→{skip,take,page,limit}`). Keep.
- `shared/http/params.js`: `authUser(req)`/`idParam` become unused by controllers
  after conversion. `idParam` may still be used for non-`:id` params — keep the file,
  but remove `authUser` usage from controllers (use `req.auth`).

> **Order matters:** Wave 0 (response helpers + helper API) lands first; every call
> site that uses the OLD `buildSearchQuery({search,keys})` array form must be updated
> in the same wave or its module's wave, or the build breaks. Grep all callers first.

## 5. Canonical FRONTEND idiom (target) — from `school-system/.../features/departments/*`

Reference files locked: `DepartmentsPage.jsx`, `config/{departmentsColumns,departmentsFilters,constant}.js`,
`components/DepartmentFormDialog.jsx`, `shared/components/forms/rhf/applyApiErrorsToForm.js`.

### 5.1 Feature folder shape & naming
- `features/<camelCaseName>/{config,pages,components}`. Normalize feature folder
  names to consistent **camelCase** (e.g. keep `quizBank`, `userDetail`; the layout
  is already correct). Resolve any `.jsx`/`.tsx` shadowing by deleting stale `.tsx`.
- `config/constant.js` (URLs + keys), `config/<feature>Columns.js`,
  `config/<feature>Filters.js`, `config/<feature>Text.js` (aya i18n text — kept).

### 5.2 List page
- `"use client"`, permission gate via `usePermission()` + early return on no-list.
- One `useRequest({ url, method:"get", isPaginated:true, autoFetch: canList })` for data.
- `PageHeader` (already exists) for title/description/create — replace inline headers.
- Columns from a **factory** `<feature>Columns({ ... })` returning the array;
  filters from `<feature>Filters()` returning a config array. (aya is already close.)
- `<DataTable .../>` config-driven (existing component, existing props).

### 5.3 Create/Edit form — manual RHF in FormDialog (school-system idiom)
```jsx
const { control, handleSubmit, reset, setError } = useForm({ defaultValues: EMPTY });
useEffect(() => { if (open) reset(editItem ? {...} : EMPTY); }, [open, editItem, reset]);
const { fetchData, isLoading } = useRequest({
  url: X_URL, method: isEdit ? "patch" : "post", shouldAutoToast: true,
  onSuccess: (res) => { onSuccess?.(res); onClose?.(); },
  onError: (err) => applyApiErrorsToForm(err, setError, { labelMap, showToast,
    fallbackMessage: txt.formInvalid, fieldsToastTemplate: txt.checkFields, suppressFallbackToast: true }),
});
// <FormDialog onSubmit={() => document.getElementById(FORM_ID)?.requestSubmit()}>
//   <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} noValidate> ... RHFTextField/RHFSelect/RHFSwitch ...
```
- Use `useRequest({method})` **or** `useMultiRequest` (both fine; `useMultiRequest`
  kept). Field errors via **`applyApiErrorsToForm`** — port this helper from
  school-system into `web/src/shared/components/forms/rhf/applyApiErrorsToForm.js`
  and export it from the shared barrel (Wave 0-FE). Text args come from aya `txt`.

### 5.4 Frontend shared foundations (Wave 0-FE)
- Port `applyApiErrorsToForm` from school-system → aya shared barrel.
- Ensure RHF wrappers exist (`RHFTextField/RHFSelect/RHFSwitch/...` — they do).
- Remove the lone `className="review-badge"` outlier → `sx`. Drop unused emotion `styled` if any.

### 5.5 Frontend out-of-scope features
Pure marketing/static features have no tables/forms/CRUD and are **not** part of the
table/form convention pass (only trivial styling/import rules apply): `blog`, `faq`,
`hero`, `pricing`, `promo`, `trust`, `whyAya`, `reviews`. CRUD/dashboard features ARE
in scope (see §7).

## 6. TypeScript → JS (Decision 4)
- Convert `web/src/app/[lng]/layout.tsx`, `web/src/app/[lng]/page.tsx` (verify exact
  paths), and `web/src/providers/MUITheme.tsx` to `.jsx` (strip type annotations).
- Replace `web/tsconfig.json` with `jsconfig.json` (paths `@/* → ./src/*`).
- Verify Next build still resolves the root layout/page.

## 7. Scope (Big-bang, in waves)

**Backend modules (21):** attachments, auth, backups, badges, certificateTemplates,
certificates, coupons, dashboard, encryptionKeys, games, invoices, notifications,
paymentTemplates, plans, points, quizzes, reports, rewards, settings, subscriptions, users.

**Frontend CRUD/dashboard features (in scope):** auth, badges, badgesAdmin,
certificateTemplates, certificates, children, childDashboard, coupons, dashboard,
games, invoices, leaderboard, notifications, paymentTemplate, plans, quizBank,
quizBuild, quizInvites, quizTake, quizzes, reports, settings, subscriptionDetail,
subscriptions, userDetail, users.

### Sequencing
1. **Wave 0 (backend foundations):** response helpers + helper API + grep/fix all
   old `buildSearchQuery` callers. Build server.
2. **Wave 0-FE (frontend foundations):** `applyApiErrorsToForm`, barrel export,
   TS→JS conversion, className outlier. Build web.
3. **Exemplar module (backend):** convert **one** representative module end-to-end
   (`badges`), run server build/lint, eyeball diff. This validates the playbook.
4. **Backend modules:** convert the rest in batches (parallel subagents OK), each
   following §4 + the `badges` exemplar; build after each batch.
5. **Exemplar feature (frontend):** convert one feature (`coupons` or `badges`)
   end-to-end, build web. Validate.
6. **Frontend features:** convert the rest in batches; build after each batch.

## 8. Verification
- After each wave/batch: `npm run build` (or the project's build) for the affected
  app, plus lint. No new errors vs baseline.
- Spot-check that response shapes/route guards are unchanged (git diff review on
  `*.route.js` — guard chains must be identical).
- Honest reporting: if a conversion changes a response shape, STOP and reconcile.

## 9. Risks & mitigations
- **Helper-API swap breaks callers** → grep every caller of the old `buildSearchQuery`
  and convert in the same wave; build immediately.
- **DTO select→transformer leaks sensitive fields** → keep security `select`s; never
  expose new fields. Diff each DTO's output keys vs the old `select` keys.
- **`isActive` contract drift** → keep aya values (`ALL|true|false`), adapter in
  `buildIsActiveFilter`; do not adopt school-system's `active|inactive` strings.
- **Route guard regressions** → never edit guard chains; only swap controller method
  references (same names) and response idiom.
- **Big-bang scope** → waves + per-batch builds + exemplar-first validation contain blast radius.
