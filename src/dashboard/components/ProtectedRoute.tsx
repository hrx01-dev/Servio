import { Navigate } from "react-router-dom";
import { useAuth } from "../../Firebase/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/signin" replace />;
  }

  if (userRole === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl text-center space-y-4 border border-red-100 dark:border-red-900/30">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-300">
            This account is authorized for admin access only. Please use the admin login page to access the admin portal.
          </p>
          <a href="/admin/login" className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition">
            Go to Admin Portal
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
