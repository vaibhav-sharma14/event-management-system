import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";

const CATEGORIES = ["Music", "Tech", "Business", "Arts", "Sports", "Food", "Wellness", "Education", "General"];

export const Route = createFileRoute("/organizer/edit/$id")({
  head: () => ({ meta: [{ title: "Edit event — EventFlow" }] }),
  component: EditEventPage,
});

function EditEventPage() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  const { data } = useQuery({
    queryKey: ["event-edit", id],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });
  useEffect(() => { if (data) setForm({ ...data, starts_at: new Date(data.starts_at).toISOString().slice(0, 16) }); }, [data]);

  if (!form) return <div className="min-h-screen"><SiteNav /><div className="p-10 text-center text-muted-foreground">Loading…</div></div>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("events").update({
      title: form.title, description: form.description, category: form.category,
      venue: form.venue, location: form.location,
      starts_at: new Date(form.starts_at).toISOString(),
      capacity: Number(form.capacity), price: Number(form.price),
      rules: form.rules, status: form.status,
    }).eq("id", id);
    setSaving(false);
    if (error) toast.error(error.message); else { toast.success("Saved"); navigate({ to: "/organizer" }); }
  };

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-6 text-3xl font-bold">Edit event</h1>
        <form onSubmit={save} className="glass space-y-5 rounded-3xl p-8">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div><Label>Description</Label><Textarea rows={5} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Venue</Label><Input value={form.venue ?? ""} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></div>
            <div><Label>Location</Label><Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div><Label>Starts at</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} required /></div>
            <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></div>
            <div><Label>Price</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Rules</Label><Textarea rows={3} value={form.rules ?? ""} onChange={(e) => setForm({ ...form, rules: e.target.value })} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/organizer" })}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-primary to-accent">{saving ? "Saving…" : "Save changes"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
