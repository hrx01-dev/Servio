import { motion } from "motion/react";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  IndianRupee,
} from "lucide-react";
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
import { useProjects } from "../hooks/useProjects";
import type { PaymentRecord } from "../types";

function paymentStatusBadge(status: PaymentRecord["status"]) {
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

export function PaymentManagement() {
  const { projects, loading } = useProjects();

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

  const project = projects[0];
  if (!project) return null;

  const remaining = project.totalCost - project.amountPaid;
  const paidPercent = Math.round(
    (project.amountPaid / project.totalCost) * 100,
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Payments
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Payment overview and history for{" "}
          <span className="font-medium">{project.name}</span>
        </p>
      </motion.div>

      {/* Payment summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Project Cost",
            value: project.totalCost,
            color: "text-gray-900 dark:text-gray-100",
            icon: IndianRupee,
            iconColor: "text-indigo-500",
            iconBg: "bg-indigo-50 dark:bg-indigo-950/50",
          },
          {
            label: "Amount Paid",
            value: project.amountPaid,
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
        ].map((item, idx) => (
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
                      ₹{item.value.toLocaleString("en-IN")}
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
              <span>₹0</span>
              <span>₹{project.totalCost.toLocaleString("en-IN")}</span>
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
            {project.payments.length === 0 ? (
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
                  {project.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="text-gray-600 dark:text-gray-300">
                        {payment.date}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                        ₹{payment.amount.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">
                        {payment.method}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400 font-mono text-xs">
                        {payment.reference}
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
