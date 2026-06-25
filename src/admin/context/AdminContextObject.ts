import { createContext } from "react";
import { User } from "firebase/auth";
import { AdminProfile, AdminRole } from "../types";
import { Permission } from "../rbac/permissions";

export interface AdminContextValue {
  /** The Firebase Auth user, if signed in (may not be an admin). */
  firebaseUser: User | null;
  /** Resolved admin profile, or null when the user is not a valid admin. */
  admin: AdminProfile | null;
  /** Effective role — null when not an admin or the account is disabled. */
  role: AdminRole | null;
  /** True while auth state and/or the admin document are still resolving. */
  loading: boolean;
  /** Set when loading the admin document failed (e.g. permission denied). */
  error: string | null;
  /** True when the user has a valid, enabled admin profile. */
  isAdmin: boolean;
  /** Permission check against the effective role. */
  can: (permission: Permission) => boolean;
  /** Diagnostic info for debugging login issues (temporary). */
  _debug: string | null;
}

export const AdminContext = createContext<AdminContextValue | null>(null);
