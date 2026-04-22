import { Navigate } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";

export function RequireAuth({ children, allow }: { children: JSX.Element; allow?: AppRole[] }) {
  const { user, roles, loading } = useAuth();
  if (loading) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  
  const hasAccess = allow ? allow.some((r) => roles.includes(r)) : true;
  
  if (!hasAccess) {
    // Determine where they SHOULD go
    if (roles.includes("admin")) return <Navigate to="/dashboard/admin" replace />;
    if (roles.includes("seller")) return <Navigate to="/dashboard/seller" replace />;
    if (roles.includes("delivery")) return <Navigate to="/dashboard/delivery" replace />;
    // If they have NO special roles, they are a buyer, but if they are ALREADY on buyer dashboard and failing, send to home
    return <Navigate to="/" replace />;
  }

  return children;
}
