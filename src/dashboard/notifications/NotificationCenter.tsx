import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDebounce } from "../../hooks/useDebounce";
import { motion } from "motion/react";
import {
  Bell,
  CheckCheck,
  Search,
  Filter,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Settings2,
} from "lucide-react";
import { Card, CardContent } from "../../app/components/ui/card";
import { Button } from "../../app/components/ui/button";
import { Badge } from "../../app/components/ui/badge";
import { Skeleton } from "../../app/components/ui/skeleton";
import { useNotifications } from "./useNotifications";
import type {
  Notification,
  NotificationType,
  NotificationCategory,
} from "./types";
import { formatDistanceToNow } from "date-fns";

const ITEMS_PER_PAGE = 10;

type ReadFilter = "all" | "unread" | "read";

function typeIcon(type: NotificationType) {
  switch (type) {
    case "success":
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case "error":
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
}

function categoryLabel(cat: NotificationCategory) {
  switch (cat) {
    case "project":
      return "Project";
    case "payment":
      return "Payment";
    case "message":
      return "Message";
    case "system":
      return "System";
  }
}

function categoryBadgeClass(cat: NotificationCategory) {
  switch (cat) {
    case "project":
      return "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800";
    case "payment":
      return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800";
    case "message":
      return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800";
    case "system":
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  }
}

function NotificationRow({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notification.isRead) onRead(notification.id);
    if (notification.actionUrl) navigate(notification.actionUrl);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:shadow-md transition-shadow ${
          !notification.isRead ? "ring-1 ring-indigo-200 dark:ring-indigo-800" : ""
        }`}
        onClick={handleClick}
      >
        <CardContent className="flex items-start gap-4 py-4">
          <div className="mt-0.5 shrink-0">{typeIcon(notification.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={`text-sm ${
                  !notification.isRead
                    ? "font-semibold text-gray-900 dark:text-gray-100"
                    : "font-medium text-gray-700 dark:text-gray-300"
                }`}
              >
                {notification.title}
              </h3>
              <Badge className={categoryBadgeClass(notification.category)}>
                {categoryLabel(notification.category)}
              </Badge>
              {!notification.isRead && (
                <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {notification.message}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              {formatDistanceToNow(notification.createdAt, {
                addSuffix: true,
              })}
            </p>
          </div>
          {notification.actionUrl && (
            <ExternalLink className="h-4 w-4 text-gray-400 shrink-0 mt-1" />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function NotificationCenter() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotifications();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [categoryFilter, setCategoryFilter] =
    useState<NotificationCategory | "all">("all");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = notifications;

    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q),
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter((n) => n.category === categoryFilter);
    }

    if (readFilter === "unread") {
      result = result.filter((n) => !n.isRead);
    } else if (readFilter === "read") {
      result = result.filter((n) => n.isRead);
    }

    return result;
  }, [notifications, debouncedSearchQuery, categoryFilter, readFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Notifications
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "You're all caught up!"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead()}
              className="gap-1.5"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
          <Link to="/dashboard/notification-preferences">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Settings2 className="h-4 w-4" />
              Preferences
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(
                e.target.value as NotificationCategory | "all",
              );
              setPage(1);
            }}
            className="rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
          >
            <option value="all">All categories</option>
            <option value="project">Project</option>
            <option value="payment">Payment</option>
            <option value="message">Message</option>
            <option value="system">System</option>
          </select>
        </div>

        {/* Read filter */}
        <div className="flex rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
          {(["all", "unread", "read"] as ReadFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setReadFilter(filter);
                setPage(1);
              }}
              className={`px-3 py-2 text-sm font-medium capitalize transition-colors ${
                readFilter === filter
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                  : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-slate-900 dark:text-gray-400 dark:hover:bg-slate-800"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Notification list */}
      {paginated.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {debouncedSearchQuery || categoryFilter !== "all" || readFilter !== "all"
              ? "No notifications match your filters."
              : "No notifications yet."}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {debouncedSearchQuery || categoryFilter !== "all" || readFilter !== "all"
              ? "Try adjusting your search or filters."
              : "We'll notify you when something important happens."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((n) => (
            <NotificationRow
              key={n.id}
              notification={n}
              onRead={markAsRead}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of{" "}
            {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
