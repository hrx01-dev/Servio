import { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Bug, Flag, Info, Bell, AlertCircle, MailCheck } from "lucide-react";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "../../Firebase/auth";
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";
import { Badge } from "../../app/components/ui/badge";
import { Skeleton } from "../../app/components/ui/skeleton";
import { useClientUpdates } from "../hooks/useClientUpdates";
import type { UpdateType } from "../lib/updates";

function updateTypeConfig(type: UpdateType) {
  switch (type) {
    case "feature":
      return {
        icon: Sparkles,
        color: "text-indigo-500",
        bg: "bg-indigo-50 dark:bg-indigo-950/50",
        label: "Feature",
        badgeClass:
          "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800",
      };
    case "bugfix":
      return {
        icon: Bug,
        color: "text-red-500",
        bg: "bg-red-50 dark:bg-red-950/50",
        label: "Bug Fix",
        badgeClass:
          "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800",
      };
    case "milestone":
      return {
        icon: Flag,
        color: "text-emerald-500",
        bg: "bg-emerald-50 dark:bg-emerald-950/50",
        label: "Milestone",
        badgeClass:
          "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800",
      };
    default:
      return {
        icon: Info,
        color: "text-gray-500",
        bg: "bg-gray-50 dark:bg-gray-950/50",
        label: "Info",
        badgeClass:
          "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
      };
  }
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function formatUpdateDate(date: Date | null): string {
  return date ? dateFormatter.format(date) : "Just now";
}

export function UpdatesFeed() {
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

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Development Updates
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          The latest progress, features, and milestones posted by your team.
        </p>
      </motion.div>

      {loading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading updates">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex flex-col items-center py-16 text-center"
        >
          <AlertCircle className="h-12 w-12 text-red-300 dark:text-red-500/70 mb-4" />
          <p className="text-gray-700 dark:text-gray-200 font-medium">
            We couldn&apos;t load your updates
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Please check your connection and try again in a moment.
          </p>
        </div>
      ) : needsEmailVerification ? (
        <div className="flex flex-col items-center py-16 text-center">
          <MailCheck className="h-12 w-12 text-indigo-300 dark:text-indigo-500/70 mb-4" />
          <p className="text-gray-700 dark:text-gray-200 font-medium">
            Verify your email to see updates
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
      ) : updates.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-700 dark:text-gray-200 font-medium">
            No updates yet
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            When your team posts progress on your project, it&apos;ll show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((update, idx) => {
            const config = updateTypeConfig(update.type);
            const Icon = config.icon;

            return (
              <motion.div
                key={update.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(idx, 8) * 0.06 }}
              >
                <Card className="border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${config.bg}`}>
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                          {update.title}
                        </CardTitle>
                      </div>
                      <Badge className={config.badgeClass}>{config.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 whitespace-pre-line">
                      {update.description}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {formatUpdateDate(update.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
