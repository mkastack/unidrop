import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ProductCard, ProductSkeleton, ProductCardData } from "@/components/marketplace/ProductCard";
import { CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function CategoryPage() {
  const { category: catParam } = useParams();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const category = CATEGORIES.find(c => c.value.toLowerCase() === catParam?.toLowerCase());

  useEffect(() => {
    if (!catParam) return;
    setLoading(true);
    supabase.from("products")
      .select("id,title,price,category,images,pickup_location,stock")
      .eq("status", "active")
      .eq("category", category?.value || catParam)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProducts((data ?? []) as ProductCardData[]);
        setLoading(false);
      });
  }, [catParam, category]);

  if (!category && !loading && products.length === 0) {
     return (
       <PublicLayout>
         <div className="container py-20 text-center">
           <h1 className="text-2xl font-bold">Category not found</h1>
           <Link to="/shop"><Button className="mt-4">Back to Shop</Button></Link>
         </div>
       </PublicLayout>
     );
  }

  return (
    <PublicLayout>
      <div className="bg-muted/30 border-b border-border/60 py-12">
        <div className="container">
          <Link to="/shop" className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2 text-sm font-medium transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Shop
          </Link>
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-amber text-slate-950 shadow-amber ring-2 ring-white/20">
               {category ? <category.icon className="h-7 w-7" /> : <Sparkles className="h-7 w-7" />}
            </span>
            <div>
              <h1 className="font-display text-4xl font-bold">{category?.label || catParam}</h1>
              <p className="text-muted-foreground mt-1 text-lg">Browse curated {category?.label.toLowerCase() || catParam} listings.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-10">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
            : products.length === 0
              ? <div className="col-span-full py-20 text-center">
                  <p className="text-muted-foreground text-lg">No products found in this category yet.</p>
                  <Link to="/shop"><Button variant="outline" className="mt-4">Explore other categories</Button></Link>
                </div>
              : products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </PublicLayout>
  );
}
