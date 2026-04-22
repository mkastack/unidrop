import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Store, ShoppingBag, Truck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_OPTIONS = [
  { value: "buyer", label: "Buyer", desc: "Browse and order from campus", icon: ShoppingBag },
  { value: "seller", label: "Seller", desc: "List products and earn", icon: Store },
  { value: "delivery", label: "Delivery Agent", desc: "Deliver orders, get paid", icon: Truck },
];

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"buyer" | "seller" | "delivery">("buyer");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate("/"); }, [user, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin, data: { name, role } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome to Tradie!");
    navigate("/");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate("/");
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden bg-gradient-hero p-12 text-primary-foreground md:flex md:flex-col md:justify-between">
        <div className="bg-gradient-radial absolute inset-0" />
        <Link to="/" className="relative flex items-center gap-2 font-display text-xl font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-amber text-primary"><Store className="h-5 w-5" /></span>
          Tradie
        </Link>
        <div className="relative">
          <h1 className="font-display text-4xl font-bold leading-tight">Your campus, your marketplace.</h1>
          <p className="mt-4 max-w-md text-primary-foreground/75">Join the fastest-growing student marketplace. Sell what you make, buy what you need.</p>
        </div>
        <div className="relative text-sm text-primary-foreground/60">© Tradie</div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-10">
        <Card className="w-full max-w-md border-border/60 p-6 shadow-card md:p-8">
          <div className="mb-6 text-center md:hidden">
            <Link to="/" className="inline-flex items-center gap-2 font-display text-xl font-bold">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-amber text-primary"><Store className="h-5 w-5" /></span>
              Tradie
            </Link>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="le">Email</Label>
                  <Input id="le" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@campus.edu" /></div>
                <div className="space-y-2"><Label htmlFor="lp">Password</Label>
                  <Input id="lp" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-amber text-accent-foreground shadow-amber hover:opacity-95">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="sn">Full name</Label>
                  <Input id="sn" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ama Mensah" /></div>
                <div className="space-y-2"><Label htmlFor="se">Email</Label>
                  <Input id="se" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@campus.edu" /></div>
                <div className="space-y-2"><Label htmlFor="sp">Password</Label>
                  <Input id="sp" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>

                <div className="space-y-2">
                  <Label>I'm joining as a…</Label>
                  <RadioGroup value={role} onValueChange={(v) => setRole(v as any)} className="grid gap-2">
                    {ROLE_OPTIONS.map((opt) => (
                      <Label key={opt.value} htmlFor={`r-${opt.value}`}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-colors ${
                          role === opt.value ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"}`}>
                        <RadioGroupItem id={`r-${opt.value}`} value={opt.value} className="sr-only" />
                        <span className={`grid h-9 w-9 place-items-center rounded-lg ${role === opt.value ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                          <opt.icon className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="text-sm font-semibold">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.desc}</div>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-gradient-amber text-accent-foreground shadow-amber hover:opacity-95">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
