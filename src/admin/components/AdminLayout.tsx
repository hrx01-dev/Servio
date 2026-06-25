import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import { cn } from "@/app/components/ui/utils";
import { Toaster } from "@/app/components/ui/sonner";
import { AdminSidebar } from "./AdminSidebar";
import { AdminCommandPalette } from "./AdminCommandPalette";
import { isTyping } from "../lib/keyboard";

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Press "/" anywhere (outside a text field) to open the search palette
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (isTyping(e)) return;
      if (e.key === "/") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop sidebar (fixed) */}
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">
        <AdminSidebar className="h-full" />
      </div>

      {/* Mobile slide-over */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          mobileOpen ? "" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <AdminSidebar
            className="h-full"
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      </div>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur lg:px-8">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <span className="text-sm font-medium text-foreground">
            Admin Portal
          </span>

          {/* Search trigger — clicking works on mobile, "/" works on desktop */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="ml-auto flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Open search"
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Search…</span>
            <kbd className="hidden rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground ring-1 ring-border sm:inline">
              /
            </kbd>
          </button>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <AdminCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <Toaster richColors position="top-right" />
    </div>
  );
}
