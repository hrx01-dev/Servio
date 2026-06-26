export type ProjectStage =
  | "requirements"
  | "planning"
  | "design"
  | "development"
  | "testing"
  | "review"
  | "deployment"
  | "completed";

export const PROJECT_STAGES: { key: ProjectStage; label: string }[] = [
  { key: "requirements", label: "Requirements Gathering" },
  { key: "planning", label: "Planning" },
  { key: "design", label: "UI/UX Design" },
  { key: "development", label: "Development" },
  { key: "testing", label: "Testing" },
  { key: "review", label: "Client Review" },
  { key: "deployment", label: "Deployment" },
  { key: "completed", label: "Completed" },
];

export interface StageDetail {
  status: "pending" | "in_progress" | "completed";
  completionPercent: number;
  lastUpdated: string;
  assignedTo: string;
}

export interface ProjectUpdate {
  id: string;
  title: string;
  description: string;
  date: string;
  type: "feature" | "bugfix" | "milestone" | "info";
}

export interface ProjectResource {
  id: string;
  label: string;
  url: string;
  type: "github" | "staging" | "production" | "document" | "other";
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "completed" | "on_hold";
  currentStage: ProjectStage;
  stages: Record<ProjectStage, StageDetail>;
  updates: ProjectUpdate[];
  resources: ProjectResource[];
  createdAt: string;
}

export interface FeatureAnalysis {
  name: string;
  complexity: "low" | "medium" | "high" | "enterprise";
  estimatedEffort: string;
}

export interface EstimationResult {
  projectType: string;
  overallComplexity: "low" | "medium" | "high" | "enterprise";
  features: FeatureAnalysis[];
  estimatedCostMin: number;
  estimatedCostMax: number;
  estimatedTimeline: string;
  explanation: string;
}

export interface EstimationRecord {
  id: string;
  userId: string;
  description: string;
  result: EstimationResult;
  createdAt: string;
}
