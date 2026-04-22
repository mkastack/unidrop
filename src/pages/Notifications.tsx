import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setItems(data ?? []);
      // mark read
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    };
    load();
    const channel = supabase.channel("notifs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <PublicLayout>
      <div className="container max-w-2xl py-10">
        <h1 className="mb-6 font-display text-3xl font-bold">Notifications</h1>
        {items.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <Bell className="mx-auto mb-3 h-8 w-8 opacity-40" />
            You're all caught up.
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map((n) => (
              <Card key={n.id} className="p-4">
                <div className="text-sm">{n.message}</div>
                <div className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
