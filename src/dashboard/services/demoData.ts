import type { Project } from "../types";

export const DEMO_PROJECT: Project = {
  id: "demo-project-1",
  name: "Corporate Website Redesign",
  description:
    "Complete redesign and development of the corporate website with modern UI/UX, responsive layouts, and CMS integration.",
  status: "active",
  currentStage: "development",
  stages: {
    requirements: {
      status: "completed",
      completionPercent: 100,
      lastUpdated: "2026-05-01",
      assignedTo: "Priya Sharma",
    },
    planning: {
      status: "completed",
      completionPercent: 100,
      lastUpdated: "2026-05-08",
      assignedTo: "Priya Sharma",
    },
    design: {
      status: "completed",
      completionPercent: 100,
      lastUpdated: "2026-05-20",
      assignedTo: "Arjun Mehta",
    },
    development: {
      status: "in_progress",
      completionPercent: 65,
      lastUpdated: "2026-06-18",
      assignedTo: "Karan Patel",
    },
    testing: {
      status: "pending",
      completionPercent: 0,
      lastUpdated: "",
      assignedTo: "Sneha Gupta",
    },
    review: {
      status: "pending",
      completionPercent: 0,
      lastUpdated: "",
      assignedTo: "",
    },
    deployment: {
      status: "pending",
      completionPercent: 0,
      lastUpdated: "",
      assignedTo: "Karan Patel",
    },
    completed: {
      status: "pending",
      completionPercent: 0,
      lastUpdated: "",
      assignedTo: "",
    },
  },
  totalCost: 30000,
  amountPaid: 15000,
  updates: [
    {
      id: "u1",
      title: "Homepage completed",
      description:
        "The homepage layout, hero section, and animations have been finalized and approved.",
      date: "2026-06-18",
      type: "milestone",
    },
    {
      id: "u2",
      title: "Authentication integrated",
      description:
        "Firebase Authentication has been integrated with email/password and Google sign-in support.",
      date: "2026-06-15",
      type: "feature",
    },
    {
      id: "u3",
      title: "Mobile responsiveness implemented",
      description:
        "All completed pages are now fully responsive across mobile, tablet, and desktop breakpoints.",
      date: "2026-06-12",
      type: "feature",
    },
    {
      id: "u4",
      title: "Testing in progress",
      description:
        "Unit and integration tests are being written for core components and API routes.",
      date: "2026-06-10",
      type: "info",
    },
    {
      id: "u5",
      title: "Design system finalized",
      description:
        "Color palette, typography, and component library have been established.",
      date: "2026-05-20",
      type: "milestone",
    },
  ],
  payments: [
    {
      id: "p1",
      date: "2026-05-01",
      amount: 10000,
      method: "Bank Transfer",
      status: "completed",
      reference: "TXN-2026-001",
    },
    {
      id: "p2",
      date: "2026-06-01",
      amount: 5000,
      method: "UPI",
      status: "completed",
      reference: "TXN-2026-002",
    },
  ],
  invoices: [
    {
      id: "inv1",
      number: "INV-2026-001",
      date: "2026-05-01",
      dueDate: "2026-05-15",
      amount: 10000,
      status: "paid",
      items: [
        { description: "Project Setup & Requirements", amount: 5000 },
        { description: "UI/UX Design - Phase 1", amount: 5000 },
      ],
    },
    {
      id: "inv2",
      number: "INV-2026-002",
      date: "2026-06-01",
      dueDate: "2026-06-15",
      amount: 5000,
      status: "paid",
      items: [{ description: "Development - Milestone 1", amount: 5000 }],
    },
    {
      id: "inv3",
      number: "INV-2026-003",
      date: "2026-06-20",
      dueDate: "2026-07-05",
      amount: 15000,
      status: "unpaid",
      items: [
        { description: "Development - Milestone 2", amount: 10000 },
        { description: "Testing & Deployment", amount: 5000 },
      ],
    },
  ],
  resources: [
    {
      id: "r1",
      label: "GitHub Repository",
      url: "https://github.com/hrx01-dev/Servio",
      type: "github",
    },
    {
      id: "r2",
      label: "Staging Environment",
      url: "https://servio-staging.web.app",
      type: "staging",
    },
    {
      id: "r3",
      label: "Production Site",
      url: "https://servio.web.app",
      type: "production",
    },
    {
      id: "r4",
      label: "Project Brief",
      url: "#",
      type: "document",
    },
  ],
  createdAt: "2026-04-25",
};
