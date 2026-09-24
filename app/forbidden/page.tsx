import Link from "next/link";

export default function Forbidden() {
  return <main className="flex min-h-[calc(100vh-58px)] items-center justify-center px-6 py-16"><section className="max-w-md border border-border bg-card p-8 text-center"><h1 className="text-2xl font-semibold">Access denied</h1><p className="mt-3 text-sm text-muted-foreground">Your role is not authorised to use this area.</p><Link className="mt-6 inline-flex bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground" href="/">Return home</Link></section></main>;
}