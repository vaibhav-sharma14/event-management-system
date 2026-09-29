import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Calendar, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/site-nav";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — EventFlow" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/dashboard" } as never }); }, [loading, user, navigate]);

  const { data: bookings } = useQuery({
    enabled: !!user,
    queryKey: ["my-bookings"],
    queryFn: async () => {
      const { data } = await supabase.from("bookings")
        .select("*, events(id,slug,title,starts_at,banner_url,venue,location)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const now = Date.now();
  const upcoming = (bookings ?? []).filter((b: any) => b.events && new Date(b.events.starts_at).getTime() >= now);
  const past = (bookings ?? []).filter((b: any) => b.events && new Date(b.events.starts_at).getTime() < now);

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your dashboard</h1>
            <p className="text-muted-foreground">Tickets, bookings, and upcoming events.</p>
          </div>
          <Link to="/events"><Button variant="outline">Browse events</Button></Link>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Stat label="Total bookings" value={bookings?.length ?? 0} />
          <Stat label="Upcoming" value={upcoming.length} />
          <Stat label="Past events" value={past.length} />
        </div>

        <Tabs defaultValue="upcoming">
          <TabsList><TabsTrigger value="upcoming">Upcoming</TabsTrigger><TabsTrigger value="past">Past</TabsTrigger></TabsList>
          <TabsContent value="upcoming" className="mt-6"><BookingList rows={upcoming} empty="No upcoming bookings yet." /></TabsContent>
          <TabsContent value="past" className="mt-6"><BookingList rows={past} empty="No past events." /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 gradient-text text-3xl font-bold">{value}</div>
    </div>
  );
}

function BookingList({ rows, empty }: { rows: any[]; empty: string }) {
  if (rows.length === 0) return <div className="glass rounded-2xl p-10 text-center text-muted-foreground">{empty}</div>;
  return (
    <div className="space-y-3">
      {rows.map((b) => (
        <Link key={b.id} to="/ticket/$id" params={{ id: b.id }} className="glass flex items-center gap-4 rounded-2xl p-4 transition hover:glow-ring">
          <div className="h-16 w-24 overflow-hidden rounded-lg bg-muted">
            {b.events.banner_url ? <img src={b.events.banner_url} alt="" className="h-full w-full object-cover" /> : null}
          </div>
          <div className="flex-1">
            <div className="font-semibold">{b.events.title}</div>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(b.events.starts_at).toLocaleString()}</span>
              <span className="inline-flex items-center gap-1"><Ticket className="h-3 w-3" />{b.quantity} ticket{b.quantity > 1 ? "s" : ""}</span>
              <span className="font-mono">{b.ticket_code}</span>
            </div>
          </div>
          <div className="text-sm font-semibold">${Number(b.total_amount).toFixed(2)}</div>
        </Link>
      ))}
    </div>
  );
}
