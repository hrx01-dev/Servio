import {
  LayoutDashboard,
  FolderKanban,
  Megaphone,
  Wallet,
  Users,
  MessageSquare,
  ClipboardList,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Permission } from "./permissions";

export interface NavItem {
  /** Path relative to `/admin`. */
  to: string;
  label: string;
  icon: LucideIcon;
  /** Permission required for the item to appear and the route to render. */
  permission: Permission;
}

/**
 * Sidebar items, in display order. The sidebar filters this list by the signed
 * in admin's permissions, so navigation is generated per role.
 */
export const ADMIN_NAV: readonly NavItem[] = [
  { to: "dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
  { to: "projects", label: "Projects", icon: FolderKanban, permission: "projects:view" },
  { to: "updates", label: "Updates", icon: Megaphone, permission: "projects:view" },
  { to: "billing", label: "Billing", icon: Wallet, permission: "projects:view" },
  { to: "clients", label: "Clients", icon: Users, permission: "clients:view" },
  { to: "messages", label: "Messages", icon: MessageSquare, permission: "messages:view" },
  { to: "audit", label: "Audit", icon: ClipboardList, permission: "audit:view" },
  { to: "settings", label: "Settings", icon: Settings, permission: "settings:view" },
];
