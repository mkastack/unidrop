import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Store, User, Sun, Moon, LogOut, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/lib/cart";
import { useEffect, useState } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const dashboardPath = (role: string | null) => {
  switch (role) {
    case "seller": return "/dashboard/seller";
    case "delivery": return "/dashboard/delivery";
    case "admin": return "/dashboard/admin";
    default: return "/dashboard/buyer";
  }
};

export function Navbar() {
  const { user, primaryRole, signOut } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("tradie:theme");
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("tradie:theme", next ? "dark" : "light");
  };

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-amber text-primary shadow-amber">
            <Store className="h-5 w-5" />
          </span>
          <span>Tradie</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/shop" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">Shop</Link>
          {user && (
            <Link to={dashboardPath(primaryRole)} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon" aria-label="Cart">
              <ShoppingCart className="h-4 w-4" />
            </Button>
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <>
              <Link to="/notifications">
                <Button variant="ghost" size="icon" aria-label="Notifications"><Bell className="h-4 w-4" /></Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon"><User className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="text-sm font-medium">{user.email}</div>
                    <div className="text-xs capitalize text-muted-foreground">{primaryRole}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(dashboardPath(primaryRole))}>Dashboard</DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => { await signOut(); navigate("/"); }}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={() => navigate("/auth")} className="bg-gradient-amber text-accent-foreground shadow-amber hover:opacity-90">
              Get started
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
