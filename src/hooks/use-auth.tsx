import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "organizer" | "user";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        supabase.from("user_roles").select("role").eq("user_id", s.user.id).then(({ data }) => {
          if (mounted) setRoles(((data ?? []) as { role: AppRole }[]).map((r) => r.role));
        });
      } else {
        setRoles([]);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (data.session?.user) {
        supabase.from("user_roles").select("role").eq("user_id", data.session.user.id).then(({ data: r }) => {
          if (mounted) setRoles(((r ?? []) as { role: AppRole }[]).map((x) => x.role));
        });
      }
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  return {
    user, session, roles, loading,
    isAdmin: roles.includes("admin"),
    isOrganizer: roles.includes("organizer") || roles.includes("admin"),
    signOut: async () => { await supabase.auth.signOut(); },
  };
}
