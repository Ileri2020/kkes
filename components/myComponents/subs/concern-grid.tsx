"use client";

import Link from "next/link";
import { 
  HeartPulse, 
  Baby, 
  BrainCircuit, 
  Syringe, 
  Stethoscope, 
  Dna, 
  Zap,
  Activity,
  Trees,
  User,
  Users
} from "lucide-react";

const concerns = [
  { name: "Pain Relief",      icon: HeartPulse,   color: "text-red-500",    bg: "bg-red-50 dark:bg-red-950/40", category: "Pain Relief" },
  { name: "Cough, Cold & Flu",icon: Activity,     color: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-950/40", category: "Cough, Cold & Flu" },
  { name: "Mother & Kids",    icon: Baby,         color: "text-pink-500",   bg: "bg-pink-50 dark:bg-pink-950/40", category: "Baby & Child Health" },
  { name: "Gut Health",       icon: Zap,          color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/40", category: "Gut Health" },
  { name: "Vitamins",         icon: Trees,        color: "text-green-500",  bg: "bg-green-50 dark:bg-green-950/40", category: "Vitamins" },
  { name: "His Health",       icon: User,         color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/40", category: "His Health" },
  { name: "Her Health",       icon: Users,        color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/40", category: "Her Health" },
  { name: "Mental Wellness",  icon: BrainCircuit, color: "text-teal-500",   bg: "bg-teal-50 dark:bg-teal-950/40", category: "Stress & Sleep" },
];

const ShopByConcern = () => {
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Shop by Health Concern</h2>
          <p className="text-muted-foreground mt-2">Find exactly what you need for your specific wellness goals</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {concerns.map((concern) => (
            <Link 
              key={concern.name}
              href={`/store?concern=${encodeURIComponent(concern.name)}`}
              className="flex flex-col items-center p-6 rounded-2xl border bg-card hover:border-primary hover:shadow-lg transition-all duration-300 group"
            >
              <div className={`w-12 h-12 rounded-xl ${concern.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <concern.icon className={`w-6 h-6 ${concern.color}`} />
              </div>
              <span className="text-xs font-bold text-center group-hover:text-primary transition-colors">
                {concern.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopByConcern;

