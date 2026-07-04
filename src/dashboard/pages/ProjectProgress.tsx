import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Sparkles,
  Bug,
  Flag,
  Info,
  Activity,
  TrendingUp,
  CalendarClock,
  Rocket,
  AlertCircle,
  MailCheck,
  type LucideIcon,
} from "lucide-react";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "../../Firebase/auth";
import { Card, CardContent } from "../../app/components/ui/card";
import { Skeleton } from "../../app/components/ui/skeleton";
import { useClientUpdates } from "../hooks/useClientUpdates";
import { summarizeUpdates, type UpdateType } from "../lib/updates";

interface TypeStyle {
  label: string;
  Icon: LucideIcon;
  /** Timeline node gradient. */
  node: string;
  /** Soft badge classes. */
  badge: string;
  /** Connector tint below the node. */
  line: string;
  /** Milestones get an extra glow ring. */
  glow: boolean;
}

const TYPE_CONFIG: Record<UpdateType, TypeStyle> = {
  milestone: {
    label: "Milestone",
    Icon: Flag,
    node: "bg-gradient-to-br from-emerald-500 to-teal-500",
    badge:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    line: "from-emerald-400/60",
    glow: true,
  },
  feature: {
    label: "Feature",
    Icon: Sparkles,
    node: "bg-gradient-to-br from-indigo-500 to-purple-500",
    badge:
      "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800",
    line: "from-indigo-400/50",
    glow: false,
  },
  bugfix: {
    label: "Fix",
    Icon: Bug,
    node: "bg-gradient-to-br from-rose-500 to-red-500",
    badge:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
    line: "from-rose-400/50",
    glow: false,
  },
  info: {
    label: "Update",
    Icon: Info,
    node: "bg-gradient-to-br from-slate-400 to-slate-500",
    badge:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    line: "from-slate-300/60",
    glow: false,
  },
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** Compact "2 days ago" style label relative to `now` (ms). */
function relativeTime(date: Date, now: number): string {
  const sec = Math.round((date.getTime() - now) / 1000);
  const abs = Math.abs(sec);
  if (abs < 60) return rtf.format(sec, "second");
  const min = Math.round(sec / 60);
  if (Math.abs(min) < 60) return rtf.format(min, "minute");
  const hr = Math.round(min / 60);
  if (Math.abs(hr) < 24) return rtf.format(hr, "hour");
  const day = Math.round(hr / 24);
  if (Math.abs(day) < 30) return rtf.format(day, "day");
  const month = Math.round(day / 30);
  if (Math.abs(month) < 12) return rtf.format(month, "month");
  return rtf.format(Math.round(month / 12), "year");
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Project Progress
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1">
        Your project&apos;s journey, posted by the team in real time.
      </p>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`rounded-xl p-2.5 ${accent}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-none text-gray-900 dark:text-gray-100">
          {value}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}

export function ProjectProgress() {
  const reduce = useReducedMotion();
  const { updates, loading, error, needsEmailVerification } = useClientUpdates();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  async function handleResendVerification() {
    if (!auth.currentUser) return;
    setResending(true);
    setSendError(null);
    try {
      await sendEmailVerification(auth.currentUser);
      setResent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/too-many-requests") {
        setSendError("Too many attempts. Please wait a few minutes and try again.");
      } else {
        setSendError("Failed to send verification email. Please try again.");
      }
    } finally {
      setResending(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <Skeleton className="h-24 rounded-2xl" />
        <div className="space-y-6 pl-2" aria-busy="true" aria-label="Loading progress">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
              <Skeleton className="h-24 flex-1 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (needsEmailVerification) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div className="flex flex-col items-center py-16 text-center">
          <MailCheck className="h-12 w-12 text-indigo-300 dark:text-indigo-500/70 mb-4" />
          <p className="text-gray-700 dark:text-gray-200 font-medium">
            Verify your email to see your progress
          </p>
          <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            Updates are tied to your verified email. Check your inbox for the
            verification link, then refresh this page.
          </p>
          {resent ? (
            <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
              Verification email sent — check your inbox.
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                className="mt-4 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-60"
              >
                {resending ? "Sending…" : "Resend verification email"}
              </button>
              {sendError && (
                <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
                  {sendError}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div role="alert" className="flex flex-col items-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-red-300 dark:text-red-500/70 mb-4" />
          <p className="text-gray-700 dark:text-gray-200 font-medium">
            We couldn&apos;t load your progress
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Please check your connection and try again in a moment.
          </p>
        </div>
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div className="flex flex-col items-center py-16 text-center">
          <Rocket className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-700 dark:text-gray-200 font-medium">
            Your journey is about to begin
          </p>
          <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            As your team posts progress on your project, each milestone and
            update will appear here as a live timeline.
          </p>
        </div>
      </div>
    );
  }

  const now = Date.now();
  const summary = summarizeUpdates(updates);

  return (
    <div className="space-y-8">
      <PageHeader />

      {/* Progress summary */}
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 0.4 }}
      >
        <Card className="overflow-hidden border-gray-200 dark:border-slate-800 bg-gradient-to-br from-indigo-50 via-white to-purple-50/60 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/30">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
              <Stat
                icon={Activity}
                label="Updates posted"
                value={String(summary.total)}
                accent="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300"
              />
              <Stat
                icon={Flag}
                label="Milestones reached"
                value={String(summary.milestones)}
                accent="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300"
              />
              <Stat
                icon={TrendingUp}
                label="Latest activity"
                value={summary.latest ? relativeTime(summary.latest, now) : "—"}
                accent="bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300"
              />
              <Stat
                icon={CalendarClock}
                label="Journey started"
                value={summary.started ? dateFormatter.format(summary.started) : "—"}
                accent="bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300"
              />
            </div>

            {summary.milestones > 0 && (
              <div className="mt-5 flex items-center gap-2 border-t border-gray-200/70 pt-4 dark:border-slate-800">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Milestones
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {Array.from({ length: summary.milestones }).map((_, i) => (
                    <span
                      key={i}
                      className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 ring-2 ring-emerald-500/20"
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Journey timeline (newest first) */}
      <div className="relative">
        {updates.map((update, idx) => {
          const cfg = TYPE_CONFIG[update.type];
          const Icon = cfg.Icon;
          const isLast = idx === updates.length - 1;

          return (
            <motion.div
              key={update.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: reduce ? 0 : 0.35,
                delay: reduce ? 0 : Math.min(idx, 10) * 0.05,
              }}
              className="flex gap-4"
            >
              {/* Node + connector */}
              <div className="flex flex-col items-center">
                <div
                  className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-md ${cfg.node} ${
                    cfg.glow ? "ring-4 ring-emerald-500/20" : ""
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                {!isLast && (
                  <div
                    className={`my-1 w-0.5 flex-1 rounded-full bg-gradient-to-b ${cfg.line} to-transparent dark:to-transparent`}
                  />
                )}
              </div>

              {/* Update card */}
              <Card
                className={`mb-6 flex-1 border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${
                  cfg.glow ? "ring-1 ring-emerald-500/15" : ""
                }`}
              >
                <CardContent className="pt-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {update.title}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.badge}`}
                    >
                      {cfg.label}
                    </span>
                  </div>

                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {update.description}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                    {update.createdAt ? (
                      <span title={dateTimeFormatter.format(update.createdAt)}>
                        {relativeTime(update.createdAt, now)} ·{" "}
                        {dateTimeFormatter.format(update.createdAt)}
                      </span>
                    ) : (
                      <span>Just now</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
