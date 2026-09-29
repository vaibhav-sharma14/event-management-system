import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Calendar, Download, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/ticket/$id")({
  head: () => ({ meta: [{ title: "Your ticket — EventFlow" }] }),
  component: TicketPage,
});

function TicketPage() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [qr, setQr] = useState<string>("");

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth", search: { redirect: `/ticket/${id}` } as never }); }, [loading, user, navigate, id]);

  const { data } = useQuery({
    enabled: !!user,
    queryKey: ["booking", id],
    queryFn: async () => {
      const { data } = await supabase.from("bookings").select("*, events(*)").eq("id", id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (data?.ticket_code) QRCode.toDataURL(data.ticket_code, { width: 320, margin: 1, color: { dark: "#ffffff", light: "#00000000" } }).then(setQr);
  }, [data?.ticket_code]);

  if (!data) return <div className="min-h-screen"><SiteNav /><div className="p-10 text-center text-muted-foreground">Loading ticket…</div></div>;
  const ev = (data as any).events;
  const date = new Date(ev.starts_at);

  const download = () => {
    const a = document.createElement("a");
    a.href = qr; a.download = `ticket-${data.ticket_code}.png`; a.click();
  };

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="glass overflow-hidden rounded-3xl glow-ring">
          <div className="relative aspect-[21/9]">
            {ev.banner_url ? <img src={ev.banner_url} className="h-full w-full object-cover" alt="" /> : <div className="h-full w-full bg-gradient-to-br from-primary/30 to-accent/20" />}
          </div>
          <div className="p-8">
            <div className="text-xs text-muted-foreground">{data.status === "confirmed" ? "Confirmed" : "Cancelled"}</div>
            <h1 className="mt-1 text-2xl font-bold">{ev.title}</h1>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div className="inline-flex items-center gap-2"><Calendar className="h-4 w-4" />{date.toLocaleString()}</div>
              <div className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{ev.venue || ev.location || "Online"}</div>
            </div>

            <div className="my-6 border-t border-dashed border-border" />

            <div className="flex flex-col items-center gap-3">
              {qr && <img src={qr} alt="QR code" className="h-64 w-64" />}
              <div className="font-mono text-sm tracking-widest">{data.ticket_code}</div>
              <div className="text-xs text-muted-foreground">Qty {data.quantity} • ${Number(data.total_amount).toFixed(2)}</div>
              {data.checked_in_at && <div className="text-xs text-green-400">Checked in at {new Date(data.checked_in_at).toLocaleString()}</div>}
              <Button variant="outline" onClick={download} className="mt-2"><Download className="mr-2 h-4 w-4" />Download QR</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
