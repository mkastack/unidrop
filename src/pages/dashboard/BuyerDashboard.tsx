import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ShoppingBag, Package, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatGHS } from "@/lib/cart";

const NAV = [
  { to: "/dashboard/buyer", label: "My orders", icon: ShoppingBag },
  { to: "/shop", label: "Browse shop", icon: Package },
  { to: "/notifications", label: "Notifications", icon: Heart },
];

const STATUS_LABEL: Record<string, string> = {
  placed: "Placed", confirmed: "Confirmed", ready: "Ready for pickup",
  picked_up: "Picked up", on_the_way: "On the way", delivered: "Delivered", cancelled: "Cancelled",
};
const STATUS_TONE: Record<string, string> = {
  placed: "bg-muted text-foreground", confirmed: "bg-accent/15 text-accent-foreground",
  ready: "bg-accent/25 text-accent-foreground", picked_up: "bg-primary/15 text-primary",
  on_the_way: "bg-primary/25 text-primary", delivered: "bg-success/15 text-success",
  cancelled: "bg-destructive/15 text-destructive",
};

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("orders")
        .select("*, products(title, images)")
        .eq("buyer_id", user.id).order("created_at", { ascending: false });
      setOrders(data ?? []);
    };
    load();
    const channel = supabase.channel("buyer-orders")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `buyer_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <DashboardLayout title="My Orders" navItems={NAV}>
      {orders.length === 0 ? (
        <Card className="p-16 text-center text-muted-foreground">You haven't placed any orders yet.</Card>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Card key={o.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="h-16 w-16 overflow-hidden rounded-xl bg-muted">
                {o.products?.images?.[0] && <img src={o.products.images[0]} alt={o.products?.title} className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="font-display font-semibold">{o.products?.title ?? "Product"}</div>
                <div className="text-xs text-muted-foreground">Qty {o.quantity} · {new Date(o.created_at).toLocaleDateString()}</div>
              </div>
              <div className="font-display font-bold">{formatGHS(Number(o.total_price))}</div>
              <Badge className={STATUS_TONE[o.status] ?? "bg-muted"}>{STATUS_LABEL[o.status]}</Badge>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
