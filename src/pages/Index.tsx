import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, Truck, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ProductCard, ProductSkeleton, ProductCardData } from "@/components/marketplace/ProductCard";
import { CATEGORIES } from "@/lib/categories";
import { supabase } from "@/integrations/supabase/client";
import hero from "@/assets/hero-marketplace.jpg";

const Index = () => {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("products").select("id,title,price,category,images,pickup_location,stock")
      .eq("status", "active").order("created_at", { ascending: false }).limit(8)
      .then(({ data }) => { setProducts((data ?? []) as ProductCardData[]); setLoading(false); });
  }, []);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="bg-gradient-radial absolute inset-0" />
        <div className="container relative grid gap-10 py-16 md:grid-cols-2 md:py-24 lg:py-28">
          <div className="flex flex-col justify-center animate-fade-up">
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <Sparkles className="h-3 w-3" /> Built for campus life
            </span>
            <h1 className="font-display text-4xl font-bold leading-[1.05] text-balance md:text-5xl lg:text-6xl">
              Buy & sell <span className="text-accent">anything</span><br />
              right on your campus.
            </h1>
            <p className="mt-5 max-w-lg text-base text-primary-foreground/80 md:text-lg">
              From jollof to laptops to lecture notes — Tradie connects students for fast pickup or campus delivery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop">
                <Button size="lg" className="bg-gradient-amber text-accent-foreground shadow-amber hover:opacity-95">
                  Browse marketplace <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-primary-foreground/5 text-primary-foreground hover:bg-primary-foreground/10">
                  Start selling
                </Button>
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-primary-foreground/10 pt-6 text-sm">
              <div><div className="font-display text-2xl font-bold text-accent">2.4k+</div><div className="text-primary-foreground/60">Listings</div></div>
              <div><div className="font-display text-2xl font-bold text-accent">15min</div><div className="text-primary-foreground/60">Avg delivery</div></div>
              <div><div className="font-display text-2xl font-bold text-accent">500+</div><div className="text-primary-foreground/60">Sellers</div></div>
            </div>
          </div>
          <div className="relative animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <div className="absolute -inset-4 rounded-[2rem] bg-accent/20 blur-3xl" />
            <img src={hero} alt="Campus marketplace illustration" width={1600} height={1024}
              className="relative rounded-3xl shadow-elevate ring-1 ring-primary-foreground/10" />
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
            <Link key={c.value} to={`/shop?cat=${c.value}`}
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
            <h2 className="font-display text-2xl font-bold md:text-3xl">Fresh on Tradie</h2>
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
            <h2 className="font-display text-3xl font-bold">Why students love Tradie</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Zap, title: "Instant orders", desc: "Tap, pay, done. Sellers are notified the second you check out." },
              { icon: Truck, title: "Campus delivery", desc: "Student delivery agents bring it to your hostel, lab, or hall." },
              { icon: ShieldCheck, title: "Safe & verified", desc: "Every seller is a verified student. Reviews keep things honest." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
                <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-amber text-primary shadow-amber">
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
        <div className="overflow-hidden rounded-3xl bg-gradient-hero p-10 text-center text-primary-foreground shadow-elevate md:p-14">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Ready to start trading?</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/75">Join hundreds of students already buying and selling on Tradie.</p>
          <Link to="/auth"><Button size="lg" className="mt-7 bg-gradient-amber text-accent-foreground shadow-amber hover:opacity-95">Create your account</Button></Link>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Index;
