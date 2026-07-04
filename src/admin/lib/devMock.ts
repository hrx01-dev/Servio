import type { User } from "firebase/auth";
import type { AdminProfile } from "../types";

/**
 * Local-only "fake credential" for previewing the admin panel without setting
 * up Firebase Auth + Firestore.
 *
 * This module is imported by AdminContext, which mounts on every route — so it
 * must stay free of Firebase *value* imports (issue #234). The demo collection
 * data (which needs Firestore Timestamps) lives in devMockData.ts, reached
 * only from the lazily-loaded admin chunks.
 *
 * SAFETY: gated on `import.meta.env.DEV`, which is `true` only under the Vite
 * dev server and ALWAYS `false` in `vite build`. So this can never activate in
 * a production build, regardless of the env var. Enable it locally by setting
 * `VITE_ADMIN_DEV_MOCK=true` in `.env.local` (git-ignored).
 *
 * When enabled: AdminContext provides a fake super_admin and the data hooks
 * return the demo data below. Real Firestore writes (create/delete/role change)
 * will still fail without a backend — this mode is for *viewing* the UI.
 *
 * IMPORTANT: This flag is explicitly compile-time dead-code-eliminated in
 * production builds. The `import.meta.env.DEV` check is replaced with `false`
 * by Vite/esbuild, making the entire mock path unreachable and tree-shaken.
 */
export const DEV_MOCK_ENABLED: boolean =
  import.meta.env.DEV === true &&
  import.meta.env.VITE_ADMIN_DEV_MOCK === "true";

if (DEV_MOCK_ENABLED) {
  console.warn(
    "[Servio] Admin dev-mock mode is ACTIVE. " +
      "Auth is bypassed — do NOT use this in production. " +
      "Remove VITE_ADMIN_DEV_MOCK from .env.local to disable.",
  );
}

export const MOCK_USER = {
  uid: "dev-mock-uid",
  email: "dev-admin@servio.local",
  displayName: "Dev Admin",
  emailVerified: true,
  isAnonymous: false,
} as unknown as User;

export const MOCK_ADMIN: AdminProfile = {
  uid: "dev-mock-uid",
  email: "dev-admin@servio.local",
  displayName: "Dev Admin",
  role: "super_admin",
  disabled: false,
};

export const MOCK_ADMINS: AdminProfile[] = [
  MOCK_ADMIN,
  {
    uid: "dev-fe",
    email: "frontend@servio.local",
    displayName: "Priya Frontend",
    role: "frontend_dev",
    disabled: false,
  },
  {
    uid: "dev-be",
    email: "backend@servio.local",
    displayName: "Arjun Backend",
    role: "backend_dev",
    disabled: false,
  },
  {
    uid: "dev-qa",
    email: "qa@servio.local",
    displayName: "Meera QA",
    role: "qa_delivery",
    disabled: true,
  },
];
