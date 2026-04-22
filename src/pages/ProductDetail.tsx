import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { addToCart, formatGHS } from "@/lib/cart";
import { MapPin, ShoppingCart, ArrowLeft, Store } from "lucide-react";
import { toast } from "sonner";
import { optimizeImage } from "@/lib/images";
import { Reviews } from "@/components/marketplace/Reviews";

interface Product {
  id: string; title: string; description: string | null; price: number;
  category: string; images: string[]; stock: number; pickup_location: string | null;
  seller_id: string; profiles?: { name: string | null } | null;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      setProduct(data as Product);
      if (data?.seller_id) {
        const { data: p } = await supabase.from("profiles").select("name").eq("id", data.seller_id).maybeSingle();
        setSeller(p?.name ?? "Seller");
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <PublicLayout><div className="container py-20 text-center text-muted-foreground">Loading…</div></PublicLayout>;
  if (!product) return <PublicLayout><div className="container py-20 text-center">Product not found.</div></PublicLayout>;

  const handleAdd = () => {
    addToCart({
      productId: product.id, title: product.title, price: Number(product.price),
      image: product.images?.[0], sellerId: product.seller_id, quantity: 1,
    });
    toast.success("Added to cart");
  };

  const mainImg = optimizeImage(product.images?.[0], 1000);

  return (
    <PublicLayout>
      <div className="container py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl bg-muted shadow-card">
            {product.images?.[0] ? (
              <img src={mainImg} alt={product.title} className="aspect-square w-full object-cover" />
            ) : (
              <div className="grid aspect-square place-items-center text-muted-foreground">No image</div>
            )}
          </div>

          <div className="flex flex-col">
            <Badge className="w-fit bg-accent/15 text-accent-foreground">{product.category}</Badge>
            <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">{product.title}</h1>
            <div className="mt-4 font-display text-3xl font-bold text-foreground">{formatGHS(Number(product.price))}</div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Store className="h-4 w-4" /> Sold by <span className="font-medium text-foreground">{seller}</span>
              </div>
              {product.pickup_location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" /> Pickup: <span className="font-medium text-foreground">{product.pickup_location}</span>
                </div>
              )}
              <div className="text-muted-foreground">{product.stock} in stock</div>
            </div>

            <p className="mt-6 leading-relaxed text-muted-foreground">{product.description || "No description provided."}</p>

            <Button size="lg" onClick={handleAdd} disabled={product.stock < 1}
              className="mt-8 w-full bg-gradient-amber text-accent-foreground shadow-amber hover:opacity-95 sm:w-fit">
              <ShoppingCart className="mr-2 h-4 w-4" /> Add to cart
            </Button>
          </div>
        </div>

        <Reviews productId={product.id} sellerId={product.seller_id} />
      </div>
    </PublicLayout>
  );
}
