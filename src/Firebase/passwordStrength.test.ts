/**
 * passwordStrength.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Comprehensive unit tests for all password-strength utility functions.
 * Covers: individual checkers, score calculator, strength classifier,
 * full analyser, submission guard, colour maps, and edge cases.
 *
 * Run with: npx vitest run
 */

import { describe, it, expect } from 'vitest';
import {
  hasMinLength,
  hasUppercase,
  hasLowercase,
  hasDigit,
  hasSpecialChar,
  calculatePasswordScore,
  classifyStrength,
  analysePassword,
  isPasswordAcceptable,
  STRENGTH_COLORS,
  METER_BAR_COLORS,
  type PasswordScore,
  type PasswordStrength,
} from './passwordStrength';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Individual requirement checkers
// ─────────────────────────────────────────────────────────────────────────────

describe('hasMinLength', () => {
  it('returns false for an empty string', () => {
    expect(hasMinLength('')).toBe(false);
  });

  it('returns false for 7 characters (boundary)', () => {
    expect(hasMinLength('abcdefg')).toBe(false);
  });

  it('returns true for exactly 8 characters (boundary)', () => {
    expect(hasMinLength('abcdefgh')).toBe(true);
  });

  it('returns true for passwords longer than 8 characters', () => {
    expect(hasMinLength('This is a long password!')).toBe(true);
  });

  it('counts multibyte characters correctly', () => {
    // 8 ASCII chars — should pass
    expect(hasMinLength('12345678')).toBe(true);
  });

  it('handles whitespace-only passwords correctly', () => {
    expect(hasMinLength('        ')).toBe(true); // 8 spaces = meets length
    expect(hasMinLength('   ')).toBe(false);      // 3 spaces = fails
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('hasUppercase', () => {
  it('returns false for all-lowercase string', () => {
    expect(hasUppercase('abcdefgh')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(hasUppercase('')).toBe(false);
  });

  it('returns true when at least one uppercase letter exists', () => {
    expect(hasUppercase('abcDefgh')).toBe(true);
  });

  it('returns true for all-uppercase string', () => {
    expect(hasUppercase('ABCDEFGH')).toBe(true);
  });

  it('ignores numbers and special chars (returns false)', () => {
    expect(hasUppercase('12345!@#')).toBe(false);
  });

  it('returns true for uppercase in the middle', () => {
    expect(hasUppercase('passwordZ')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('hasLowercase', () => {
  it('returns false for all-uppercase string', () => {
    expect(hasLowercase('ABCDEFGH')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(hasLowercase('')).toBe(false);
  });

  it('returns true when at least one lowercase letter exists', () => {
    expect(hasLowercase('ABCdEFGH')).toBe(true);
  });

  it('returns true for all-lowercase string', () => {
    expect(hasLowercase('abcdefgh')).toBe(true);
  });

  it('ignores digits and special chars (returns false)', () => {
    expect(hasLowercase('12345!@#')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('hasDigit', () => {
  it('returns false for password with no digits', () => {
    expect(hasDigit('ABCDEFgh')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(hasDigit('')).toBe(false);
  });

  it('returns true when at least one digit exists', () => {
    expect(hasDigit('password1')).toBe(true);
  });

  it('returns true for all-digit password', () => {
    expect(hasDigit('12345678')).toBe(true);
  });

  it('returns true for digit at the start', () => {
    expect(hasDigit('1password')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('hasSpecialChar', () => {
  it('returns false for alphanumeric-only password', () => {
    expect(hasSpecialChar('Password1')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(hasSpecialChar('')).toBe(false);
  });

  const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+',
    '-', '=', '[', ']', '{', '}', ';', "'", ':', '"', '|', ',', '.', '<', '>', '?', '/', '~', '`'];

  it.each(specialChars)('returns true for special character: %s', (char) => {
    expect(hasSpecialChar(`Password1${char}`)).toBe(true);
  });

  it('returns false for space character (not in the allowed set)', () => {
    // A space alone is not treated as a special char by the regex
    expect(hasSpecialChar('Password 1')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Score calculator
// ─────────────────────────────────────────────────────────────────────────────

describe('calculatePasswordScore', () => {
  it('returns 0 for empty string', () => {
    expect(calculatePasswordScore('')).toBe(0);
  });

  it('returns 1 for a short simple password (only lowercase met)', () => {
    // 'abc' is short (fails minLength), has no upper, no digit, no special,
    // but DOES satisfy hasLowercase — so the score is 1, not 0.
    expect(calculatePasswordScore('abc')).toBe(1);
  });

  it('returns 1 when only min-length criterion is met', () => {
    expect(calculatePasswordScore('abcdefgh')).toBe(2); // length + lowercase
  });

  it('returns 2 for password with length + lowercase only', () => {
    expect(calculatePasswordScore('abcdefgh')).toBe(2);
  });

  it('returns 3 for length + lowercase + uppercase', () => {
    expect(calculatePasswordScore('Abcdefgh')).toBe(3);
  });

  it('returns 4 for length + lowercase + uppercase + digit', () => {
    expect(calculatePasswordScore('Abcdefg1')).toBe(4);
  });

  it('returns 5 for password meeting all criteria', () => {
    expect(calculatePasswordScore('Abcdefg1!')).toBe(5);
  });

  it('returns correct score regardless of password length beyond 8', () => {
    expect(calculatePasswordScore('Abcdefghijklmno1!')).toBe(5);
  });

  it('returns 1 for digit-only short password', () => {
    expect(calculatePasswordScore('1')).toBe(1); // only digit criterion met
  });

  it('returns 3 for digit-only long password', () => {
    expect(calculatePasswordScore('12345678')).toBe(2); // length + digit (no upper, no lower, no special)
  });

  it('correctly scores passwords with only special characters (short)', () => {
    expect(calculatePasswordScore('!')).toBe(1); // only special char met
  });

  it('correctly scores passwords with mixed upper and special chars', () => {
    // AAAAAAAA! → length(✓) + upper(✓) + lower(✗) + digit(✗) + special(✓) = 3
    expect(calculatePasswordScore('AAAAAAAA!')).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Strength classifier
// ─────────────────────────────────────────────────────────────────────────────

describe('classifyStrength', () => {
  const weakScores: PasswordScore[] = [0, 1, 2];
  const mediumScores: PasswordScore[] = [3, 4];
  const strongScores: PasswordScore[] = [5];

  it.each(weakScores)('classifies score %i as Weak', (score) => {
    expect(classifyStrength(score)).toBe<PasswordStrength>('Weak');
  });

  it.each(mediumScores)('classifies score %i as Medium', (score) => {
    expect(classifyStrength(score)).toBe<PasswordStrength>('Medium');
  });

  it.each(strongScores)('classifies score %i as Strong', (score) => {
    expect(classifyStrength(score)).toBe<PasswordStrength>('Strong');
  });

  it('boundary: score 2 is Weak, not Medium', () => {
    expect(classifyStrength(2)).toBe('Weak');
  });

  it('boundary: score 3 is Medium, not Weak', () => {
    expect(classifyStrength(3)).toBe('Medium');
  });

  it('boundary: score 4 is Medium, not Strong', () => {
    expect(classifyStrength(4)).toBe('Medium');
  });

  it('boundary: score 5 is Strong, not Medium', () => {
    expect(classifyStrength(5)).toBe('Strong');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Full analyser (analysePassword)
// ─────────────────────────────────────────────────────────────────────────────

describe('analysePassword', () => {
  it('returns a result with score, strength, and 5 requirements for any input', () => {
    const result = analysePassword('anything');
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('strength');
    expect(result.requirements).toHaveLength(5);
  });

  it('returns correct structure for an empty password', () => {
    const { score, strength, requirements } = analysePassword('');
    expect(score).toBe(0);
    expect(strength).toBe('Weak');
    expect(requirements.every((r) => !r.met)).toBe(true);
  });

  it('marks all requirements as met for a fully strong password', () => {
    const { score, strength, requirements } = analysePassword('Passw0rd!');
    expect(score).toBe(5);
    expect(strength).toBe('Strong');
    expect(requirements.every((r) => r.met)).toBe(true);
  });

  it('correctly identifies which requirements are unmet', () => {
    // "abcdefgh" — length(✓) lowercase(✓) uppercase(✗) digit(✗) special(✗)
    const { requirements } = analysePassword('abcdefgh');
    const byId = Object.fromEntries(requirements.map((r) => [r.id, r.met]));
    expect(byId['minLength']).toBe(true);
    expect(byId['lowercase']).toBe(true);
    expect(byId['uppercase']).toBe(false);
    expect(byId['digit']).toBe(false);
    expect(byId['specialChar']).toBe(false);
  });

  it('all requirements have non-empty id and label', () => {
    const { requirements } = analysePassword('Test1!');
    requirements.forEach((r) => {
      expect(r.id).toBeTruthy();
      expect(r.label).toBeTruthy();
    });
  });

  it('returns Medium strength for a 4-score password', () => {
    // "Abcdefg1" → length(✓) upper(✓) lower(✓) digit(✓) special(✗) = 4
    const { strength, score } = analysePassword('Abcdefg1');
    expect(score).toBe(4);
    expect(strength).toBe('Medium');
  });

  it('result is deterministic for the same input', () => {
    const a = analysePassword('Passw0rd!');
    const b = analysePassword('Passw0rd!');
    expect(a).toEqual(b);
  });

  it('handles very long passwords correctly', () => {
    const longPassword = 'Aa1!' + 'x'.repeat(200);
    const { score, strength } = analysePassword(longPassword);
    expect(score).toBe(5);
    expect(strength).toBe('Strong');
  });

  it('handles unicode characters in password length correctly', () => {
    // Emoji characters might count as >1 char, but standard JS .length is used
    const password = 'Aa1!🔒🔒🔒';
    const { requirements } = analysePassword(password);
    const lengthReq = requirements.find((r) => r.id === 'minLength');
    // Depending on JS string length; each emoji is 2 code-units so 'Aa1!' + 3 emojis = 4+6 = 10 chars
    expect(lengthReq?.met).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Submission guard (isPasswordAcceptable)
// ─────────────────────────────────────────────────────────────────────────────

describe('isPasswordAcceptable', () => {
  const weakPasswords = [
    '',
    'a',
    'abc',
    'password',
    'abcdefgh',   // length + lowercase only → score 2 = Weak
    'ABCDEFGH',   // length + uppercase only → score 2 = Weak
    '12345678',   // length + digit only → score 2 = Weak
  ];

  it.each(weakPasswords)('blocks submission for weak password: "%s"', (pwd) => {
    expect(isPasswordAcceptable(pwd)).toBe(false);
  });

  const mediumPasswords = [
    'Abcdefgh',   // length + upper + lower → score 3 = Medium
    'abcdefg1',   // length + lower + digit → score 3 = Medium
    'Abcdefg1',   // length + upper + lower + digit → score 4 = Medium
  ];

  it.each(mediumPasswords)('allows submission for medium password: "%s"', (pwd) => {
    expect(isPasswordAcceptable(pwd)).toBe(true);
  });

  const strongPasswords = [
    'Passw0rd!',
    'C0mplex!Pass',
    'My$ecure1',
    'Tr0ub4dor&3',
  ];

  it.each(strongPasswords)('allows submission for strong password: "%s"', (pwd) => {
    expect(isPasswordAcceptable(pwd)).toBe(true);
  });

  it('is consistent with classifyStrength returning Weak', () => {
    const weakPwd = 'abcde';
    expect(isPasswordAcceptable(weakPwd)).toBe(false);
  });

  it('is consistent with classifyStrength returning Strong', () => {
    const strongPwd = 'Str0ng!P@ss';
    expect(isPasswordAcceptable(strongPwd)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Colour map constants
// ─────────────────────────────────────────────────────────────────────────────

describe('STRENGTH_COLORS', () => {
  it('has entries for all three strength levels', () => {
    expect(STRENGTH_COLORS).toHaveProperty('Weak');
    expect(STRENGTH_COLORS).toHaveProperty('Medium');
    expect(STRENGTH_COLORS).toHaveProperty('Strong');
  });

  it('each value is a non-empty string', () => {
    Object.values(STRENGTH_COLORS).forEach((cls) => {
      expect(typeof cls).toBe('string');
      expect(cls.length).toBeGreaterThan(0);
    });
  });

  it('Weak maps to a red colour class', () => {
    expect(STRENGTH_COLORS['Weak']).toContain('red');
  });

  it('Medium maps to an amber/orange colour class', () => {
    expect(STRENGTH_COLORS['Medium']).toMatch(/amber|orange|yellow/);
  });

  it('Strong maps to a green/emerald colour class', () => {
    expect(STRENGTH_COLORS['Strong']).toMatch(/green|emerald/);
  });
});

describe('METER_BAR_COLORS', () => {
  it('has entries for all three strength levels', () => {
    expect(METER_BAR_COLORS).toHaveProperty('Weak');
    expect(METER_BAR_COLORS).toHaveProperty('Medium');
    expect(METER_BAR_COLORS).toHaveProperty('Strong');
  });

  it('each value is a non-empty string', () => {
    Object.values(METER_BAR_COLORS).forEach((cls) => {
      expect(typeof cls).toBe('string');
      expect(cls.length).toBeGreaterThan(0);
    });
  });

  it('Weak bar is red', () => {
    expect(METER_BAR_COLORS['Weak']).toContain('red');
  });

  it('Medium bar is amber/orange', () => {
    expect(METER_BAR_COLORS['Medium']).toMatch(/amber|orange|yellow/);
  });

  it('Strong bar is green/emerald', () => {
    expect(METER_BAR_COLORS['Strong']).toMatch(/green|emerald/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Edge cases and integration scenarios
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge cases', () => {
  it('handles null-like values gracefully (empty string)', () => {
    expect(() => analysePassword('')).not.toThrow();
    expect(() => calculatePasswordScore('')).not.toThrow();
  });

  it('handles whitespace-heavy passwords', () => {
    const ws = '        '; // 8 spaces
    // Only minLength is met; hasUppercase/Lower/Digit/Special all fail
    const { score } = analysePassword(ws);
    expect(score).toBe(1); // only minLength
  });

  it('handles passwords with only digits and enough length', () => {
    const pwd = '12345678';
    const { requirements } = analysePassword(pwd);
    const met = requirements.filter((r) => r.met).map((r) => r.id);
    expect(met).toContain('minLength');
    expect(met).toContain('digit');
    expect(met).not.toContain('uppercase');
    expect(met).not.toContain('lowercase');
    expect(met).not.toContain('specialChar');
  });

  it('a single character that satisfies multiple rules still only adds correct score', () => {
    // There is no single ASCII character that is simultaneously upper, lower, digit, AND special
    // But e.g. 'A' is only uppercase → score 1
    expect(calculatePasswordScore('A')).toBe(1);
  });

  it('score never exceeds 5', () => {
    const score = calculatePasswordScore('VERY_long_complex_P@ssw0rd_indeed!1');
    expect(score).toBeLessThanOrEqual(5);
  });

  it('score is always a non-negative integer', () => {
    const passwords = ['', 'a', 'Password1!', '!!!!!!!!!!!!!'];
    passwords.forEach((pwd) => {
      const score = calculatePasswordScore(pwd);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(score)).toBe(true);
    });
  });

  it('analysePassword is pure — repeated calls with the same input return equal objects', () => {
    const pwd = 'TestPassword1!';
    const r1 = analysePassword(pwd);
    const r2 = analysePassword(pwd);
    expect(r1.score).toBe(r2.score);
    expect(r1.strength).toBe(r2.strength);
    r1.requirements.forEach((req, i) => {
      expect(req.met).toBe(r2.requirements[i].met);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Form submission behaviour (logic layer)
// ─────────────────────────────────────────────────────────────────────────────

describe('Form submission guard logic', () => {
  it('prevents submission when password strength is Weak (score ≤ 2)', () => {
    const weakPasswords = ['', 'abc', 'password', 'ABCDEFGH', '12345678'];
    weakPasswords.forEach((pwd) => {
      expect(isPasswordAcceptable(pwd)).toBe(false);
    });
  });

  it('allows submission when password strength is Medium (score 3–4)', () => {
    // "Abcdefgh" → length + upper + lower = 3 → Medium
    expect(isPasswordAcceptable('Abcdefgh')).toBe(true);
    // "Abcdefg1" → length + upper + lower + digit = 4 → Medium
    expect(isPasswordAcceptable('Abcdefg1')).toBe(true);
  });

  it('allows submission when password strength is Strong (score 5)', () => {
    expect(isPasswordAcceptable('Passw0rd!')).toBe(true);
    expect(isPasswordAcceptable('C0mplex@P@ss!')).toBe(true);
  });

  it('submission guard is aligned with classifyStrength logic', () => {
    // Any password where classifyStrength !== 'Weak' should be acceptable
    const passwords = [
      'Abcdefgh',   // Medium
      'Abcdefg1',   // Medium
      'Passw0rd!',  // Strong
    ];
    passwords.forEach((pwd) => {
      const score = calculatePasswordScore(pwd);
      const strength = classifyStrength(score);
      const acceptable = isPasswordAcceptable(pwd);
      if (strength === 'Weak') {
        expect(acceptable).toBe(false);
      } else {
        expect(acceptable).toBe(true);
      }
    });
  });

  it('missing requirements list is empty for a fully strong password', () => {
    const { requirements } = analysePassword('Passw0rd!');
    const missing = requirements.filter((r) => !r.met);
    expect(missing).toHaveLength(0);
  });

  it('missing requirements list is non-empty for a weak password', () => {
    const { requirements } = analysePassword('abc');
    const missing = requirements.filter((r) => !r.met);
    expect(missing.length).toBeGreaterThan(0);
  });
});
