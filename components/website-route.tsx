export function WebsiteRoute({ section }: { section: string }) {
  return (
    <main className="min-h-[calc(100vh-58px)] px-6 py-16">
      <div className="mx-auto max-w-6xl border border-border bg-card p-8 shadow-xl sm:p-12">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-accent">Kith & Kin School</p>
        <h1 className="text-4xl font-semibold tracking-tight">{section}</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">This public school website page is ready for its content and data layer.</p>
      </div>
    </main>
  );
}
