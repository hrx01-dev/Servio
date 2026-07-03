import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { signOut } from "firebase/auth";
import { auth } from "../../Firebase/firebase";
import { useAuth } from "../../Firebase/useAuth";
import { useTheme } from "../../app/hooks/useTheme";
import {
  LayoutDashboard,
  GitBranch,
  Bell,
  CreditCard,
  FileText,
  FolderOpen,
  LogOut,
  Menu,
  X,
  Home,
  Moon,
  Sun,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../app/components/ui/avatar";
import { Button } from "../../app/components/ui/button";
import { Jali } from "../../app/components/motifs";
import { NotificationProvider } from "../notifications/NotificationContext";
import { NotificationBell } from "../notifications/NotificationBell";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/dashboard/progress", icon: GitBranch, label: "Progress" },
  { to: "/dashboard/updates", icon: Bell, label: "Updates" },
  { to: "/dashboard/notifications", icon: Bell, label: "Notifications" },
  { to: "/dashboard/payments", icon: CreditCard, label: "Payments" },
  { to: "/dashboard/invoices", icon: FileText, label: "Invoices" },
  { to: "/dashboard/resources", icon: FolderOpen, label: "Resources" },
  { to: "/dashboard/estimation", icon: Sparkles, label: "AI Estimate" },
];

function NavLink({
  to,
  icon: Icon,
  label,
  active,
  onClick,
  pillId,
  reduce,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick?: () => void;
  pillId: string;
  reduce: boolean;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      }`}
    >
      {active && (
        <motion.span
          layoutId={pillId}
          aria-hidden
          className="absolute inset-0 rounded-lg bg-sidebar-accent ring-1 ring-sidebar-ring/30 shadow-elev-1"
          transition={
            reduce
              ? { duration: 0 }
              : { type: "spring", stiffness: 520, damping: 40 }
          }
        />
      )}
      <Icon
        className={`relative z-10 h-5 w-5 shrink-0 transition-colors ${
          active
            ? "text-primary"
            : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
        }`}
      />
      <span className="relative z-10">{label}</span>
    </Link>
  );
}

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const reduce = useReducedMotion() ?? false;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  const initials = currentUser?.displayName
    ? currentUser.displayName
        .split(" ")
        .filter((n) => n.length > 0)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : currentUser?.email?.slice(0, 2).toUpperCase() ?? "U";

  const isActive = (to: string, end?: boolean) => {
    if (end) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  const renderSidebar = (idPrefix: string) => (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center px-5 py-5">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-grad-brand text-sm font-bold text-white shadow-elev-1">
            S
          </span>
          <span className="font-display text-xl font-semibold text-gradient-brand">
            Servio
          </span>
        </Link>
      </div>

      <div className="mx-3 h-px bg-sidebar-border" />

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            {...item}
            active={isActive(item.to, item.end)}
            onClick={() => setSidebarOpen(false)}
            pillId={`${idPrefix}-nav-pill`}
            reduce={reduce}
          />
        ))}
      </nav>

      {/* Footer — the only place a motif is allowed, kept barely-there */}
      <div className="relative mt-auto">
        <Jali
          className="absolute inset-x-0 bottom-0 h-44"
          color="var(--gold)"
          opacity={0.05}
        />
        <div className="relative">
          <div className="mx-3 h-px bg-sidebar-border" />
          <div className="space-y-1 p-3">
            <button
              onClick={toggleTheme}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <>
                  <Sun className="h-5 w-5 shrink-0 text-saffron" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-5 w-5 shrink-0 text-sidebar-foreground/60" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            <Link
              to="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            >
              <Home className="h-5 w-5 shrink-0 text-sidebar-foreground/60" />
              Back to Home
            </Link>

            <div className="mt-2 flex items-center gap-3 rounded-lg border border-sidebar-border/70 bg-sidebar-accent/40 px-3 py-2.5">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser?.photoURL ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {currentUser?.displayName ?? "Client"}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60">
                  {currentUser?.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                aria-label="Sign out"
                className="shrink-0 text-sidebar-foreground/70 hover:text-sidebar-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-background text-foreground">
        {/* Desktop glass rail */}
        <aside
          className="glass glass-thin fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border text-sidebar-foreground lg:block"
          style={{ borderRadius: 0 }}
        >
          {renderSidebar("desktop")}
        </aside>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.15 }}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 300, damping: 30 }
                }
                className="glass glass-strong fixed inset-y-0 left-0 z-50 w-64 border-r border-sidebar-border text-sidebar-foreground lg:hidden"
                style={{ borderRadius: 0 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-4 z-10 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close sidebar"
                >
                  <X className="h-5 w-5" />
                </Button>
                {renderSidebar("mobile")}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="lg:pl-64">
          {/* Top bar */}
          <header
            className="glass sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border px-4"
            style={{ borderRadius: 0 }}
          >
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <span className="font-display text-base font-semibold text-gradient-brand lg:hidden">
                Servio
              </span>
            </div>
            <div className="flex items-center gap-1">
              <NotificationBell />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-saffron" />
                ) : (
                  <Moon className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
            </div>
          </header>

          <main className="p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}
