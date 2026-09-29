import Link from "next/link";
import { ArrowRight, BookOpen, Backpack, GraduationCap, PencilRuler, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = [
  {
    title: "Textbooks & readers",
    description: "Course books, recommended reading, and supporting learning materials.",
    icon: BookOpen,
    tint: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  {
    title: "Exercise books & stationery",
    description: "Writing books, pens, pencils, and everyday classroom essentials.",
    icon: PencilRuler,
    tint: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  {
    title: "School supplies",
    description: "Useful items students need to stay organised and ready to learn.",
    icon: Backpack,
    tint: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  {
    title: "School wear",
    description: "Ask the school about uniform items and availability for your student.",
    icon: Shirt,
    tint: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
];

export default function BookshopPage() {
  return (
    <main className="min-h-[calc(100vh-58px)] overflow-hidden bg-gradient-to-b from-accent/[0.07] via-background to-background">
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-10 sm:px-6 sm:pt-16 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-accent/15 bg-card shadow-xl shadow-accent/5">
          <div aria-hidden="true" className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative grid gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1fr_auto] lg:items-center lg:px-14">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                <GraduationCap className="h-4 w-4" /> School essentials
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">The Kith and Kin <span className="text-accent">Bookshop</span></h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                A convenient place to find the books and everyday supplies that support learning. Contact the school for current availability, prices, and class-specific requirements.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-xl px-6 shadow-lg shadow-accent/15">
                  <Link href="/contact">Ask about availability <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl px-6">
                  <Link href="/account">Student and parent account</Link>
                </Button>
              </div>
            </div>
            <div aria-hidden="true" className="mx-auto flex h-40 w-40 items-center justify-center rounded-[2rem] border border-accent/15 bg-background/80 shadow-inner sm:h-52 sm:w-52 lg:mr-4">
              <BookOpen className="h-20 w-20 text-accent sm:h-28 sm:w-28" strokeWidth={1.25} />
            </div>
          </div>
        </div>

        <div className="mt-12 sm:mt-16">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Browse essentials</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">What you may need</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">Availability can vary by term and class. Please confirm requirements with the school before purchasing.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map(({ title, description, icon: Icon, tint }) => (
              <article key={title} className="group rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5">
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${tint}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{description}</p>
                <Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
                  Enquire <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-border/70 bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="font-semibold">Need a class book list?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Contact the school to confirm the current list and purchase details.</p>
          </div>
          <Button asChild variant="outline" className="shrink-0 rounded-xl">
            <Link href="/contact">Contact the school <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
