import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Hero photograph. Place the real exam photo at public/images/hero-exam.jpg
          — see README.md for details. */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-[position:50%_30%]"
        style={{ backgroundImage: "url('/images/hero-exam.jpg')" }}
        role="img"
        aria-label="A student holding a graded exam paper marked A+ in a classroom"
      />
      {/* Warm, dark gradient overlay for text readability. Strongest on the
          left where the copy sits, easing off toward the right so the
          photograph stays visible. */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(100deg, rgba(50,24,12,0.94) 0%, rgba(50,24,12,0.82) 32%, rgba(50,24,12,0.55) 58%, rgba(50,24,12,0.28) 78%, rgba(50,24,12,0.15) 100%)",
        }}
      />

      <div className="container flex min-h-[86vh] items-center py-24">
        <div className="max-w-xl">
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.2em] text-terracotta">
            University learning platform
          </p>

          <h1 className="font-serif text-5xl font-medium leading-[1.05] text-cream sm:text-6xl">
            Prepare with purpose.
          </h1>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-ivory/85">
            Practice your courses, simulate real examinations, and understand
            where you need to improve.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/practice">
                Start Practicing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-cream/40 text-cream hover:bg-cream/10 hover:text-cream"
            >
              <Link href="/courses">
                <Compass className="h-4 w-4" />
                Explore Courses
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
