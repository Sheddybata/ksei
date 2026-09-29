"use client";

import { useState, useTransition } from "react";
import { login } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/input";

const demos = [
  { label: "Administrator", email: "admin@ksei.org.ng", password: "Empower2026!" },
  { label: "Instructor", email: "instructor@ksei.org.ng", password: "Lead2026!" },
  { label: "Student", email: "ada.okonkwo@ksei.org.ng", password: "Learn2026!" },
];

export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function signIn(nextEmail: string, nextPassword: string) {
    setError(null);
    startTransition(() => {
      void (async () => {
        const result = await login({ email: nextEmail, password: nextPassword, next });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        window.location.href = result.redirectTo;
      })();
    });
  }

  return (
    <div className="space-y-6">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          signIn(email, password);
        }}
      >
        <Field>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" />
        </Field>
        <Field>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
        </Field>
        {error ? <p className="text-sm text-red-800">{error}</p> : null}
        <Button disabled={pending} type="submit" className="w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-deep">Demonstration access</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {demos.map((demo) => (
            <Button
              key={demo.email}
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => {
                setEmail(demo.email);
                setPassword(demo.password);
                signIn(demo.email, demo.password);
              }}
            >
              {demo.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
