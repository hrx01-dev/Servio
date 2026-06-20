import { Timestamp } from "firebase/firestore";
import type { User } from "firebase/auth";
import {
  AdminProfile,
  AuditLogEntry,
  Client,
  ContactMessage,
  Project,
} from "../types";

/**
 * Local-only "fake credential" for previewing the admin panel without setting
 * up Firebase Auth + Firestore.
 *
 * SAFETY: gated on `import.meta.env.DEV`, which is `true` only under the Vite
 * dev server and ALWAYS `false` in `vite build`. So this can never activate in
 * a production build, regardless of the env var. Enable it locally by setting
 * `VITE_ADMIN_DEV_MOCK=true` in `.env.local` (git-ignored).
 *
 * When enabled: AdminContext provides a fake super_admin and the data hooks
 * return the demo data below. Real Firestore writes (create/delete/role change)
 * will still fail without a backend — this mode is for *viewing* the UI.
 */
export const DEV_MOCK_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_ADMIN_DEV_MOCK === "true";

function ts(iso: string): Timestamp {
  return Timestamp.fromDate(new Date(iso));
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

export const MOCK_PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Acme Website Redesign",
    clientName: "Acme Inc.",
    status: "active",
    assignedTo: ["dev-fe", "dev-be"],
    budget: 450000,
    createdAt: ts("2026-05-02"),
    updatedAt: ts("2026-06-10"),
  },
  {
    id: "p2",
    name: "Globex Mobile App",
    clientName: "Globex",
    status: "lead",
    assignedTo: [],
    budget: 800000,
    createdAt: ts("2026-06-01"),
  },
  {
    id: "p3",
    name: "Initech Dashboard",
    clientName: "Initech",
    status: "completed",
    assignedTo: ["dev-be"],
    budget: 300000,
    createdAt: ts("2026-03-15"),
  },
  {
    id: "p4",
    name: "Umbrella CRM",
    clientName: "Umbrella Co.",
    status: "on_hold",
    assignedTo: ["dev-fe"],
    budget: 120000,
    createdAt: ts("2026-04-20"),
  },
];

export const MOCK_CLIENTS: Client[] = [
  {
    id: "c1",
    name: "Acme Inc.",
    company: "Acme",
    email: "hello@acme.test",
    phone: "+91 90000 00001",
    createdAt: ts("2026-04-01"),
  },
  {
    id: "c2",
    name: "Globex",
    company: "Globex Corp",
    email: "contact@globex.test",
    phone: "+91 90000 00002",
    createdAt: ts("2026-05-12"),
  },
  {
    id: "c3",
    name: "Initech",
    company: "Initech",
    email: "team@initech.test",
    createdAt: ts("2026-02-20"),
  },
];

export const MOCK_MESSAGES: ContactMessage[] = [
  {
    id: "m1",
    name: "Rahul Sharma",
    email: "rahul@example.com",
    subject: "Need a landing page",
    body: "Hi, we'd like a quote for a marketing landing page.",
    status: "new",
    createdAt: ts("2026-06-18"),
  },
  {
    id: "m2",
    name: "Sara Khan",
    email: "sara@example.com",
    subject: "E-commerce build",
    body: "Looking for a full storefront with payments and inventory.",
    status: "read",
    createdAt: ts("2026-06-15"),
  },
  {
    id: "m3",
    name: "Tom Lee",
    email: "tom@example.com",
    body: "Following up on my previous enquiry — any update?",
    status: "replied",
    createdAt: ts("2026-06-10"),
  },
];

export const MOCK_AUDIT: AuditLogEntry[] = [
  {
    id: "a1",
    actorUid: "dev-mock-uid",
    actorEmail: "dev-admin@servio.local",
    action: "project.create",
    targetType: "project",
    targetId: "p2",
    createdAt: ts("2026-06-01"),
  },
  {
    id: "a2",
    actorUid: "dev-mock-uid",
    actorEmail: "dev-admin@servio.local",
    action: "admin.role_change",
    targetType: "admin",
    targetId: "dev-be",
    metadata: { from: "frontend_dev", to: "backend_dev" },
    createdAt: ts("2026-05-20"),
  },
  {
    id: "a3",
    actorUid: "dev-mock-uid",
    actorEmail: "dev-admin@servio.local",
    action: "project.delete",
    targetType: "project",
    targetId: "p9",
    createdAt: ts("2026-05-10"),
  },
];
