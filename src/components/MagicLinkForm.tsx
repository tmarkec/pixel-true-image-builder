import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function MagicLinkForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const clean = email.trim();
    if (!EMAIL_RE.test(clean)) {
      setError("That email doesn't look right. Check it and try again.");
      return;
    }
    if (mode === "signup" && !consent) {
      setError("Tick the box to confirm your age or permission before you sign up.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: clean,
      options: {
        emailRedirectTo: window.location.origin,
        shouldCreateUser: mode === "signup",
        data:
          mode === "signup"
            ? { age_or_permission_confirmed: true, confirmed_at: new Date().toISOString() }
            : undefined,
      },
    });
    setBusy(false);
    if (error) {
      if (mode === "login" && /signups not allowed|not found/i.test(error.message)) {
        setError("We couldn't find an account with that email. Sign up first.");
      } else if (/rate/i.test(error.message)) {
        setError("Too many attempts. Wait a few minutes and try again.");
      } else {
        setError("We couldn't send the email. Try again in a moment.");
      }
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-md border bg-surface p-5">
        <h2 className="text-2xl font-bold">Check your email</h2>
        <p className="mt-2 text-muted-foreground">
          We've sent a link to <strong className="text-foreground">{email.trim()}</strong>. Open it on
          this device to {mode === "signup" ? "confirm your account and log in" : "log in"}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="secretary@yourclub.ie"
        />
      </div>

      {mode === "signup" && (
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <Checkbox
              id="consent"
              checked={consent}
              onCheckedChange={(v) => setConsent(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="consent" className="leading-snug font-normal">
              I'm 18 or over, or I have permission from a parent, guardian or my club to use this site
            </Label>
          </div>
          <p className="pl-7 text-sm text-muted-foreground">
            Read our{" "}
            <Link to="/privacy" className="text-primary underline underline-offset-2">
              privacy policy
            </Link>
            .
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Sending..." : mode === "signup" ? "Sign up" : "Email me a login link"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link to="/login" className="text-primary underline underline-offset-2">Log in</Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link to="/signup" className="text-primary underline underline-offset-2">Sign up</Link>
          </>
        )}
      </p>
    </form>
  );
}
