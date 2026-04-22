import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  buyer_id: string;
}

export function Reviews({ productId, sellerId }: { productId: string; sellerId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [canReview, setCanReview] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("reviews").select("*").eq("product_id", productId).order("created_at", { ascending: false });
    const list = (data ?? []) as Review[];
    setReviews(list);
    const ids = Array.from(new Set(list.map((r) => r.buyer_id)));
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id,name").in("id", ids);
      setAuthorNames(Object.fromEntries((ps ?? []).map((p: any) => [p.id, p.name ?? "Student"])));
    }
  };

  useEffect(() => { load(); }, [productId]);

  useEffect(() => {
    if (!user) { setCanReview(false); return; }
    (async () => {
      const { data } = await supabase.from("orders")
        .select("id").eq("buyer_id", user.id).eq("product_id", productId).eq("status", "delivered").limit(1);
      setCanReview((data ?? []).length > 0);
    })();
  }, [user, productId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("reviews").insert({
      buyer_id: user.id, seller_id: sellerId, product_id: productId, rating, comment,
    });
    if (error) return toast.error(error.message);
    toast.success("Review posted");
    setComment(""); setRating(5);
    load();
  };

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="font-display text-xl font-bold">Reviews</h2>
        {reviews.length > 0 && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-accent text-accent" /> {avg.toFixed(1)} · {reviews.length}
          </span>
        )}
      </div>

      {canReview && (
        <Card className="mb-4 p-4">
          <form onSubmit={submit} className="space-y-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)}>
                  <Star className={`h-6 w-6 ${n <= rating ? "fill-accent text-accent" : "text-muted"}`} />
                </button>
              ))}
            </div>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience…" required />
            <Button type="submit" className="bg-gradient-amber text-accent-foreground shadow-amber">Post review</Button>
          </form>
        </Card>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">{authorNames[r.buyer_id] ?? "Student"}</div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-accent text-accent" : "text-muted"}`} />
                  ))}
                </div>
              </div>
              {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
