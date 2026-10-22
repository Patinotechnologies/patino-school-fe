# Frontend Architecture — `patino-school-fe`

Companion doc to [`patino-schools-be`'s Architecture & Tech Stack](../../patino-schools-be/doc/Architecture.md) (system-level decisions — database, multi-tenancy, offline support, hosting — and the backend's own folder structure/API) and the [PRD](../../patino-schools-be/doc/School%20Management%20System%20—%20PRD.md). This doc covers the frontend's folder structure, state management, UI kit, and the V1 design pass.

Next.js 16 (App Router), React 19, Tailwind v4. **Structure deliberately mirrors `ReproxyFE`** (an existing, larger Next.js app in this developer's other projects) rather than the default `create-next-app` layout — feature-based, with everything under `src/`, thin `app/` route files that just render a component from the matching `features/<name>/`, and dedicated top-level folders for cross-cutting concerns:

```
patino-school-fe/
├── src/
│   ├── app/                      # Routing only — every page.tsx/layout.tsx is a thin wrapper
│   │   ├── layout.tsx            # Root layout — QueryProvider + Toaster
│   │   ├── page.tsx              # "/" — redirects to /dashboard or /login (reads the auth store directly)
│   │   ├── globals.css
│   │   ├── register/page.tsx     # renders features/auth/pages/register-form
│   │   ├── login/page.tsx        # renders features/auth/pages/login-form
│   │   └── (dashboard)/          # route group — wraps every route below in the sidebar shell, adds nothing to the URL
│   │       ├── layout.tsx        # renders features/dashboard/components/dashboard-shell
│   │       ├── dashboard/page.tsx   # "/dashboard" — renders features/dashboard/pages/dashboard-overview
│   │       ├── schools/page.tsx     # "/schools"
│   │       ├── pupils/page.tsx      # "/pupils"
│   │       ├── staff/page.tsx       # "/staff"
│   │       ├── classes/page.tsx     # "/classes"
│   │       ├── attendance/page.tsx  # "/attendance"
│   │       ├── exams/page.tsx       # "/exams"
│   │       ├── fees/page.tsx        # "/fees"
│   │       └── settings/page.tsx    # "/settings"
│   ├── features/
│   │   ├── auth/
│   │   │   ├── api/auth-api.ts        # authApi.register/login/me + useRegisterMutation/useLoginMutation/useMeQuery
│   │   │   └── pages/
│   │   │       ├── register-form.tsx
│   │   │       └── login-form.tsx
│   │   ├── dashboard/
│   │   │   ├── components/dashboard-shell.tsx  # auth guard (redirect to /login) + header/logout
│   │   │   └── pages/dashboard-overview.tsx     # "/dashboard" — stat cards + per-school summary table
│   │   ├── schools/
│   │   │   └── api/schools-api.ts     # schoolsApi.list/create + useSchoolsQuery/useCreateSchoolMutation — no pages/, see "School switcher" below
│   │   ├── pupils/ staff/ classes/ attendance/ exams/ fees/   # each its own pages/ (mock data — see "V1 design pass" below)
│   │   └── settings/
│   │       ├── pages/settings-page.tsx          # horizontal Tabs: Profile / Security / Company
│   │       └── components/{profile,security,company}-tab.tsx
│   ├── components/
│   │   ├── ui/                   # button, input, checkbox, dropdown, dropdown-menu, modal, tabs, badge — shadcn-style (cva + clsx/tailwind-merge via cn(), Radix primitives for checkbox/dialog/select/tabs/dropdown-menu)
│   │   ├── layout/                # sidebar, page-header, stat-card — shared across every dashboard module page
│   │   └── table/                 # DataTable — the one table component for the whole system, see "Data table" below
│   ├── config/
│   │   ├── env.ts                # NEXT_PUBLIC_API_URL, one getter per backend service (today: just one — the monolith)
│   │   └── api.ts                # apiConfig.baseUrl, built from env.ts
│   ├── constants/
│   │   └── query-keys.ts         # queryKeys.me / queryKeys.schools — no magic strings across features
│   ├── lib/
│   │   ├── api/api-client.ts     # createApiClient(baseUrl) factory — .get/.post, reads the zustand token, throws ApiError
│   │   └── utils/{cn,toast-error}.ts  # cn() (cva/tailwind-merge helper); toastError(err) — shared onError handler for mutations
│   ├── providers/
│   │   └── QueryProvider.tsx     # QueryClientProvider, one QueryClient per browser tab
│   ├── stores/
│   │   └── auth-store.ts         # Zustand — just the JWT (+ hasHydrated), persisted to localStorage
│   └── types/
│       ├── auth.ts               # RegisterPayload/LoginPayload/AuthResponse/MeResponse — mirrors backend src/interface/auth.ts
│       └── school.ts             # CreateSchoolPayload/School — mirrors backend src/interface/school.ts
├── doc/
│   └── Architecture.md     # this file
├── public/                 # Static assets
├── .env.local / .env.example  # NEXT_PUBLIC_API_URL
├── next.config.ts
├── package.json
└── tsconfig.json           # baseUrl "." + "@/*": ["./src/*"]
```

**Why `app/` stays thin:** every route file's entire body is `return <ComponentFromFeatures />` (see `src/app/register/page.tsx`, `src/app/(dashboard)/layout.tsx`, etc.) — same as ReproxyFE's `app/auth/signin/page.tsx` rendering `features/auth/pages/sign-in-form`. Routing (URL structure) and feature logic are different concerns; `app/` only owns the former. This also means a feature's actual implementation never has to move when its URL changes — proven directly when every module's route moved from `/dashboard/<name>` to top-level `/<name>` and only the thin `app/` files needed to move, none of the `features/` code.

## State management

**State split (decided):** **Zustand** (`stores/auth-store.ts`) holds only the JWT — genuine client/session state, persisted to `localStorage` via `zustand/middleware`'s `persist`. **TanStack Query** owns everything fetched from the server — `user`/`organization` (`useMeQuery`, key `queryKeys.me`) and `schools` (`useSchoolsQuery`, key `queryKeys.schools`) — with its own caching, loading/error state, and refetching; nothing server-derived is duplicated into the Zustand store. `register`/`login` set the token in the store and seed the `me` query cache directly via `queryClient.setQueryData`, avoiding a redundant fetch right after auth. `logout` clears the token and calls `queryClient.clear()`. Each feature's query/mutation hooks live alongside its raw API calls in that feature's own `api/*.ts` file (e.g. `features/auth/api/auth-api.ts` has both `authApi.login()` and `useLoginMutation()`) — matching ReproxyFE's `authApi.ts`, rather than a separate root-level data-fetching-hooks folder.

This storage approach — token in client state, hydrated/synced against the server — is deliberately the simple approach for the **admin/bursar/proprietor dashboard**, which [the backend's Architecture doc](../../patino-schools-be/doc/Architecture.md) already scoped as a standard online-only experience. It does **not** apply to the teacher portal — that's still planned as a PWA with IndexedDB local-first storage (see that doc's Offline support section) and hasn't been built yet.

**Hydration note:** `auth-store`'s `hasHydrated` flag exists because `persist` reads `localStorage` asynchronously after mount — every auth-aware component checks `hasHydrated` before trusting `token`, to avoid a flash of "logged out" state before the store catches up.

## Tooling

**Dev server port:** moved to **3001** (`package.json` → `"dev": "next dev -p 3001"`) since the backend already uses 3000.

**Frontend tooling (installed):**

| Package | Role |
|---|---|
| `next`, `react`, `react-dom` | App framework |
| `tailwindcss` | Styling |
| `zustand` | Client state — just the auth token (see above) |
| `@tanstack/react-query` | Server state — fetching/caching `user`, `organization`, `schools` |
| `react-hot-toast` | Success/error toasts for mutations (register, login, logout, create school) |
| `class-variance-authority`, `clsx`, `tailwind-merge` | The `cn()` + `cva` variant pattern behind every `components/ui/*` primitive |
| `@radix-ui/react-{checkbox,dialog,select,tabs,dropdown-menu}`, `lucide-react` | Accessible unstyled primitives + icons behind Checkbox/Modal/Dropdown/Tabs/DataTable's column menu |
| `@tanstack/react-table` **pinned to `^8.21.3`** | Headless table logic (sorting, pagination, column visibility, row expansion) behind `components/table/DataTable` |

**Why `@tanstack/react-table` is pinned to v8, not the installed-by-default v9:** `npm install @tanstack/react-table` pulled `9.3.1` — a very recent major rewrite (a `TableFeatures` generic system, row-model factories renamed `createCoreRowModel`/etc., `useReactTable` gone) with far less documentation/community precedent than v8, which is still the version virtually every current tutorial and the official examples describe. Rather than write against an unfamiliar, newly-released API, the dependency was pinned to the last v8 release (`8.21.3`) — stable, extremely well-documented, and exactly what `DataTable` is built against. `package.json` uses `^8.21.3`, which cannot drift to v9 on a plain `npm install`.

**Toasts (decided):** `onSuccess`/`onError` live on the mutation hooks themselves (`useRegisterMutation`, `useLoginMutation`, `useCreateSchoolMutation` in each feature's `api/*.ts`), not in the pages that call them — so every call site gets a toast for free, and the error message always comes from the backend's `ApiError.message` via a shared `toastError()` helper (`lib/utils/toast-error.ts`), falling back to a generic message only for non-API errors (network failure, etc). Once toasts covered success/failure, the pages' own inline error `<p>` elements for these actions were removed as redundant — the schools **list** fetch error is the one exception kept inline, since a background query failure (not a user-triggered action) reads better as a persistent banner than a transient toast.

## Data table (decided) — `components/table/DataTable`

The one table component for the whole system — every list screen (Pupils, Staff, Classes, Fees' invoices, Company's staff table, and whatever comes next) should use this rather than a one-off `<table>`. Built on TanStack Table (headless logic) + the existing `cn()`/`cva` styling conventions, so it looks and behaves like the rest of the UI kit, not a bolted-on library.

```
src/components/table/
├── data-table.tsx                # DataTable<TData> — the component consumers import
├── data-table-column-header.tsx  # DataTableColumnHeader — sortable header button with a sort-direction icon
├── data-table-toolbar.tsx        # search box + "Columns" visibility menu (Radix DropdownMenu, checkboxes)
├── data-table-pagination.tsx     # page-size select + prev/next/first/last controls
├── data-table-mobile-card.tsx    # auto-generated card for the responsive mobile view
├── types.ts                      # ColumnMeta module augmentation (meta.label) + getColumnLabel()
└── index.ts                      # public exports: DataTable, DataTableColumnHeader, getColumnLabel
```

**What it covers, from the brief:**
- **Pagination** — client-side (`getPaginationRowModel`), page-size selector (10/25/50), first/prev/next/last controls, "X–Y of Z" count.
- **Expansion** — pass `renderSubRow(row)` and an expand-toggle column is added automatically; expanded content renders as an extra `<tr>` on desktop and inline inside the card on mobile. Omit the prop and no expand column appears at all.
- **Column add/remove** — every column is hideable by default (`enableHiding: false` to opt a column out, e.g. the expand toggle); the toolbar's "Columns" button is a checkbox menu toggling `columnVisibility` state.
- **Responsive (the priority ask)** — one `DataTable` instance renders *two* layouts from the same `table` state, toggled with Tailwind breakpoints rather than JS (`hidden md:block` for the table, `md:hidden` for the stacked cards) — no layout-shift flash, no duplicate data fetching. Each card is auto-generated from the row's visible cells (label from `meta.label`/string header, value from the cell renderer) unless the column set doesn't suit that — there's no custom-card override yet, which is the main thing to revisit if a future table's data doesn't translate well to "label: value" pairs.
- **Loading state** — `isLoading` renders skeleton rows/cards (pulse-animated bars) matching the current page size and visible column count, in both layouts.
- **Empty state** — centered icon + title + description, customizable per table (`emptyTitle`, `emptyDescription`, `emptyIcon`), shown when there's no data (post-filter).
- **Also included:** global search (filters across all columns, the `Search` box in the toolbar) and column sorting (click a `DataTableColumnHeader` — asc/desc/none cycle with an icon).

**`meta.label` (decided):** a column's `header` is often a render function (`DataTableColumnHeader`, for sortable columns), not a plain string — but the "Columns" menu and the mobile card both need plain text. Rather than re-deriving a label from JSX, `types.ts` adds a `meta.label?: string` field to TanStack's own `ColumnMeta` type (module augmentation) and a `getColumnLabel()` helper that checks `meta.label` first, then falls back to a string `header`, then the column `id`. Every column with a function header should set `meta: { label: "..." }` — see `features/pupils/pages/pupils-page.tsx` for the pattern.

**Not included (deliberately, not yet needed):** row selection (checkboxes) and virtualization (`@tanstack/react-virtual`, needed only once a table might render 1,000+ rows at once — none of the V1 mock datasets are anywhere close). Both are straightforward to add to `DataTable` later without changing its public API shape, if a real need shows up.

**Proven working, not just type-checked:** wired into `/pupils` as the first real usage (replacing its static `<table>`) — sortable Name/Class/Guardian/Date-of-birth columns, a search box, an expandable row showing guardian relationship + address, and the responsive card view, all against the existing mock pupil data. The rest of the V1 pages (Staff, Classes, Fees invoices, Company's staff table) are still on plain `<table>` markup and are the natural next candidates to migrate.

## Onboarding (decided) — `/onboarding`

A new proprietor is dropped into a 4-step horizontal wizard right after registering, before they ever see the dashboard: **Contact → School → Team (skippable) → Preview & submit**. Nothing is persisted until the final "Complete setup" — steps 1–3 only hold local React state in `features/onboarding/pages/onboarding-page.tsx`, and the preview step renders that same state read-only so there's nothing to get out of sync. On submit, one backend call (`POST /api/onboarding/complete`) does everything in a single Prisma transaction: updates the organization's contact info, creates the first school, and creates any invited staff — all three or none, rather than three separate requests that could partially fail.

**Gating (decided):** `Organization.onboardedAt` (nullable, mirroring `School.onboardedAt`) tracks completion. `DashboardShell` redirects to `/onboarding` whenever `me.organization.onboardedAt` is null, and `/onboarding` itself redirects to `/dashboard` once it's set — so the wizard can't be re-run, and a half-finished signup always lands back on it instead of a broken dashboard. `useCompleteOnboardingMutation` patches the cached `me` query directly with the new `onboardedAt` on success, so the redirect clears immediately without waiting on a refetch.

**Why one combined endpoint instead of reusing `schools`/`staff`/`organizations` APIs individually:** those endpoints already exist and are used elsewhere (Schools page, Settings), but calling them one-by-one from the wizard risks partial completion (e.g. school created, then a staff invite fails) with no easy rollback. `onboardingService.complete` wraps `organizationRepository.update` + `schoolRepository.create` + `staffRepository.create` in one `prisma.$transaction`, the same pattern already used by `authService.register`.

**Scope decisions:** step 2 is a repeatable list, same pattern as the Team step — "Add school" below the list, each row with its own name/level/address, at least one required (enforced client- and server-side). More can still be added later from `/schools`. Staff invited in step 3 go through the same validation as the standalone Staff API (duplicate emails within the submitted batch are rejected client- and server-side). `School.onboardedAt` is deliberately *not* auto-set by this flow (or by the regular "Add school" form) — that field already existed unused before this feature and changing its behavior wasn't part of this task.

## School switcher (decided) — `components/layout/sidebar.tsx`

The sidebar's school dropdown, previously decorative (hardcoded options, local `useState`), is now wired to the real `GET /schools` list via the existing `useSchoolsQuery`. The selected school lives in a new Zustand store, `stores/school-store.ts` — a `selectedSchoolId: string | null`, persisted to `localStorage` the same way `auth-store.ts` persists the token. The sidebar defaults it to the first school in the list whenever nothing is selected yet (first load, or the previously-selected school no longer exists).

**No more standalone Schools page (decided):** the dedicated `/schools` route (list + "Add school" form) is gone — `app/(dashboard)/schools/` and `features/schools/pages/schools-page.tsx` were deleted. The dropdown itself now carries a trailing **"+ Add school"** option (a sentinel value intercepted in the `onChange` handler, not a real selectable school) that opens a `Modal` with the same name/level form the old page had. `features/schools/api/schools-api.ts` (the query/mutation hooks) stayed — the sidebar is just a new consumer of it.

**Why:** the switcher already shows every school and is always on screen, so a separate page for the same list was redundant. Picking a school from it is meant to scope everything else in the app — "anything that is done is done for a specific school." That scoping is **not yet implemented** for Pupils/Staff/Classes/Attendance/Exams/Fees — those are still unscoped mock-data pages with no backend models at all, so there's nothing yet to filter by the selected school. `selectedSchoolId` exists and is persisted now so that work can start without redesigning where the selection lives.

## Staff list: search, filter, pagination (decided) — `GET /api/staff`

`GET /api/staff` now takes query params — `search` (matches `fullName` OR `email`, case-insensitive), `role`, `active`, `page`, `pageSize` (default 20, max 100) — validated by a new `listStaffQuerySchema` and a new `validateQuery` middleware (`middlewares/validate.ts`), since the existing `validate` only ever parsed `req.body`. It stores the parsed result on `req.validatedQuery` rather than reassigning `req.query`, since Express's query type can't be widened to an arbitrary zod-inferred shape.

The response shape changed from a bare array to `{ data, pagination: { page, pageSize, total, totalPages } }` — `staffRepository.listByOrganization` now runs `findMany` + `count` with the same `where` clause via `Promise.all`. This is a breaking change for the one existing frontend caller (Company tab's staff table); `features/staff/api/staff-api.ts` was updated to match (`PaginatedStaff`, `ListStaffParams`), and the Company tab passes `{ pageSize: 100 }` and reads `staffQuery.data?.data` to keep its current behavior (full list, client-side paginated by `DataTable`) rather than switching it to server-side paging — no UI for search/filter/pagination controls was built yet, since none was asked for this round. The API is ready for whichever page ends up needing it (the dedicated `/staff` page is still on mock data).

## V1 design pass (admin/bursar/proprietor dashboard — decided)

Every PRD V1 module now has a real screen, built against **mock data only** — no new API calls were wired (the brief was design, not integration). Each follows the same `features/<name>/pages/<name>-page.tsx` + thin `app/(dashboard)/<name>/page.tsx` pattern already established for auth/schools. Routes are **top-level** (`/pupils`, not `/dashboard/pupils`) — all of them, `/dashboard` included, live under the `(dashboard)` route group so they share the sidebar shell without that grouping folder appearing in the URL:

| Module | Route | What's there |
|---|---|---|
| Dashboard | `/dashboard` | 3 stat cards (enrollment, attendance rate, fee collection rate) + a per-school summary table — PRD Dashboard P0. Was previously the Schools list; that moved to its own route. |
| Schools | *(no route)* | Removed as a standalone page — listing and adding schools now lives in the sidebar's school switcher, see "School switcher" below |
| Pupils | `/pupils` | Table + "Enroll pupil" modal (name, DOB, class, guardian name/phone/relationship) — PRD Pupils P0 |
| Staff | `/staff` | Table with role badges + "Add staff" modal (name, email, phone, role) — PRD Staff + Roles & Permissions P0 |
| Classes | `/classes` | Grouped by level (Nursery/Primary/Secondary) + "Add class" modal (name, level, class teacher) — PRD Classes P0 |
| Attendance | `/attendance` | Class + date pickers, roster with a present/absent/late segmented control per pupil, live counts — PRD Attendance P0 flow |
| Exams & Report Cards | `/exams` | Class/subject/term pickers, score-entry table, missing-score indicator, report card preview modal — PRD Exams P0 |
| Fees & Bursary | `/fees` | 3 stat cards, fee structure table, invoices table with status badges and a "record payment" modal — PRD Finance P0 |
| Settings | `/settings` | Horizontal tabs (Radix `Tabs`): **Profile** (avatar, name/email/phone, role badge, update form) · **Security** (change password, 2FA setup with a mock-QR modal) · **Company** (logo, name/phone/email, staff table) — `features/settings/components/{profile,security,company}-tab.tsx` |

**New shared pieces**, in `src/components/`:
- `layout/sidebar.tsx` — the nav shell for every route in the `(dashboard)` group, replacing the old header-only `DashboardShell`. Includes the PRD's sidebar school switcher (`"switch schools from a sidebar dropdown"`) — currently decorative/local-state only, not yet wired to actually scope any page's data to the selected school
- `layout/page-header.tsx`, `layout/stat-card.tsx` — repeated across every module page
- `ui/badge.tsx` — status pills (role badges, Active/Deactivated, Paid/Partial/Unpaid, attendance-rate thresholds)
- `ui/tabs.tsx` — Radix `Tabs` wrapper, blue underline on the active tab

**Brand colors (decided): white + blue.** `Button`'s `primary` variant, `Checkbox`'s checked state, `Input`/`Dropdown` focus rings, and the sidebar's active-nav-item state all moved from the neutral black/zinc "invert" theme (the `create-next-app` default) to `blue-600`/`blue-50`. Dropped dark-mode support at the same time — the existing `dark:` Tailwind classes across the Button/Input/Checkbox/Dropdown/Modal kit and the auth pages were removed, since "white and blue" was given as a definite single-theme brand, not a light/dark pair; trivial to reintroduce later if needed.

**Not done, deliberately:** no API calls were added for pupils/staff/classes/attendance/exams/fees/settings — every number and row on those pages is a hardcoded mock array in the page file itself, clearly commented as such. Wiring them up is real backend work first (none of those tables exist yet — see the PRD's Data Model Overview for `Pupil`, `Staff`, `Class/Grade`, `Attendance`, `Subject`, `Score`, `Report Card`, `Fee Structure`, `Invoice`, `Payment`, none of which the backend has migrations for beyond `organizations`/`users`/`schools`).

Still to build — the teacher portal (offline-first), following the same `features/<name>/{api,pages,components}` pattern:

```
src/
├── app/
│   └── (teacher)/               # Teacher portal — PWA, offline-first
│       ├── layout.tsx
│       ├── attendance/
│       └── scores/
├── features/
│   └── teacher/
├── lib/
│   └── offline/                 # IndexedDB storage + sync logic for the teacher portal
public/
├── manifest.json            # PWA manifest
└── sw.js                    # Service worker (offline caching + sync)
```
