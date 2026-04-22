import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Store, LogOut, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface NavItem {
  to: string;
  label: string;
  icon: any;
}

interface Props {
  title: string;
  navItems: NavItem[];
  children: ReactNode;
}

export function DashboardLayout({ title, navItems, children }: Props) {
  const { user, primaryRole, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6 font-display text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-amber text-primary">
            <Store className="h-4 w-4" />
          </span>
          UniDrop
        </div>
        <div className="px-4 py-4 text-xs uppercase tracking-wider text-sidebar-foreground/50">
          {title}
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 truncate text-xs text-sidebar-foreground/60">{user?.email}</div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={async () => { await signOut(); navigate("/"); }}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Home
            </Button>
            <h1 className="font-display text-lg font-semibold">{title}</h1>
          </div>
          <div className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium capitalize text-accent-foreground">
            {primaryRole}
          </div>
        </header>
        <div className="flex-1 p-4 md:p-8">{children}</div>

        {/* Mobile bottom nav */}
        <nav className="flex border-t border-border bg-background md:hidden">
          {navItems.slice(0, 4).map((item) => (
            <NavLink key={item.to} to={item.to} end
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2 text-xs ${isActive ? "text-accent" : "text-muted-foreground"}`}>
              <item.icon className="h-4 w-4" /> {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
