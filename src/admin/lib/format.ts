import { Timestamp } from "firebase/firestore";
import { format, formatDistanceToNow } from "date-fns";

export function formatDate(value?: Timestamp, pattern = "MMM d, yyyy"): string {
  if (!value) return "—";
  return format(value.toDate(), pattern);
}

export function formatRelative(value?: Timestamp): string {
  if (!value) return "—";
  return formatDistanceToNow(value.toDate(), { addSuffix: true });
}

export function formatCurrency(amount?: number): string {
  if (typeof amount !== "number") return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
