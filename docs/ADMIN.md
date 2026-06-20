# Servio Admin Portal

An internal administration portal with Firebase Authentication, role-based
access control (RBAC), dynamic navigation, protected routes, and a security-PIN
layer for sensitive actions.

> Implements GitHub issue #64 — "Build Admin Dashboard Foundation with
> Role-Based Access Control (RBAC) and Security PIN Support".

---

## 1. Architecture overview

The portal lives entirely in the existing Vite + React SPA under
[`src/admin/`](../src/admin) and is mounted at **`/admin`** by the app router.

```
Browser ──▶ AuthProvider (Firebase Auth)        ← existing, app-wide
              └─ /admin/* ──▶ AdminApp
                               ├─ AdminProvider   loads admins/{uid}, exposes role + can()
                               └─ PinGateProvider session PIN verification
                                    └─ Routes
                                         ├─ /admin/login          (public)
                                         ├─ /admin/unauthorized   (public)
                                         └─ ProtectedAdminRoute    requires a valid admin
                                              └─ AdminLayout (sidebar + topbar)
                                                   ├─ /admin/dashboard
                                                   ├─ /admin/projects
                                                   ├─ /admin/clients
                                                   ├─ /admin/messages
                                                   ├─ /admin/audit      (audit:view)
                                                   └─ /admin/settings   (super_admin)
```

Access is enforced in **two layers**:

1. **Client guards** (`src/admin`) — for UX: redirect unauthenticated/unauthorized
   users, hide controls a role can't use, prompt for a PIN. These are
   convenience only and **can be bypassed** by a determined user.
2. **Firestore Security Rules** ([`firestore.rules`](../firestore.rules)) — the
   real, server-side enforcement. The role→capability matrix is mirrored there.

> ⚠️ Because this is a client-only SPA (Firebase Hosting, no backend server),
> **the security rules are what actually protect your data.** Always deploy them.

### Directory map

| Path | Responsibility |
| --- | --- |
| `src/admin/types.ts` | Domain types for all collections |
| `src/admin/rbac/permissions.ts` | `Permission` union, role→permission matrix, `hasPermission`, sensitive set |
| `src/admin/rbac/roles.ts` | Role list, display metadata, `isAdminRole` guard |
| `src/admin/rbac/navigation.ts` | Sidebar items + the permission each needs |
| `src/admin/lib/collections.ts` | Collection refs + safe Firestore→type parsers |
| `src/admin/lib/pin.ts` | PBKDF2 PIN hashing / verification (Web Crypto) |
| `src/admin/lib/audit.ts` | `writeAuditLog()` helper |
| `src/admin/lib/format.ts` | Date / currency formatting |
| `src/admin/context/AdminContext.tsx` | Loads `admins/{uid}`, exposes role + `can()` |
| `src/admin/context/PinProvider.tsx` | Session PIN gate + renders `PinDialog` |
| `src/admin/hooks/useAdminData.ts` | Real-time collection hooks (`useProjects`, …) |
| `src/admin/hooks/useSensitiveAction.ts` | Wrap an action behind a PIN challenge |
| `src/admin/components/guards/*` | `ProtectedAdminRoute`, `RequirePermission` |
| `src/admin/components/*` | Layout, sidebar, PIN dialog, shared UI |
| `src/admin/pages/*` | Login, Unauthorized, Dashboard, Projects, Clients, Messages, Audit, Settings |
| `src/admin/AdminApp.tsx` | The `/admin/*` route tree + providers |

---

## 2. Roles & permissions (RBAC)

Four roles are defined. Capabilities are expressed as fine-grained
`resource:action` permissions; routes and controls gate on **permissions**, not
roles directly, so the mapping can evolve in one place
(`src/admin/rbac/permissions.ts`).

| Permission | super_admin | frontend_dev | backend_dev | qa_delivery |
| --- | :---: | :---: | :---: | :---: |
| `dashboard:view`        | ✅ | ✅ | ✅ | ✅ |
| `projects:view`         | ✅ | ✅ | ✅ | ✅ |
| `projects:edit`         | ✅ | ✅ | ✅ | — |
| `projects:assign`       | ✅ | — | ✅ | — |
| `projects:delete` 🔒    | ✅ | — | — | — |
| `clients:view`          | ✅ | ✅ | ✅ | ✅ |
| `clients:edit`          | ✅ | — | ✅ | — |
| `messages:view`         | ✅ | ✅ | ✅ | ✅ |
| `messages:reply`        | ✅ | ✅ | ✅ | ✅ |
| `settings:view` 🔒      | ✅ | — | — | — |
| `admins:manage` 🔒      | ✅ | — | — | — |
| `audit:view`            | ✅ | — | ✅ | — |
| `business:view_sensitive` 🔒 | ✅ | — | — | — |

🔒 = **sensitive** — requires a security-PIN challenge in addition to the
permission (see `SENSITIVE_PERMISSIONS`).

This satisfies the issue's examples:
- `frontend_dev` cannot access settings or manage admins.
- `backend_dev` cannot manage admins.
- `qa_delivery` cannot modify project assignments (`projects:assign`/`edit`).
- `super_admin` has full access.

---

## 3. Firestore data model

| Collection | Doc id | Purpose |
| --- | --- | --- |
| `admins` | Firebase Auth `uid` | Admin profile, role, hashed PIN |
| `projects` | auto | Delivery projects |
| `clients` | auto | Client directory |
| `messages` | auto | Inbound contact/quote submissions |
| `audit_logs` | auto | Append-only record of sensitive actions |

### `admins/{uid}`
```ts
{
  email: string,
  displayName: string,
  role: 'super_admin' | 'frontend_dev' | 'backend_dev' | 'qa_delivery',
  disabled: boolean,
  // security PIN (set by the admin; never store the raw PIN)
  pinHash?: string,        // PBKDF2-SHA256, hex
  pinSalt?: string,        // hex
  pinIterations?: number,
  createdAt?: Timestamp,
  updatedAt?: Timestamp,
  lastLoginAt?: Timestamp,
}
```

### `projects/{id}`
```ts
{ name, clientId?, clientName?, status, assignedTo: string[], budget?, description?, createdAt?, updatedAt? }
// status: 'lead' | 'active' | 'on_hold' | 'completed' | 'archived'
```

### `clients/{id}`
```ts
{ name, company?, email, phone?, notes?, createdAt?, updatedAt? }
```

### `messages/{id}`
```ts
{ name, email, subject?, body, status, createdAt? }
// status: 'new' | 'read' | 'replied' | 'archived'
```

### `audit_logs/{id}`
```ts
{ actorUid, actorEmail, action, targetType?, targetId?, metadata?, createdAt? }
// e.g. action: 'project.delete', 'admin.role_change', 'admin.pin_set'
```

---

## 4. Security PIN

Sensitive actions (delete project, change admin roles, open system config, view
sensitive business data) require an extra PIN challenge on top of the role
check.

- The PIN is a 6-digit code, hashed with **PBKDF2-SHA256** + a per-admin random
  salt via the Web Crypto API (`src/admin/lib/pin.ts`). Only the hash, salt and
  iteration count are stored on `admins/{uid}` — never the raw PIN.
- Verification is **session-based**: once verified, it stays valid for
  `PIN_SESSION_TTL_MS` (5 minutes) before the gate prompts again.
- First use: if no PIN is configured, the dialog runs in **setup** mode (enter +
  confirm) and saves the credential.
- Usage in code:
  ```tsx
  const runSensitive = useSensitiveAction();
  await runSensitive(async () => {
    await deleteDoc(doc(db, 'projects', id));   // only runs after PIN verified
  });
  ```

### Production hardening (recommended)

Client-side hashing protects the PIN **at rest in Firestore**, but a determined
user with a valid session could bypass the client check. For real protection of
sensitive writes, move verification server-side:

1. Add a Cloud Function `verifyAdminPin` that checks the PIN and mints a
   short-lived custom claim / token.
2. Tighten `firestore.rules` so sensitive writes require that claim.

The PIN module is intentionally small so only `hashPin`/`verifyPin` need to
change.

---

## 5. Setup

### 5.1 Environment variables

Firebase web config is read from Vite env vars. Copy the template and fill it in:

```bash
cp .env.example .env.local
```

`.env.local` (git-ignored) is already populated for the `servio-0` project.
These "web API keys" are safe to ship in the client bundle — access is gated by
Auth + Security Rules, not by key secrecy.

### 5.2 Enable Firebase services

In the [Firebase console](https://console.firebase.google.com/project/servio-0):
1. **Authentication** → enable the **Email/Password** provider (and Google if
   desired).
2. **Firestore Database** → create the database (production mode).

### 5.3 Bootstrap the first super admin

The rules only let an existing `super_admin` create admin docs, so seed the
first one by hand:

1. **Authentication → Users → Add user** — create the admin's email + password
   (or have them sign up). Copy the generated **User UID**.
2. **Firestore → Start collection** `admins` → **Document ID = that UID**, fields:
   | Field | Type | Value |
   | --- | --- | --- |
   | `email` | string | the admin's email |
   | `displayName` | string | e.g. `Harsh Goswami` |
   | `role` | string | `super_admin` |
   | `disabled` | boolean | `false` |
   | `createdAt` | timestamp | now |
3. Visit `/admin/login`, sign in — you now have full access and can add the rest
   of the team from **Settings → Admin users**.

### 5.4 Deploy security rules

```bash
firebase deploy --only firestore:rules
# (.firebaserc already targets the `servio-0` project)
```

### 5.5 Local preview without a backend (dev mock)

To browse the admin UI locally without configuring Firebase Auth/Firestore, set
`VITE_ADMIN_DEV_MOCK=true` in `.env.local` and run `npm run dev`. Visiting
`/admin` then signs you in as a fake **super_admin** ("Dev Admin") with demo
data across every page.

- **Hard-gated on `import.meta.env.DEV`**, which is `false` in `vite build`, so
  the mock — and its demo data/fake credentials — can never activate in or be
  bundled into a production build (the mock args fold away and are tree-shaken).
- It's a **read-only preview**: writes (create/delete/role change) hit real
  Firestore and will fail without a backend.
- Turn it off by clearing the env var and restarting the dev server.

---

## 6. Routes

| Route | Access |
| --- | --- |
| `/admin` | redirects to `/admin/dashboard` |
| `/admin/login` | public |
| `/admin/unauthorized` | public (shown to non-admins) |
| `/admin/dashboard` | any admin |
| `/admin/projects` | `projects:view` |
| `/admin/clients` | `clients:view` |
| `/admin/messages` | `messages:view` |
| `/admin/audit` | `audit:view` (super_admin + backend_dev) |
| `/admin/settings` | `settings:view` (super_admin) |

The sidebar is generated from `ADMIN_NAV`, filtered by the signed-in admin's
permissions — each role sees only what it can use.

---

## 7. Acceptance criteria → where it lives

| Criterion | Implementation |
| --- | --- |
| Admin authentication | `pages/AdminLogin.tsx`, `context/AdminContext.tsx` |
| Dedicated `/admin` route | `AdminApp.tsx`, wired in `src/app/App.tsx` |
| Dashboard layout & navigation | `components/AdminLayout.tsx`, `AdminSidebar.tsx` |
| RBAC system | `rbac/permissions.ts`, `rbac/roles.ts` |
| Protected routes enforce permissions | `components/guards/*`, `firestore.rules` |
| Dynamic sidebar based on role | `AdminSidebar.tsx` + `rbac/navigation.ts` |
| Security PIN architecture | `lib/pin.ts`, `context/PinProvider.tsx`, `components/PinDialog.tsx` |
| Firestore collections designed & documented | this file + `firestore.rules` |
| Unauthorized access handling | `pages/Unauthorized.tsx`, guards, rules |
| Ready for future features | typed data layer, hooks, audit log |

---

## 8. Known limitations / future work

- **PIN verification is client-side** (see §4 hardening). Relatedly, the PIN
  hash/salt live on the readable `admins/{uid}` document, so a super_admin can
  read (and offline-brute-force) another admin's 6-digit PIN. This is a
  defense-in-depth gap, not a privilege escalation (the PIN is a UX gate only,
  never enforced in rules). Hardening: move `pinHash/pinSalt/pinIterations` into
  an owner-only subdocument (e.g. `admins/{uid}/security/pin`) and/or verify in a
  Cloud Function.
- Collection hooks subscribe to whole collections and sort client-side — fine
  for the foundation; add pagination/queries + composite indexes as data grows.
- Admin creation is manual for the first super admin (by design).
- The last-enabled-super-admin guard is enforced client-side; for true
  guarantees move admin role/disable mutations behind a Cloud Function that
  performs the count-and-block transactionally.
- The public `messages` create rule is hardened (server timestamp required,
  bounded field sizes, basic email shape) but is still unauthenticated by
  design. For scripted-spam protection, enable Firebase App Check and/or route
  submissions through a rate-limited callable function. Wire the marketing
  contact/quote forms to `addDoc(messagesCollection, …)` to populate it.
