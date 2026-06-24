# Frontend Guide — Aya Academy

App overview
- Aya Academy: a Next.js-based frontend for a Quran learning app for kids.
- Primary UI lives under `app/src` with feature modules in `app/src/features` and shared UI in `app/src/shared`.

Tech stack (detected)
- Framework: Next.js (see [app/package.json](app/package.json#L1)).
- Language: TypeScript (see [app/tsconfig.json](app/tsconfig.json#L1)).
- UI: MUI (Material UI) + Emotion styling.
- State / Forms: `react-hook-form`.
- Animations: `framer-motion`, `gsap`.
- Network: custom fetch helpers under `app/src/shared/lib/fetchers` (`get.ts`, `post.ts`).
- Misc: `react-toastify`, `react-icons`, `socket.io-client`.

Folder structure (high level)
- `app/` — Next.js application root.
  - `src/app` — global layout and entry pages (Next `layout.tsx`, `page.tsx`).
  - `src/features` — feature modules. Each module contains an `index.tsx`, `types.ts` and `components/` subfolder (e.g., `childDashboard`, `hero`, `howItWorks`).
  - `src/shared` — cross-cutting code: `data/` (static content), `lib/` (fetchers, types), `ui/` (buttons, navbar), `utils/` (constants, helpers).
  - `providers/` — app-level providers like theming and toggles (`MUITheme.tsx`, `ThemeToggler.tsx`).
  - `public/` and `images/` — static assets.

Code conventions and recommendations
- File & folder names: prefer `kebab-case` or `camelCase` consistently for new features. Existing repo mixes styles (`Levels/`, `howItWorks/`); pick one for new work and apply consistently.
- Components: keep components small and focused. Place feature-specific presentational pieces in the feature's `components/` folder.
- Hooks: put feature-specific hooks inside the feature folder under `hooks/`. Shared hooks belong in `src/shared/hooks`.
- Types: use a `types.ts` file per feature for feature-scoped interfaces and `src/shared/types` for cross-cutting types.
- Services / API calls: centralize network calls in service files and use `src/shared/lib/fetchers/get.ts` and `post.ts` for HTTP plumbing.

State / data flow
- UI -> Hook/Service -> Fetcher -> Server: components call feature hooks or service functions which call the shared fetchers; fetchers perform network requests to server endpoints.
- Global providers (theme, toggler, auth) are registered under `providers/` and applied in `layout.tsx`.
- Use `react-hook-form` for form state and validation; validation helpers can be put in `shared/utils`.

How to add a new feature module (frontend)
1. Create `app/src/features/<featureName>/`.
2. Add `index.tsx` (page or feature entry), `types.ts`, `service.ts` (API wrappers), and `components/`.
3. Add `hooks/use<FeatureName>.ts` if logic is non-trivial.
4. Use `shared/lib/fetchers/get.ts` and `post.ts` inside `service.ts` for network calls.
5. Add static demo data to `src/shared/data/` only if reusable.
6. Wire navigation by updating `src/shared/ui/navigation/navbar` components.
7. Add tests (if present) and run the app in dev mode: `npm run dev` from `app/`.

Common patterns
- Forms & validation: `react-hook-form` + local validator helpers.
- API calls: service functions return typed data and handle errors; UI shows loading / error states.
- Auth: store token in a secure place (httpOnly cookie recommended on server); frontend uses token for UI gating only.
- Roles: frontend only hides UI elements; always rely on server RBAC for security.

Example skeleton for a new feature
- `app/src/features/myFeature/`
  - `index.tsx` — page / entry.
  - `types.ts` — feature types.
  - `service.ts` — API wrappers using `shared/lib/fetchers`.
  - `components/MyFeatureCard.tsx` — presentational component.
  - `hooks/useMyFeature.ts` — encapsulate fetch and state logic.

Notes
- Keep edits minimal and consistent with existing patterns. Inspect similar feature folders (for example `app/src/features/childDashboard`) and mirror their layout and naming.
