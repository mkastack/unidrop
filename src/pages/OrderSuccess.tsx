import { useSearchParams, useNavigate } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, PackageSearch, Receipt, Home, Download, Share2 } from "lucide-react";
import { formatGHS } from "@/lib/cart";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const ids = searchParams.get("ids")?.split(",") || [];
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) {
      navigate("/");
      return;
    }
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, products(title, price)")
        .in("id", ids);
      
      if (error) {
        toast.error("Error loading order details");
      } else {
        setOrders(data || []);
      }
      setLoading(false);
    };
    fetchOrders();
  }, [ids, navigate]);

  const totalPaid = orders.reduce((s, o) => s + Number(o.total_price), 0);

  const printReceipt = () => {
    window.print();
  };

  return (
    <PublicLayout>
      <div className="container max-w-2xl py-12 md:py-20 animate-fade-up">
        <div className="text-center mb-10">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 mb-6 animate-bounce">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="font-display text-4xl font-extrabold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground text-lg">Your order has been placed and sellers are preparing it.</p>
        </div>

        <Card className="overflow-hidden border-border/40 shadow-2xl mb-8">
          <div className="bg-muted/30 p-6 border-b border-border/40 flex justify-between items-center">
            <div className="font-bold uppercase tracking-wider text-xs text-muted-foreground">Order Summary</div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Paid</Badge>
          </div>
          
          <div className="p-6 space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />)}
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="flex justify-between items-start">
                  <div>
                    <div className="font-bold">{order.products?.title}</div>
                    <div className="text-xs text-muted-foreground">Order ID: <span className="font-mono">{order.id.slice(0, 8)}</span></div>
                  </div>
                  <div className="font-semibold">{formatGHS(order.total_price)}</div>
                </div>
              ))
            )}

            <div className="pt-4 border-t border-dashed border-border flex justify-between items-center">
              <div className="text-lg font-bold">Total Paid</div>
              <div className="text-2xl font-extrabold text-accent">{formatGHS(totalPaid)}</div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
          <Button 
            onClick={() => navigate("/dashboard/buyer")} 
            size="lg" 
            className="h-14 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg hover:scale-[1.02] transition-transform"
          >
            <PackageSearch className="mr-2 h-5 w-5" /> Trace My Item
          </Button>
          <Button 
            onClick={printReceipt} 
            size="lg" 
            variant="outline" 
            className="h-14 border-border/60 font-bold rounded-2xl hover:bg-muted transition-all"
          >
            <Receipt className="mr-2 h-5 w-5" /> View Receipt
          </Button>
          <Button 
            onClick={() => navigate("/")} 
            variant="ghost" 
            className="h-12 md:col-span-2 text-muted-foreground"
          >
            <Home className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </div>

        {/* Hidden Print Section */}
        <div className="hidden print:block p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">UniDrop Receipt</h2>
            <p className="text-sm">Campus Marketplace</p>
          </div>
          <div className="space-y-4">
            {orders.map(o => (
              <div key={o.id} className="flex justify-between">
                <span>{o.products?.title} (x{o.quantity})</span>
                <span>{formatGHS(o.total_price)}</span>
              </div>
            ))}
            <div className="border-t pt-4 font-bold flex justify-between">
              <span>Total</span>
              <span>{formatGHS(totalPaid)}</span>
            </div>
          </div>
          <div className="mt-12 text-center text-xs text-muted-foreground">
            Thank you for shopping on UniDrop!
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

function Badge({ children, variant, className }: any) {
  return <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${className}`}>{children}</span>
}
