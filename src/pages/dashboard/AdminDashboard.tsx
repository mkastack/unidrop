import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Users, Package, BarChart3, ShoppingBag, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatGHS } from "@/lib/cart";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Send } from "lucide-react";
import { useState as _useState } from "react";

const NAV = [
  { to: "/dashboard/admin", label: "Overview", icon: BarChart3 },
  { to: "/dashboard/admin?tab=users", label: "Users", icon: Users },
  { to: "/dashboard/admin?tab=products", label: "Products", icon: Package },
  { to: "/dashboard/admin?tab=orders", label: "Orders", icon: ShoppingBag },
];

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [broadcast, setBroadcast] = useState("");
  const [sending, setSending] = useState(false);

  const sendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const { data, error } = await supabase.rpc("broadcast_announcement", { _message: broadcast });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success(`Sent to ${data} users`);
    setBroadcast("");
  };

  const load = async () => {
    const [{ data: u }, { data: p }, { data: o }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
    ]);
    setUsers(u ?? []); setProducts(p ?? []); setOrders(o ?? []);
  };
  useEffect(() => { load(); }, []);

  const totalRev = orders.filter((o) => o.status === "delivered").reduce((s, o) => s + Number(o.total_price), 0);

  const removeProduct = async (id: string) => {
    if (!confirm("Remove this listing?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed"); load();
  };

  return (
    <DashboardLayout title="Admin Console" navItems={NAV}>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total users", value: users.length, icon: Users, tone: "bg-primary/10 text-primary" },
          { label: "Listings", value: products.length, icon: Package, tone: "bg-accent/15 text-accent-foreground" },
          { label: "Orders", value: orders.length, icon: ShoppingBag, tone: "bg-muted text-foreground" },
          { label: "Revenue", value: formatGHS(totalRev), icon: BarChart3, tone: "bg-success/10 text-success" },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-4 p-5">
            <span className={`grid h-12 w-12 place-items-center rounded-xl ${s.tone}`}><s.icon className="h-5 w-5" /></span>
            <div><div className="text-xs text-muted-foreground">{s.label}</div><div className="font-display text-xl font-bold">{s.value}</div></div>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-accent" />
          <h2 className="font-display text-lg font-bold">Broadcast announcement</h2>
        </div>
        <form onSubmit={sendBroadcast} className="flex gap-2">
          <Textarea value={broadcast} onChange={(e) => setBroadcast(e.target.value)} placeholder="Message to all users…" required className="flex-1" rows={2} />
          <Button type="submit" disabled={sending || !broadcast} className="bg-gradient-amber text-accent-foreground shadow-amber">
            <Send className="mr-2 h-4 w-4" /> Send
          </Button>
        </form>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Recent users</h2>
          <div className="space-y-2">
            {users.slice(0, 6).map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <div><div className="font-medium">{u.name ?? u.email}</div><div className="text-xs text-muted-foreground">{u.email}</div></div>
                <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-display text-lg font-bold">All listings</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {products.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{p.category} · {formatGHS(Number(p.price))}</div>
                </div>
                <Badge variant="outline">{p.status}</Badge>
                <Button variant="ghost" size="sm" onClick={() => removeProduct(p.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            ))}
            {products.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No products yet.</p>}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
