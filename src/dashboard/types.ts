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

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: string;
  status: "completed" | "pending" | "failed";
  reference: string;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  status: "paid" | "unpaid" | "overdue";
  items: { description: string; amount: number }[];
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
  totalCost: number;
  amountPaid: number;
  updates: ProjectUpdate[];
  payments: PaymentRecord[];
  invoices: Invoice[];
  resources: ProjectResource[];
  createdAt: string;
}
