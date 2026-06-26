import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { flushSync } from "react-dom";
import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS } from "input-otp";
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { auth } from "@/Firebase/firebase";
import { db } from "@/Firebase/firebase";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";
import { useAdmin } from "../context/useAdmin";
import { usePinGate } from "../context/usePinGate";
import { AdminLoading } from "../components/AdminLoading";
import { COLLECTIONS } from "../lib/collections";
import { createPinCredential, isValidPin, PIN_LENGTH } from "../lib/pin";
import { writeAuditLog } from "../lib/audit";
import { DEV_MOCK_ENABLED } from "../lib/devMock";

/** Masked PIN dot-slots for the setup form. */
function PinSlots({
  count,
  invalid,
  complete,
}: {
  count: number;
  invalid: boolean;
  complete: boolean;
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
              active
                ? "z-10 border-primary ring-4 ring-primary/20 shadow-lg shadow-primary/10"
                : "border-input",
              invalid && "border-destructive ring-4 ring-destructive/20",
              complete &&
                !invalid &&
                "border-emerald-500 ring-4 ring-emerald-500/20",
            )}
          >
            {filled && (
              <span
                className={cn(
                  "h-3 w-3 rounded-full shadow-sm",
                  complete && !invalid ? "bg-emerald-500" : "bg-foreground",
                )}
              />
            )}
            {!filled && active && (
              <span className="h-0.5 w-5 animate-pulse rounded-full bg-primary" />
            )}
          </div>
        );
      })}
    </div>
  );
}

type Step = "new" | "confirm";

/**
 * Full-page Security PIN setup screen.
 *
 * Required when an admin signs in for the first time and has no PIN configured.
 * The admin must create a PIN before gaining access to any protected route.
 * Also shown when a PIN is missing or corrupt so the admin can re-establish one.
 *
 * Fix notes:
 * - flushSync commits pinSessionVerified BEFORE navigate so RequirePinSession
 *   sees the updated value immediately (no race condition).
 * - Firestore write happens AFTER navigation (fire-and-forget) so the user is
 *   never blocked waiting for a network round-trip. If the write fails, the
 *   admin simply needs to set up their PIN again on the next login.
 */
export function PinSetup() {
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

  const [step, setStep] = useState<Step>("new");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const confirmMatch = confirmPin.length === PIN_LENGTH && confirmPin === pin;
  const confirmMismatch =
    confirmPin.length === PIN_LENGTH && confirmPin !== pin;

  // If admin already has a PIN, redirect to verify page instead.
  // Guard with !busy: once the submit flow starts (busy=true), we've already
  // navigated or are about to — don't let the background Firestore write
  // triggering onSnapshot cause a stray redirect.
  useEffect(() => {
    if (!loading && !busy && admin?.pinHash && admin?.pinSalt) {
      navigate("/admin/pin-verify", { replace: true });
    }
  }, [loading, busy, admin, navigate]);

  // Auto-advance to confirm step when new PIN is fully entered
  useEffect(() => {
    if (step === "new" && pin.length === PIN_LENGTH) {
      setStep("confirm");
      setError(null);
    }
  }, [pin, step]);

  // Auto-submit when confirm PIN is fully entered
  useEffect(() => {
    if (step === "confirm" && confirmPin.length === PIN_LENGTH) {
      void handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmPin, step]);

  const handleSubmit = async () => {
    if (busy) return;
    if (!admin) {
      setError("No admin account is loaded. Please sign in again.");
      return;
    }
    if (!isValidPin(pin)) {
      setError(`Choose a ${PIN_LENGTH}-digit PIN.`);
      setStep("new");
      setPin("");
      setConfirmPin("");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs do not match. Please try again.");
      setConfirmPin("");
      setStep("confirm");
      return;
    }

    setError(null);
    setBusy(true);

    try {
      if (DEV_MOCK_ENABLED) {
        console.log("[PinSetup] DEV_MOCK_ENABLED: skipping PIN hash and Firestore write.");
      } else {
        // 1. Hash the PIN in the Web Worker (non-blocking, runs at 600k iterations).
        const cred = await createPinCredential(pin);

        // 2. Persist the credential to Firestore FIRST — the PIN MUST be saved
        //    before session access is granted. If this fails, the user is shown
        //    an error and no access is granted.
        await updateDoc(doc(db, COLLECTIONS.admins, admin.uid), {
          pinHash: cred.hash,
          pinSalt: cred.salt,
          pinIterations: cred.iterations,
          updatedAt: serverTimestamp(),
        });
      }

      // 3. Commit session state synchronously so RequirePinSession sees
      //    pinSessionVerified=true before the navigation re-renders the guard.
      flushSync(() => {
        completePinSession();
      });

      // 4. Navigate to the originally requested route (or dashboard).
      navigate(destination, { replace: true });

      // 5. Audit log is non-critical — fire-and-forget after navigation.
      if (!DEV_MOCK_ENABLED) {
        void writeAuditLog({
          actorUid: admin.uid,
          actorEmail: admin.email,
          action: "admin.pin_set",
        });
      }
    } catch (err) {
      console.error("[PinSetup] failed to save PIN", err);
      setError("Could not save PIN. Please try again.");
      setBusy(false);
    }
  };

  const handleBack = () => {
    setStep("new");
    setConfirmPin("");
    setError(null);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/admin/login", { replace: true });
  };

  if (loading) {
    return <AdminLoading label="Loading account…" />;
  }

  if (!admin) {
    return null; // ProtectedAdminRoute will redirect to login
  }

  const steps: { key: Step; label: string }[] = [
    { key: "new", label: "Create PIN" },
    { key: "confirm", label: "Confirm PIN" },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-white via-indigo-50/40 to-white px-4 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950">
      {/* Decorative blobs */}
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
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
              <KeyRound className="h-8 w-8" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Set up your security PIN
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a{" "}
              <span className="font-medium text-foreground">
                {PIN_LENGTH}-digit PIN
              </span>{" "}
              to protect your admin account. You&apos;ll need it on every
              login.
            </p>
          </div>

          {/* Step indicators */}
          <div className="mb-6 flex items-center justify-center gap-4">
            {steps.map((s, idx) => {
              const isActive = step === s.key;
              const isDone = s.key === "new" && step === "confirm";
              return (
                <div key={s.key} className="flex items-center gap-2">
                  {idx > 0 && (
                    <div
                      className={cn(
                        "h-px w-8 transition-colors",
                        isDone ? "bg-primary" : "bg-border",
                      )}
                    />
                  )}
                  <div className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isDone
                            ? "bg-emerald-500 text-white"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {isDone ? (
                        <CheckCircle2
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isActive ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PIN input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
            className="space-y-6"
          >
            <div className="space-y-3">
              {step === "new" ? (
                <>
                  <p className="text-center text-xs text-muted-foreground">
                    Enter a new {PIN_LENGTH}-digit PIN
                  </p>
                  <OTPInput
                    key="new-pin"
                    id="pin-setup-new"
                    maxLength={PIN_LENGTH}
                    value={pin}
                    onChange={(val) => {
                      setPin(val);
                      if (error) setError(null);
                    }}
                    pattern={REGEXP_ONLY_DIGITS}
                    inputMode="numeric"
                    autoFocus
                    disabled={busy}
                    containerClassName="flex items-center justify-center"
                    aria-label="New security PIN"
                  >
                    <PinSlots
                      count={pin.length}
                      invalid={!!error}
                      complete={false}
                    />
                  </OTPInput>
                </>
              ) : (
                <>
                  <p className="text-center text-xs text-muted-foreground">
                    Confirm your {PIN_LENGTH}-digit PIN
                  </p>
                  <OTPInput
                    key="confirm-pin"
                    id="pin-setup-confirm"
                    maxLength={PIN_LENGTH}
                    value={confirmPin}
                    onChange={(val) => {
                      setConfirmPin(val);
                      if (error) setError(null);
                    }}
                    pattern={REGEXP_ONLY_DIGITS}
                    inputMode="numeric"
                    autoFocus
                    disabled={busy}
                    containerClassName="flex items-center justify-center"
                    aria-label="Confirm security PIN"
                  >
                    <PinSlots
                      count={confirmPin.length}
                      invalid={confirmMismatch || !!error}
                      complete={confirmMatch}
                    />
                  </OTPInput>
                </>
              )}

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  <ShieldCheck
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {step === "confirm" && (
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleBack}
                  disabled={busy}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={busy || confirmPin.length < PIN_LENGTH}
                >
                  {busy ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  )}
                  {busy ? "Saving…" : "Save PIN"}
                </Button>
              </div>
            )}
          </form>

          {/* Sign out */}
          <div className="mt-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => void handleSignOut()}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out and use a different account
            </Button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          This PIN protects your admin account from unauthorized access.
          <br />
          Keep it safe and do not share it with others.
        </p>
      </div>
    </div>
  );
}
