export function AuthRoute({ section }: { section: string }) {
  return (
    <main className="flex min-h-[calc(100vh-58px)] items-center justify-center px-6 py-16">
      <section className="w-full max-w-md border border-border bg-card p-8 shadow-xl">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-accent">Kith & Kin account</p>
        <h1 className="text-3xl font-semibold">{section}</h1>
        <p className="mt-3 text-sm text-muted-foreground">This authentication page shell is ready for its form and session action.</p>
      </section>
    </main>
  );
}
