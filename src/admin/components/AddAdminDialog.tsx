import { useState } from "react";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { auth, db } from "@/Firebase/firebase";
import { Button } from "@/app/components/ui/button";
import { COLLECTIONS } from "../lib/collections";
import { writeAuditLog } from "../lib/audit";
import { ADMIN_ROLES, roleLabel } from "../rbac/roles";
import { AdminProfile, AdminRole } from "../types";

interface AddAdminDialogProps {
  currentAdmin: AdminProfile;
  onClose: () => void;
}

/**
 * Dialog for super admins to provision a new admin account. Creates a Firebase
 * Auth user (if the email is new) and writes the `admins/{uid}` Firestore
 * document with the selected role.
 */
export function AddAdminDialog({ currentAdmin, onClose }: AddAdminDialogProps) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("frontend_dev");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !displayName || !password) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);

    try {
      // Check if the email is already registered in Firebase Auth.
      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (methods.length > 0) {
        // User exists in Auth — we can't get their UID from the client SDK
        // without signing them in. Instead, inform the admin.
        setError(
          "This email is already registered in Firebase Auth. " +
            "Ask the user to sign in at /admin/login once their admin document is created. " +
            "Use the Firebase Console or the seed script to link the UID.",
        );
        setBusy(false);
        return;
      }

      // Create the Firebase Auth user.
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const uid = credential.user.uid;

      // Check if an admin doc already exists (shouldn't, but be safe).
      const adminRef = doc(db, COLLECTIONS.admins, uid);
      const existing = await getDoc(adminRef);

      if (existing.exists()) {
        setError("An admin profile already exists for this user.");
        setBusy(false);
        return;
      }

      // Write the admin document.
      await setDoc(adminRef, {
        email,
        displayName,
        role,
        disabled: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Audit log.
      await writeAuditLog({
        actorUid: currentAdmin.uid,
        actorEmail: currentAdmin.email,
        action: "admin.create",
        targetType: "admin",
        targetId: uid,
        metadata: { email, role },
      });

      toast.success(`Admin account created for ${displayName}.`);
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create admin.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl">
        <div className="mb-5 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-indigo-600" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Add Admin</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="add-admin-name"
              className="block text-sm font-medium text-foreground"
            >
              Display name
            </label>
            <input
              id="add-admin-name"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
              placeholder="e.g. Harsh Goswami"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="add-admin-email"
              className="block text-sm font-medium text-foreground"
            >
              Email
            </label>
            <input
              id="add-admin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="add-admin-password"
              className="block text-sm font-medium text-foreground"
            >
              Initial password
            </label>
            <input
              id="add-admin-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
              placeholder="Min 6 characters"
            />
            <p className="text-xs text-muted-foreground">
              Share this with the admin securely. They should change it on first login.
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="add-admin-role"
              className="block text-sm font-medium text-foreground"
            >
              Role
            </label>
            <select
              id="add-admin-role"
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
            >
              {ADMIN_ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && (
                <Loader2
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              Create admin
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
