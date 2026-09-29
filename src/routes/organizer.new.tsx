import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";

const schema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(5000),
  category: z.string(),
  venue: z.string().trim().max(120),
  location: z.string().trim().max(120),
  starts_at: z.string().min(1),
  capacity: z.number().int().min(1).max(1_000_000),
  price: z.number().min(0).max(1_000_000),
  rules: z.string().trim().max(2000).optional(),
});

const CATEGORIES = ["Music", "Tech", "Business", "Arts", "Sports", "Food", "Wellness", "Education", "General"];

export const Route = createFileRoute("/organizer/new")({
  head: () => ({ meta: [{ title: "Create event — EventFlow" }] }),
  component: NewEventPage,
});

function NewEventPage() {
  const { user, isOrganizer, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", category: "General", venue: "", location: "",
    starts_at: "", capacity: 100, price: 0, rules: "", status: "published" as "draft" | "published",
  });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/organizer/new" } as never });
  }, [loading, user, navigate]);

  if (!user) return null;
  if (!isOrganizer) { navigate({ to: "/organizer" }); return null; }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...form,
      capacity: Number(form.capacity), price: Number(form.price),
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);

    let banner_url: string | null = null;
    if (banner) {
      const ext = banner.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("event-media").upload(path, banner);
      if (upErr) { toast.error(upErr.message); setSubmitting(false); return; }
      const { data: signed } = await supabase.storage.from("event-media").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      banner_url = signed?.signedUrl ?? null;
    }

    const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 7);

    const { error } = await supabase.from("events").insert({
      organizer_id: user.id,
      title: form.title, slug,
      description: form.description, category: form.category,
      venue: form.venue, location: form.location,
      starts_at: new Date(form.starts_at).toISOString(),
      capacity: Number(form.capacity), price: Number(form.price),
      rules: form.rules || null, status: form.status, banner_url,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Event created!");
    navigate({ to: "/organizer" });
  };

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold">Create event</h1>
        <p className="mb-8 text-muted-foreground">Tell people what they're going to experience.</p>

        <form onSubmit={submit} className="glass space-y-5 rounded-3xl p-8">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div><Label>Description</Label><Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "draft" | "published" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Venue</Label><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></div>
            <div><Label>City / Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div><Label>Date & time</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} required /></div>
            <div><Label>Capacity</Label><Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></div>
            <div><Label>Price (USD)</Label><Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
          </div>

          <div><Label>Rules (optional)</Label><Textarea rows={3} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} /></div>

          <div>
            <Label>Banner image</Label>
            <label className="glass mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-sm text-muted-foreground hover:text-foreground">
              <ImagePlus className="h-4 w-4" />
              {banner ? banner.name : "Click to upload banner"}
              <input type="file" accept="image/*" hidden onChange={(e) => setBanner(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/organizer" })}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-primary to-accent">{submitting ? "Creating…" : "Create event"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
