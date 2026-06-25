import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Send,
  Loader2,
  AlertCircle,
  Clock,
  BarChart3,
  IndianRupee,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  History,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../app/components/ui/card";
import { Badge } from "../../app/components/ui/badge";
import { Separator } from "../../app/components/ui/separator";
import { Button } from "../../app/components/ui/button";
import { analyzeProject, fetchEstimationHistory } from "../services/estimationService";
import { useAuth } from "../../Firebase/useAuth";
import type { EstimationResult, EstimationRecord } from "../types";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const COMPLEXITY_COLORS: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800",
  medium:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800",
  high: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800",
  enterprise:
    "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800",
};

function ComplexityBadge({ complexity }: { complexity: string }) {
  return (
    <Badge
      variant="outline"
      className={COMPLEXITY_COLORS[complexity] ?? COMPLEXITY_COLORS.medium}
    >
      {complexity.charAt(0).toUpperCase() + complexity.slice(1)}
    </Badge>
  );
}

function EstimationResults({ result }: { result: EstimationResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Project Analysis Header */}
      <Card className="border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              Project Analysis
            </CardTitle>
            <ComplexityBadge complexity={result.overallComplexity} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Project Type
              </p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100 mt-1">
                {result.projectType}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Overall Complexity
              </p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100 mt-1 capitalize">
                {result.overallComplexity}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Breakdown */}
      <Card className="border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Feature Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">
                    Feature
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">
                    Complexity
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">
                    Estimated Effort
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.features.map((feature, idx) => (
                  <motion.tr
                    key={feature.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    className="border-b border-gray-100 dark:border-slate-800 last:border-0"
                  >
                    <td className="py-3 px-2 text-gray-900 dark:text-gray-100 font-medium">
                      {feature.name}
                    </td>
                    <td className="py-3 px-2">
                      <ComplexityBadge complexity={feature.complexity} />
                    </td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-300">
                      {feature.estimatedEffort}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Cost & Timeline */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-lg p-2.5 bg-indigo-50 dark:bg-indigo-950/50">
                <IndianRupee className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Estimated Project Cost
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {"\u20B9"}
                  {result.estimatedCostMin.toLocaleString("en-IN")} &ndash;{" "}
                  {"\u20B9"}
                  {result.estimatedCostMax.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-lg p-2.5 bg-emerald-50 dark:bg-emerald-950/50">
                <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Estimated Timeline
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {result.estimatedTimeline}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Explanation */}
      <Card className="border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg p-2.5 bg-amber-50 dark:bg-amber-950/50 shrink-0">
              <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                AI Analysis
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {result.explanation}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function HistoryItem({ record }: { record: EstimationRecord }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {record.result.projectType}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {new Date(record.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {"\u20B9"}
            {record.result.estimatedCostMin.toLocaleString("en-IN")} &ndash;{" "}
            {"\u20B9"}
            {record.result.estimatedCostMax.toLocaleString("en-IN")}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-100 dark:border-slate-800 pt-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Original Description:
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3 mb-3">
                {record.description}
              </p>
              <EstimationResults result={record.result} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ProjectEstimation() {
  const { currentUser } = useAuth();
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EstimationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<EstimationRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 10) {
      setError("Please provide a detailed project description (at least 10 characters).");
      return;
    }

    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const estimation = await analyzeProject(
        description.trim(),
        currentUser?.uid ?? "",
      );
      setResult(estimation);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadHistory = async () => {
    if (!currentUser) return;
    setShowHistory(true);
    setHistoryLoading(true);
    try {
      const records = await fetchEstimationHistory(currentUser.uid);
      setHistory(records);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleNewEstimate = () => {
    setResult(null);
    setDescription("");
    setError(null);
  };

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-indigo-500" />
              AI Project Estimation
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Describe your project and get an instant cost estimate powered by
              AI.
            </p>
          </div>
          {!showHistory && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadHistory}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              History
            </Button>
          )}
        </div>
      </motion.div>

      {!result ? (
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card className="border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Describe Your Project
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="project-description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Project Description{" "}
                    <span className="text-indigo-500">*</span>
                  </label>
                  <textarea
                    id="project-description"
                    rows={6}
                    placeholder={`Example:\nI need a food delivery website with:\n- Customer authentication\n- Restaurant dashboard\n- Order management\n- Payment gateway\n- Real-time order tracking\n- Mobile responsive design`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all resize-y text-sm"
                    disabled={loading}
                  />
                  <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                    {description.length}/5000 characters
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                  >
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </p>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !description.trim()}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/25"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing Project...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Get Estimate
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleNewEstimate}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              New Estimate
            </Button>
          </div>
          <EstimationResults result={result} />
        </>
      )}

      {/* Estimation History */}
      {showHistory && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Separator />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <History className="h-5 w-5 text-gray-400" />
              Previous Estimates
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(false)}
            >
              Hide
            </Button>
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No previous estimates found.
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((record) => (
                <HistoryItem key={record.id} record={record} />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
