import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Package, ListOrdered, DollarSign, Plus, Trash2, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";
import { formatGHS } from "@/lib/cart";
import { toast } from "sonner";

const NAV = [
  { to: "/dashboard/seller", label: "Overview", icon: Package },
  { to: "/dashboard/seller?tab=orders", label: "Orders", icon: ListOrdered },
];

interface Product { id: string; title: string; price: number; category: string; stock: number; status: string; images: string[]; }
interface Order { id: string; product_id: string; quantity: number; total_price: number; status: string; created_at: string; }

const STATUS_LABEL: Record<string, string> = {
  placed: "Placed", confirmed: "Confirmed", ready: "Ready",
  picked_up: "Picked up", on_the_way: "On the way", delivered: "Delivered", cancelled: "Cancelled",
};

export default function SellerDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", price: "", category: "Food", stock: "1", pickup_location: "", image: "" });

  const load = async () => {
    if (!user) return;
    const [{ data: p }, { data: o }] = await Promise.all([
      supabase.from("products").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
      supabase.from("orders").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
    ]);
    setProducts((p ?? []) as Product[]);
    setOrders((o ?? []) as Order[]);
  };

  useEffect(() => { load(); }, [user]);

  const totalSales = orders.filter((o) => o.status === "delivered").reduce((s, o) => s + Number(o.total_price), 0);
  const pending = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").reduce((s, o) => s + Number(o.total_price), 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("products").insert({
      seller_id: user.id, title: form.title, description: form.description,
      price: Number(form.price), category: form.category, stock: Number(form.stock),
      pickup_location: form.pickup_location, images: form.image ? [form.image] : [],
    });
    if (error) return toast.error(error.message);
    toast.success("Product listed!");
    setOpen(false);
    setForm({ title: "", description: "", price: "", category: "Food", stock: "1", pickup_location: "", image: "" });
    load();
  };

  const removeProduct = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const updateOrder = async (id: string, status: any) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Order updated");
    load();
  };

  return (
    <DashboardLayout title="Seller Dashboard" navItems={NAV}>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total earnings", value: formatGHS(totalSales), icon: DollarSign, color: "bg-success/10 text-success" },
          { label: "Pending payouts", value: formatGHS(pending), icon: ListOrdered, color: "bg-accent/10 text-accent-foreground" },
          { label: "Active listings", value: products.filter((p) => p.status === "active").length, icon: Package, color: "bg-primary/10 text-primary" },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-4 p-5">
            <span className={`grid h-12 w-12 place-items-center rounded-xl ${s.color}`}><s.icon className="h-5 w-5" /></span>
            <div><div className="text-xs text-muted-foreground">{s.label}</div><div className="font-display text-xl font-bold">{s.value}</div></div>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Your products</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-amber text-accent-foreground shadow-amber"><Plus className="mr-2 h-4 w-4" /> New listing</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create a new listing</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-3">
                <div><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Price (GHS)</Label><Input required type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                  <div><Label>Stock</Label><Input required type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
                </div>
                <div><Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Pickup location</Label><Input value={form.pickup_location} onChange={(e) => setForm({ ...form, pickup_location: e.target.value })} placeholder="e.g. Hall 5, Room 12" /></div>
                <div><Label>Image URL</Label><Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…" /></div>
                <Button type="submit" className="w-full bg-gradient-amber text-accent-foreground shadow-amber">Publish listing</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {products.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">No listings yet — create your first one!</Card>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Status</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-3 font-medium">{p.title}</td>
                    <td className="p-3 text-muted-foreground">{p.category}</td>
                    <td className="p-3">{formatGHS(Number(p.price))}</td>
                    <td className="p-3">{p.stock}</td>
                    <td className="p-3"><Badge variant="outline" className="capitalize">{p.status}</Badge></td>
                    <td className="p-3 text-right"><Button variant="ghost" size="sm" onClick={() => removeProduct(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-10">
        <h2 className="mb-4 font-display text-xl font-bold">Incoming orders</h2>
        {orders.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">No orders yet.</Card>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <Card key={o.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div>
                  <div className="text-xs text-muted-foreground">Order #{o.id.slice(0, 8)}</div>
                  <div className="font-display font-semibold">{formatGHS(Number(o.total_price))} · qty {o.quantity}</div>
                </div>
                <Badge variant="outline">{STATUS_LABEL[o.status]}</Badge>
                <div className="flex gap-2">
                  {o.status === "placed" && <Button size="sm" onClick={() => updateOrder(o.id, "confirmed")}>Confirm</Button>}
                  {o.status === "confirmed" && <Button size="sm" onClick={() => updateOrder(o.id, "ready")} className="bg-gradient-amber text-accent-foreground">Mark ready</Button>}
                  {o.status === "ready" && <Button size="sm" variant="outline" disabled>Awaiting pickup</Button>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
