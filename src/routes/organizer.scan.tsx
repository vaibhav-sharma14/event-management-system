import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, QrCode, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/organizer/scan")({
  head: () => ({ meta: [{ title: "QR Scanner — EventFlow" }] }),
  component: ScanPage,
});

type Result = { ok: boolean; msg: string; ticket?: any };

function ScanPage() {
  const { user, isOrganizer, loading } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  if (!loading && !user) { navigate({ to: "/auth", search: { redirect: "/organizer/scan" } as never }); return null; }
  if (!loading && !isOrganizer) { navigate({ to: "/organizer" }); return null; }

  const verify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!code.trim()) return;
    setBusy(true); setResult(null);
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*, events(title, organizer_id, starts_at, venue)")
      .eq("ticket_code", code.trim().toUpperCase())
      .maybeSingle();

    if (error || !booking) { setBusy(false); setResult({ ok: false, msg: "Ticket not found" }); return; }
    if ((booking as any).events?.organizer_id !== user!.id) { setBusy(false); setResult({ ok: false, msg: "This ticket is not for your event" }); return; }
    if (booking.status === "cancelled") { setBusy(false); setResult({ ok: false, msg: "Ticket is cancelled" }); return; }
    if (booking.checked_in_at) {
      setBusy(false); setResult({ ok: false, msg: `Already checked in at ${new Date(booking.checked_in_at).toLocaleString()}`, ticket: booking });
      return;
    }
    const { data: upd, error: uErr } = await supabase.from("bookings").update({ checked_in_at: new Date().toISOString() }).eq("id", booking.id).select("*, events(title, venue)").single();
    setBusy(false);
    if (uErr) { setResult({ ok: false, msg: uErr.message }); return; }
    setResult({ ok: true, msg: "Checked in!", ticket: upd });
    toast.success("Ticket verified");
    setCode("");
  };

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-xl px-6 py-12">
        <h1 className="text-3xl font-bold">QR check-in</h1>
        <p className="mb-8 text-muted-foreground">Enter or paste a ticket code to verify attendance.</p>

        <form onSubmit={verify} className="glass space-y-4 rounded-3xl p-6 glow-ring">
          <div className="flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-md bg-input px-3">
              <QrCode className="h-4 w-4 text-muted-foreground" />
              <Input className="border-0 bg-transparent shadow-none focus-visible:ring-0" placeholder="EVT-XXXXXXXX-XXXX" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <Button type="submit" disabled={busy} className="bg-gradient-to-r from-primary to-accent">{busy ? "Verifying…" : "Verify"}</Button>
          </div>
          <p className="text-xs text-muted-foreground">Tip: any QR scanner app can read the QR and paste the code here. Duplicate entries are blocked automatically.</p>
        </form>

        {result && (
          <div className={`glass mt-6 rounded-2xl p-6 ${result.ok ? "border-green-500/40" : "border-red-500/40"}`}>
            <div className={`flex items-center gap-2 text-lg font-semibold ${result.ok ? "text-green-400" : "text-red-400"}`}>
              {result.ok ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              {result.msg}
            </div>
            {result.ticket && (
              <div className="mt-3 text-sm text-muted-foreground">
                <div className="font-medium text-foreground">{result.ticket.events?.title}</div>
                <div>Qty {result.ticket.quantity} • {result.ticket.events?.venue}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
