import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { Home, LogOut, ShieldAlert } from "lucide-react";
import { auth } from "@/Firebase/firebase";
import { Button } from "@/app/components/ui/button";
import { useAdmin } from "../context/useAdmin";

export function Unauthorized() {
  const { firebaseUser, admin } = useAdmin();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/admin/login", { replace: true });
  };

  const reason = admin?.disabled
    ? "Your admin account has been disabled. Contact a super admin to restore access."
    : "This account doesn't have permission to view the admin portal.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center text-card-foreground shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">{reason}</p>
        {firebaseUser?.email && (
          <p className="mt-1 text-xs text-muted-foreground">
            Signed in as {firebaseUser.email}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {firebaseUser && (
            <Button type="button" variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </Button>
          )}
          <Button asChild>
            <Link to="/">
              <Home className="h-4 w-4" aria-hidden="true" />
              Back to site
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
