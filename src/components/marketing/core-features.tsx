import Link from "next/link";
import { ArrowRight, BookOpenCheck, Gauge, LineChart } from "lucide-react";

import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: BookOpenCheck,
    title: "Practice",
    body: "Work through real course questions at your own pace. See where you went wrong and learn from every mistake before it costs you marks.",
    href: "/practice",
    tint: "bg-terracotta/10 text-terracotta",
  },
  {
    icon: Gauge,
    title: "Exam Simulation",
    body: "Step into timed conditions that mirror the real thing. Build the pacing and composure that only come from practicing under pressure.",
    href: "/exams",
    tint: "bg-brown/10 text-brown",
  },
  {
    icon: LineChart,
    title: "Performance Tracking",
    body: "Follow your accuracy, your answering speed, and exactly which topics need another look — across every course you're preparing for.",
    href: "/performance",
    tint: "bg-teal/10 text-teal",
  },
] as const;

export function CoreFeatures() {
  return (
    <section className="container py-24 sm:py-28">
      <div className="max-w-2xl">
        <h2 className="text-balance font-serif text-3xl font-medium text-foreground sm:text-4xl">
          Everything you need to walk in ready.
        </h2>
      </div>

      <div className="mt-14 grid gap-8 md:grid-cols-3 md:gap-10">
        {FEATURES.map(({ icon: Icon, title, body, href, tint }) => (
          <Link
            key={title}
            href={href}
            className="group block rounded-lg border border-border bg-card p-7 transition-colors hover:border-terracotta/40"
          >
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full",
                tint
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="mt-5 font-serif text-xl font-medium text-foreground">
              {title}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              {body}
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-terracotta">
              Explore
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
