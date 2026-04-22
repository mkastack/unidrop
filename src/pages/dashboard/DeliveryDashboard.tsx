import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Truck, CheckCircle2, Power } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { formatGHS } from "@/lib/cart";
import { toast } from "sonner";

const NAV = [
  { to: "/dashboard/delivery", label: "Tasks", icon: Truck },
  { to: "/dashboard/delivery?tab=done", label: "Completed", icon: CheckCircle2 },
];

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [online, setOnline] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("orders")
      .select("*, products(title)")
      .eq("delivery_agent_id", user.id).order("created_at", { ascending: false });
    setOrders(data ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const update = async (id: string, status: any) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    load();
  };

  const active = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const done = orders.filter((o) => o.status === "delivered");
  const earned = done.reduce((s, o) => s + Number(o.total_price) * 0.1, 0);

  return (
    <DashboardLayout title="Delivery Dashboard" navItems={NAV}>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Card className="flex items-center gap-3 p-4">
          <Power className={`h-5 w-5 ${online ? "text-success" : "text-muted-foreground"}`} />
          <div className="text-sm font-medium">{online ? "Online — accepting jobs" : "Offline"}</div>
          <Switch checked={online} onCheckedChange={setOnline} />
        </Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Deliveries done</div><div className="font-display text-xl font-bold">{done.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Earnings</div><div className="font-display text-xl font-bold">{formatGHS(earned)}</div></Card>
      </div>

      <h2 className="mb-3 font-display text-lg font-bold">Active deliveries</h2>
      {active.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No active deliveries assigned.</Card>
      ) : (
        <div className="space-y-3">
          {active.map((o) => (
            <Card key={o.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <div className="font-display font-semibold">{o.products?.title}</div>
                <div className="text-xs text-muted-foreground">#{o.id.slice(0, 8)} · {formatGHS(Number(o.total_price))}</div>
              </div>
              <Badge variant="outline">{o.status}</Badge>
              <div className="flex gap-2">
                {o.status === "ready" && <Button size="sm" onClick={() => update(o.id, "picked_up")}>Pick up</Button>}
                {o.status === "picked_up" && <Button size="sm" onClick={() => update(o.id, "on_the_way")} className="bg-gradient-amber text-accent-foreground">On the way</Button>}
                {o.status === "on_the_way" && <Button size="sm" onClick={() => update(o.id, "delivered")} className="bg-success text-success-foreground">Delivered</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
