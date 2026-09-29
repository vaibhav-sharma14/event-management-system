import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/site-nav";
import { EventCard } from "@/components/event-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/events/")({
  validateSearch: (s: Record<string, unknown>) => ({
    category: typeof s.category === "string" ? s.category : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  head: () => ({ meta: [{ title: "Browse events — EventFlow Pro" }] }),
  component: BrowsePage,
});

const CATEGORIES = ["All", "Music", "Tech", "Business", "Arts", "Sports", "Food", "Wellness", "Education", "General"];

function BrowsePage() {
  const search = Route.useSearch();
  const [q, setQ] = useState(search.q ?? "");
  const [category, setCategory] = useState(search.category ?? "All");
  const [sort, setSort] = useState<"soon" | "price">("soon");

  const { data, isLoading } = useQuery({
    queryKey: ["events", "browse"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id,slug,title,category,venue,location,starts_at,banner_url,price")
        .eq("status", "published")
        .order("starts_at", { ascending: true });
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    let list = data ?? [];
    if (category !== "All") list = list.filter((e) => e.category === category);
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(t) || (e.location ?? "").toLowerCase().includes(t) || (e.venue ?? "").toLowerCase().includes(t));
    }
    if (sort === "price") list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
    return list;
  }, [data, category, q, sort]);

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight">Discover events</h1>
          <p className="text-muted-foreground">Find experiences that match your vibe.</p>
        </div>

        <div className="glass mb-8 flex flex-wrap items-center gap-3 rounded-2xl p-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events, venues, cities…" className="pl-9" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as "soon" | "price")}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="soon">Soonest</SelectItem>
              <SelectItem value="price">Lowest price</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <div key={i} className="glass aspect-[4/5] rounded-2xl shimmer" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-3xl p-16 text-center text-muted-foreground">No events match your filters.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        )}
      </div>
    </div>
  );
}
