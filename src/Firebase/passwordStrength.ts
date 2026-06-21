/**
 * passwordStrength.ts
 * -------------------
 * Pure utility functions for analysing password strength.
 * All functions are side-effect-free and fully unit-testable.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Individual requirement with a human-readable label and a test result. */
export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

/** Score from 0 (no criteria met) to 5 (all criteria met). */
export type PasswordScore = 0 | 1 | 2 | 3 | 4 | 5;

/** Strength band derived from the numeric score. */
export type PasswordStrength = 'Weak' | 'Medium' | 'Strong';

/** Full analysis result returned by `analysePassword`. */
export interface PasswordAnalysis {
  score: PasswordScore;
  strength: PasswordStrength;
  requirements: PasswordRequirement[];
}

// ─── Individual requirement checkers ─────────────────────────────────────────

/** Returns `true` when the password is at least 8 characters long. */
export function hasMinLength(password: string): boolean {
  return password.length >= 8;
}

/** Returns `true` when the password contains at least one uppercase letter. */
export function hasUppercase(password: string): boolean {
  return /[A-Z]/.test(password);
}

/** Returns `true` when the password contains at least one lowercase letter. */
export function hasLowercase(password: string): boolean {
  return /[a-z]/.test(password);
}

/** Returns `true` when the password contains at least one numeric digit. */
export function hasDigit(password: string): boolean {
  return /[0-9]/.test(password);
}

/**
 * Returns `true` when the password contains at least one special character.
 * Recognised special characters: `! @ # $ % ^ & * ( ) _ + - = [ ] { } ; ' : " | , . < > ? / \\ ~`
 */
export function hasSpecialChar(password: string): boolean {
  return /[!@#$%^&*()_+\-=[\]{};':"|,.<>/?~`]/.test(password);
}

// ─── Score calculator ─────────────────────────────────────────────────────────

/**
 * Calculates a password score from 0–5.
 * Each satisfied requirement adds 1 point:
 *  1. ≥ 8 characters
 *  2. Uppercase letter
 *  3. Lowercase letter
 *  4. Numeric digit
 *  5. Special character
 */
export function calculatePasswordScore(password: string): PasswordScore {
  const criteria = [
    hasMinLength(password),
    hasUppercase(password),
    hasLowercase(password),
    hasDigit(password),
    hasSpecialChar(password),
  ];
  return criteria.filter(Boolean).length as PasswordScore;
}

// ─── Strength classifier ──────────────────────────────────────────────────────

/**
 * Maps a numeric score to a human-readable strength band.
 * - 0–2 → Weak
 * - 3–4 → Medium
 * - 5   → Strong
 */
export function classifyStrength(score: PasswordScore): PasswordStrength {
  if (score <= 2) return 'Weak';
  if (score <= 4) return 'Medium';
  return 'Strong';
}

// ─── Comprehensive analyser ───────────────────────────────────────────────────

/**
 * Runs a full password analysis and returns a structured result containing the
 * numeric score, strength classification, and a detailed requirements checklist.
 */
export function analysePassword(password: string): PasswordAnalysis {
  const requirements: PasswordRequirement[] = [
    {
      id: 'minLength',
      label: 'At least 8 characters',
      met: hasMinLength(password),
    },
    {
      id: 'uppercase',
      label: 'At least one uppercase letter (A–Z)',
      met: hasUppercase(password),
    },
    {
      id: 'lowercase',
      label: 'At least one lowercase letter (a–z)',
      met: hasLowercase(password),
    },
    {
      id: 'digit',
      label: 'At least one number (0–9)',
      met: hasDigit(password),
    },
    {
      id: 'specialChar',
      label: 'At least one special character (!@#$…)',
      met: hasSpecialChar(password),
    },
  ];

  const score = calculatePasswordScore(password);
  const strength = classifyStrength(score);

  return { score, strength, requirements };
}

// ─── Guard helper ─────────────────────────────────────────────────────────────

/**
 * Returns `true` when the password is strong enough to be submitted.
 * Submission is blocked for Weak passwords (score 0–2).
 */
export function isPasswordAcceptable(password: string): boolean {
  return classifyStrength(calculatePasswordScore(password)) !== 'Weak';
}

// ─── UI colour mapping ────────────────────────────────────────────────────────

/** Maps a strength band to its Tailwind colour classes (text + fill). */
export const STRENGTH_COLORS: Record<PasswordStrength, string> = {
  Weak: 'text-red-500',
  Medium: 'text-amber-500',
  Strong: 'text-emerald-500',
};

/** Maps a strength band to its meter bar colour class. */
export const METER_BAR_COLORS: Record<PasswordStrength, string> = {
  Weak: 'bg-red-500',
  Medium: 'bg-amber-500',
  Strong: 'bg-emerald-500',
};
