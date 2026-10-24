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

## Classes (decided) — `/classes`, `/classes/[id]`, `GET`/`POST /api/classes`, `GET`/`PATCH /api/classes/:id`

The first real entity scoped by the sidebar's selected school — `selectedSchoolId` (from `stores/school-store.ts`, unused since the switcher shipped) now actually drives a query. `/classes` calls `useClassesQuery(selectedSchoolId)`, which hits `GET /api/classes?schoolId=...`; `schoolId` is a required query param (`listClassesQuerySchema`), not optional, since a class with no school context is meaningless.

**Model:** `Class` belongs to one `School` (`onDelete: Cascade` — a deleted school takes its classes with it) and optionally to one `Staff` member as `classTeacher` (`onDelete: SetNull` — removing that staff member unassigns them rather than deleting the class).

**No `Class.level` (decided, reversed from the initial build):** `Class` originally carried its own `level` field, copying the mock design's level picker on "Add class." Dropped it — `School.level` is already singular (a school is nursery *or* primary *or* secondary, never a mix), so every class under a school is necessarily that school's level; a separate per-class level was pure redundancy with no case where it could legitimately differ. The "Add class" form no longer asks for it at all. Migration `20261024111358_remove_class_level` drops the column (hand-written, not generated — `prisma migrate dev` refuses to run non-interactively when a migration would drop non-empty data, so this one was authored by hand and applied with `prisma migrate deploy`, same SQL Prisma would have generated).

**UI:** originally a grouped-by-level layout (three bordered sections, matching the mock design pass). Once Classes became scoped to one selected school — which has only one level — that grouping would always collapse to a single populated section, so it was flattened into one plain list instead. Not the shared `DataTable` either; this is a small, append-only list with no need for its search/sort/pagination. An unassigned class teacher shows as "Unassigned" rather than blank. The "pupils" count from the original mock is dropped for now — there's no Pupils backend yet to count against.

**Detail page — `/classes/[id]` (decided):** the app's first dynamic route. Clicking a class row (`onClick` + `router.push`, not a real `<a>` — can't validly wrap a `<tr>` in a `Next` `Link`) opens an editable view: class name and class-teacher reassignment, same `Dropdown`-of-staff pattern as "Add class." Below that, a permanent empty-state "No pupils yet" section — deliberately not built out further, since there's no Pupils backend yet to show a real roster against; adding fake sections (attendance, exam results) to look more complete would just be decoration with nothing behind it. `GET /api/classes/:id` and `PATCH /api/classes/:id` follow the same org-scoped-via-school tenant check as list/create (`classRepository.findById` joins through `school.organizationId`), and reassigning the teacher re-validates that staff member belongs to the org, same as on create.

## Pupils, Attendance, Exams, Fees (decided)

Prisma schema and `src/interface/*.ts` request/response shapes for the four remaining V1 modules, grounded directly in each mock page's actual interaction rather than speculative fields.

**Pupils has a full API now** (`GET`/`POST /api/pupils`, `GET`/`PATCH`/`DELETE /api/pupils/:id`, `POST /api/pupils/move`) — same repository → service → controller → routes pattern as Classes/Staff. Two things worth calling out:
- **`POST /api/pupils/move`** — moves one or more pupils to a different class (or unassigns with `classId: null`) in a single request, rather than requiring one `PATCH` per pupil. `pupilService.moveMany` validates every pupil belongs to the org *and*, when a target class is given, that every one of them is in that class's school — a pupil can change classes within their school, not silently transfer to a different school's class through this endpoint.
- Every class reassignment (single `PATCH` or bulk `move`) is checked the same way: `assertClassBelongsToSchool` confirms the target class exists in this org and belongs to the pupil's own `schoolId`, returning a 400 rather than letting a pupil end up pointing at a class in another school.

**Subjects has a full API + UI now too** — `GET`/`POST /api/subjects`, `PATCH /api/subjects/:id`, and `GET`/`POST /api/class-subjects`. No `/subjects` nav item: the Classes page (`/classes`) got a second tab, **Subject**, alongside the existing **Classes** tab — same `Tabs` component as Settings, not a new route. That tab manages the school-wide `Subject` list (name + score weighting: test/assignment/exam max marks, editable via the row's pencil icon) and *assigns* a subject to a class via the row's link icon — a modal with a Class + Subject-teacher picker that calls `POST /api/class-subjects`. The Classes tab got a matching quick-action: a row-level icon opens a small "assign class teacher" modal without navigating into the class's own detail page.

`classSubjectService.assign` is an **upsert**, not a plain create — calling it again for a class/subject pair that already exists (e.g. to change the subject teacher) updates that row instead of hitting the `[classId, subjectId]` unique constraint. Verified: assigning the same subject to the same class twice with different teachers left exactly one row, now carrying the new teacher.

The class detail page (`/classes/[id]`) got a 5th tab, **Subjects**, showing every `ClassSubject` assigned to that class (subject name, subject teacher, weighting) — read-only, since assignment itself happens from the Classes page's Subject tab, not here. Confirmed live: assigning "Mathematics" to "Primary 1" from the Subject tab immediately showed up on that class's own Subjects tab.

Attendance, Exams, and Fees are still schema + interfaces only — no repositories/services/controllers/routes yet. That's the natural next step, same pattern.

- **`Pupil`** — required `schoolId`, optional `classId` (`SetNull` on class delete, so a pupil isn't deleted just because their class was). Guardian fields (name/phone/relationship enum: mother/father/guardian) match the Pupils mock exactly.
- **`AttendanceRecord`** — one per pupil per day (`@@unique([pupilId, date])`). Stores `classId` as a snapshot alongside `pupilId`, so attendance history stays tied to whichever class a pupil was actually in that day, not wherever they are now.
- **Subjects (decided, revises the first pass):** `ExamScore` originally stored `subject` as a free-text string. Replaced with a real `Subject` model (school-scoped, unique per `[schoolId, name]`) and a `ClassSubject` join table that's literally how you "add a subject to a class" — one row per class/subject pair, with an optional `subjectTeacherId` (`Staff`, `SetNull` on delete). `ExamScore.subjectId` now points at `Subject` instead of a typed string, so "Mathematics" and "maths" can't both exist as separate scores, and the Exams page's subject dropdown can eventually be scoped to whichever subjects a class actually has instead of a hardcoded list. Migration `20261024122515_add_subjects` was hand-written and applied with `migrate deploy` (same reason as the `Class.level` removal — `migrate dev` refuses non-interactively on a warning, here a uniqueness-constraint warning rather than data loss; `exam_scores` was empty at the time, confirmed before writing the migration).
- **`FeeStructure`** (per school/level/term/session — matches the mock's grade-based fee schedule table) plus **`FeeInvoice`**/**`FeePayment`** (per-pupil, supporting partial payments; `amountPaid`/`status` denormalized on the invoice for cheap collection-rate queries rather than summing payments on every read) — matching the mock's two separate tables (fee structure vs. invoices).
- **`Term`** (first/second/third) is a shared enum between Exams and Fees; `session` stays a free string (e.g. "2025/2026") since academic years aren't a fixed set of values.

Verified at the schema level directly via SQL (no service layer exists yet to go through): created a `Subject`, assigned it to a `Class` via `ClassSubject` with a `subjectTeacherId`, recorded an `ExamScore` against it and confirmed the join back to the subject name works, and confirmed both the `[schoolId, name]` and `[pupilId, subjectId, term, session]` uniqueness constraints reject duplicates.

## Pupils wired to the frontend (decided) — `/pupils`

`/pupils` moved off mock data onto the real API: list (scoped to the selected school), enroll, edit, delete, and bulk move all go through `pupils-api.ts` now. Two things worth calling out:

**Row selection added to `DataTable` (decided):** the shared table component gained `enableRowSelection` + `onSelectedRowsChange` + `getRowId` — opt-in, so every other table using it (Staff, Classes, Company's staff list) is unaffected. Selection state stays internal to `DataTable` (same as sorting/expand/column-visibility); the new bit is a `useEffect` that reports the selected rows' *original data* back to the caller whenever selection changes, so a page can render its own bulk-action UI (a button, a bar, whatever) outside the table without `DataTable` needing to know what that action is. `getRowId` matters here specifically — without it, selection is keyed by row index, which breaks across refetches/sorts/pagination; Pupils passes `(pupil) => pupil.id`.

**"Move N to class"** appears in the page header the moment `selectedPupils.length > 0`, and opens a modal with just a Class dropdown (including "No class" to unassign) — thin wrapper around `POST /api/pupils/move`. Verified live: selected 2 pupils, moved both to a different class in one request, and the table reflected the change immediately for both rows.

Edit/Delete are per-row icon actions (pencil/trash) rather than a separate detail page, since pupils don't have one yet — delete uses a plain `window.confirm`, consistent with there being no reusable confirm-dialog component in the app yet.

## Attendance: full API + take-attendance UI (decided) — `/classes/[id]`'s Attendance tab, `/attendance`

**Schema redesign before building this:** the original `AttendanceRecord` (one row per pupil per day, no subject) couldn't represent what was actually needed — attendance for a whole class, for one subject's period, or for a named extra activity ("Sports Day") all in the same day. Replaced it with **`AttendanceSession`** (`classId`, `date`, optional `subjectId`, optional free-text `activity`) + a slimmer `AttendanceRecord` (`sessionId`, `pupilId`, `status`). One take-attendance submission = one session; re-submitting the same class/date/subject/activity combination finds and corrects the existing session instead of creating a duplicate (`attendanceService.markAttendance` does a find-or-create, then upserts each pupil's record by `[sessionId, pupilId]`). Migration `20261024135627_add_attendance_sessions` was hand-written and `migrate deploy`-applied (same non-interactive-warning story as the two earlier schema changes; the table was empty).

**The "For" picker (decided):** rather than a single combobox that's part-dropdown-part-free-text, the "Take attendance" modal uses a plain `Dropdown` ("Whole class" / "Subject period" / "Extra activity") that reveals either a Subject `Dropdown` (sourced from this class's assigned subjects) or a free-text `Input`, depending on which is picked. Achieves the same pick-or-type outcome without building a new combobox primitive — a real one (type to filter, select or fall through to free text in one field) would be a reasonable follow-up if this pattern shows up elsewhere.

**This dashboard both takes and shows attendance (decided)**, not records-only — per the discussion that the planned teacher PWA is a separate, longer-term build, and a bursar/proprietor needs some way to record or correct attendance before and after that ships.

**Two entry points, same backend:** the per-class detail tab (scoped to one class, reached via Classes → a class → Attendance) and the standalone `/attendance` nav page — which adds a Class picker up top (defaulting to the first class for the selected school) since it isn't pre-scoped, then renders the identical date/For/roster/submit form plus a "Recent sessions" list for that class. Both call the same `useMarkAttendanceMutation`/`useAttendanceSessionsQuery` hooks; the nav page just isn't a modal.

**Caught during verification, not before:** the first real submission 500'd — `Transaction API error: ... timeout for this transaction was 5000ms`. The transaction was awaiting one `upsertRecord` per pupil sequentially in a `for` loop; fixed by running them concurrently with `Promise.all` and raising the transaction's explicit timeout to 15s as headroom for larger rosters. Re-verified the exact same submission succeeded afterward. (That specific run's 8.5s was inflated by an unrelated session pause, but the sequential-await pattern was a genuine scaling risk independent of that — a 40-pupil roster doing one round trip at a time would get meaningfully closer to the default 5s ceiling on a slower connection.)

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
