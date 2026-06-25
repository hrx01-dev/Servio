import { useState } from "react";
import { motion } from "motion/react";
import {
  Save,
  Bell,
  Mail,
  Smartphone,
  GitBranch,
  CreditCard,
  MessageSquare,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";
import { Button } from "../../app/components/ui/button";
import { Switch } from "../../app/components/ui/switch";
import { Label } from "../../app/components/ui/label";
import { Separator } from "../../app/components/ui/separator";
import { useNotifications } from "./useNotifications";
import type { NotificationPreferences as PrefsType } from "./types";

interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onCheckedChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-gray-100 p-2 dark:bg-slate-800">
          {icon}
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {label}
          </Label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function NotificationPreferences() {
  const { preferences, updatePreferences } = useNotifications();
  const [localPrefs, setLocalPrefs] = useState<PrefsType>(preferences);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasChanges =
    JSON.stringify(localPrefs) !== JSON.stringify(preferences);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreferences(localPrefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const updateCategory = (
    key: keyof PrefsType["categories"],
    value: boolean,
  ) => {
    setLocalPrefs((prev) => ({
      ...prev,
      categories: { ...prev.categories, [key]: value },
    }));
  };

  const updateChannel = (
    key: keyof PrefsType["channels"],
    value: boolean,
  ) => {
    setLocalPrefs((prev) => ({
      ...prev,
      channels: { ...prev.channels, [key]: value },
    }));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Notification Preferences
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Choose which notifications you'd like to receive and how.
        </p>
      </motion.div>

      {/* Category preferences */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-base">Notification Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <ToggleRow
              icon={
                <GitBranch className="h-4 w-4 text-indigo-500" />
              }
              label="Project Updates"
              description="Project creation, status changes, milestones, and deliveries"
              checked={localPrefs.categories.project}
              onCheckedChange={(v) => updateCategory("project", v)}
            />
            <Separator />
            <ToggleRow
              icon={
                <CreditCard className="h-4 w-4 text-emerald-500" />
              }
              label="Payment Updates"
              description="Payment receipts, invoices, and refunds"
              checked={localPrefs.categories.payment}
              onCheckedChange={(v) => updateCategory("payment", v)}
            />
            <Separator />
            <ToggleRow
              icon={
                <MessageSquare className="h-4 w-4 text-purple-500" />
              }
              label="Messages"
              description="New messages and replies"
              checked={localPrefs.categories.message}
              onCheckedChange={(v) => updateCategory("message", v)}
            />
            <Separator />
            <ToggleRow
              icon={
                <Shield className="h-4 w-4 text-gray-500" />
              }
              label="System Alerts"
              description="Account security, maintenance, and announcements"
              checked={localPrefs.categories.system}
              onCheckedChange={(v) => updateCategory("system", v)}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Channel preferences */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-base">Delivery Channels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <ToggleRow
              icon={<Bell className="h-4 w-4 text-blue-500" />}
              label="In-App"
              description="Notifications inside the Servio dashboard"
              checked={localPrefs.channels.inApp}
              onCheckedChange={(v) => updateChannel("inApp", v)}
            />
            <Separator />
            <ToggleRow
              icon={<Mail className="h-4 w-4 text-orange-500" />}
              label="Email"
              description="Receive notifications via email (coming soon)"
              checked={localPrefs.channels.email}
              onCheckedChange={(v) => updateChannel("email", v)}
            />
            <Separator />
            <ToggleRow
              icon={
                <Smartphone className="h-4 w-4 text-teal-500" />
              }
              label="Push Notifications"
              description="Browser push notifications (coming soon)"
              checked={localPrefs.channels.push}
              onCheckedChange={(v) => updateChannel("push", v)}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Save button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="flex items-center gap-3"
      >
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Preferences"}
        </Button>
        {saved && (
          <span className="text-sm text-emerald-600 dark:text-emerald-400">
            Preferences saved successfully.
          </span>
        )}
      </motion.div>
    </div>
  );
}
