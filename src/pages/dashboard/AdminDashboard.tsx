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
import { Megaphone, Send, Wallet, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useState as _useState } from "react";

const NAV = [
  { to: "/dashboard/admin", label: "Overview", icon: BarChart3 },
  { to: "/dashboard/admin?tab=users", label: "Users", icon: Users },
  { to: "/dashboard/admin?tab=products", label: "Products", icon: Package },
  { to: "/dashboard/admin?tab=orders", label: "Orders", icon: ShoppingBag },
  { to: "/dashboard/admin?tab=withdrawals", label: "Withdrawals", icon: Wallet },
];

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [broadcast, setBroadcast] = useState("");
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState(new URLSearchParams(window.location.search).get("tab") || "overview");

  useEffect(() => {
    const handlePopState = () => {
      setTab(new URLSearchParams(window.location.search).get("tab") || "overview");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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
    const [{ data: u }, { data: p }, { data: o }, { data: w }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("withdrawal_requests").select("*, profiles(name, email)").order("created_at", { ascending: false }),
    ]);
    setUsers(u ?? []); 
    setProducts(p ?? []); 
    setOrders(o ?? []);
    setWithdrawals(w ?? []);
  };
  useEffect(() => { load(); }, []);

  const totalRev = orders.filter((o) => o.status === "delivered").reduce((s, o) => s + Number(o.total_price), 0);

  const removeProduct = async (id: string) => {
    if (!confirm("Remove this listing?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed"); load();
  };

  const updateWithdrawal = async (id: string, status: string) => {
    const { error } = await supabase.from("withdrawal_requests").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Request marked as ${status}`);
    load();
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

      {tab === "overview" && (
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
      )}

      {tab === "users" && (
        <div className="mt-8 space-y-4">
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-accent" /> Platform Users
          </h2>
          <Card className="overflow-hidden border-border/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-bold">User</th>
                    <th className="px-6 py-4 font-bold">Joined</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold">{u.name || "Unnamed User"}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">Active</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab === "products" && (
        <div className="mt-8 space-y-4">
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-accent" /> All Listings
          </h2>
          <div className="grid gap-4">
            {products.map((p) => (
              <Card key={p.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden">
                    {p.images?.[0] && <img src={p.images[0]} className="h-full w-full object-cover" />}
                  </div>
                  <div>
                    <div className="font-bold">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.category} · {formatGHS(Number(p.price))}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{p.status}</Badge>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeProduct(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="mt-8 space-y-4">
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-accent" /> Platform Orders
          </h2>
          <Card className="overflow-hidden border-border/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-bold">Order ID</th>
                    <th className="px-6 py-4 font-bold">Amount</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                        #{o.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 font-bold">
                        {formatGHS(Number(o.total_price))}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="capitalize">{o.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab === "withdrawals" && (
        <div className="mt-8 space-y-4">
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-accent" /> Withdrawal Requests
          </h2>
          
          <div className="grid gap-4">
            {withdrawals.length === 0 && (
              <Card className="p-12 text-center text-muted-foreground">No withdrawal requests at this time.</Card>
            )}
            {withdrawals.map((w) => (
              <Card key={w.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-accent/10 text-accent">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-lg">{formatGHS(w.amount)}</div>
                      <div className="text-sm text-muted-foreground">Requested by {w.profiles?.name || w.profiles?.email}</div>
                      <div className="mt-2 flex items-center gap-4 text-xs font-medium">
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {w.momo_network}</span>
                        <span className="flex items-center gap-1 font-mono">{w.momo_number}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={`px-3 py-1 ${
                      w.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                      w.status === 'paid' ? 'bg-success/10 text-success border-success/20' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {w.status.toUpperCase()}
                    </Badge>

                    {w.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-success border-success/20 hover:bg-success/5" onClick={() => updateWithdrawal(w.id, 'paid')}>
                          Mark as Paid
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/5" onClick={() => updateWithdrawal(w.id, 'rejected')}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
