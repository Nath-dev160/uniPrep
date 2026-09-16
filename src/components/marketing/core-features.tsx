import { BookOpenCheck, Gauge, LineChart } from "lucide-react";

const FEATURES = [
  {
    icon: BookOpenCheck,
    title: "Practice",
    body: "Work through real course questions at your own pace. See where you went wrong and learn from every mistake before it costs you marks.",
  },
  {
    icon: Gauge,
    title: "Exam Simulation",
    body: "Step into timed conditions that mirror the real thing. Build the pacing and composure that only come from practicing under pressure.",
  },
  {
    icon: LineChart,
    title: "Performance Tracking",
    body: "Follow your accuracy, your answering speed, and exactly which topics need another look — across every course you're preparing for.",
  },
] as const;

export function CoreFeatures() {
  return (
    <section className="container py-24">
      <div className="max-w-2xl">
        <h2 className="font-serif text-3xl font-medium text-foreground sm:text-4xl">
          Everything you need to walk in ready.
        </h2>
      </div>

      <div className="mt-14 grid gap-x-10 gap-y-12 md:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="border-l-2 border-terracotta pl-6">
            <Icon className="h-6 w-6 text-terracotta" aria-hidden />
            <h3 className="mt-4 font-serif text-xl font-medium text-foreground">
              {title}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
