import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  GitBranch,
  CreditCard,
  Bell,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";
import { Badge } from "../../app/components/ui/badge";
import { Progress } from "../../app/components/ui/progress";
import { Separator } from "../../app/components/ui/separator";
import { Skeleton } from "../../app/components/ui/skeleton";
import { useProjects } from "../hooks/useProjects";
import { useClientUpdates } from "../hooks/useClientUpdates";
import { useClientPayments } from "../hooks/useClientPayments";
import { PROJECT_STAGES } from "../types";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const recentUpdateDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export function DashboardOverview() {
  const { projects, loading, isDemo } = useProjects();
  const {
    updates: recentUpdates,
    loading: updatesLoading,
    error: updatesError,
    needsEmailVerification,
  } = useClientUpdates();
  const {
    billing,
    loading: paymentsLoading,
    error: paymentsError,
    needsEmailVerification: paymentsNeedsVerification,
  } = useClientPayments();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const project = projects[0];
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <LayoutDashboard className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          No Projects Yet
        </h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-sm">
          Your projects will appear here once they are created. Contact the team
          to get started.
        </p>
      </div>
    );
  }

  const stageValues = Object.values(project.stages ?? {});
  const overallProgress =
    stageValues.length > 0
      ? Math.round(
          stageValues.reduce(
            (sum, s) =>
              sum +
              (Number.isFinite(s.completionPercent) ? s.completionPercent : 0),
            0,
          ) / stageValues.length,
        )
      : 0;

  const completedStages = Object.values(project.stages).filter(
    (s) => s.status === "completed",
  ).length;

  const currentStageLabel =
    PROJECT_STAGES.find((s) => s.key === project.currentStage)?.label ??
    project.currentStage;

  // Payment figures come from the client's real, email-addressed billing — not
  // the project record — and load independently, so the stat card reflects the
  // billing hook's state (loading / verify-email / not-set-up / data).
  let paymentValue: string;
  let paymentSubtitle: string | undefined;
  if (paymentsNeedsVerification) {
    paymentValue = "Verify email";
  } else if (paymentsLoading) {
    paymentValue = "…";
  } else if (paymentsError) {
    paymentValue = "Unavailable";
  } else if (!billing) {
    paymentValue = "Not set up";
  } else {
    paymentValue = `${inr(billing.amountPaid)} paid`;
    paymentSubtitle = `${inr(billing.remaining)} remaining`;
  }

  const statCards = [
    {
      title: "Project Status",
      value: currentStageLabel,
      icon: GitBranch,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/50",
    },
    {
      title: "Overall Progress",
      value: `${overallProgress}%`,
      icon: TrendingUp,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      title: "Stages Completed",
      value: `${completedStages} / ${PROJECT_STAGES.length}`,
      icon: CheckCircle2,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/50",
    },
    {
      title: "Payment Status",
      value: paymentValue,
      icon: CreditCard,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/50",
      subtitle: paymentSubtitle,
    },
  ];

  return (
    <div className="space-y-6">
      {isDemo && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          Showing demo data. Your real projects will appear here once
          configured in Firestore.
        </div>
      )}

      <motion.div {...fadeUp}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Welcome back! Here&apos;s an overview of your project.
        </p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.title}
            {...fadeUp}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
          >
            <Card className="border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {stat.value}
                    </p>
                    {stat.subtitle && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {stat.subtitle}
                      </p>
                    )}
                  </div>
                  <div className={`rounded-lg p-2.5 ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Active project card */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.32 }}>
        <Card className="border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {project.name}
              </CardTitle>
              <Badge
                variant={
                  project.status === "active" ? "default" : "secondary"
                }
                className={
                  project.status === "active"
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800"
                    : ""
                }
              >
                {project.status === "active"
                  ? "Active"
                  : project.status === "completed"
                    ? "Completed"
                    : "On Hold"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {project.description}
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Overall Progress
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {overallProgress}%
                </span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            <Separator />

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                Current Stage: {currentStageLabel}
              </div>
              <Link
                to="/dashboard/progress"
                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium"
              >
                View Progress <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent updates & payment summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.4 }}>
          <Card className="border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-indigo-500" />
                  Recent Updates
                </CardTitle>
                <Link
                  to="/dashboard/updates"
                  className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium"
                >
                  View All
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {updatesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : updatesError ? (
                <div className="flex flex-col items-center py-6 text-center" role="alert">
                  <Bell className="h-8 w-8 text-red-300 dark:text-red-500/70 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Couldn&apos;t load updates
                  </p>
                </div>
              ) : needsEmailVerification ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <Bell className="h-8 w-8 text-indigo-300 dark:text-indigo-500/70 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Verify your email to see updates
                  </p>
                </div>
              ) : recentUpdates.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No updates yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentUpdates.slice(0, 3).map((update) => (
                    <div key={update.id} className="flex gap-3">
                      <div className="mt-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {update.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {update.createdAt
                            ? recentUpdateDateFormatter.format(update.createdAt)
                            : "Just now"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.48 }}>
          <Card className="border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-indigo-500" />
                  Payment Summary
                </CardTitle>
                <Link
                  to="/dashboard/payments"
                  className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium"
                >
                  View All
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                  <Skeleton className="h-2" />
                </div>
              ) : paymentsError ? (
                <div
                  className="flex flex-col items-center py-6 text-center"
                  role="alert"
                >
                  <CreditCard className="h-8 w-8 text-red-300 dark:text-red-500/70 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Couldn&apos;t load payments
                  </p>
                </div>
              ) : paymentsNeedsVerification ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <CreditCard className="h-8 w-8 text-indigo-300 dark:text-indigo-500/70 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Verify your email to see payments
                  </p>
                </div>
              ) : !billing ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <CreditCard className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No payment information yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Total Cost
                      </p>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {inr(billing.totalCost)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Paid
                      </p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {inr(billing.amountPaid)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Remaining
                      </p>
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {inr(billing.remaining)}
                      </p>
                    </div>
                  </div>
                  <Progress value={billing.paidPercent} className="h-2" />
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    {billing.paidPercent}% of total paid
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
