import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — EventFlow" }] }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase places recovery info in URL hash
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setReady(true);
    } else {
      supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password too short"); return; }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); navigate({ to: "/dashboard" }); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="glass w-full max-w-md space-y-4 rounded-3xl p-8 glow-ring">
        <h1 className="text-2xl font-semibold">Set a new password</h1>
        {ready ? (
          <>
            <div><Label htmlFor="np">New password</Label><Input id="np" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required /></div>
            <Button className="w-full bg-gradient-to-r from-primary to-accent">Update password</Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Open the password reset link from your email to continue.</p>
        )}
      </form>
    </div>
  );
}
