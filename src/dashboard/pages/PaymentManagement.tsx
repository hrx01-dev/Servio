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
import { toast } from "sonner";
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

function loadRazorpay() {
  return new Promise((resolve) => {
    // @ts-expect-error - Razorpay injected via script
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      resolve(true);
    };
    script.onerror = (error) => {
      console.error("Razorpay script load error:", error);
      resolve(false);
    };
    document.body.appendChild(script);
  });
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
          <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            {error}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            Try again
          </button>
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
  const [isProcessing, setIsProcessing] = useState(false);

  async function handlePayment(specificAmount?: number, pendingPaymentId?: string) {
    if (!auth.currentUser?.email) {
      toast.error("User email not found");
      return;
    }

    const amountToPay = specificAmount || remaining;
    if (amountToPay <= 0) return;

    setIsProcessing(true);
    try {
      const res = await loadRazorpay();
      if (!res) {
        toast.error("Razorpay SDK failed to load. Are you online?");
        setIsProcessing(false);
        return;
      }

      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      // Create Order on Backend
      const orderRes = await fetch(`${baseUrl}/api/razorpay?action=createOrder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountToPay,
          clientEmail: auth.currentUser.email,
        }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to create order");
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Servio",
        description: "Project Billing",
        order_id: orderData.id,
        handler: async function (response: Record<string, string>) {
          const verifyRes = await fetch(`${baseUrl}/api/razorpay?action=verifyPayment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              clientEmail: auth.currentUser!.email,
              amount: amountToPay,
              pendingPaymentId: pendingPaymentId,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            toast.success("Payment successful!");
          } else {
            toast.error(verifyData.error || "Payment verification failed");
          }
        },
        prefill: {
          name: auth.currentUser.displayName || "Client",
          email: auth.currentUser.email,
        },
        theme: {
          color: "#6366f1",
        },
      };

      // @ts-expect-error - Razorpay injected via script
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to initiate payment");
    } finally {
      setIsProcessing(false);
    }
  }

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
                    {item.label === "Remaining Balance" && remaining > 0 && (
                      <button
                        onClick={() => handlePayment()}
                        disabled={isProcessing}
                        className="mt-3 text-sm px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        {isProcessing ? "Processing..." : "Pay Now"}
                      </button>
                    )}
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
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {paymentStatusBadge(payment.status)}
                          {payment.status === "pending" && (
                            <button
                              onClick={() => handlePayment(payment.amount, payment.id)}
                              disabled={isProcessing}
                              className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-sm transition-colors disabled:opacity-50"
                            >
                              Pay Now
                            </button>
                          )}
                        </div>
                      </TableCell>
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
