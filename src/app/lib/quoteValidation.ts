// Shared, framework-agnostic validation + abuse-detection for the quote form.
//
// Everything here is PURE: no DOM, no React, no `localStorage`, no `Date.now()`
// read internally — timestamps and storage are passed in by the caller. That
// keeps the exact same rules usable in two places:
//   • client-side today (QuoteForm wires it to React state + localStorage), and
//   • inside any future server handler (re-run the identical checks on input it
//     must never trust from the browser).
//
// Client-side checks are advisory — a determined attacker can bypass anything
// that runs in their own browser. The point of this module is to (a) raise the
// cost of casual spam/bots dramatically and (b) be the single source of truth a
// real backend can adopt verbatim when one is added.

export type QuoteFormData = {
  name: string;
  email: string;
  phone: string; // optional field: "" means "not provided"
  business: string;
  budget: string;
  type: string;
  description: string;
};

export type QuoteField = keyof QuoteFormData;
export type FieldErrors = Partial<Record<QuoteField, string>>;

// Allowed option sets live here (not in the component) so a server can
// authoritatively reject anything that isn't one of these — a browser can POST
// arbitrary strings regardless of what the <select> offered.
export const BUDGET_OPTIONS = [
  "Under $1,000",
  "$1,000 – $2,500",
  "$2,500 – $5,000",
  "$5,000 – $10,000",
  "$10,000+",
] as const;

export const WEBSITE_TYPES = [
  "Landing Page",
  "Business Website",
  "Portfolio Website",
  "E-Commerce Store",
  "Custom Web Application",
  "Website Redesign",
] as const;

// Length bounds, shared so client and server agree. [min, max] on trimmed input.
export const LIMITS = {
  name: [2, 80],
  business: [2, 100],
  description: [0, 2000],
  email: [5, 254], // 254 = practical RFC 5321 max
  // Raw (human-formatted) length cap. isValidPhone only constrains the *dialable*
  // digits, so a bound on the raw string is needed too — otherwise a hugely
  // padded but "valid" number ("(((…+15551234567…)))") slips through here and
  // later overflows the size-bounded persistence write, silently losing the lead.
  phone: [0, 40],
} as const;

// ----------------------------------------------------------------------------
// Field-level format helpers
// ----------------------------------------------------------------------------

// Pragmatic email check: one @, no spaces, a dot in the domain. Deliberately not
// a full RFC 5322 parser — those reject valid addresses and accept junk. Real
// deliverability is only knowable by sending mail, which a server would do.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(raw: string): boolean {
  const v = raw.trim();
  return v.length >= LIMITS.email[0] && v.length <= LIMITS.email[1] && EMAIL_RE.test(v);
}

// Strip human formatting so the digit/`+` pattern is all that's validated.
// Also fold two common-but-valid conventions into canonical form: a trailing
// extension ("x89", "ext. 5", "#12") is dropped — it isn't part of the dialable
// number we validate — and a leading "00" IDD prefix becomes "+" so long
// international numbers don't blow the 15-digit ceiling purely on the prefix.
export function normalizePhone(raw: string): string {
  let n = raw.replace(/[\s().-]/g, "");
  n = n.replace(/(?:x|ext\.?|#)\d+$/i, "");
  if (n.startsWith("00")) n = "+" + n.slice(2);
  return n;
}

// Optional field. Empty is valid (caller decides requiredness). When present,
// accept E.164-ish international input: optional leading '+', then 7–15 digits.
// 15 is the ITU E.164 maximum; 7 rejects obvious junk without guessing at the
// minimum national-number length of every country.
export function isValidPhone(raw: string): boolean {
  const n = normalizePhone(raw);
  return /^\+?[0-9]{7,15}$/.test(n);
}

function len(s: string) {
  return s.trim().length;
}

// ----------------------------------------------------------------------------
// Field validation — returns user-facing messages keyed by field.
// ----------------------------------------------------------------------------

export function validateFields(data: QuoteFormData): FieldErrors {
  const errs: FieldErrors = {};

  if (!data.name.trim()) {
    errs.name = "Name is required";
  } else if (len(data.name) < LIMITS.name[0]) {
    errs.name = "Please enter your full name";
  } else if (len(data.name) > LIMITS.name[1]) {
    errs.name = `Name must be under ${LIMITS.name[1]} characters`;
  }

  if (!data.email.trim()) {
    errs.email = "Email is required";
  } else if (!isValidEmail(data.email)) {
    errs.email = "Enter a valid email address";
  }

  // Optional, but if the user typed something it must look like a phone number
  // and stay within a sane raw length (see LIMITS.phone).
  if (data.phone.trim()) {
    if (data.phone.trim().length > LIMITS.phone[1] || !isValidPhone(data.phone)) {
      errs.phone = "Enter a valid phone number, or leave it blank";
    }
  }

  if (!data.business.trim()) {
    errs.business = "Business name is required";
  } else if (len(data.business) > LIMITS.business[1]) {
    errs.business = `Business name must be under ${LIMITS.business[1]} characters`;
  }

  if (!data.budget) {
    errs.budget = "Please select a budget";
  } else if (!BUDGET_OPTIONS.includes(data.budget as (typeof BUDGET_OPTIONS)[number])) {
    errs.budget = "Please select a valid budget";
  }

  if (!data.type) {
    errs.type = "Please select a website type";
  } else if (!WEBSITE_TYPES.includes(data.type as (typeof WEBSITE_TYPES)[number])) {
    errs.type = "Please select a valid website type";
  }

  if (data.description.length > LIMITS.description[1]) {
    errs.description = `Please keep the description under ${LIMITS.description[1]} characters`;
  }

  return errs;
}

export function hasErrors(errs: FieldErrors): boolean {
  return Object.keys(errs).length > 0;
}

// ----------------------------------------------------------------------------
// Spam content heuristics
// ----------------------------------------------------------------------------
//
// Scored, not boolean — a single weak signal must never block a real lead, so
// `isSpam` only trips once independent signals stack up (>= SPAM_THRESHOLD).
// Tuned conservatively: false positives here turn away paying customers.

export const SPAM_THRESHOLD = 3;

export type SpamVerdict = { isSpam: boolean; score: number; reasons: string[] };

// Matched on word boundaries (see `keywordHits` below) so an entry never fires
// inside a legitimate word — e.g. "cialis" must not match "specialist", "seo"
// must not match a name. Kept short and high-signal; deliberately excludes
// low-signal industry words like "casino"/"xxx" that name real hospitality and
// events clients this agency wants to win.
const SPAM_KEYWORDS = [
  "viagra",
  "cialis",
  "porn",
  "binary options",
  "forex signals",
  "buy backlinks",
  "cheap seo",
  "rank #1 on google",
  "weight loss pills",
  "make money fast",
  "work from home guaranteed",
  "bitcoin doubler",
  "crypto pump",
];

function countMatches(haystack: string, re: RegExp): number {
  return (haystack.match(re) || []).length;
}

function uppercaseRatio(s: string): number {
  const letters = s.replace(/[^a-z]/gi, "");
  if (letters.length === 0) return 0;
  const upper = s.replace(/[^A-Z]/g, "").length;
  return upper / letters.length;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Count keywords that appear as whole tokens. Plain `includes` would match
// "cialis" inside "specialist"; the `[^a-z0-9]` guards require a non-alphanumeric
// boundary (or string edge) on both sides. `\b` is unusable here because some
// keywords contain spaces/symbols (e.g. "rank #1 on google").
function keywordHits(haystack: string, keywords: string[]): number {
  return keywords.filter((k) =>
    new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(k)}(?:[^a-z0-9]|$)`, "i").test(haystack)
  ).length;
}

// Real URLs in an identity field (name/business) are never human — but a bare
// "word.tld" is NOT checked here, because brand-as-domain names ("Monday.com",
// "Acme.io") are common and legitimate. Non-global: used only with `.test()`.
const IDENTITY_LINK_RE = /https?:\/\/|www\./i;

// Broader link matcher for the description, where counting bare domains is the
// point (SEO/backlink stuffing). Global so `String.match` can count them.
const DESCRIPTION_LINK_RE = /https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|ru|cn|io|xyz|top|info)\b/gi;

export function detectSpam(data: QuoteFormData): SpamVerdict {
  const reasons: string[] = [];
  let score = 0;

  const haystack = `${data.name} ${data.business} ${data.description}`.toLowerCase();

  // 1. A real URL where a human never puts one: the name or business field.
  if (IDENTITY_LINK_RE.test(data.name) || IDENTITY_LINK_RE.test(data.business)) {
    score += 2;
    reasons.push("link_in_identity_field");
  }

  // 2. Link-stuffed description (classic SEO/backlink spam).
  const links = countMatches(data.description, DESCRIPTION_LINK_RE);
  if (links >= 3) {
    score += 2;
    reasons.push("many_links");
  } else if (links >= 1 && data.description.trim().length < 60) {
    // A short message that's mostly a URL is almost always a drive-by.
    score += 1;
    reasons.push("short_message_with_link");
  }

  // 3. Forum-style BBCode, a hallmark of automated link spam.
  if (/\[url[=\]]|\[link[=\]]|\[\/(?:url|link)\]/i.test(haystack)) {
    score += 2;
    reasons.push("bbcode_links");
  }

  // 4. Spam keyword hits (each adds a point, capped so one field can't dominate).
  const kwHits = keywordHits(haystack, SPAM_KEYWORDS);
  if (kwHits > 0) {
    score += Math.min(kwHits, 3);
    reasons.push("spam_keywords");
  }

  // 5. Shouting: long description that's mostly uppercase.
  if (data.description.trim().length >= 20 && uppercaseRatio(data.description) > 0.6) {
    score += 1;
    reasons.push("excessive_caps");
  }

  // 6. Long runs of one character ("aaaaaaaaaa", "!!!!!!!!!!").
  if (/(.)\1{9,}/.test(haystack)) {
    score += 1;
    reasons.push("char_flooding");
  }

  return { isSpam: score >= SPAM_THRESHOLD, score, reasons };
}

// ----------------------------------------------------------------------------
// Bot heuristics: honeypot + submission timing
// ----------------------------------------------------------------------------

// Honeypot: a field hidden from humans but present in the DOM. Bots that fill
// every input will populate it; any non-empty value means "not a human".
export function isHoneypotTripped(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

// Timing trap: humans cannot read, decide, and complete a multi-field form in
// under a couple of seconds; scripted submitters routinely do it in <100ms.
// `elapsedMs` is (submit time − form mount time), both supplied by the caller.
export const MIN_HUMAN_FILL_MS = 2000;

export function looksAutomated(elapsedMs: number, opts?: { minMs?: number }): boolean {
  const minMs = opts?.minMs ?? MIN_HUMAN_FILL_MS;
  return elapsedMs < minMs;
}

// ----------------------------------------------------------------------------
// Rate limiting (storage-agnostic)
// ----------------------------------------------------------------------------
//
// Pure sliding-window decision: the caller owns persistence. Pass the array of
// prior submission timestamps; get back whether this one is allowed plus the
// pruned+appended history to persist. Client backs this with localStorage; a
// server would back the same call with Redis/KV keyed by IP.

export const DEFAULT_RATE_LIMIT = { maxSubmissions: 3, windowMs: 10 * 60 * 1000 };

export type RateLimitResult = {
  allowed: boolean;
  retryAfterMs: number;
  nextHistory: number[];
};

export function evaluateRateLimit(
  history: number[],
  now: number,
  opts?: { maxSubmissions?: number; windowMs?: number }
): RateLimitResult {
  const maxSubmissions = opts?.maxSubmissions ?? DEFAULT_RATE_LIMIT.maxSubmissions;
  const windowMs = opts?.windowMs ?? DEFAULT_RATE_LIMIT.windowMs;

  // Drop timestamps that have aged out of the window (and any future-dated junk).
  const recent = history.filter((t) => typeof t === "number" && t > now - windowMs && t <= now);

  if (recent.length >= maxSubmissions) {
    const oldest = Math.min(...recent);
    return {
      allowed: false,
      retryAfterMs: Math.max(0, oldest + windowMs - now),
      nextHistory: recent, // unchanged: a blocked attempt is not recorded
    };
  }

  return { allowed: true, retryAfterMs: 0, nextHistory: [...recent, now] };
}

// ----------------------------------------------------------------------------
// Composite evaluation
// ----------------------------------------------------------------------------
//
// One call that runs field validation + abuse checks in priority order and
// returns a single verdict the UI (or a server) can switch on. Ordering matters:
// honest humans should get field feedback first; silent bot traps are checked
// before content/rate so a tripped bot never learns why it failed.

export type AbuseReason = "honeypot" | "timing" | "rate_limit" | "spam" | null;

export type SubmissionVerdict =
  | { status: "invalid"; errors: FieldErrors }
  | {
      status: "blocked";
      reason: Exclude<AbuseReason, null>;
      silent: boolean;
      message?: string;
      retryAfterMs?: number;
      // Present only when the blocked attempt should still count against the
      // rate limit (spam): the caller persists it. Absent for rate_limit
      // (already over cap) and the silent honeypot/timing traps (never recorded).
      nextHistory?: number[];
    }
  | { status: "ok"; nextHistory: number[] };

export type SubmissionContext = {
  honeypot: string | null | undefined;
  elapsedMs: number;
  now: number;
  history: number[];
  rateLimit?: { maxSubmissions?: number; windowMs?: number };
  timing?: { minMs?: number };
};

export function evaluateSubmission(data: QuoteFormData, ctx: SubmissionContext): SubmissionVerdict {
  const errors = validateFields(data);
  if (hasErrors(errors)) {
    return { status: "invalid", errors };
  }

  // Silent traps first: respond as if successful so bots don't learn the trap.
  if (isHoneypotTripped(ctx.honeypot)) {
    return { status: "blocked", reason: "honeypot", silent: true };
  }
  if (looksAutomated(ctx.elapsedMs, ctx.timing)) {
    return { status: "blocked", reason: "timing", silent: true };
  }

  // Rate limit before spam: cheap, and stops floods regardless of content.
  const rate = evaluateRateLimit(ctx.history, ctx.now, ctx.rateLimit);
  if (!rate.allowed) {
    return {
      status: "blocked",
      reason: "rate_limit",
      silent: false,
      retryAfterMs: rate.retryAfterMs,
      message: "You've sent a few requests already. Please try again shortly.",
    };
  }

  const spam = detectSpam(data);
  if (spam.isSpam) {
    return {
      status: "blocked",
      reason: "spam",
      silent: false,
      message: "Your message was flagged by our spam filter. Please revise and try again.",
      // Count this attempt: repeated spam from one browser should still hit the
      // rate limit. `rate.nextHistory` is [...recent, now] (rate.allowed here).
      nextHistory: rate.nextHistory,
    };
  }

  return { status: "ok", nextHistory: rate.nextHistory };
}
