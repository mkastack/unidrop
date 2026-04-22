import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ShoppingBag, Package, Bell, MapPin, Truck, Calendar, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatGHS } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NAV = [
  { to: "/dashboard/buyer", label: "Trace & Orders", icon: ShoppingBag },
  { to: "/shop", label: "Marketplace", icon: Package },
];

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
  placed: { label: "Order Placed", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Calendar },
  confirmed: { label: "Confirmed", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: Package },
  ready: { label: "Ready for Pickup", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: MapPin },
  picked_up: { label: "In Transit", color: "bg-primary/10 text-primary border-primary/20", icon: Truck },
  on_the_way: { label: "Out for Delivery", color: "bg-primary/20 text-primary border-primary/30", icon: Truck },
  delivered: { label: "Delivered", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: ShoppingBag },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive border-destructive/20", icon: Bell },
};

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from("orders")
        .select("*, products(title, images, price)")
        .eq("buyer_id", user.id).order("created_at", { ascending: false });
      
      if (error) throw error;
      setOrders(data ?? []);
    } catch (error: any) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (!user) return;
    
    const channel = supabase.channel("buyer-tracking")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `buyer_id=eq.${user.id}` }, load)
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <DashboardLayout title="Trace & Orders" navItems={NAV}>
      <div className="space-y-8 animate-fade-up">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">Hello, Shopping Maestro!</h2>
            <p className="text-muted-foreground">Track your orders and manage your campus purchases.</p>
          </div>
          <Link to="/shop">
            <Button className="bg-gradient-amber text-accent-foreground shadow-amber-lg">
              Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Orders Section */}
        <div className="space-y-4">
          <h3 className="font-display text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-accent" /> Active Tracking
          </h3>

          {loading ? (
            <div className="grid gap-4">
              {[1, 2].map((i) => <Card key={i} className="h-24 animate-pulse bg-muted/20" />)}
            </div>
          ) : orders.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-20 text-center border-dashed border-2">
              <div className="h-16 w-16 rounded-full bg-muted grid place-items-center mb-4 text-muted-foreground">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h4 className="text-lg font-bold italic">"No packages on the way?"</h4>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1 mb-6">
                Your order history is empty. Time to discover something fresh on campus!
              </p>
              <Link to="/shop">
                <Button variant="outline" className="rounded-full px-8">Visit Shop</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-4">
              {orders.map((o) => {
                const config = STATUS_CONFIG[o.status] || STATUS_CONFIG.placed;
                const StatusIcon = config.icon;
                
                return (
                  <Card key={o.id} className="overflow-hidden border-border/40 hover:border-accent/40 transition-all group shadow-sm ring-1 ring-black/5 hover:ring-accent/20">
                    <div className="flex flex-col md:flex-row items-center gap-6 p-5">
                      {/* Product View */}
                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-muted ring-1 ring-border shadow-sm">
                        {o.products?.images?.[0] ? (
                          <img src={o.products.images[0]} alt={o.products.title} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                        ) : (
                          <div className="grid h-full place-items-center"><Package className="h-8 w-8 text-muted-foreground" /></div>
                        )}
                      </div>

                      {/* Info View */}
                      <div className="flex-1 text-center md:text-left">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center justify-center md:justify-start gap-2">
                          Order #{o.id.slice(0, 8)} <span className="h-1 w-1 rounded-full bg-muted-foreground/30" /> {o.created_at ? new Date(o.created_at).toLocaleDateString() : "Pending"}
                        </div>
                        <h4 className="font-display text-xl font-bold group-hover:text-accent transition-colors">{o.products?.title || "Product"}</h4>
                        <div className="flex items-center justify-center md:justify-start gap-4 mt-1 text-sm font-medium">
                          <span className="text-foreground">Qty: {o.quantity || 1}</span>
                          <span className="text-accent">{formatGHS(Number(o.total_price || 0))}</span>
                        </div>
                      </div>

                      {/* Status View */}
                      <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-3 px-4 py-2 border-t md:border-t-0 md:border-l border-border/40">
                        <Badge variant="outline" className={`h-10 px-4 rounded-full text-xs font-bold gap-2 ${config.color}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {config.label}
                        </Badge>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {o.delivery_type === 'self_pickup' ? 'Self Pickup' : `Delivery to ${o.hall_location || "selected hall"}`}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
