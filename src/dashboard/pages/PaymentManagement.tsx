import { useState } from "react";
import { motion } from "motion/react";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  IndianRupee,
  AlertCircle,
  MailCheck,
  Wallet,
} from "lucide-react";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "../../Firebase/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";
import { Badge } from "../../app/components/ui/badge";
import { Progress } from "../../app/components/ui/progress";
import { Separator } from "../../app/components/ui/separator";
import { Skeleton } from "../../app/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../app/components/ui/table";
import { useClientPayments } from "../hooks/useClientPayments";
import type { ClientBilling, PaymentStatus } from "../lib/payments";

const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

// Payment dates are stored as calendar dates ('YYYY-MM-DD') and parsed to UTC
// midnight, so format them in UTC too — otherwise a client west of UTC would
// see the date shifted a day earlier.
const paymentDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function formatPaymentDate(date: Date | null): string {
  return date ? paymentDateFormatter.format(date) : "—";
}

function paymentStatusBadge(status: PaymentStatus) {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    default:
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
  }
}

function PageTitle() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Payments
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1">
        Your project cost, payments, and remaining balance.
      </p>
    </motion.div>
  );
}

export function PaymentManagement() {
  const { billing, loading, error, needsEmailVerification } =
    useClientPayments();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleResendVerification() {
    if (!auth.currentUser) return;
    setResending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setResent(true);
    } catch {
      /* allow the user to try again */
    } finally {
      setResending(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (needsEmailVerification) {
    return (
      <div className="space-y-6">
        <PageTitle />
        <div className="flex flex-col items-center py-16 text-center">
          <MailCheck className="h-12 w-12 text-indigo-300 dark:text-indigo-500/70 mb-4" />
          <p className="text-gray-700 dark:text-gray-200 font-medium">
            Verify your email to see your payments
          </p>
          <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            Payment details are tied to your verified email. Check your inbox for
            the verification link, then refresh this page.
          </p>
          {resent ? (
            <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
              Verification email sent — check your inbox.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resending}
              className="mt-4 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-60"
            >
              {resending ? "Sending…" : "Resend verification email"}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageTitle />
        <div
          role="alert"
          className="flex flex-col items-center py-16 text-center"
        >
          <AlertCircle className="h-12 w-12 text-red-300 dark:text-red-500/70 mb-4" />
          <p className="text-gray-700 dark:text-gray-200 font-medium">
            We couldn&apos;t load your payments
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Please check your connection and try again in a moment.
          </p>
        </div>
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="space-y-6">
        <PageTitle />
        <div className="flex flex-col items-center py-16 text-center">
          <Wallet className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-700 dark:text-gray-200 font-medium">
            No payment information yet
          </p>
          <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            Your project cost and payment history will appear here once your team
            sets them up.
          </p>
        </div>
      </div>
    );
  }

  return <BillingView billing={billing} />;
}

function BillingView({ billing }: { billing: ClientBilling }) {
  const { totalCost, amountPaid, remaining, paidPercent, payments } = billing;

  const summaryCards = [
    {
      label: "Total Project Cost",
      value: totalCost,
      color: "text-gray-900 dark:text-gray-100",
      icon: IndianRupee,
      iconColor: "text-indigo-500",
      iconBg: "bg-indigo-50 dark:bg-indigo-950/50",
    },
    {
      label: "Amount Paid",
      value: amountPaid,
      color: "text-emerald-600 dark:text-emerald-400",
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      label: "Remaining Balance",
      value: remaining,
      color: "text-amber-600 dark:text-amber-400",
      icon: Clock,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-50 dark:bg-amber-950/50",
    },
  ];

  return (
    <div className="space-y-6">
      <PageTitle />

      {/* Payment summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.08 }}
          >
            <Card className="border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item.label}
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${item.color}`}>
                      {inr(item.value)}
                    </p>
                  </div>
                  <div className={`rounded-lg p-2.5 ${item.iconBg}`}>
                    <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.24 }}
      >
        <Card className="border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Payment Progress
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {paidPercent}%
              </span>
            </div>
            <Progress value={paidPercent} className="h-3" />
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>{inr(0)}</span>
              <span>{inr(totalCost)}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Separator />

      {/* Payment history */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.32 }}
      >
        <Card className="border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-indigo-500" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                No payments recorded yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="text-gray-600 dark:text-gray-300">
                        {formatPaymentDate(payment.date)}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                        {inr(payment.amount)}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">
                        {payment.method || "—"}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400 font-mono text-xs">
                        {payment.reference || "—"}
                      </TableCell>
                      <TableCell>{paymentStatusBadge(payment.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
