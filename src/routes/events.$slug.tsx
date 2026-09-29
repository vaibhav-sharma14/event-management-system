import { createFileRoute, useNavigate, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Calendar, MapPin, Users, Ticket, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/events/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug} — EventFlow` }] }),
  component: EventDetail,
  errorComponent: () => <div className="p-10 text-center">Failed to load.</div>,
  notFoundComponent: () => <div className="p-10 text-center">Event not found.</div>,
});

function EventDetail() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [qty, setQty] = useState(1);
  const [booking, setBooking] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const book = async () => {
    if (!user) { navigate({ to: "/auth", search: { redirect: window.location.pathname } as never }); return; }
    if (!event) return;
    setBooking(true);
    const total = Number(event.price) * qty;
    const { data, error } = await supabase.from("bookings").insert({
      event_id: event.id, user_id: user.id, quantity: qty, total_amount: total,
    }).select().single();
    setBooking(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Booking confirmed!");
    navigate({ to: "/ticket/$id", params: { id: data.id } });
  };

  if (isLoading || !event) return <div className="min-h-screen"><SiteNav /><div className="p-10 text-center text-muted-foreground">Loading…</div></div>;
  const date = new Date(event.starts_at);
  const gallery = (event.gallery as string[] | null) ?? [];

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <button onClick={() => navigate({ to: "/events" })} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to events
        </button>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass overflow-hidden rounded-3xl">
              <div className="relative aspect-[16/9]">
                {event.banner_url ? (
                  <img src={event.banner_url} alt={event.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary/30 to-accent/20" />
                )}
              </div>
            </div>

            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs">{event.category}</div>
              <h1 className="text-4xl font-bold tracking-tight">{event.title}</h1>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4" />{date.toLocaleString()}</span>
                <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{event.venue || event.location || "Online"}</span>
                <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" />Capacity {event.capacity}</span>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="mb-2 font-semibold">About this event</h2>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{event.description || "No description provided."}</p>
            </div>

            {event.rules && (
              <div className="glass rounded-2xl p-6">
                <h2 className="mb-2 font-semibold">Rules & guidelines</h2>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{event.rules}</p>
              </div>
            )}

            {gallery.length > 0 && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {gallery.map((g, i) => <img key={i} src={g} alt="" className="aspect-square rounded-xl object-cover" />)}
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 self-start">
            <div className="glass rounded-2xl p-6 glow-ring">
              <div className="mb-1 text-xs text-muted-foreground">Ticket price</div>
              <div className="gradient-text text-3xl font-bold">
                {Number(event.price) === 0 ? "Free" : `$${Number(event.price).toFixed(2)}`}
              </div>
              <div className="mt-6 space-y-3">
                <label className="text-xs text-muted-foreground">Quantity</label>
                <Input type="number" min={1} max={10} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} />
                <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">${(Number(event.price) * qty).toFixed(2)}</span>
                </div>
                <Button onClick={book} disabled={booking} className="w-full bg-gradient-to-r from-primary to-accent">
                  <Ticket className="mr-2 h-4 w-4" /> {booking ? "Booking…" : "Book now"}
                </Button>
                <p className="text-center text-[10px] text-muted-foreground">Secure checkout • QR ticket • Instant confirmation</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
