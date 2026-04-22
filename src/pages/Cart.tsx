import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useCart, removeFromCart, formatGHS, clearCart } from "@/lib/cart";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Truck, MapPin, Loader2, CreditCard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { usePaystackPayment } from "react-paystack";
import { getPaystackConfig } from "@/lib/paystack";

export default function Cart() {
  const cart = useCart();
  const { user, primaryRole } = useAuth();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<"campus_delivery" | "self_pickup">("self_pickup");
  const [placing, setPlacing] = useState(false);

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const deliveryFee = delivery === "campus_delivery" ? 5 : 0;
  const total = subtotal + deliveryFee;

  const config = getPaystackConfig(user?.email || "", total, (ref) => {
    checkout();
  });
  const initializePayment = usePaystackPayment(config);

  const checkout = async () => {
    if (!user) { navigate("/auth"); return; }
    if (primaryRole === "seller") { toast.error("Sellers can't place orders. Switch accounts to buy."); return; }
    setPlacing(true);
    try {
      const inserts = cart.map((item) => ({
        buyer_id: user.id,
        seller_id: item.sellerId,
        product_id: item.productId,
        quantity: item.quantity,
        total_price: item.price * item.quantity + (delivery === "campus_delivery" ? 5 / cart.length : 0),
        delivery_type: delivery,
        status: "placed" as const,
      }));
      const { error } = await supabase.from("orders").insert(inserts);
      if (error) throw error;

      // Auto-assign delivery agent for campus delivery orders
      if (delivery === "campus_delivery") {
        const { data: created } = await supabase.from("orders")
          .select("id").eq("buyer_id", user.id)
          .order("created_at", { ascending: false }).limit(cart.length);
        if (created) {
          await Promise.all(created.map((o: any) =>
            supabase.rpc("assign_random_delivery_agent", { _order_id: o.id })
          ));
        }
      }

      // Notify each seller (one per unique seller)
      const sellers = Array.from(new Set(cart.map((c) => c.sellerId)));
      await supabase.from("notifications").insert(
        sellers.map((sid) => ({ user_id: sid, message: "You have a new order on CampusMarkt 🎉" }))
      );

      clearCart();
      toast.success("Order placed! Sellers have been notified.");
      navigate("/dashboard/buyer");
    } catch (e: any) {
      toast.error(e.message ?? "Could not place order");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <PublicLayout>
      <div className="container py-10">
        <h1 className="mb-8 font-display text-3xl font-bold">Your cart</h1>

        {cart.length === 0 ? (
          <Card className="p-16 text-center">
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Button onClick={() => navigate("/shop")} className="mt-4 bg-gradient-amber text-accent-foreground shadow-amber">Start shopping</Button>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-3">
              {cart.map((item) => (
                <Card key={item.productId} className="flex items-center gap-4 p-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {item.image && <img src={item.image} alt={item.title} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-display font-semibold">{item.title}</div>
                    <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-bold">{formatGHS(item.price * item.quantity)}</div>
                    <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.productId)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="h-fit space-y-5 p-6 shadow-card">
              <h2 className="font-display text-lg font-semibold">Order summary</h2>

              <div>
                <Label className="mb-2 block">Delivery option</Label>
                <RadioGroup value={delivery} onValueChange={(v) => setDelivery(v as any)} className="space-y-2">
                  <Label htmlFor="d-pick" className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 ${delivery === "self_pickup" ? "border-accent bg-accent/5" : "border-border"}`}>
                    <RadioGroupItem id="d-pick" value="self_pickup" className="sr-only" />
                    <MapPin className="h-4 w-4" /><div className="text-sm"><div className="font-medium">Self pickup</div><div className="text-muted-foreground">Free</div></div>
                  </Label>
                  <Label htmlFor="d-del" className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 ${delivery === "campus_delivery" ? "border-accent bg-accent/5" : "border-border"}`}>
                    <RadioGroupItem id="d-del" value="campus_delivery" className="sr-only" />
                    <Truck className="h-4 w-4" /><div className="text-sm"><div className="font-medium">Campus delivery</div><div className="text-muted-foreground">{formatGHS(5)}</div></div>
                  </Label>
                </RadioGroup>
              </div>

              <div className="space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatGHS(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{formatGHS(deliveryFee)}</span></div>
                <div className="flex justify-between border-t border-border pt-2 font-display text-lg font-bold"><span>Total</span><span>{formatGHS(total)}</span></div>
              </div>

              <Button 
                onClick={() => {
                  if (!user) { navigate("/auth"); return; }
                  if (primaryRole === "seller") { toast.error("Sellers can't place orders."); return; }
                  // @ts-ignore
                  initializePayment();
                }} 
                disabled={placing} 
                size="lg" 
                className="w-full bg-gradient-amber text-accent-foreground shadow-amber hover:opacity-95"
              >
                {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <><CreditCard className="mr-2 h-4 w-4" /> Pay & Place Order</>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Secured by Paystack
              </p>
            </Card>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
