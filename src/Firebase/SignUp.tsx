import { useState, useId } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase';
import { notifyWelcome } from '../dashboard/notifications/notificationTriggers';
import { Home, Check, X, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Aurora } from '@/app/components/Aurora';
import { GlassPanel } from '@/app/components/GlassPanel';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/app/components/UnsavedChangesDialog';
import {
  analysePassword,
  isPasswordAcceptable,
  STRENGTH_COLORS,
  METER_BAR_COLORS,
  type PasswordStrength,
} from './passwordStrength';

// ─── Google SVG Logo ───────────────────────────────────────────────────────────

function GoogleLogo() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

// ─── Password Strength Meter ───────────────────────────────────────────────────

interface StrengthMeterProps {
  password: string;
  strength: PasswordStrength;
  score: number;
  visible: boolean;
}

function StrengthMeter({ password, strength, score, visible }: StrengthMeterProps) {
  const barColor = METER_BAR_COLORS[strength];
  const textColor = STRENGTH_COLORS[strength];
  const totalBars = 5;

  // Accessible label for the meter
  const ariaLabel = password.length === 0
    ? 'No password entered'
    : `Password strength: ${strength} (${score} of ${totalBars} criteria met)`;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="strength-meter"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="mt-2 space-y-1.5" role="group" aria-label="Password strength indicator">
            {/* Segmented bar */}
            <div
              className="flex gap-1"
              role="meter"
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={totalBars}
              aria-label={ariaLabel}
            >
              {Array.from({ length: totalBars }).map((_, i) => (
                <motion.div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                    i < score ? barColor : 'bg-muted'
                  }`}
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                />
              ))}
            </div>

            {/* Strength label */}
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold tracking-wide ${textColor}`}>
                {password.length > 0 ? strength : ''}
              </span>
              {password.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {score}/{totalBars} criteria
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Requirements Checklist ────────────────────────────────────────────────────

interface RequirementsChecklistProps {
  password: string;
  visible: boolean;
}

function RequirementsChecklist({ password, visible }: RequirementsChecklistProps) {
  const { requirements } = analysePassword(password);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="requirements"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <ul
            className="mt-3 space-y-1.5 p-3 rounded-lg bg-muted/40 border border-border"
            aria-label="Password requirements checklist"
            role="list"
          >
            {requirements.map((req) => (
              <motion.li
                key={req.id}
                className="flex items-center gap-2 text-xs"
                animate={{ opacity: 1 }}
                initial={{ opacity: 0 }}
              >
                <motion.span
                  animate={{
                    scale: req.met ? [1, 1.3, 1] : 1,
                    rotate: req.met ? [0, 10, 0] : 0,
                  }}
                  transition={{ duration: 0.25 }}
                  aria-hidden="true"
                >
                  {req.met ? (
                    <Check
                      className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0"
                      strokeWidth={2.5}
                    />
                  ) : (
                    <X
                      className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0"
                      strokeWidth={2.5}
                    />
                  )}
                </motion.span>
                <span
                  className={`transition-colors duration-200 ${
                    req.met
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground'
                  }`}
                >
                  {req.label}
                </span>
                {/* Visually hidden status for screen readers */}
                <span className="sr-only">{req.met ? '– met' : '– not met'}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Weak Password Inline Alert ────────────────────────────────────────────────

interface WeakPasswordAlertProps {
  visible: boolean;
  missingLabels: string[];
}

function WeakPasswordAlert({ visible, missingLabels }: WeakPasswordAlertProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="weak-alert"
          role="alert"
          aria-live="assertive"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive dark:text-red-300 text-xs"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold mb-0.5">Password is too weak</p>
            <p>Please satisfy the following requirements:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              {missingLabels.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main SignUp Component ─────────────────────────────────────────────────────

export function SignUp() {
  const { markDirty, markClean, blocker } = useUnsavedChanges();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [weakAttempt, setWeakAttempt] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const navigate = useNavigate();

  // Stable IDs for accessibility
  const passwordId = useId();
  const strengthId = useId();
  const checklistId = useId();

  // Live password analysis
  const analysis = analysePassword(password);
  const { score, strength, requirements } = analysis;
  const passwordTouched = password.length > 0;
  const showStrengthUI = passwordTouched || passwordFocused;

  // Missing requirements (for the weak-password alert)
  const missingRequirements = requirements.filter((r) => !r.met).map((r) => r.label);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setWeakAttempt(false);

    // Programmatic guard — block submission if password is Weak
    if (!isPasswordAcceptable(password)) {
      setWeakAttempt(true);
      return;
    }

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      // Send a verification mail so the account can unlock email-addressed
      // features (e.g. project updates). Best-effort — never block sign-up on it.
      try {
        await sendEmailVerification(user);
      } catch {
        /* non-fatal: the user can resend from the dashboard */
      }
      notifyWelcome(user.uid, user.displayName ?? user.email ?? 'there');
      markClean();
      navigate('/dashboard');
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('An unexpected error occurred during sign-up.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      notifyWelcome(user.uid, user.displayName ?? user.email ?? 'there');
      markClean();
      navigate('/dashboard');
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('An unexpected error occurred with Google Sign-Up.');
      }
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
    <UnsavedChangesDialog blocker={blocker} />
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Warm ambient glow — the same drifting aurora the landing page uses */}
      <Aurora intensity={0.6} />

      {/* Home button */}
      <Link
        to="/"
        aria-label="Back to home"
        className="absolute top-4 left-4 z-10 inline-flex items-center justify-center rounded-full p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
      >
        <Home className="w-6 h-6" aria-hidden="true" />
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-md w-full"
      >
        <GlassPanel tier="strong" className="p-8 rounded-2xl shadow-elev-3">
          <h1 className="font-display text-3xl font-bold text-center mb-2">
            <span className="text-gradient-brand">
              Create an Account
            </span>
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Join Servio to get started.
          </p>

          {/* Firebase error banner */}
          {error && (
            <p
              role="alert"
              className="bg-destructive/10 text-destructive dark:text-red-300 border border-destructive/20 p-3 rounded-lg mb-4 text-sm"
            >
              {error}
            </p>
          )}

          <form
            onSubmit={handleEmailSignUp}
            className="space-y-5"
            aria-label="Create an account with email and password"
            noValidate
          >
            {/* ── Email ─────────────────────────────────────────────────── */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                aria-required="true"
                value={email}
                onChange={(e) => { markDirty(); setEmail(e.target.value); }}
                className="mt-1 block w-full px-3 py-2 bg-input-background border border-border rounded-md shadow-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60 focus:border-primary sm:text-sm transition"
                placeholder="you@example.com"
              />
            </div>

            {/* ── Password ──────────────────────────────────────────────── */}
            <div>
              <label
                htmlFor={passwordId}
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>

              {/* Input wrapper with show/hide toggle */}
              <div className="relative mt-1">
                <input
                  id={passwordId}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  aria-required="true"
                  aria-describedby={`${strengthId} ${checklistId}`}
                  aria-invalid={weakAttempt ? 'true' : undefined}
                  value={password}
                  onChange={(e) => {
                    markDirty();
                    setPassword(e.target.value);
                    if (weakAttempt) setWeakAttempt(false);
                  }}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className={`block w-full pr-10 px-3 py-2 bg-input-background border rounded-md shadow-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60 sm:text-sm transition ${
                    weakAttempt
                      ? 'border-red-400 dark:border-red-600 focus:border-red-500'
                      : passwordTouched && strength === 'Strong'
                      ? 'border-emerald-400 dark:border-emerald-600 focus:border-emerald-500'
                      : passwordTouched && strength === 'Medium'
                      ? 'border-amber-400 dark:border-amber-600 focus:border-amber-500'
                      : 'border-border focus:border-primary'
                  }`}
                  placeholder="Create a strong password"
                />

                {/* Show / hide toggle */}
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-r-md"
                  tabIndex={0}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* Strength meter (appears when user starts typing or focuses) */}
              <div id={strengthId}>
                <StrengthMeter
                  password={password}
                  strength={strength}
                  score={score}
                  visible={showStrengthUI}
                />
              </div>

              {/* Requirements checklist */}
              <div id={checklistId}>
                <RequirementsChecklist
                  password={password}
                  visible={showStrengthUI}
                />
              </div>

              {/* Weak-password alert (shown only on submit attempt with weak password) */}
              <div className="mt-2">
                <WeakPasswordAlert
                  visible={weakAttempt}
                  missingLabels={missingRequirements}
                />
              </div>
            </div>

            {/* ── Submit ────────────────────────────────────────────────── */}
            <motion.button
              type="submit"
              id="signup-submit-btn"
              aria-label="Sign up"
              aria-disabled={passwordTouched && strength === 'Weak'}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className={`w-full flex justify-center py-2.5 px-4 rounded-full shadow-elev-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-ring transition-all duration-300 ${
                passwordTouched && strength === 'Weak'
                  ? 'bg-muted text-muted-foreground shadow-none cursor-not-allowed opacity-70'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:[box-shadow:0_0_28px_-4px_var(--gold)]'
              }`}
            >
              Sign Up
            </motion.button>
          </form>

          {/* ── Divider ───────────────────────────────────────────────────── */}
          <div className="mt-6">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="h-px flex-1 bg-border" aria-hidden="true" />
              <span>Or sign up with</span>
              <span className="h-px flex-1 bg-border" aria-hidden="true" />
            </div>

            {/* Google Sign-Up */}
            <div className="mt-6">
              <motion.button
                onClick={handleGoogleSignIn}
                aria-label="Sign up with Google"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 border border-border rounded-full shadow-sm bg-card text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-ring transition-colors"
              >
                <GoogleLogo />
                Sign up with Google
              </motion.button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already a member?{' '}
            <Link
              to="/signin"
              className="font-medium text-primary hover:text-primary/80"
            >
              Sign in
            </Link>
          </p>
        </GlassPanel>
      </motion.div>
    </div>
    </>
  );
}
