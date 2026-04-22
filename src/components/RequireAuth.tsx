import { Navigate } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";

export function RequireAuth({ children, allow }: { children: JSX.Element; allow?: AppRole[] }) {
  const { user, roles, loading } = useAuth();
  if (loading) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (allow && !allow.some((r) => roles.includes(r))) {
    return <Navigate to="/" replace />;
  }
  return children;
}
