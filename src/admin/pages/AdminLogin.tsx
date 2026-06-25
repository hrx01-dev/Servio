import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { Home, Loader2, ShieldCheck } from "lucide-react";
import { auth } from "@/Firebase/firebase";
import { Button } from "@/app/components/ui/button";
import { useAdmin } from "../context/useAdmin";
import { usePinGate } from "../context/usePinGate";
import { AdminLoading } from "../components/AdminLoading";
import { authErrorMessage } from "../lib/authError";
import {
  readLoginLockout,
  recordLoginFailure,
  clearLoginLockout,
  MAX_LOGIN_ATTEMPTS,
  type LoginLockoutState,
} from "../lib/loginLockout";

interface LocationState {
  from?: { pathname?: string };
}

export function AdminLogin() {
  const { firebaseUser, isAdmin, loading, admin, error: adminError, _debug } = useAdmin();
  const { pinSessionVerified } = usePinGate();
  const navigate = useNavigate();
  const location = useLocation();
  // Only use `from` if it's a proper dashboard/protected route, not a PIN page.
  const rawFrom =
    (location.state as LocationState | null)?.from?.pathname ?? "";
  const protectedFrom =
    rawFrom &&
    !rawFrom.startsWith("/admin/login") &&
    !rawFrom.startsWith("/admin/pin")
      ? rawFrom
      : "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lockout, setLockout] = useState<LoginLockoutState>({
    attempts: 0,
    lockedUntil: null,
  });
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (loading || !firebaseUser || !isAdmin) return;

    // If the PIN session is already verified (e.g. the user refreshed the login
    // page while still logged in), go straight to the destination.
    if (pinSessionVerified) {
      navigate(protectedFrom, { replace: true });
      return;
    }

    // Route through the PIN gate. The PinVerify / PinSetup pages will redirect
    // to protectedFrom once the PIN step is complete.
    if (admin?.pinHash && admin?.pinSalt) {
      navigate("/admin/pin-verify", {
        replace: true,
        state: { from: { pathname: protectedFrom } },
      });
    } else {
      navigate("/admin/pin-setup", {
        replace: true,
        state: { from: { pathname: protectedFrom } },
      });
    }
  }, [loading, firebaseUser, isAdmin, admin, pinSessionVerified, protectedFrom, navigate]);

  // Tick the lockout countdown every second while an active lockout is present.
  useEffect(() => {
    if (lockout.lockedUntil === null) {
      setSecondsLeft(0);
      return;
    }
    const tick = () => {
      const ms = Math.max(0, lockout.lockedUntil! - Date.now());
      setSecondsLeft(Math.ceil(ms / 1000));
      if (ms <= 0) setLockout({ attempts: 0, lockedUntil: null });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockout.lockedUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check for an active lockout before hitting Firebase.
    const current = readLoginLockout(email);
    if (current.lockedUntil !== null && current.lockedUntil > Date.now()) {
      setLockout(current);
      return;
    }

    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      clearLoginLockout(email);
      // Redirect is handled by the effect once the admin profile resolves.
    } catch (err) {
      const next = recordLoginFailure(email);
      setLockout(next);
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setBusy(false);
    setError(null);
  };

  if (loading) {
    return <AdminLoading label="Loading…" />;
  }

  const signedInNotAdmin = Boolean(firebaseUser) && !isAdmin;
  const isLocked = lockout.lockedUntil !== null && lockout.lockedUntil > Date.now();
  const attemptsRemaining = MAX_LOGIN_ATTEMPTS - lockout.attempts;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-white via-indigo-50/40 to-white px-4 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950">
      <Link
        to="/"
        aria-label="Back to home"
        className="absolute left-4 top-4 inline-flex items-center justify-center rounded-full p-2 text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
      >
        <Home className="h-6 w-6" aria-hidden="true" />
      </Link>

      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in with your administrator account.
          </p>
        </div>

        {signedInNotAdmin ? (
          <div className="space-y-4 text-center">
            <p
              role="alert"
              className="rounded-lg bg-amber-100 px-3 py-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
            >
              You are signed in as{" "}
              <span className="font-medium">{firebaseUser?.email}</span>, but
              this account does not have admin access.
            </p>
            {adminError && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                Error: {adminError}
              </p>
            )}
            {_debug && (
              <details className="rounded-lg bg-muted px-3 py-2 text-left text-xs text-muted-foreground">
                <summary className="cursor-pointer font-medium">
                  Diagnostic info
                </summary>
                <pre className="mt-1 whitespace-pre-wrap break-all">
                  {_debug}
                </pre>
              </details>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
            >
              Sign out and use another account
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {isLocked ? (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-3 py-3 text-sm text-destructive"
              >
                Too many failed attempts. Try again in{" "}
                <span className="font-mono font-medium">{mm}:{ss}</span>.
              </p>
            ) : (
              <>
                {error && (
                  <p
                    role="alert"
                    className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    {error}
                  </p>
                )}
                {!error && lockout.attempts > 0 && attemptsRemaining <= 2 && (
                  <p
                    role="status"
                    className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                  >
                    {attemptsRemaining} attempt{attemptsRemaining !== 1 ? "s" : ""}{" "}
                    remaining before temporary lockout.
                  </p>
                )}
              </>
            )}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="admin-password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy || isLocked}>
              {busy && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              Sign in
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
