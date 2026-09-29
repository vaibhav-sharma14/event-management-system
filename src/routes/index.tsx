import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BarChart3, Calendar, CheckCircle2, QrCode, Shield, Sparkles, Star, Ticket, Users, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/site-nav";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EventFlow Pro — Premium Event Management" },
      { name: "description", content: "Create, discover and manage unforgettable events. Ticketing, QR check-in, analytics, and a beautiful organizer dashboard." },
    ],
  }),
  component: Landing,
});

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const start = performance.now();
        const dur = 1400;
        const step = (t: number) => {
          const p = Math.min(1, (t - start) / dur);
          setN(Math.floor(p * to));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        obs.disconnect();
      }
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
}

function Landing() {
  const { data: featured } = useQuery({
    queryKey: ["featured-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id,slug,title,category,venue,location,starts_at,banner_url,price")
        .eq("status", "published")
        .order("starts_at", { ascending: true })
        .limit(6);
      return data ?? [];
    },
  });

  // Mouse parallax
  const heroRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--mx", `${x * 30}px`);
      el.style.setProperty("--my", `${y * 30}px`);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  const categories = ["Music", "Tech", "Business", "Arts", "Sports", "Food", "Wellness", "Education"];

  return (
    <div className="min-h-screen">
      <SiteNav />

      {/* HERO */}
      <section ref={heroRef} className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[10%] top-[20%] h-72 w-72 rounded-full bg-primary/30 blur-3xl animate-float-blob" style={{ transform: "translate(var(--mx,0), var(--my,0))" }} />
          <div className="absolute right-[8%] top-[10%] h-80 w-80 rounded-full bg-accent/30 blur-3xl animate-float-blob" style={{ animationDelay: "2s" }} />
          <div className="absolute left-[40%] bottom-[5%] h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl animate-float-blob" style={{ animationDelay: "4s" }} />
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-20 text-center">
          <div className="glass mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs animate-fade-up">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">Trusted by 12,000+ organizers worldwide</span>
          </div>
          <h1 className="animate-fade-up text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Events that feel <span className="gradient-text">unforgettable.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-pretty text-lg text-muted-foreground">
            EventFlow Pro is the all-in-one platform to create, ticket, scan, and grow your events — with a beautiful experience for organizers and attendees.
          </p>
          <div className="mt-8 flex animate-fade-up flex-wrap justify-center gap-3">
            <Link to="/events">
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent">
                Browse events <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth" search={{ mode: "signup" } as never}>
              <Button size="lg" variant="outline">Become an organizer</Button>
            </Link>
          </div>

          {/* Floating preview card */}
          <div className="relative mx-auto mt-16 max-w-4xl animate-fade-up">
            <div className="glass overflow-hidden rounded-3xl p-2 glow-ring">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {["Live Ticketing","QR Check-in","Analytics","Refunds"].map((t,i)=>(
                  <div key={t} className="glass rounded-2xl p-5 text-left" style={{ animationDelay: `${i*100}ms` }}>
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent">
                      {[<Ticket key="t" className="h-4 w-4" />,<QrCode key="q" className="h-4 w-4" />,<BarChart3 key="b" className="h-4 w-4" />,<Shield key="s" className="h-4 w-4" />][i]}
                    </div>
                    <div className="mt-3 text-sm font-medium">{t}</div>
                    <div className="text-xs text-muted-foreground">Built-in</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="glass grid grid-cols-2 gap-6 rounded-3xl p-8 md:grid-cols-4">
          {[
            { v: 12000, s: "+", l: "Organizers" },
            { v: 850000, s: "+", l: "Tickets sold" },
            { v: 4_900, s: "+", l: "Events run" },
            { v: 98, s: "%", l: "Satisfaction" },
          ].map((x) => (
            <div key={x.l} className="text-center">
              <div className="gradient-text text-3xl font-bold md:text-4xl"><Counter to={x.v} suffix={x.s} /></div>
              <div className="text-xs text-muted-foreground">{x.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED EVENTS */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Featured events</h2>
            <p className="mt-1 text-muted-foreground">Hand-picked experiences happening soon.</p>
          </div>
          <Link to="/events" className="text-sm text-muted-foreground hover:text-foreground">View all →</Link>
        </div>
        {featured && featured.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        ) : (
          <div className="glass rounded-3xl p-12 text-center text-muted-foreground">
            No public events yet. <Link to="/auth" className="underline">Sign up</Link> to create the first one.
          </div>
        )}
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-8 text-3xl font-bold tracking-tight">Browse by category</h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((c) => (
            <Link key={c} to="/events" search={{ category: c } as never} className="glass rounded-full px-5 py-2 text-sm transition hover:glow-ring">
              {c}
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-3 text-center text-3xl font-bold tracking-tight md:text-4xl">Everything you need to run great events</h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">From the first idea to the final check-in, EventFlow handles the workflow so you can focus on the experience.</p>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { i: <Calendar className="h-5 w-5" />, t: "Create in minutes", d: "Beautiful event pages with gallery, schedule, and ticket tiers." },
            { i: <Ticket className="h-5 w-5" />, t: "Smart ticketing", d: "Multiple ticket types, capacity rules, and instant confirmations." },
            { i: <QrCode className="h-5 w-5" />, t: "QR check-in", d: "Scan tickets at the door — duplicate-entry protected." },
            { i: <BarChart3 className="h-5 w-5" />, t: "Real-time analytics", d: "Revenue, sales velocity, attendance — all in one dashboard." },
            { i: <Users className="h-5 w-5" />, t: "Organizer profiles", d: "Build a following with public organizer pages and reviews." },
            { i: <Zap className="h-5 w-5" />, t: "Fast & secure", d: "Built on a modern edge platform with row-level security." },
          ].map((f) => (
            <div key={f.t} className="glass rounded-2xl p-6 transition hover:-translate-y-1 hover:glow-ring">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent">{f.i}</div>
              <h3 className="mt-4 text-lg font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">Loved by organizers</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { n: "Priya S.", r: "Festival Director", q: "Sold 12k tickets in a week. The dashboard is genuinely beautiful." },
            { n: "Marcus L.", r: "Tech Conference", q: "QR check-in saved us hours. Our team picked it up in minutes." },
            { n: "Elena R.", r: "Workshop Host", q: "Finally an event tool that feels modern and respects organizers." },
          ].map((t) => (
            <div key={t.n} className="glass rounded-2xl p-6">
              <div className="flex gap-1 text-yellow-400">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
              <p className="mt-4 text-sm">"{t.q}"</p>
              <div className="mt-4 text-xs text-muted-foreground">{t.n} — {t.r}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">Frequently asked questions</h2>
        <Accordion type="single" collapsible className="glass rounded-2xl px-6">
          {[
            { q: "Is there a free plan?", a: "Yes. Free events have no platform fee. Paid events have a small per-ticket fee." },
            { q: "How do attendees check in?", a: "Each booking gets a unique QR code. Organizers scan it from their dashboard with duplicate-entry protection." },
            { q: "Can I customize event pages?", a: "Yes — upload banners, galleries, schedules, rules, and ticket tiers." },
            { q: "Do you support refunds?", a: "Organizers can cancel bookings; refund flow runs through your payment provider." },
          ].map((f) => (
            <AccordionItem key={f.q} value={f.q} className="border-border">
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA / NEWSLETTER */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="glass relative overflow-hidden rounded-3xl p-12 text-center glow-ring">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/3 top-1/3 h-40 w-40 rounded-full bg-primary/30 blur-3xl animate-float-blob" />
          </div>
          <h2 className="text-3xl font-bold md:text-4xl">Ready to host something amazing?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Create your first event in under 2 minutes. No credit card required.</p>
          <form onSubmit={(e) => { e.preventDefault(); }} className="mx-auto mt-6 flex max-w-md gap-2">
            <input type="email" placeholder="you@company.com" className="glass flex-1 rounded-md px-4 py-2 text-sm outline-none ring-0 focus:glow-ring" />
            <Button type="submit" className="bg-gradient-to-r from-primary to-accent">Get updates</Button>
          </form>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Free to start</span>
            <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent"><Sparkles className="h-3.5 w-3.5" /></span>
            <span className="font-semibold text-foreground">EventFlow Pro</span>
          </div>
          <div>© {new Date().getFullYear()} EventFlow. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
