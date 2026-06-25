/**
 * useUnsavedChanges
 *
 * Detects when a form is "dirty" (modified by the user but not yet saved)
 * and prevents accidental data loss via two complementary mechanisms:
 *
 *  1. Browser-level navigation (refresh, tab close, address-bar change):
 *     A `beforeunload` event listener fires the native browser confirmation
 *     dialog.  This is the only way to intercept these events — modern
 *     browsers do not allow custom dialog text here.
 *
 *  2. Client-side route changes (React Router `<Link>`, `navigate()`,
 *     browser back/forward within the SPA):
 *     React Router v6.8+ `useBlocker` is used.  The hook returns a
 *     `blocker` whose `state` can be `"blocked"`, `"proceeding"`, or
 *     `"unblocked"`.  The consuming component renders a confirmation
 *     dialog when `blocker.state === "blocked"`.
 *
 * Usage:
 *   const { isDirty, markDirty, markClean, blocker } = useUnsavedChanges();
 *
 *   // mark dirty whenever the user modifies a field:
 *   onChange={() => { markDirty(); /* ...update state... *\/ }}
 *
 *   // clear after a successful save:
 *   markClean();
 *
 *   // render a confirmation dialog:
 *   <UnsavedChangesDialog blocker={blocker} />
 */

import { useState, useEffect, useCallback } from "react";
import { useBlocker } from "react-router-dom";

export interface UnsavedChangesHook {
  /** True when the form has been modified and not yet saved. */
  isDirty: boolean;
  /** Call whenever the user edits a field to mark the form dirty. */
  markDirty: () => void;
  /** Call after a successful save (or explicit discard) to clear dirty state. */
  markClean: () => void;
  /** React Router blocker — pass to <UnsavedChangesDialog>. */
  blocker: ReturnType<typeof useBlocker>;
}

export function useUnsavedChanges(): UnsavedChangesHook {
  const [isDirty, setIsDirty] = useState(false);

  // Block client-side route changes when the form is dirty.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  // Block browser-level navigation (refresh, close, external URL).
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Modern browsers require returnValue to be set (the text is ignored).
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // If the blocker was left in "blocked" state but the component unmounts
  // (e.g. the user navigated away via a programmatic route reset), clean up.
  useEffect(() => {
    return () => {
      setIsDirty(false);
    };
  }, []);

  const markDirty = useCallback(() => setIsDirty(true), []);
  const markClean = useCallback(() => setIsDirty(false), []);

  return { isDirty, markDirty, markClean, blocker };
}
