import { createNotification } from "./notificationService";
import type { NotificationType, NotificationCategory } from "./types";

interface TriggerParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  actionUrl?: string;
}

async function trigger(params: TriggerParams) {
  try {
    await createNotification(params);
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

// ── Project Events ──

export function notifyProjectCreated(userId: string, projectName: string) {
  return trigger({
    userId,
    title: "New Project Created",
    message: `Your project "${projectName}" has been created successfully.`,
    type: "success",
    category: "project",
    actionUrl: "/dashboard",
  });
}

export function notifyProjectAssigned(
  userId: string,
  projectName: string,
  projectId: string,
) {
  return trigger({
    userId,
    title: "Project Assigned",
    message: `You have been assigned to project "${projectName}".`,
    type: "info",
    category: "project",
    actionUrl: `/dashboard/progress?project=${projectId}`,
  });
}

export function notifyStatusChanged(
  userId: string,
  projectName: string,
  newStatus: string,
) {
  return trigger({
    userId,
    title: "Project Status Updated",
    message: `"${projectName}" status changed to ${newStatus}.`,
    type: "info",
    category: "project",
    actionUrl: "/dashboard/progress",
  });
}

export function notifyMilestoneCompleted(
  userId: string,
  projectName: string,
  milestone: string,
) {
  return trigger({
    userId,
    title: "Milestone Completed",
    message: `"${milestone}" has been completed for "${projectName}".`,
    type: "success",
    category: "project",
    actionUrl: "/dashboard/progress",
  });
}

export function notifyProjectDelivered(
  userId: string,
  projectName: string,
) {
  return trigger({
    userId,
    title: "Project Delivered",
    message: `"${projectName}" has been delivered. Please review the final deliverables.`,
    type: "success",
    category: "project",
    actionUrl: "/dashboard/resources",
  });
}

// ── Payment Events ──

export function notifyPaymentReceived(
  userId: string,
  amount: number,
  projectName: string,
) {
  return trigger({
    userId,
    title: "Payment Received",
    message: `Payment of $${amount.toLocaleString()} received for "${projectName}".`,
    type: "success",
    category: "payment",
    actionUrl: "/dashboard/payments",
  });
}

export function notifyInvoiceGenerated(
  userId: string,
  invoiceNumber: string,
) {
  return trigger({
    userId,
    title: "Invoice Generated",
    message: `Invoice ${invoiceNumber} has been generated and is ready for review.`,
    type: "info",
    category: "payment",
    actionUrl: "/dashboard/invoices",
  });
}

export function notifyRefundIssued(
  userId: string,
  amount: number,
  reference: string,
) {
  return trigger({
    userId,
    title: "Refund Issued",
    message: `A refund of $${amount.toLocaleString()} (ref: ${reference}) has been processed.`,
    type: "info",
    category: "payment",
    actionUrl: "/dashboard/payments",
  });
}

// ── Account Events ──

export function notifyPasswordChanged(userId: string) {
  return trigger({
    userId,
    title: "Password Changed",
    message:
      "Your password has been changed. If you did not make this change, please contact support.",
    type: "warning",
    category: "system",
  });
}

export function notifyProfileUpdated(userId: string) {
  return trigger({
    userId,
    title: "Profile Updated",
    message: "Your profile information has been updated successfully.",
    type: "success",
    category: "system",
  });
}

export function notifyNewLogin(userId: string, device: string) {
  return trigger({
    userId,
    title: "New Login Detected",
    message: `A new login was detected from ${device}. If this wasn't you, please secure your account.`,
    type: "warning",
    category: "system",
  });
}

export function notifyWelcome(userId: string, name: string) {
  return trigger({
    userId,
    title: "Welcome to Servio!",
    message: `Hi ${name}, welcome aboard! Explore your dashboard to track projects and more.`,
    type: "success",
    category: "system",
    actionUrl: "/dashboard",
  });
}

// ── Admin Events ──

export function notifyAnnouncement(userId: string, announcement: string) {
  return trigger({
    userId,
    title: "New Announcement",
    message: announcement,
    type: "info",
    category: "system",
  });
}

export function notifyMaintenanceScheduled(
  userId: string,
  scheduledDate: string,
) {
  return trigger({
    userId,
    title: "Scheduled Maintenance",
    message: `System maintenance is scheduled for ${scheduledDate}. You may experience brief downtime.`,
    type: "warning",
    category: "system",
  });
}
