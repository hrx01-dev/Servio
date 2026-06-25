/**
 * UnsavedChangesDialog
 *
 * Renders an accessible confirmation dialog when a React Router `useBlocker`
 * has intercepted a client-side navigation attempt.
 *
 * - "Stay" / pressing Escape → calls `blocker.reset()`, keeping the user on
 *   the current page.
 * - "Leave" → calls `blocker.proceed()`, allowing the navigation to continue
 *   and discarding unsaved changes.
 *
 * Pass the `blocker` returned by `useUnsavedChanges()` directly to this
 * component; it renders nothing when `blocker.state !== "blocked"`.
 */

import { useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UnsavedChangesDialogProps {
  blocker: ReturnType<typeof useBlocker>;
}

export function UnsavedChangesDialog({ blocker }: UnsavedChangesDialogProps) {
  const isBlocked = blocker.state === "blocked";
  const dialogRef = useRef<HTMLDivElement>(null);
  // Remember the element that was focused before the dialog opened so we can
  // restore focus when it closes (WCAG 2.4.3 / APG dialog pattern).
  const triggerRef = useRef<Element | null>(null);

  // Trap focus inside the dialog and restore it on close.
  useEffect(() => {
    if (isBlocked) {
      triggerRef.current = document.activeElement;
      // Defer so the dialog is in the DOM before we try to focus it.
      requestAnimationFrame(() => {
        dialogRef.current?.focus();
      });
    } else {
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    }
  }, [isBlocked]);

  // Allow Escape to dismiss the dialog (keep the user on the page).
  useEffect(() => {
    if (!isBlocked) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        blocker.reset?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isBlocked, blocker]);

  return (
    <AnimatePresence>
      {isBlocked && (
        <>
          {/* Backdrop */}
          <motion.div
            key="unsaved-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => blocker.reset?.()}
          />

          {/* Dialog panel */}
          <motion.div
            key="unsaved-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="unsaved-dialog-title"
            aria-describedby="unsaved-dialog-desc"
            ref={dialogRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-1/2 top-1/2 z-[9999] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 focus:outline-none"
          >
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/60">
              {/* Icon */}
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15">
                <AlertTriangle
                  className="h-6 w-6 text-amber-400"
                  aria-hidden="true"
                />
              </div>

              {/* Heading */}
              <h2
                id="unsaved-dialog-title"
                className="mb-2 text-lg font-semibold text-white"
              >
                Unsaved changes
              </h2>

              {/* Body */}
              <p
                id="unsaved-dialog-desc"
                className="mb-6 text-sm leading-relaxed text-slate-400"
              >
                You have unsaved changes that will be lost if you leave this
                page. Are you sure you want to continue?
              </p>

              {/* Actions */}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {/* Stay — primary action (highlighted so "safe" choice is obvious) */}
                <button
                  id="unsaved-dialog-stay"
                  type="button"
                  onClick={() => blocker.reset?.()}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 sm:flex-none"
                >
                  Stay on page
                </button>

                {/* Leave — destructive */}
                <button
                  id="unsaved-dialog-leave"
                  type="button"
                  onClick={() => blocker.proceed?.()}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 sm:flex-none"
                >
                  Leave & discard
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
