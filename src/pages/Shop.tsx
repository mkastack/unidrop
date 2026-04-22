import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ProductCard, ProductSkeleton, ProductCardData } from "@/components/marketplace/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/categories";
import { Search } from "lucide-react";

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const initialCat = params.get("cat") ?? "All";
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(initialCat);

  useEffect(() => {
    setLoading(true);
    let q = supabase.from("products").select("id,title,price,category,images,pickup_location,stock").eq("status", "active");
    if (category !== "All") q = q.eq("category", category);
    q.order("created_at", { ascending: false }).then(({ data }) => {
      setProducts((data ?? []) as ProductCardData[]);
      setLoading(false);
    });
  }, [category]);

  useEffect(() => {
    if (category === "All") params.delete("cat"); else params.set("cat", category);
    setParams(params, { replace: true });
  }, [category]);

  const filtered = useMemo(
    () => products.filter((p) => p.title.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  return (
    <PublicLayout>
      <section className="border-b border-border/60 bg-muted/30 py-10">
        <div className="container">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Marketplace</h1>
          <p className="mt-1 text-muted-foreground">Discover what fellow students are selling today.</p>
          <div className="relative mt-6 max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…" className="h-12 pl-10" />
          </div>
        </div>
      </section>

      <section className="container py-8">
        <div className="mb-6 flex flex-wrap gap-2">
          <Button variant={category === "All" ? "default" : "outline"} size="sm"
            className={category === "All" ? "bg-primary text-primary-foreground" : ""}
            onClick={() => setCategory("All")}>All</Button>
          {CATEGORIES.map((c) => (
            <Button key={c.value} variant={category === c.value ? "default" : "outline"} size="sm"
              className={category === c.value ? "bg-primary text-primary-foreground" : ""}
              onClick={() => setCategory(c.value)}>
              <c.icon className="mr-1.5 h-3.5 w-3.5" /> {c.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
            : filtered.length === 0
              ? <p className="col-span-full py-16 text-center text-muted-foreground">No products match.</p>
              : filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </PublicLayout>
  );
}
