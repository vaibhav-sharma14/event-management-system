import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Users, Calendar, DollarSign, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/site-nav";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — EventFlow" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/admin" } as never }); }, [loading, user, navigate]);

  const { data: events } = useQuery({
    enabled: !!isAdmin,
    queryKey: ["admin-events"],
    queryFn: async () => (await supabase.from("events").select("*").order("created_at", { ascending: false }).limit(50)).data ?? [],
  });
  const { data: bookings } = useQuery({
    enabled: !!isAdmin,
    queryKey: ["admin-bookings"],
    queryFn: async () => (await supabase.from("bookings").select("*, events(title)").order("created_at", { ascending: false }).limit(50)).data ?? [],
  });
  const { data: profileCount } = useQuery({
    enabled: !!isAdmin,
    queryKey: ["admin-users"],
    queryFn: async () => (await supabase.from("profiles").select("*", { count: "exact", head: true })).count ?? 0,
  });

  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen"><SiteNav />
        <div className="mx-auto max-w-xl px-6 py-20 text-center">
          <div className="glass rounded-3xl p-10">
            <h1 className="text-2xl font-bold">Admin access only</h1>
            <p className="mt-2 text-sm text-muted-foreground">You don't have permission to view this page.</p>
          </div>
        </div>
      </div>
    );
  }

  const revenue = (bookings ?? []).reduce((s, b: any) => s + Number(b.total_amount || 0), 0);
  const tickets = (bookings ?? []).reduce((s, b: any) => s + (b.quantity || 0), 0);

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold">Admin dashboard</h1>
        <p className="mb-8 text-muted-foreground">Platform-wide overview.</p>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card icon={<Users />} label="Users" value={profileCount ?? 0} />
          <Card icon={<Calendar />} label="Events" value={events?.length ?? 0} />
          <Card icon={<Ticket />} label="Tickets sold" value={tickets} />
          <Card icon={<DollarSign />} label="Revenue" value={`$${revenue.toFixed(2)}`} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Recent events">
            <ul className="divide-y divide-border text-sm">
              {(events ?? []).slice(0, 10).map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2">
                  <span className="truncate">{e.title}</span>
                  <span className="text-xs text-muted-foreground">{e.status}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Recent bookings">
            <ul className="divide-y divide-border text-sm">
              {(bookings ?? []).slice(0, 10).map((b: any) => (
                <li key={b.id} className="flex items-center justify-between py-2">
                  <span className="truncate">{b.events?.title}</span>
                  <span className="text-xs text-muted-foreground">${Number(b.total_amount).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Card({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent">{icon}</div>
      <div className="mt-3 text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {children}
    </div>
  );
}
