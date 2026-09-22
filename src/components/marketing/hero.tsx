import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-espresso">
      <Image
        src="/images/hero-exam.jpg"
        alt="A student reviewing a graded exam paper marked A+ in a university classroom"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[50%_28%]"
      />

      {/* Warm, dark gradient overlay for text readability. Strongest on the
          left where the copy sits, easing off toward the right so the
          photograph stays visible and prominent. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, rgba(50,24,12,0.96) 0%, rgba(50,24,12,0.88) 30%, rgba(50,24,12,0.6) 55%, rgba(50,24,12,0.32) 74%, rgba(50,24,12,0.16) 100%)",
        }}
      />
      <div aria-hidden className="absolute inset-0 bg-grain" />

      <div className="container relative flex min-h-[88svh] items-center py-28">
        <div className="max-w-xl animate-fade-up">
          <p className="mb-4 font-serif text-lg italic text-terracotta">
            University learning platform
          </p>

          <h1 className="text-balance font-serif text-5xl font-medium leading-[1.08] text-cream sm:text-6xl">
            Prepare with purpose.
          </h1>

          <p className="mt-6 max-w-md text-balance text-lg leading-relaxed text-ivory/80">
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
              className="border-cream/35 text-cream hover:bg-cream/10 hover:text-cream"
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
