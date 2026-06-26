import { useRouteError } from "react-router-dom";

export function GlobalErrorBoundary() {
  const error = useRouteError();
  const isChunkError =
    error instanceof Error &&
    (error.message.includes("Failed to fetch dynamically imported module") ||
      error.message.includes("Importing a module script failed"));

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 text-center dark:bg-slate-950">
      <h1 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white">
        {isChunkError ? "App Updated" : "Oops! Something went wrong."}
      </h1>
      <p className="mb-8 max-w-md text-slate-600 dark:text-slate-400">
        {isChunkError
          ? "A new version of the application is available. Please refresh to load the latest version."
          : "An unexpected error occurred while rendering this page. Please try again."}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-md bg-slate-900 px-6 py-3 font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        Refresh Page
      </button>
    </div>
  );
}
