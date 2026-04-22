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
import authSide from "@/assets/auth-side.jpg";

const ROLE_OPTIONS = [
  { value: "buyer", label: "Buyer", desc: "Browse and order from campus", icon: ShoppingBag },
  { value: "seller", label: "Seller", desc: "List products and earn", icon: Store },
  { value: "delivery", label: "Delivery Agent", desc: "Deliver orders, get paid", icon: Truck },
];

export default function Auth() {
  const navigate = useNavigate();
  const { user, refreshRoles } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"buyer" | "seller" | "delivery">("buyer");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!key || key.includes("PASTE_YOUR")) {
      toast.error("Supabase API Key is missing! Please check your .env file.", { duration: 10000 });
    }
  }, []);

  useEffect(() => { if (user) navigate("/"); }, [user, navigate]);

  const dashboardPath = (role: string) => {
    switch (role) {
      case "seller": return "/dashboard/seller";
      case "delivery": return "/dashboard/delivery";
      default: return "/";
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, data } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin, data: { name, role } },
    });
    
    if (!error && data.user) {
      await supabase.from("user_roles").insert({ user_id: data.user.id, role });
      await refreshRoles();
    }

    setLoading(false);
    if (error) {
      if (error.message.includes("rate limit")) {
        toast.error("Signup Busy: Supabase limits reached.", {
          description: "Tip: Go to your Supabase Dashboard > Auth > Settings and increase the 'Max Signups per Hour' to 100.",
          duration: 6000,
        });
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Welcome to UniDrop! 🎉");
    navigate(dashboardPath(role));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }
    
    await refreshRoles();
    const { data: profile } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).single();
    setLoading(false);
    toast.success("Welcome back!");
    navigate(dashboardPath(profile?.role || "buyer"));
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Content - Hidden on mobile */}
      <div className="relative hidden w-1/2 overflow-hidden bg-primary md:flex">
        <div 
          className="absolute inset-0 z-0 animate-pulse duration-[10s]"
          style={{ 
            backgroundImage: `url(${authSide})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center',
            filter: 'brightness(0.5) contrast(1.1)'
          }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-primary via-primary/50 to-transparent" />
        
        <div className="relative z-10 flex h-full w-full flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2 font-display text-3xl font-bold text-white group">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-amber text-primary shadow-amber group-hover:scale-110 transition-transform">
              <Store className="h-6 w-6" />
            </span>
            UniDrop
          </Link>
          
          <div className="max-w-md">
            <div className="mb-4 inline-block rounded-full bg-accent/20 px-4 py-1 text-xs font-bold uppercase tracking-widest text-accent backdrop-blur-md italic">
              Verified Student Network
            </div>
            <h2 className="font-display text-5xl font-extrabold leading-tight text-white mb-6">
              Empowering <span className="text-accent underline decoration-accent/30 underline-offset-8">Campus</span> Economies.
            </h2>
            <div className="text-xl text-white/80 font-medium">
              Join the elite circle of student traders on UniDrop
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-8 mt-12">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-primary bg-muted/20 backdrop-blur-sm" />
                ))}
              </div>
              <div className="text-xs font-bold text-white/60">5,000+ Students Already Joined</div>
            </div>
            <div className="relative z-10 text-sm text-primary-foreground/60 italic font-bold">
              © UniDrop
            </div>
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex w-full flex-col p-8 md:w-[500px]">
        <div className="mb-10 text-center md:hidden">
          <Link to="/" className="inline-flex items-center gap-2 font-display text-2xl font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-amber text-primary">
              <Store className="h-5 w-5" />
            </span>
            UniDrop
          </Link>
        </div>
        <Card className="w-full max-w-md border-border/60 p-6 shadow-card md:p-8">
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
