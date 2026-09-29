import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { Plus, QrCode, BarChart3, Calendar, DollarSign, Ticket, Trash2, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/organizer/")({
  head: () => ({ meta: [{ title: "Organizer dashboard — EventFlow" }] }),
  component: OrganizerPage,
});

function OrganizerPage() {
  const { user, isOrganizer, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/organizer" } as never }); }, [loading, user, navigate]);

  const becomeOrganizer = async () => {
    if (!user) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role: "organizer" });
    if (error && !error.message.includes("duplicate")) { toast.error(error.message); return; }
    toast.success("You're now an organizer!"); window.location.reload();
  };

  const { data: events } = useQuery({
    enabled: !!user,
    queryKey: ["organizer-events", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*").eq("organizer_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: bookings } = useQuery({
    enabled: !!user,
    queryKey: ["organizer-bookings", user?.id],
    queryFn: async () => {
      const ids = (events ?? []).map((e) => e.id);
      if (ids.length === 0) return [];
      const { data } = await supabase.from("bookings").select("*, events(title)").in("event_id", ids).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const totals = {
    events: events?.length ?? 0,
    revenue: (bookings ?? []).reduce((s, b: any) => s + Number(b.total_amount || 0), 0),
    tickets: (bookings ?? []).reduce((s, b: any) => s + (b.quantity || 0), 0),
    checkedIn: (bookings ?? []).filter((b: any) => b.checked_in_at).length,
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Event deleted"); qc.invalidateQueries({ queryKey: ["organizer-events"] }); }
  };

  if (!user) return null;

  if (!isOrganizer) {
    return (
      <div className="min-h-screen"><SiteNav />
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <div className="glass rounded-3xl p-10 glow-ring">
            <h1 className="text-3xl font-bold">Become an organizer</h1>
            <p className="mt-2 text-muted-foreground">Unlock event creation, ticketing, QR check-in, and analytics.</p>
            <Button onClick={becomeOrganizer} className="mt-6 bg-gradient-to-r from-primary to-accent">Activate organizer access</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold">Organizer dashboard</h1>
            <p className="text-muted-foreground">Manage your events and check-ins.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/organizer/scan"><Button variant="outline"><QrCode className="mr-2 h-4 w-4" />Scanner</Button></Link>
            <Link to="/organizer/new"><Button className="bg-gradient-to-r from-primary to-accent"><Plus className="mr-2 h-4 w-4" />New event</Button></Link>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={<Calendar />} label="Events" value={totals.events} />
          <Stat icon={<Ticket />} label="Tickets sold" value={totals.tickets} />
          <Stat icon={<DollarSign />} label="Revenue" value={`$${totals.revenue.toFixed(2)}`} />
          <Stat icon={<BarChart3 />} label="Checked in" value={totals.checkedIn} />
        </div>

        <h2 className="mb-3 text-xl font-semibold">Your events</h2>
        {(events ?? []).length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-muted-foreground">No events yet. Create your first one.</div>
        ) : (
          <div className="space-y-3">
            {events!.map((e) => (
              <div key={e.id} className="glass flex flex-wrap items-center gap-4 rounded-2xl p-4">
                <div className="h-16 w-24 overflow-hidden rounded-lg bg-muted">
                  {e.banner_url ? <img src={e.banner_url} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <Link to="/events/$slug" params={{ slug: e.slug }} className="font-semibold hover:underline">{e.title}</Link>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{new Date(e.starts_at).toLocaleString()}</span>
                    <span className={`rounded-full px-2 py-0.5 ${e.status === "published" ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"}`}>{e.status}</span>
                  </div>
                </div>
                <Link to="/organizer/edit/$id" params={{ id: e.id }}><Button variant="outline" size="sm"><Edit className="h-3.5 w-3.5" /></Button></Link>
                <Button variant="outline" size="sm" onClick={() => remove(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent">{icon}</div>
      <div className="mt-3 text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
