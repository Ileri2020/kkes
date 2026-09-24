"use client";

import { FormEvent, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ROLE_DASHBOARDS } from "@/lib/roles";

function destination(role?: string) {
  return ROLE_DASHBOARDS[String(role ?? "").toUpperCase() as keyof typeof ROLE_DASHBOARDS] ?? "/";
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace(destination(session?.user?.role));
  }, [router, session?.user?.role, status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: searchParams.get("callbackUrl") ?? "/",
      });
      if (result?.error) {
        setError("Invalid credentials or inactive account.");
      } else {
        await router.refresh();
      }
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md border border-border bg-card p-8 shadow-xl">
      <p className="mb-3 text-xs uppercase tracking-[0.25em] text-accent">Kith & Kin account</p>
      <h1 className="text-3xl font-semibold">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">Use your school account to continue.</p>
      <form onSubmit={submit} className="mt-8 grid gap-4">
        <input className="border border-input bg-background px-3 py-3" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" required />
        <input className="border border-input bg-background px-3 py-3" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" required />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button className="bg-accent px-4 py-3 font-semibold text-accent-foreground disabled:opacity-60" disabled={busy} type="submit">{busy ? "Signing in..." : "Sign in"}</button>
      </form>
      <div className="my-5 grid grid-cols-2 gap-3">
        <button type="button" className="border border-border px-3 py-2 text-sm" onClick={() => signIn("google", { callbackUrl: "/" })}>Google</button>
        <button type="button" className="border border-border px-3 py-2 text-sm" onClick={() => signIn("facebook", { callbackUrl: "/" })}>Facebook</button>
      </div>
      <a href="/forgot-password" className="text-sm text-accent hover:underline">Forgot password?</a>
    </div>
  );
}
