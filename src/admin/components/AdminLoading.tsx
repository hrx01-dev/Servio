import { Loader2 } from "lucide-react";

export function AdminLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
        <p role="status" className="text-sm">
          {label}
        </p>
      </div>
    </div>
  );
}
