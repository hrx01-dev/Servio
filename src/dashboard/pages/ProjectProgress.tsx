import { motion } from "motion/react";
import {
  CheckCircle2,
  Clock,
  Circle,
  ArrowDown,
  User,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";
import { Badge } from "../../app/components/ui/badge";
import { Progress } from "../../app/components/ui/progress";
import { Skeleton } from "../../app/components/ui/skeleton";
import { useProjects } from "../hooks/useProjects";
import { PROJECT_STAGES } from "../types";
import type { StageDetail } from "../types";

function StageStatusIcon({ status }: { status: StageDetail["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-6 w-6 text-emerald-500" />;
    case "in_progress":
      return <Clock className="h-6 w-6 text-indigo-500 animate-pulse" />;
    default:
      return <Circle className="h-6 w-6 text-gray-300 dark:text-gray-600" />;
  }
}

function statusBadge(status: StageDetail["status"]) {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800">
          Completed
        </Badge>
      );
    case "in_progress":
      return (
        <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800">
          In Progress
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-gray-500 dark:text-gray-400">
          Pending
        </Badge>
      );
  }
}

export function ProjectProgress() {
  const { projects, loading } = useProjects();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  const project = projects[0];
  if (!project) return null;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Project Progress
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Track each stage of <span className="font-medium">{project.name}</span>
        </p>
      </motion.div>

      <div className="space-y-0">
        {PROJECT_STAGES.map((stage, idx) => {
          const detail = project.stages[stage.key];
          const isLast = idx === PROJECT_STAGES.length - 1;

          return (
            <motion.div
              key={stage.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.06 }}
            >
              <div className="flex gap-4">
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  <StageStatusIcon status={detail.status} />
                  {!isLast && (
                    <div className="flex flex-col items-center py-1">
                      <div
                        className={`w-0.5 flex-1 min-h-[2rem] ${
                          detail.status === "completed"
                            ? "bg-emerald-300 dark:bg-emerald-700"
                            : "bg-gray-200 dark:bg-gray-700"
                        }`}
                      />
                      <ArrowDown
                        className={`h-3 w-3 my-0.5 ${
                          detail.status === "completed"
                            ? "text-emerald-400 dark:text-emerald-600"
                            : "text-gray-300 dark:text-gray-600"
                        }`}
                      />
                    </div>
                  )}
                </div>

                {/* Stage card */}
                <Card
                  className={`flex-1 mb-4 border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${
                    detail.status === "in_progress"
                      ? "ring-2 ring-indigo-500/20"
                      : ""
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {stage.label}
                      </CardTitle>
                      {statusBadge(detail.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          Completion
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {detail.completionPercent}%
                        </span>
                      </div>
                      <Progress value={detail.completionPercent} className="h-1.5" />
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                      {detail.assignedTo && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {detail.assignedTo}
                        </span>
                      )}
                      {detail.lastUpdated && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {detail.lastUpdated}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
