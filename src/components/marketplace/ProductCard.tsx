import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { formatGHS } from "@/lib/cart";
import { optimizeImage } from "@/lib/images";

export interface ProductCardData {
  id: string;
  title: string;
  price: number;
  category: string;
  images: string[];
  pickup_location?: string | null;
  stock: number;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const img = optimizeImage(product.images?.[0], 600);
  return (
    <Link to={`/product/${product.id}`} className="group">
      <Card className="overflow-hidden border-border/60 bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {product.images?.[0] ? (
            <img src={img} alt={product.title} loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="grid h-full place-items-center text-muted-foreground">No image</div>
          )}
          <Badge className="absolute left-3 top-3 bg-background/90 text-foreground backdrop-blur">
            {product.category}
          </Badge>
        </div>
        <div className="space-y-2 p-4">
          <h3 className="line-clamp-1 font-display font-semibold">{product.title}</h3>
          {product.pickup_location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {product.pickup_location}
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="font-display text-lg font-bold text-foreground">{formatGHS(product.price)}</span>
            <span className="text-xs text-muted-foreground">{product.stock} left</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function ProductSkeleton() {
  return (
    <Card className="overflow-hidden border-border/60">
      <div className="skeleton aspect-[4/3]" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-5 w-1/3 rounded" />
      </div>
    </Card>
  );
}
