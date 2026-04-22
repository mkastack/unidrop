import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Package, ListOrdered, DollarSign, Plus, Trash2, LayoutDashboard, ShoppingBag, TrendingUp, Clock } from "lucide-react";
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
import { ImageUploader } from "@/components/marketplace/ImageUploader";

const NAV = [
  { to: "/dashboard/seller", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/seller?tab=orders", label: "All Orders", icon: ListOrdered },
  { to: "/dashboard/seller?tab=wallet", label: "Wallet", icon: DollarSign },
];

interface Product { id: string; title: string; price: number; category: string; stock: number; status: string; images: string[]; }
interface Order { id: string; product_id: string; quantity: number; total_price: number; status: string; created_at: string; products: { title: string } }
interface WithdrawalRequest { id: string; amount: number; status: string; created_at: string; momo_number: string; momo_network: string; }
interface Profile { momo_number: string | null; momo_network: string | null; }

const STATUS_COLOR: Record<string, string> = {
  placed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  confirmed: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  ready: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  delivered: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function SellerDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ title: "", description: "", price: "", category: "Food", stock: "1", pickup_location: "" });
  const [momoForm, setMomoForm] = useState({ number: "", network: "MTN" });
  
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [open, setOpen] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const load = async () => {
    if (!user) return;
    const [{ data: p }, { data: o }, { data: w }, { data: prof }] = await Promise.all([
      supabase.from("products").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
      supabase.from("orders").select("*, products(title)").eq("seller_id", user.id).order("created_at", { ascending: false }),
      (supabase.from("withdrawal_requests" as any) as any).select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
      (supabase.from("profiles" as any) as any).select("momo_number, momo_network").eq("id", user.id).maybeSingle(),
    ]);
    setProducts((p ?? []) as Product[]);
    setOrders((o ?? []) as Order[]);
    setWithdrawals((w ?? []) as unknown as WithdrawalRequest[]);
    if (prof) {
      setProfile(prof as unknown as Profile);
      setMomoForm({ number: (prof as any).momo_number || "", network: (prof as any).momo_network || "MTN" });
    }
  };

  useEffect(() => {
    load();
    if (!user) return;

    const productsSub = supabase.channel("seller-inventory")
      .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: `seller_id=eq.${user.id}` }, () => load())
      .subscribe();
    
    const ordersSub = supabase.channel("seller-sales")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `seller_id=eq.${user.id}` }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(productsSub);
      supabase.removeChannel(ordersSub);
    };
  }, [user]);

  const startEdit = (p: Product) => {
    // Note: We need description and pickup_location for editing, which aren't in the Product interface yet.
    // Let's treat them as accessible since we fetched *
    const raw = p as any;
    setEditingProduct(p);
    setForm({
      title: p.title,
      description: raw.description || "",
      price: p.price.toString(),
      category: p.category,
      stock: p.stock.toString(),
      pickup_location: raw.pickup_location || ""
    });
    setImages(p.images || []);
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditingProduct(null);
    setForm({ title: "", description: "", price: "", category: "Food", stock: "1", pickup_location: "" });
    setImages([]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const payload = {
      seller_id: user.id, title: form.title, description: form.description,
      price: Number(form.price), category: form.category, stock: Number(form.stock),
      pickup_location: form.pickup_location, images,
    };

    const { error } = editingProduct 
      ? await supabase.from("products").update(payload).eq("id", editingProduct.id).eq("seller_id", user.id)
      : await supabase.from("products").insert(payload);

    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(editingProduct ? "Product updated! 📝" : "Product listed successfully! 🚀");
    closeDialog();
    load();
  };

  const removeProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id).eq("seller_id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Product removed");
    load();
  };

  const totalSales = orders.filter((o) => o.status === "delivered").reduce((s, o) => s + Number(o.total_price), 0);
  const activeOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));

  const updateOrder = async (id: string, status: any) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id).eq("seller_id", user?.id);
    if (error) return toast.error(error.message);
    toast.success(`Order marked as ${status}`);
    load();
  };

  const updateMomo = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await (supabase.from("profiles" as any) as any).update({
      momo_number: momoForm.number,
      momo_network: momoForm.network
    }).eq("id", user.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Payment details updated!");
    load();
  };

  const requestWithdrawal = async (amount: number) => {
    if (!user || !profile?.momo_number) {
      toast.error("Please set your MoMo details first");
      return;
    }
    setWithdrawing(true);
    const { error } = await (supabase.from("withdrawal_requests" as any) as any).insert({
      seller_id: user.id,
      amount,
      momo_number: profile.momo_number,
      momo_network: profile.momo_network,
      status: "pending"
    });
    setWithdrawing(false);
    if (error) return toast.error(error.message);
    toast.success("Withdrawal request sent! 💸");
    setShowWithdraw(false);
    load();
  };

  const lifetimeSales = orders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total_price), 0);
  const totalEarned = lifetimeSales * 0.8;
  const pendingEarnings = orders.filter(o => !["delivered", "cancelled"].includes(o.status)).reduce((s, o) => s + Number(o.total_price), 0) * 0.8;
  const withdrawnAmount = withdrawals.filter(w => ["approved", "paid"].includes(w.status)).reduce((s, w) => s + Number(w.amount), 0);
  const pendingWithdrawal = withdrawals.filter(w => w.status === "pending").reduce((s, w) => s + Number(w.amount), 0);
  const currentBalance = totalEarned - withdrawnAmount - pendingWithdrawal;

  return (
    <DashboardLayout title="Seller Hub" navItems={NAV}>
      <div className="space-y-8 animate-fade-up">
        {activeTab === "overview" && (
          <>
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="glass relative overflow-hidden p-6">
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y--8 rounded-full bg-success/10 blur-2xl" />
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-success/20 text-success shadow-lg shadow-success/10">
                    <DollarSign className="h-6 w-6" />
                  </span>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lifetime Sales</div>
                    <div className="font-display text-2xl font-bold">{formatGHS(totalSales)}</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-success">
                  <TrendingUp className="h-3 w-3" /> +12.5% this week
                </div>
              </Card>

              <Card className="glass p-6">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/20 text-amber-500">
                    <ShoppingBag className="h-6 w-6" />
                  </span>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Orders</div>
                    <div className="font-display text-2xl font-bold">{activeOrders.length}</div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Awaiting fulfillment
                </div>
              </Card>

              <Card className="glass p-6">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/20 text-primary">
                    <Package className="h-6 w-6" />
                  </span>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Listings</div>
                    <div className="font-display text-2xl font-bold">{products.length}</div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">{products.filter(p => Number(p.stock) === 0).length} items out of stock</div>
              </Card>
            </div>

            {/* Current Activity */}
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold">Your Inventory</h2>
                  <Dialog open={open} onOpenChange={(v) => { if(!v) closeDialog(); setOpen(v); }}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-amber text-accent-foreground shadow-amber-lg hover:scale-105 transition-transform">
                        <Plus className="mr-2 h-5 w-5" /> Add New Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader><DialogTitle className="text-2xl font-bold">{editingProduct ? "Edit Listing" : "Post an Item"}</DialogTitle></DialogHeader>
                      <form onSubmit={submit} className="space-y-4 pt-4">
                        <div className="space-y-2"><Label>What are you selling?</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. MacBook Air M1" /></div>
                        <div className="space-y-2"><Label>Description</Label><Textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tell buyers about your item..." className="min-h-[100px]" /></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Price (₵)</Label><Input required type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                          <div className="space-y-2"><Label>Initial Stock</Label><Input required type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
                        </div>
                        <div className="space-y-2"><Label>Category</Label>
                          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                            <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                            <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2"><Label>Pickup Location</Label><Input required value={form.pickup_location} onChange={(e) => setForm({ ...form, pickup_location: e.target.value })} placeholder="e.g. Jean Nelson Hall, Room B12" /></div>
                        <div className="space-y-2"><Label>Upload Photos</Label><ImageUploader value={images} onChange={setImages} /></div>
                        <Button type="submit" disabled={loading} className="h-14 w-full bg-gradient-amber text-xl font-bold text-accent-foreground shadow-amber hover:opacity-90">
                          {loading ? "Processing..." : (editingProduct ? "Update Listing" : "Publish to Marketplace")}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {products.length === 0 ? (
                  <Card className="p-20 text-center border-dashed border-2">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-muted shadow-inner mb-4"><Package className="h-8 w-8 text-muted-foreground" /></div>
                    <h3 className="text-xl font-semibold">Start your business!</h3>
                    <p className="text-muted-foreground mb-6">List your first product and start earning from fellow students.</p>
                    <Button variant="outline" onClick={() => setOpen(true)}>Create First Listing</Button>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {products.map((p) => (
                      <Card key={p.id} className="group overflow-hidden border-border/40 hover:border-accent/40 transition-colors">
                        <div className="flex items-center gap-6 p-4">
                          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border/20">
                            {p.images[0] ? <img src={p.images[0]} className="h-full w-full object-cover transition-transform group-hover:scale-110" /> : <Package className="m-auto h-8 w-8 text-muted-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-display font-bold truncate">{p.title}</h3>
                              <Badge variant="outline" className="bg-accent/5 text-[10px] uppercase font-bold">{p.category}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm font-medium">
                              <span className="text-accent">{formatGHS(Number(p.price))}</span>
                              <span className="text-muted-foreground">Stock: {p.stock}</span>
                            </div>
                          </div>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => startEdit(p)} className="hover:bg-accent/10 hover:text-accent"><Package className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => removeProduct(p.id)} className="hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <h2 className="font-display text-2xl font-bold">Recent Orders</h2>
                {activeOrders.length === 0 ? (
                  <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                    <div className="h-12 w-12 rounded-full bg-muted grid place-items-center mb-3"><ListOrdered className="h-6 w-6 text-muted-foreground" /></div>
                    <p className="text-sm font-medium text-muted-foreground">No active orders</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {activeOrders.map((o) => (
                      <Card key={o.id} className="p-4 border-l-4 border-accent">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">#{o.id.slice(0, 8)}</div>
                            <h4 className="font-bold text-sm">{o.products?.title || "Product Deleted"}</h4>
                            <div className="text-xs font-semibold text-accent mt-0.5">{formatGHS(Number(o.total_price))} · {o.quantity} units</div>
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${STATUS_COLOR[o.status] || ""}`}>{o.status}</Badge>
                        </div>
                        <div className="flex gap-2">
                          {o.status === "placed" && (
                            <Button size="sm" className="w-full text-xs" onClick={() => updateOrder(o.id, "confirmed")}>Confirm & Process</Button>
                          )}
                          {o.status === "confirmed" && (
                            <Button size="sm" className="w-full text-xs bg-gradient-amber text-accent-foreground" onClick={() => updateOrder(o.id, "ready")}>Dispatch Order</Button>
                          )}
                          {o.status === "ready" && (
                            <Button size="sm" variant="secondary" className="w-full text-xs pointer-events-none opacity-60">Awaiting Delivery</Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === "orders" && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold">Order History</h2>
            <Card className="divide-y divide-border overflow-hidden">
              {orders.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">No orders yet</div>
              ) : (
                orders.map((o) => (
                  <div key={o.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex-1">
                      <div className="text-xs font-bold text-muted-foreground mb-1">#{o.id.slice(0, 8)}</div>
                      <div className="font-bold">{o.products?.title || "Product Deleted"}</div>
                      <div className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString()} · {o.quantity} units</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-accent">{formatGHS(Number(o.total_price))}</div>
                      <Badge variant="outline" className={`mt-1 text-[10px] ${STATUS_COLOR[o.status] || ""}`}>{o.status}</Badge>
                    </div>
                  </div>
                ))
              )}
            </Card>
          </div>
        )}

        {activeTab === "wallet" && (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold">Earnings & Payouts</h2>
                <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
                  <DialogTrigger asChild>
                    <Button disabled={currentBalance <= 0} className="bg-gradient-amber text-accent-foreground shadow-amber">
                      <DollarSign className="mr-2 h-4 w-4" /> Request Payout
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Request Payout</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="rounded-xl bg-accent/10 p-4 border border-accent/20">
                        <div className="text-xs font-bold uppercase text-accent mb-1">Available to Withdraw</div>
                        <div className="text-3xl font-bold">{formatGHS(currentBalance)}</div>
                        <p className="mt-2 text-xs text-muted-foreground">This will be sent to {profile?.momo_number} ({profile?.momo_network})</p>
                      </div>
                      <Button 
                        onClick={() => requestWithdrawal(currentBalance)} 
                        disabled={withdrawing || currentBalance <= 0} 
                        className="w-full h-12 bg-gradient-amber font-bold text-accent-foreground"
                      >
                        {withdrawing ? "Processing..." : "Confirm Withdrawal"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 bg-primary text-primary-foreground">
                  <div className="text-xs font-bold uppercase opacity-70">Total Earned (80%)</div>
                  <div className="text-3xl font-bold mt-1">{formatGHS(totalEarned)}</div>
                  <div className="mt-2 text-[10px] opacity-60">From delivered orders</div>
                </Card>
                <Card className="p-6 border-amber-500 bg-amber-500/5">
                  <div className="text-xs font-bold uppercase text-amber-600">Pending Earnings</div>
                  <div className="text-3xl font-bold mt-1 text-foreground">{formatGHS(pendingEarnings)}</div>
                  <div className="mt-2 text-[10px] text-muted-foreground">Payment received, awaiting delivery</div>
                </Card>
                <Card className="p-6 border-accent bg-accent/5">
                  <div className="text-xs font-bold uppercase text-accent">Available to Withdraw</div>
                  <div className="text-3xl font-bold mt-1 text-foreground">{formatGHS(currentBalance)}</div>
                  <div className="mt-2 text-[10px] text-muted-foreground">{pendingWithdrawal > 0 && `${formatGHS(pendingWithdrawal)} pending approval`}</div>
                </Card>
              </div>

              <Card>
                <div className="p-4 border-b font-bold">Withdrawal History</div>
                <div className="divide-y">
                  {withdrawals.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">No withdrawals yet</div>
                  ) : (
                    withdrawals.map((w) => (
                      <div key={w.id} className="p-4 flex items-center justify-between">
                        <div>
                          <div className="font-bold">{formatGHS(Number(w.amount))}</div>
                          <div className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleDateString()} · {w.momo_network}</div>
                        </div>
                        <Badge className={
                          w.status === 'paid' ? 'bg-success/20 text-success' : 
                          w.status === 'pending' ? 'bg-amber-500/20 text-amber-500' : 
                          'bg-destructive/20 text-destructive'
                        }>
                          {w.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <h2 className="font-display text-2xl font-bold">Payment Settings</h2>
              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-6">Enter your Mobile Money details to receive payouts.</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>MoMo Network</Label>
                    <Select value={momoForm.network} onValueChange={(v) => setMomoForm({...momoForm, network: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MTN">MTN Mobile Money</SelectItem>
                        <SelectItem value="Telecel">Telecel Cash</SelectItem>
                        <SelectItem value="AT">AT Money</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>MoMo Number</Label>
                    <Input 
                      placeholder="024 XXX XXXX" 
                      value={momoForm.number} 
                      onChange={(e) => setMomoForm({...momoForm, number: e.target.value})} 
                    />
                  </div>
                  <Button 
                    onClick={updateMomo} 
                    disabled={loading} 
                    className="w-full bg-primary text-primary-foreground"
                  >
                    {loading ? "Saving..." : "Save Details"}
                  </Button>
                </div>
              </Card>

              <div className="rounded-xl bg-muted p-4 border border-dashed border-border">
                <h4 className="font-bold text-sm mb-2">How it works</h4>
                <ul className="text-xs space-y-2 text-muted-foreground">
                  <li>• We take 20% platform commission on every sale.</li>
                  <li>• Payouts are processed within 24 hours of request.</li>
                  <li>• Only "Delivered" orders count towards your balance.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
