import { useState, useRef, useEffect } from "react";
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

export default function Cart() {
  const cart = useCart();
  const { user, primaryRole } = useAuth();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<"campus_delivery" | "self_pickup">("self_pickup");
  const [placing, setPlacing] = useState(false);

  const cartRef = useRef(cart);
  const userRef = useRef(user);

  useEffect(() => {
    cartRef.current = cart;
    userRef.current = user;
  }, [cart, user]);

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const deliveryFee = delivery === "campus_delivery" ? 5 : 0;
  const total = subtotal + deliveryFee;

  const paystackConfig = {
    email: user?.email || "",
    amount: Math.round(total * 100),
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder",
    currency: "GHS",
  };

  const initializePayment = usePaystackPayment(paystackConfig);

  const onSuccess = (reference: any) => {
    console.log("Paystack Success:", reference);
    handleCheckoutSuccess();
  };

  const onClose = () => {
    setPlacing(false);
    toast.error("Payment cancelled");
  };

  const handleCheckoutSuccess = async () => {
    const currentUser = userRef.current;
    const currentCart = cartRef.current;

    if (!currentUser || currentCart.length === 0) {
      toast.error("Critical error: Order details lost. Please contact support.");
      return;
    }

    setPlacing(true);
    const loadingToast = toast.loading("Finalizing your order... Please do not close this page.");

    try {
      const hall = localStorage.getItem("unidrop:location") || "Main Campus";
      const inserts = currentCart.map((item) => ({
        buyer_id: currentUser.id,
        seller_id: item.sellerId,
        product_id: item.productId,
        quantity: item.quantity,
        total_price: item.price * item.quantity + (delivery === "campus_delivery" ? 5 / currentCart.length : 0),
        delivery_type: delivery,
        hall_location: hall,
        status: "placed" as const,
      }));

      const { data: created, error } = await (supabase.from("orders") as any).insert(inserts).select("id");
      
      if (error) throw error;
      if (!created || created.length === 0) throw new Error("Order not saved.");

      const orderIds = created.map((o: any) => o.id);
      
      // Clear cart immediately after DB success
      console.log("Order saved. Clearing cart...");
      clearCart();

      // Background tasks (non-blocking)
      try {
        if (delivery === "campus_delivery") {
          orderIds.forEach((id: string) => supabase.rpc("assign_random_delivery_agent", { _order_id: id }));
        }
        const sellers = Array.from(new Set(currentCart.map((c) => c.sellerId)));
        supabase.from("notifications").insert(sellers.map((sid) => ({ user_id: sid, message: "New order! 🎉" })));
      } catch (bgError) { console.warn("Background task error:", bgError); }

      toast.dismiss(loadingToast);
      toast.success("Success! Redirecting...");
      
      // Force hard redirect to be 100% sure
      setTimeout(() => {
        window.location.href = `/order-success?ids=${orderIds.join(",")}`;
      }, 500);

    } catch (e: any) {
      toast.dismiss(loadingToast);
      console.error("Critical Failure:", e);
      toast.error(`Order Placement Error: ${e.message}. Your payment was successful, please contact support.`);
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
                  // Sellers are allowed to buy too
                  if (!user) { navigate("/auth"); return; }
                  
                  if (!paystackConfig.email || paystackConfig.publicKey === "pk_test_placeholder") {
                    toast.error("Payment setup incomplete. Please contact support.");
                    console.error("Missing Paystack config:", paystackConfig);
                    return;
                  }

                  // @ts-ignore
                  initializePayment(onSuccess, onClose);
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
