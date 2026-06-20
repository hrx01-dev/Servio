import { useContext } from "react";
import { AdminContext, AdminContextValue } from "./AdminContextObject";

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdmin must be used within an <AdminProvider>.");
  }
  return ctx;
}
