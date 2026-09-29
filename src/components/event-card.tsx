import { Link } from "@tanstack/react-router";
import { Calendar, MapPin, Ticket } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export function EventCard({ event }: { event: Pick<Tables<"events">, "id" | "slug" | "title" | "category" | "venue" | "location" | "starts_at" | "banner_url" | "price"> }) {
  const date = new Date(event.starts_at);
  return (
    <Link
      to="/events/$slug" params={{ slug: event.slug }}
      className="group glass relative overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:glow-ring"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {event.banner_url ? (
          <img src={event.banner_url} alt={event.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/30 via-accent/20 to-background" />
        )}
        <div className="absolute left-3 top-3 rounded-full bg-background/70 px-3 py-1 text-xs backdrop-blur">
          {event.category}
        </div>
      </div>
      <div className="space-y-2 p-5">
        <h3 className="line-clamp-1 text-lg font-semibold">{event.title}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          <span className="text-border">•</span>
          {date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="line-clamp-1">{event.venue || event.location || "Online"}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-semibold gradient-text">
            {Number(event.price) === 0 ? "Free" : `$${Number(event.price).toFixed(2)}`}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground">
            <Ticket className="h-3.5 w-3.5" /> Book
          </span>
        </div>
      </div>
    </Link>
  );
}
