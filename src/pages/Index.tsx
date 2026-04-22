import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, Truck, ShieldCheck, Zap, Sparkles, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ProductCard, ProductSkeleton, ProductCardData } from "@/components/marketplace/ProductCard";
import { CATEGORIES } from "@/lib/categories";
import { supabase } from "@/integrations/supabase/client";
import hero from "@/assets/hero-campus.png";

const Index = () => {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/shop?q=${encodeURIComponent(search)}`);
  };

  useEffect(() => {
    supabase.from("products").select("id,title,price,category,images,pickup_location,stock")
      .eq("status", "active").order("created_at", { ascending: false }).limit(8)
      .then(({ data }) => { setProducts((data ?? []) as ProductCardData[]); setLoading(false); });
  }, []);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden text-primary-foreground bg-slate-950">
        {/* Cinematic Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{ 
            backgroundImage: `url(${hero})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'brightness(0.35) contrast(1.1)'
          }}
        />
        {/* Modern Gradient Overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-transparent" />
        
        <div className="container relative z-10 py-20 md:py-32 lg:py-40 text-center md:text-left">
          <div className="max-w-3xl animate-fade-up">
            <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-accent shadow-2xl backdrop-blur-xl ring-1 ring-white/20 animate-fade-in">
              <Sparkles className="h-4 w-4 animate-pulse text-accent-foreground" />
              Ghana's #1 University Marketplace
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl">
              Trading <span className="text-amber-500 underline decoration-amber-500/30 underline-offset-8">Simplified</span><br />
              for Students.
            </h1>
            <p className="mt-8 max-w-xl text-lg text-white/80 md:text-2xl leading-relaxed">
              Buy food, gadgets, and books instantly, or start earning by selling within your campus community today!
            </p>

            <div className="mt-12 flex flex-wrap gap-5">
              <Link to="/shop">
                <Button size="lg" className="h-16 px-10 bg-gradient-amber text-xl font-bold text-accent-foreground shadow-amber-lg hover:scale-105 transition-all duration-300">
                  Shop Now <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="h-16 px-10 border-white/30 bg-white/10 text-xl font-bold text-white backdrop-blur-md hover:bg-white/20 transition-all">
                  Join as Seller
                </Button>
              </Link>
            </div>
            <div className="mt-16 grid grid-cols-3 gap-12 border-t border-white/10 pt-10">
              <div><div className="font-display text-4xl font-bold text-accent">25k+</div><div className="text-sm font-medium uppercase tracking-widest text-white/50 mt-1">Trades Done</div></div>
              <div><div className="font-display text-4xl font-bold text-accent">10m</div><div className="text-sm font-medium uppercase tracking-widest text-white/50 mt-1">Avg Delivery</div></div>
              <div><div className="font-display text-4xl font-bold text-accent">100%</div><div className="text-sm font-medium uppercase tracking-widest text-white/50 mt-1">Safe Trade</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">Shop by category</h2>
            <p className="mt-1 text-sm text-muted-foreground">Find what you need, faster.</p>
          </div>
          <Link to="/shop" className="hidden text-sm font-medium text-accent hover:underline md:inline">View all →</Link>
        </div>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {CATEGORIES.map((c) => (
            <Link key={c.value} to={`/category/${c.value}`}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card p-5 text-center shadow-soft transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-card">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <c.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">Fresh on UniDrop</h2>
            <p className="mt-1 text-sm text-muted-foreground">Latest listings from your campus.</p>
          </div>
          <Link to="/shop"><Button variant="ghost">See all</Button></Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
            : products.length === 0
              ? <p className="col-span-full py-12 text-center text-muted-foreground">No listings yet — be the first to post!</p>
              : products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/40 py-16">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold">Why students love UniDrop</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Zap, title: "Instant orders", desc: "Tap, pay, done. Sellers are notified the second you check out." },
              { icon: Truck, title: "Campus delivery", desc: "Student delivery agents bring it to your hostel, lab, or hall." },
              { icon: ShieldCheck, title: "Safe & verified", desc: "Every seller is a verified student. Reviews keep things honest." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all group">
                <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-amber text-slate-950 shadow-amber group-hover:scale-110 transition-transform">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16">
        <div className="overflow-hidden rounded-3xl bg-gradient-hero p-10 text-center text-white shadow-elevate md:p-14">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Ready to start trading?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">Join hundreds of students already buying and selling on UniDrop.</p>
          <Link to="/auth"><Button size="lg" className="mt-7 bg-gradient-amber text-slate-950 font-bold shadow-amber hover:opacity-95">Create your account</Button></Link>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Index;
