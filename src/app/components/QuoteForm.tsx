import { useRef, useState } from "react";
import { motion } from "motion/react";
import { Send, CheckCircle2 } from "lucide-react";
import {
  BUDGET_OPTIONS as budgetOptions,
  WEBSITE_TYPES as websiteTypes,
  LIMITS,
  evaluateSubmission,
  type FieldErrors,
  type QuoteFormData,
} from "../lib/quoteValidation";

// Persisted submission timestamps for client-side rate limiting. Advisory only
// (a user can clear storage) — the heavy lifting belongs on a server, but this
// stops casual repeat-spam from the same browser at zero infra cost.
const RATE_KEY = "servio:quote:submissions";

function readHistory(): number[] {
  try {
    const raw = localStorage.getItem(RATE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((n) => typeof n === "number") : [];
  } catch {
    return []; // storage disabled / private mode → fail open
  }
}

function writeHistory(history: number[]): void {
  try {
    localStorage.setItem(RATE_KEY, JSON.stringify(history));
  } catch {
    /* storage unavailable — nothing to persist, not worth surfacing */
  }
}

export function QuoteForm() {
  const [form, setForm] = useState<QuoteFormData>({
    name: "",
    email: "",
    phone: "",
    business: "",
    budget: "",
    type: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  // Bumped on every surfaced form error so the live region re-announces even
  // when the message text is identical to the previous one (e.g. blocked twice).
  const [errorNonce, setErrorNonce] = useState(0);

  // Honeypot value lives outside React state (read on submit via ref) so it
  // never round-trips through the controlled inputs a human interacts with.
  const honeypotRef = useRef<HTMLInputElement>(null);
  // Timestamp of first render — the start of the timing trap. Lazily computed
  // once so it survives re-renders without re-stamping.
  const [mountedAt] = useState(() => Date.now());

  const showFormError = (message: string) => {
    setFormError(message);
    setErrorNonce((n) => n + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const now = Date.now();
    const verdict = evaluateSubmission(form, {
      honeypot: honeypotRef.current?.value ?? "",
      elapsedMs: now - mountedAt,
      now,
      history: readHistory(),
    });

    if (verdict.status === "invalid") {
      setErrors(verdict.errors);
      // Move focus to the first invalid control so keyboard/AT users land on it.
      const firstKey = Object.keys(verdict.errors)[0];
      if (firstKey) document.getElementById(`quote-${firstKey}`)?.focus();
      return;
    }

    setErrors({});

    if (verdict.status === "blocked") {
      // Silent traps (honeypot / impossibly-fast fill): mimic the success state
      // so automated submitters get zero signal that they were caught.
      if (verdict.silent) {
        setSubmitted(true);
        return;
      }
      // A spam block still consumes a rate-limit slot (carried as nextHistory);
      // rate_limit blocks carry none. Persist before surfacing the message.
      if (verdict.nextHistory) writeHistory(verdict.nextHistory);
      showFormError(verdict.message ?? "Unable to submit right now. Please try again.");
      return;
    }

    // verdict.status === "ok" — record this submission, then "send".
    writeHistory(verdict.nextHistory);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  const inputClass = (field: keyof QuoteFormData) =>
    `w-full px-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200 ${
      errors[field] ? "border-red-400/60" : "border-white/20 hover:border-white/30"
    }`;

  // Shared aria wiring for a field: marks it invalid and points at its error text.
  const fieldAria = (field: keyof QuoteFormData) => ({
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `quote-${field}-error` : undefined,
  });

  return (
    <section id="contact" aria-labelledby="quote-title" className="py-20 md:py-32 bg-gradient-to-br from-[#0f0f1a] via-[#1a0a2e] to-[#0f0f1a] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-cyan-400 font-semibold text-sm uppercase tracking-wider">
            Get in Touch
          </span>
          <h2 id="quote-title" className="text-4xl md:text-5xl font-bold text-white mt-3 mb-4">
            Request Your{" "}
            <span className="bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] bg-clip-text text-transparent">
              Free Proposal
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Tell us about your project and we'll send you a detailed proposal within 24 hours.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl shadow-black/40"
        >
          {submitted ? (
            <div className="text-center py-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-3">Proposal Sent!</h3>
              <p className="text-gray-400">
                Thank you, {form.name}! We've received your request and will reach out within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {/* Honeypot: hidden from humans (display:none keeps it out of the
                  a11y tree and away from autofill) but present in the DOM, so a
                  form-filling bot trips it. Neutral name = no autofill category.
                  Do not remove. */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="referral_source">Leave this field empty</label>
                <input
                  ref={honeypotRef}
                  type="text"
                  id="referral_source"
                  name="referral_source"
                  tabIndex={-1}
                  autoComplete="off"
                  defaultValue=""
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label htmlFor="quote-name" className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    id="quote-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Sarah Chen"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputClass("name")}
                    {...fieldAria("name")}
                  />
                  {errors.name && <p id="quote-name-error" className="mt-1.5 text-red-400 text-xs">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="quote-email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    id="quote-email"
                    type="email"
                    autoComplete="email"
                    placeholder="sarah@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputClass("email")}
                    {...fieldAria("email")}
                  />
                  {errors.email && <p id="quote-email-error" className="mt-1.5 text-red-400 text-xs">{errors.email}</p>}
                </div>

                {/* Phone (optional) */}
                <div>
                  <label htmlFor="quote-phone" className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number <span className="text-gray-500">(optional)</span>
                  </label>
                  <input
                    id="quote-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+1 555 123 4567"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={inputClass("phone")}
                    {...fieldAria("phone")}
                  />
                  {errors.phone && <p id="quote-phone-error" className="mt-1.5 text-red-400 text-xs">{errors.phone}</p>}
                </div>

                {/* Business */}
                <div>
                  <label htmlFor="quote-business" className="block text-sm font-medium text-gray-300 mb-2">
                    Business Name <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    id="quote-business"
                    type="text"
                    autoComplete="organization"
                    placeholder="TechStart Inc."
                    value={form.business}
                    onChange={(e) => setForm({ ...form, business: e.target.value })}
                    className={inputClass("business")}
                    {...fieldAria("business")}
                  />
                  {errors.business && (
                    <p id="quote-business-error" className="mt-1.5 text-red-400 text-xs">
                      {errors.business}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-10">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                >
                  {loading ? (
                    "Sending Request..."
                  ) : (
                    <>
                      Send Proposal Request <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}