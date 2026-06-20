import { motion } from "motion/react";
import {
  Github,
  Globe,
  Rocket,
  FileText,
  Link2,
  ExternalLink,
  FolderOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";
import { Badge } from "../../app/components/ui/badge";
import { Skeleton } from "../../app/components/ui/skeleton";
import { useProjects } from "../hooks/useProjects";
import type { ProjectResource } from "../types";

function resourceConfig(type: ProjectResource["type"]) {
  switch (type) {
    case "github":
      return {
        icon: Github,
        color: "text-gray-900 dark:text-gray-100",
        bg: "bg-gray-100 dark:bg-gray-800",
        label: "Repository",
      };
    case "staging":
      return {
        icon: Globe,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-950/50",
        label: "Staging",
      };
    case "production":
      return {
        icon: Rocket,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-950/50",
        label: "Production",
      };
    case "document":
      return {
        icon: FileText,
        color: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-50 dark:bg-indigo-950/50",
        label: "Document",
      };
    default:
      return {
        icon: Link2,
        color: "text-gray-600 dark:text-gray-400",
        bg: "bg-gray-50 dark:bg-gray-800",
        label: "Other",
      };
  }
}

export function ProjectResources() {
  const { projects, loading } = useProjects();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
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
          Project Resources
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Links and documents for{" "}
          <span className="font-medium">{project.name}</span>
        </p>
      </motion.div>

      {project.resources.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <FolderOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No resources have been added yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {project.resources.map((resource, idx) => {
            const config = resourceConfig(resource.type);
            const Icon = config.icon;

            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
              >
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <Card className="border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-shadow hover:shadow-md">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-lg p-2.5 ${config.bg}`}>
                            <Icon className={`h-5 w-5 ${config.color}`} />
                          </div>
                          <div>
                            <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {resource.label}
                            </CardTitle>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {config.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{resource.url}</span>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
