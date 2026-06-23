# Aya Academy Codebase Instructions

## Project Overview

**Aya Academy** is a Next.js 16 + React 19 web application for Quran memorization education. It's a content-driven landing/dashboard site with Material-UI theming, real-time updates via Socket.io, and form handling using React Hook Form.

**Tech Stack:** Next.js 16, TypeScript, Material-UI v7, React Hook Form, Framer Motion, Socket.io-client, Emotion

## Architecture Patterns

### 1. Feature-Based Organization

- Structure: `src/features/{featureName}/` (e.g., `hero/`, `howItWorks/`, `reviews/`)
- Each feature contains:
  - `index.tsx` - Main feature component (often default export)
  - `components/` - Feature-specific sub-components
  - Data-driven: Features pull content from `src/shared/data/{featureName}/`

**Example:** `HowItWorks` feature loads data from `shared/data/how-it-works/index.ts`, renders via `HowItWorkCard.tsx` component mapped over `steps` array.

### 2. Data-Driven Architecture

- **Location:** `src/shared/data/{section}/`
- **Pattern:** Each section has `types.ts` (TypeScript interfaces) + `index.ts` (data export)
- Types are composed from shared base types (`TitleDescription`, `Action`)
- Example types: `HowItWorksData` extends base types with feature-specific arrays

### 3. Component & Type Patterns

- **Shared Utils:** `src/shared/utlis/types.ts` defines base types (`TitleDescription`, `ColorsTokens`)
- **Data Components:** Don't contain business logic—purely render passed data
- **Icons:** Use `react-icons` (imported as React components, e.g., `import { MdOutlinePersonAddAlt }`)

### 4. API & Fetching

- **Fetcher Functions:** `src/shared/lib/fetchers/` (e.g., `post.ts`)
- **Pattern:** `submitData()` handles loading state, error handling, and toast notifications via `react-toastify`
- **Base URL:** Uses `process.env.NEXT_PUBLIC_API_URL`
- **Credentials:** Requests include `credentials: "include"` for session handling
- **Response Format:** All responses follow `ApiResponse<T>` structure with `data`, `message`, `status`

### 5. MUI Theme System

- **Provider:** `src/providers/MUITheme.tsx` wraps app and provides light/dark modes
- **Custom Colors:** Extends MUI theme with project color tokens (`colors`, `darkColors` from `constants.ts`)
- **Custom Variants:** Extends Button with `outlinedYellow` variant and Background type
- **Direction Support:** Theme supports RTL via `direction` parameter

### 6. Responsive Grid System

- **MUI Grid:** Uses `Grid` with `size` prop (e.g., `size={{ xs: 12, sm: 6, md: 3 }}`)
- **Containers:** Wrap content with `<Container>` for consistent max-width padding

## Development Workflows

### Build & Dev Commands

```bash
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
```

### Path Aliases

- `@/*` resolves to `src/` (e.g., `@/features/hero`, `@/shared/data/how-it-works`)
- Always use aliases for imports across features

### TypeScript Configuration

- **Target:** ES2017, strict mode enabled
- **Module:** ESM with bundler resolution
- Key compiler: `"jsx": "react-jsx"` (not importing React required in components)

## Key Integration Points

### Forms

- **Library:** React Hook Form with MUI components
- **Location:** `src/shared/form/` (form-specific utilities)
- **Pattern:** Use `submitData()` from fetchers for submission handling

### Real-Time Communication

- **Library:** Socket.io-client
- **Usage:** Likely for live lesson updates or progress tracking
- **Client:** Already installed but look in feature components for actual usage

### Styling

- **System:** Material-UI `sx` prop for component styling
- **CSS:** Global styles in `src/app/globals.css`
- **Variables:** CSS custom properties via font variables (`--font-geist-sans`, `--font-geist-mono`)
- **Layout Animations:** Framer Motion (`framer-motion`) + GSAP (`gsap`) for advanced animations

### Navigation

- **Component:** `src/shared/ui/navigation/Navbar.tsx` (included in root layout)
- **Drawer:** `NavbarDrawer.tsx` for mobile responsive menu
- **Data:** Navigation items loaded from `shared/data/navigation/navbar.ts`

## Project-Specific Conventions

1. **Naming:** Use PascalCase for components, camelCase for files/functions
2. **Data Export Pattern:** Features import from `src/shared/data/{feature}/index.ts`, never hardcode data in components
3. **Icon Pattern:** Icons are React components; pass them as `icon` property in data (e.g., `Step.icon: React.ComponentType`)
4. **Error Handling:** Use `react-toastify` for user feedback (via `submitData()` or manual `toast()` calls)
5. **Env Variables:** Frontend env vars prefixed with `NEXT_PUBLIC_` (e.g., `NEXT_PUBLIC_API_URL`)

## File Reference Examples

- **Feature Structure:** [src/features/howItWorks/](src/features/howItWorks/)
- **Data Types:** [src/shared/data/how-it-works/types.ts](src/shared/data/how-it-works/types.ts)
- **Base Types:** [src/shared/utlis/types.ts](src/shared/utlis/types.ts)
- **API Fetcher:** [src/shared/lib/fetchers/post.ts](src/shared/lib/fetchers/post.ts)
- **Theme Provider:** [src/providers/MUITheme.tsx](src/providers/MUITheme.tsx)
- **Root Layout:** [src/app/layout.tsx](src/app/layout.tsx)
