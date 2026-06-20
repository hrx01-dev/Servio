import { motion } from "motion/react";
import {
  Sparkles,
  Bug,
  Flag,
  Info,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";
import { Badge } from "../../app/components/ui/badge";
import { Skeleton } from "../../app/components/ui/skeleton";
import { useProjects } from "../hooks/useProjects";
import type { ProjectUpdate } from "../types";

function updateTypeConfig(type: ProjectUpdate["type"]) {
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

export function UpdatesFeed() {
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

  const updates = [...project.updates].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

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
          Latest updates for{" "}
          <span className="font-medium">{project.name}</span>
        </p>
      </motion.div>

      {updates.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No updates yet. Check back soon!
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
                transition={{ duration: 0.3, delay: idx * 0.06 }}
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
                      <Badge className={config.badgeClass}>
                        {config.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {update.description}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {update.date}
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
