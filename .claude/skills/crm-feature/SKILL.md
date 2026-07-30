---
name: crm-feature
description: Use when adding or extending functionality in this CRM (Django REST + React) — new backend apps/models/endpoints, new frontend pages/API calls, or any full-stack feature. Encodes this repo's exact conventions so new code matches existing style instead of introducing a new pattern.
---

# Building features in this CRM

This project is a Django REST Framework backend (`backend/`) + React 19/Vite frontend
(`frontend/`), currently implementing auth, user management, and audit logging in a
single Django app (`accounts`). There is no scaffolding tool — follow the conventions
below by hand, matching the existing `accounts` app.

## Backend (Django / DRF)

**New feature = new Django app**, not more code stuffed into `accounts`, unless the
feature is genuinely about users/auth. Register it in `INSTALLED_APPS`
(`backend/backend/settings.py`) and wire its urls in `backend/backend/urls.py` via
`path('api/', include('<app>.urls'))` (mirror how `accounts.urls` is included).

- **Package manager is `uv`**, Python >=3.14. Run backend commands via `uv run
  manage.py ...` from `backend/`. There is no linter/formatter configured (no ruff/black)
  and no real test suite (`tests.py` is an untouched stub) — don't invent CI-enforced
  style rules that don't exist, but also don't regress: if you add meaningful logic,
  consider whether a quick test is warranted even though none exist yet.

- **Models**: plain `models.Model`, integer auto-increment PKs (no UUIDs). Explicit
  `DateTimeField(auto_now_add=True)` for creation timestamps — there's no shared
  `updated_at`/base-model convention, so don't invent one unilaterally for just your
  feature. FKs use snake_case `related_name`. Enum-like fields use `choices` as a
  list of tuples. Add `Meta: ordering = [...]` for anything listy. Always a `__str__`.

- **Serializers**: `ModelSerializer` for CRUD-on-a-model, plain `Serializer` for
  action/RPC endpoints that don't map 1:1 to a model (e.g. an "invite" or "approve"
  action). Naming: `<Noun>Serializer` vs `<Verb><Noun>Serializer`. Always spell out
  `Meta.fields` as a tuple — never `'__all__'`. For write serializers that should
  respond with the canonical read shape, override `to_representation` to delegate to
  the read serializer (see `UserUpdateSerializer` in `accounts/serializers.py`).
  Field validation via `validate_<field>`; cross-field validation via
  `validate(self, attrs)` returning `attrs` (stash derived objects like a looked-up
  `user` in there for the view to consume from `validated_data`).

- **Views**: `APIView` for actions, DRF generics (`ListAPIView`,
  `RetrieveUpdateAPIView`, `UpdateAPIView`) for CRUD. **No ViewSets/routers** — stay
  consistent with the flat-`urls.py` style. Standard shape: build serializer with
  `data=request.data`, `serializer.is_valid(raise_exception=True)`, pull from
  `validated_data`, return `Response(..., status=status.HTTP_xxx)` — don't
  hand-roll try/except around validation. Set `permission_classes` as a static list
  per view (no `get_permissions()` overrides). Override `get_queryset()` for
  role-scoped visibility, `perform_update()`/`perform_create()` for side effects.

- **Permissions**: subclass `BasePermission` in a `permissions.py`; keep the actual
  authorization logic in a plain, testable helper function (see `can_manage` in
  `accounts/permissions.py`) that the permission class just calls. Role hierarchy is
  `is_superuser` > `is_staff` > everyone else — there's no separate `role` field or
  groups table, so check those two booleans rather than adding a new role system.

- **Audit logging**: if the feature performs an admin-relevant mutation (create,
  update, delete, invite, etc.), call `log_action(...)` from `accounts/audit.py` (or
  add a thin `log_<verb>(...)` wrapper next to the existing ones) from the view,
  the same way `LoginView`/`InviteUserView` do. Note: `UserDetailView` and
  `MyProfileUpdateView` currently *skip* calling `log_user_update` despite mutating
  users — that's a known gap in the existing code, not a pattern to copy. New
  mutating endpoints should log.

- **URLs**: flat `path()` list per app, `.as_view()`, trailing slashes, grouped by a
  resource-noun prefix (`deals/...`) with verb leaf segments for actions
  (`deals/<id>/close/`) and REST-ish leaves for CRUD (`deals/<int:pk>/`). No
  `name=` kwargs used anywhere currently.

- **Settings/env**: anything configurable goes through `django-environ`
  (`env(...)`/`env.bool`/`env.list`), never hardcoded — mirror the existing
  `settings.py` bottom block for feature-specific config.

## Frontend (React / Vite)

- **API layer**: one file per feature under `frontend/src/api/<feature>.js`,
  mirroring `users.js` — plain named arrow-function exports (`listX`, `getX`,
  `createX`, `updateX`) that call the shared `client` from `api/client.js` and
  return the promise as-is (no try/catch, no unwrapping `.data` — the caller does
  that). Convert camelCase JS params to snake_case body keys to match DRF field
  names. Don't touch `client.js`'s auth/refresh interceptor logic unless the auth
  flow itself is what you're changing.

- **Pages**: functional components as **named** exports (`export const Deals =
  () => {...}`), not default exports. Local state via multiple `useState` calls —
  no Redux/Zustand/React Query in this project, don't introduce one for a single
  feature. Data loading: `useEffect(() => { loadX(); }, [])` calling an async
  function that toggles a `loading` state around `await api.list()` in
  try/catch/finally. Form handlers named `handleX`, call `e.preventDefault()`, show
  inline feedback via a `message` state string auto-cleared with
  `setTimeout(..., 3000)` — no toast library. Read validation errors as
  `err.response?.data?.<field>?.[0] || 'fallback message'`.

- **Access control**: gate both in the route (via `ProtectedRoute` for
  authenticated-only) and in-page using `<RoleGate allow={...}>` plus an early-return
  "Access denied" check using role flags from `useAuth()` — this repo does both,
  belt-and-suspenders, rather than relying on routing alone.

- **Routing**: add new protected routes inside the existing `<Route
  element={<ProtectedRoute />}>` block in `App.jsx`; public routes go before it.

- **Styling**: one co-located CSS file per component/page (`Deals.jsx` +
  `Deals.css`), kebab-case classes, root wrapper class matching the component name.
  Use the CSS custom properties from `index.css` (`var(--text)`, `var(--border)`,
  etc.) for theming rather than hardcoding colors — existing components sometimes
  hardcode dark-mode hex values instead, which is an inconsistency to avoid
  repeating, not a pattern to follow.

## When starting a new feature

1. Confirm whether it belongs in `accounts` or warrants a new Django app.
2. Backend: model → serializer(s) → permission(s) if new roles/rules are needed →
   view(s) → urls → audit logging on mutations.
3. Frontend: `api/<feature>.js` → page component + CSS → route in `App.jsx` →
   nav entry in `Navbar.jsx` if it should be user-visible → role gating.
4. There's no automated test/lint gate in this repo today — manually verify by
   running both dev servers and exercising the feature in the browser.
