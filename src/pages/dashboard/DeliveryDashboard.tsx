import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Truck, CheckCircle2, Power, MapPin, Package, Clock, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { formatGHS } from "@/lib/cart";
import { toast } from "sonner";

const NAV = [
  { to: "/dashboard/delivery", label: "My Tasks", icon: Truck },
  { to: "/dashboard/delivery?tab=history", label: "History", icon: CheckCircle2 },
];

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [online, setOnline] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("orders")
      .select("*, products(title, pickup_location)")
      .eq("delivery_agent_id", user.id).order("created_at", { ascending: false });
    setOrders(data ?? []);
  };
  
  useEffect(() => {
    load();
    if (!user) return;

    const sub = supabase.channel("delivery-jobs")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `delivery_agent_id=eq.${user.id}` }, () => {
        load();
        toast("New shift update! Check your tasks.");
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [user]);

  const update = async (id: string, status: any) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Trip status: ${status.replace('_', ' ')}`);
    load();
  };

  const active = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const done = orders.filter((o) => o.status === "delivered");
  const earned = done.reduce((s, o) => s + Number(o.total_price) * 0.1, 0); // 10% delivery fee mockup

  return (
    <DashboardLayout title="Agent Workspace" navItems={NAV}>
      <div className="space-y-8 animate-fade-up">
        {/* Header Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass relative overflow-hidden p-6 border-l-4 border-l-success">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Status</div>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full animate-pulse ${online ? "bg-success" : "bg-muted"}`} />
                  <span className="font-display text-xl font-bold">{online ? "Accepting Jobs" : "Offline"}</span>
                </div>
              </div>
              <Switch checked={online} onCheckedChange={setOnline} className="data-[state=checked]:bg-success" />
            </div>
          </Card>

          <Card className="glass p-6 border-l-4 border-l-accent">
            <div className="flex items-center gap-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent"><CheckCircle2 className="h-5 w-5" /></span>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Deliveries</div>
                <div className="font-display text-2xl font-bold">{done.length}</div>
              </div>
            </div>
          </Card>

          <Card className="glass p-6 border-l-4 border-l-primary">
            <div className="flex items-center gap-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Wallet className="h-5 w-5" /></span>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Earnings</div>
                <div className="font-display text-2xl font-bold">{formatGHS(earned)}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-accent" /> Active Assignments
          </h2>
          
          {active.length === 0 ? (
            <Card className="p-16 text-center border-dashed border-2 bg-muted/20">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted grid place-items-center mb-4"><Package className="h-8 w-8 text-muted-foreground" /></div>
              <h3 className="text-lg font-bold">No active tasks right now</h3>
              <p className="text-sm text-muted-foreground">Stay online to receive new delivery requests from sellers.</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {active.map((o) => (
                <Card key={o.id} className="overflow-hidden border-border/60 hover:border-accent/40 transition-all shadow-soft ring-1 ring-black/5">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline" className="bg-accent/5 font-bold uppercase tracking-tighter shadow-sm">{o.status.replace('_', ' ')}</Badge>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Clock className="h-3.5 w-3.5" /> 15 mins ago</div>
                      </div>
                      
                      <h3 className="font-display text-xl font-bold mb-4">{o.products?.title}</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground"><Package className="h-4 w-4" /></div>
                          <div>
                            <div className="text-[10px] font-bold uppercase text-muted-foreground">Pickup Location</div>
                            <div className="text-sm font-semibold">{o.products?.pickup_location || "Not specified"}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="mt-1 grid h-8 w-8 place-items-center rounded-lg bg-accent/10 text-accent"><MapPin className="h-4 w-4" /></div>
                          <div>
                            <div className="text-[10px] font-bold uppercase text-muted-foreground">Delivery Point</div>
                            <div className="text-sm font-semibold">{o.hall_location || "Buyer's Hall"}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-64 bg-muted/30 border-t md:border-t-0 md:border-l p-6 flex flex-col justify-center gap-3">
                      <div className="text-center mb-2">
                        <div className="text-[10px] font-bold uppercase text-muted-foreground">Potential Earning</div>
                        <div className="text-lg font-bold text-success">{formatGHS(Number(o.total_price) * 0.1)}</div>
                      </div>
                      
                      {o.status === "ready" && (
                        <Button className="w-full bg-accent text-accent-foreground font-bold shadow-lg shadow-accent/20" onClick={() => update(o.id, "picked_up")}>Scan & Pick Up</Button>
                      )}
                      {o.status === "picked_up" && (
                        <Button className="w-full bg-gradient-amber text-accent-foreground font-bold shadow-lg" onClick={() => update(o.id, "on_the_way")}>Start Navigation</Button>
                      )}
                      {o.status === "on_the_way" && (
                        <Button className="w-full bg-success text-success-foreground font-bold shadow-lg shadow-success/20" onClick={() => update(o.id, "delivered")}>Confirm Delivery</Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
