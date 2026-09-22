import Link from "next/link";

import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-espresso">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 90% at 50% 0%, rgba(168,111,79,0.28) 0%, rgba(50,24,12,0) 70%)",
        }}
      />
      <div className="container relative flex flex-col items-start gap-6 py-24 sm:items-center sm:py-28 sm:text-center">
        <h2 className="max-w-lg text-balance font-serif text-3xl font-medium text-cream sm:text-4xl">
          Your next test starts here.
        </h2>
        <Button asChild size="lg">
          <Link href="/signup">Create your free account</Link>
        </Button>
      </div>
    </section>
  );
}
