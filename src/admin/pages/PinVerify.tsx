import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { flushSync } from "react-dom";
import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS } from "input-otp";
import { KeyRound, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { auth } from "@/Firebase/firebase";
import { db } from "@/Firebase/firebase";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";
import { useAdmin } from "../context/useAdmin";
import { usePinGate } from "../context/usePinGate";
import { AdminLoading } from "../components/AdminLoading";
import { COLLECTIONS } from "../lib/collections";
import {
  createPinCredential,
  isValidPin,
  PIN_ITERATIONS,
  PIN_LENGTH,
  verifyPin,
} from "../lib/pin";
import { writeAuditLog } from "../lib/audit";
import {
  clearLockout,
  MAX_ATTEMPTS,
  readLockout,
  recordFailure,
} from "../lib/pinLockout";

// ── Lockout helpers ──────────────────────────────────────────────────────────
// Persistent attempt/lockout state lives in ../lib/pinLockout (unit-tested).

/** How long to show the lockout error before auto-signing out (ms). */
const LOCKOUT_SIGNOUT_DELAY_MS = 4_000;

// ── Slot renderer ────────────────────────────────────────────────────────────

function PinSlots({
  count,
  invalid,
  locked,
}: {
  count: number;
  invalid: boolean;
  locked: boolean;
}) {
  const ctx = useContext(OTPInputContext);
  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length: PIN_LENGTH }).map((_, i) => {
        const active = ctx?.slots[i]?.isActive ?? false;
        const filled = i < count;
        return (
          <div
            key={i}
            aria-hidden="true"
            className={cn(
              "relative flex h-14 w-12 items-center justify-center rounded-xl border-2 bg-muted/40 text-sm transition-all duration-150",
              active && !locked
                ? "z-10 border-primary ring-4 ring-primary/20 shadow-lg shadow-primary/10"
                : "border-input",
              (invalid || locked) && "border-destructive ring-4 ring-destructive/20",
            )}
          >
            {filled && (
              <span className="h-3 w-3 rounded-full bg-foreground shadow-sm" />
            )}
            {!filled && active && !locked && (
              <span className="h-0.5 w-5 animate-pulse rounded-full bg-primary" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Full-page Security PIN verification screen.
 *
 * Security properties:
 * - The failed-attempt count is persisted (localStorage, keyed by uid), so it
 *   cannot be reset by refreshing the page between guesses. After MAX_ATTEMPTS
 *   (3) consecutive failures the account is locked for LOCKOUT_DURATION_MS
 *   (15 min); the expiry is persisted too and survives refreshes and tabs.
 * - After the lock is set the user is automatically signed out after a brief
 *   delay. The lockout is deliberately NOT cleared on sign-out, so signing back
 *   in re-locks until the window expires — the forced sign-out cannot be used
 *   to bypass the lock. State is cleared only on a successful verification.
 *   (See ../lib/pinLockout for the persisted state machine and its tests.)
 * - PIN upgrade: on a successful verify, if the stored iteration count is
 *   *less than* the current target (PIN_ITERATIONS), the credential is
 *   silently re-hashed in the background to bring it up to the current
 *   strength. Hashes stored at a *higher* count are left untouched.
 * - Uses flushSync to commit pinSessionVerified before navigate so
 *   RequirePinSession sees the updated value immediately.
 * - Navigates to the originally requested route (location.state.from)
 *   rather than always falling back to /admin/dashboard.
 */
export function PinVerify() {
  const { admin, loading } = useAdmin();
  const { completePinSession } = usePinGate();
  const navigate = useNavigate();
  const location = useLocation();

  // Resolve destination: use the originally requested route forwarded via
  // location.state.from, falling back to the dashboard. Sanitise to reject
  // any path that would loop back through the auth/PIN flow.
  const rawFrom =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? "";
  const destination =
    rawFrom &&
    !rawFrom.startsWith("/admin/login") &&
    !rawFrom.startsWith("/admin/pin")
      ? rawFrom
      : "/admin/dashboard";

  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // locked=true disables all interaction and triggers auto sign-out.
  const [locked, setLocked] = useState(false);

  // The failed-attempt count is the persisted store's responsibility (see
  // ../lib/pinLockout) — it's the single source of truth and survives refreshes.
  // React state below only tracks UI concerns (pin/error/busy/locked).

  // If a lockout is still active on mount, surface it and force sign-out. This
  // is what re-locks an admin who signs back in during the window.
  useEffect(() => {
    if (!admin?.uid) return;
    const { lockedUntil } = readLockout(admin.uid);
    if (lockedUntil !== null) {
      setLocked(true);
      setError(
        `Too many failed attempts. Account locked until ${new Date(lockedUntil).toLocaleTimeString()}. Signing out…`,
      );
      const t = setTimeout(() => void doSignOut(), LOCKOUT_SIGNOUT_DELAY_MS);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin?.uid]);

  // Redirect to setup if no PIN is configured.
  useEffect(() => {
    if (!loading && admin && !admin.pinHash) {
      navigate("/admin/pin-setup", { replace: true });
    }
  }, [loading, admin, navigate]);

  const doSignOut = async () => {
    // Intentionally does NOT clear the lockout. The forced sign-out exists to
    // *enforce* the lockout window; clearing it here would let the admin sign
    // straight back in with a clean slate (the original bug). State is
    // per-browser localStorage, so there is nothing to leak across devices.
    await signOut(auth);
    navigate("/admin/login", { replace: true });
  };

  const handleSubmit = async (candidate: string) => {
    if (busy || locked || !candidate) return;
    if (!admin) {
      setError("No admin account is loaded. Please sign in again.");
      return;
    }
    if (!admin.pinHash || !admin.pinSalt) {
      navigate("/admin/pin-setup", { replace: true });
      return;
    }
    if (!isValidPin(candidate)) {
      setError(`Enter your ${PIN_LENGTH}-digit security PIN.`);
      return;
    }

    setError(null);
    setBusy(true);

    try {
      // Hashing runs in the Web Worker — main thread stays responsive.
      const ok = await verifyPin(candidate, {
        hash: admin.pinHash,
        salt: admin.pinSalt,
        iterations: admin.pinIterations,
      });

      if (ok) {
        // Correct PIN — wipe any persisted failed-attempt / lockout state so a
        // legitimate admin who fumbled a digit doesn't carry a stale counter.
        clearLockout(admin.uid);

        // Commit session state synchronously so RequirePinSession sees
        // pinSessionVerified=true before navigate re-renders the guard.
        flushSync(() => {
          completePinSession();
        });
        navigate(destination, { replace: true });

        // ── Background work after navigation ──────────────────────────────

        // 1. Upgrade credential if stored iteration count is WEAKER than the
        //    current target. Use `<` — not `!==` — to preserve any hashes that
        //    were already stored at a stronger (higher) count.
        const storedIterations = admin.pinIterations ?? PIN_ITERATIONS;
        if (storedIterations < PIN_ITERATIONS) {
          createPinCredential(candidate)
            .then((cred) =>
              updateDoc(doc(db, COLLECTIONS.admins, admin.uid), {
                pinHash: cred.hash,
                pinSalt: cred.salt,
                pinIterations: cred.iterations,
                updatedAt: serverTimestamp(),
              }),
            )
            .catch((err) =>
              console.warn("[PinVerify] background re-hash failed", err),
            );
        }

        // 2. Audit log.
        void writeAuditLog({
          actorUid: admin.uid,
          actorEmail: admin.email,
          action: "admin.pin_verified",
        });
      } else {
        setPin("");

        // Persist the failure (survives refreshes) and find out whether this
        // one tripped the lockout. recordFailure handles the threshold + expiry.
        const { attempts: next, lockedUntil } = recordFailure(admin.uid);

        if (lockedUntil !== null) {
          setLocked(true);
          setError(
            `Too many failed attempts. Account locked until ${new Date(lockedUntil).toLocaleTimeString()}. Signing out…`,
          );
          // Auto sign-out after a brief delay so the user sees the message.
          setTimeout(() => void doSignOut(), LOCKOUT_SIGNOUT_DELAY_MS);
        } else {
          setError(
            next === MAX_ATTEMPTS - 1
              ? `Incorrect PIN. 1 attempt remaining before lockout.`
              : "Incorrect PIN. Please try again.",
          );
        }

        setBusy(false);
      }
    } catch (err) {
      console.error("[PinVerify] verification failed", err);
      setError("Could not verify PIN. Please try again.");
      setPin("");
      setBusy(false);
    }
  };

  if (loading) {
    return <AdminLoading label="Loading account…" />;
  }

  if (!admin) {
    return null; // ProtectedAdminRoute will redirect to login
  }

  const inputDisabled = busy || locked;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-white via-indigo-50/40 to-white px-4 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950">
      {/* Subtle decorative blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl dark:bg-indigo-900/20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-200/30 blur-3xl dark:bg-purple-900/20"
      />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-xl">
          {/* Header */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div
              className={cn(
                "mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg",
                locked
                  ? "bg-destructive shadow-destructive/30"
                  : "bg-gradient-to-br from-indigo-600 to-purple-600 shadow-indigo-500/30",
              )}
            >
              <ShieldCheck className="h-8 w-8" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {locked ? "Account locked" : "Security verification"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {locked ? (
                "Too many incorrect PIN attempts."
              ) : (
                <>
                  Enter your{" "}
                  <span className="font-medium text-foreground">
                    {PIN_LENGTH}-digit PIN
                  </span>{" "}
                  to access the admin panel.
                </>
              )}
            </p>
            {admin.displayName && !locked && (
              <p className="mt-1 text-xs text-muted-foreground">
                Signed in as{" "}
                <span className="font-medium">{admin.email}</span>
              </p>
            )}
          </div>

          {/* PIN input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit(pin);
            }}
            className="space-y-6"
          >
            <div className="space-y-3">
              <OTPInput
                id="pin-verify-input"
                maxLength={PIN_LENGTH}
                value={pin}
                onChange={(val) => {
                  if (locked) return;
                  setPin(val);
                  if (error && !locked) setError(null);
                  // Auto-submit the moment the last digit is entered.
                  if (val.length === PIN_LENGTH) {
                    void handleSubmit(val);
                  }
                }}
                pattern={REGEXP_ONLY_DIGITS}
                inputMode="numeric"
                autoFocus
                disabled={inputDisabled}
                containerClassName="flex items-center justify-center"
                aria-label="Security PIN"
              >
                <PinSlots
                  count={pin.length}
                  invalid={!!error && !locked}
                  locked={locked}
                />
              </OTPInput>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  <KeyRound
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {!locked && (
              <Button
                type="submit"
                className="w-full"
                disabled={inputDisabled || pin.length < PIN_LENGTH}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                )}
                {busy ? "Verifying…" : "Verify PIN"}
              </Button>
            )}
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Sign out */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            disabled={busy}
            onClick={() => void doSignOut()}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out and use a different account
          </Button>
        </div>
      </div>
    </div>
  );
}
