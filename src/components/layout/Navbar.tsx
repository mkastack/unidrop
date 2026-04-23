import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Store, User, Sun, Moon, LogOut, Bell, Menu, Search, PackageSearch, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CAMPUS_HALLS } from "@/lib/locations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/lib/cart";
import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/category/Food", label: "Food" },
  { to: "/category/Provisions", label: "Provisions" },
  { to: "/category/Electronics", label: "Electronics" },
  { to: "/category/Accessories", label: "Accessories" },
];

const dashboardPath = (role: string | null) => {
  switch (role) {
    case "seller": return "/dashboard/seller";
    case "delivery": return "/dashboard/delivery";
    case "admin": return "/dashboard/admin";
    default: return "/dashboard/buyer";
  }
};

export function Navbar() {
  const { user, primaryRole, signOut, refreshRoles } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentHall, setCurrentHall] = useState<string>(localStorage.getItem("unidrop:location") || "Select Hall");
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);

  useEffect(() => {
    if (search.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const { data } = await supabase.from("products")
        .select("id, title, price, images")
        .ilike("title", `%${search}%`)
        .eq("status", "active")
        .limit(5);
      setSearchResults(data ?? []);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const saveLocation = (hall: string) => {
    setCurrentHall(hall);
    localStorage.setItem("unidrop:location", hall);
    setIsLocModalOpen(false);
    toast.success(`Location set to ${hall}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setSearchResults([]);
    navigate(`/shop?q=${encodeURIComponent(search)}`);
  };

  useEffect(() => {
    const stored = localStorage.getItem("unidrop:theme");
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("unidrop:theme", next ? "dark" : "light");
  };

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 border-b ${
      isScrolled 
        ? "border-border/60 bg-background/80 backdrop-blur-xl py-0" 
        : "border-transparent bg-transparent py-2 shadow-none"
      }`}>
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-amber text-slate-950 shadow-amber">
              <Store className="h-5 w-5" />
            </span>
            <span className={`hidden sm:inline transition-colors duration-300 ${(!isScrolled && location.pathname === "/") ? (dark ? "text-white" : "text-slate-900") : "text-foreground"}`}>UniDrop</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === link.to 
                    ? "text-accent font-bold" 
                    : (!isScrolled && location.pathname === "/" ? (dark ? "text-white/80 hover:text-white" : "text-slate-600 hover:text-slate-900") : "text-muted-foreground hover:text-foreground")
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Search Bar - Center on mobile, Right-ish on desktop */}
        <div className="flex-1 max-w-md mx-2 lg:mx-0 lg:max-w-none lg:flex lg:items-center lg:gap-2">
          <div className="relative w-full lg:w-auto">
            <form onSubmit={handleSearch} className="group relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground group-focus-within:text-accent transition-colors" />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search campus..." 
                className="h-9 w-full lg:w-[180px] xl:w-[240px] rounded-full border-border/40 bg-muted/60 pl-9 pr-3 text-[11px] font-medium lg:focus:w-[240px] xl:focus:w-[320px] focus:bg-background focus:ring-accent/20 transition-all shadow-inner placeholder:text-muted-foreground/80"
              />
            </form>

            {/* Quick Search Results Dropdown */}
            {(searchResults.length > 0 || isSearching) && (
              <div className="absolute top-full left-0 mt-2 w-full lg:w-[300px] rounded-2xl border border-border bg-background p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-50">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">Searching campus...</div>
                ) : (
                  searchResults.map((p) => (
                    <Link 
                      key={p.id} 
                      to={`/product/${p.id}`}
                      onClick={() => setSearch("")}
                      className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted transition-colors"
                    >
                      <div className="h-10 w-10 overflow-hidden rounded-lg bg-muted">
                        {p.images?.[0] && <img src={p.images[0]} className="h-full w-full object-cover" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold truncate max-w-[180px]">{p.title}</div>
                        <div className="text-[10px] text-accent font-semibold">GHS {p.price}</div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
          
          {/* Location Picker - Desktop only in this spot */}
          <div className="hidden lg:block">
            {(primaryRole === "buyer" || !user) && (
              <Dialog open={isLocModalOpen} onOpenChange={setIsLocModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 gap-1.5 rounded-full border border-border/40 bg-muted/30 px-3 text-xs hover:bg-muted">
                    <MapPin className="h-3.5 w-3.5 text-accent" />
                    <span className="max-w-[80px] truncate">{currentHall}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Select your Hall / Hostel</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto py-4">
                    {CAMPUS_HALLS.map((hall) => (
                      <Button 
                        key={hall} 
                        variant={currentHall === hall ? "default" : "outline"} 
                        onClick={() => saveLocation(hall)}
                        className="justify-start text-left"
                      >
                        {hall}
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-1.5 md:flex-none">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="hidden sm:inline-flex">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon" aria-label="Cart">
              <ShoppingCart className="h-4 w-4" />
            </Button>
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground animate-pulse">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <>
              <Link to="/notifications" className="hidden sm:inline-flex">
                <Button variant="ghost" size="icon" aria-label="Notifications"><Bell className="h-4 w-4" /></Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon"><User className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal text-xs">
                    <div className="font-medium text-foreground">{user.email}</div>
                    <div className="capitalize text-muted-foreground mt-0.5">{primaryRole}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(dashboardPath(primaryRole))}>
                    <Store className="mr-2 h-4 w-4" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/dashboard/buyer")}>
                    <PackageSearch className="mr-2 h-4 w-4" /> Trace & Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/notifications")} className="sm:hidden">Notifications</DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleTheme} className="sm:hidden">
                    {dark ? "Light Mode" : "Dark Mode"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => { await signOut(); navigate("/"); }} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={() => navigate("/auth")} className="bg-gradient-amber text-accent-foreground shadow-amber hover:opacity-90 hidden sm:inline-flex">
              Login
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px]">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-2 font-display text-xl">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-amber text-slate-950">
                    <Store className="h-4 w-4" />
                  </span>
                  UniDrop
                </SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-2">
                <div className="flex items-center justify-between mb-4">
                  {(primaryRole === "buyer" || !user) && (
                    <Dialog open={isLocModalOpen} onOpenChange={setIsLocModalOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-10 flex-1 gap-2 rounded-xl text-sm justify-start px-4">
                          <MapPin className="h-4 w-4 text-accent" />
                          <span className="truncate">{currentHall}</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Select your Hall / Hostel</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto py-4">
                          {CAMPUS_HALLS.map((hall) => (
                            <Button 
                              key={hall} 
                              variant={currentHall === hall ? "default" : "outline"} 
                              onClick={() => saveLocation(hall)}
                              className="justify-start text-left"
                            >
                              {hall}
                            </Button>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`rounded-lg px-4 py-3 text-lg font-medium transition-colors hover:bg-muted ${
                      location.pathname === link.to ? "bg-accent/10 text-accent font-bold" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {!user && (
                  <Button onClick={() => navigate("/auth")} className="mt-4 bg-gradient-amber text-accent-foreground w-full">
                    Get Started
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
