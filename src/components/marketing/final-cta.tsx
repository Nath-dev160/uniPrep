import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="bg-espresso">
      <div className="container flex flex-col items-start gap-6 py-24 sm:items-center sm:text-center">
        <h2 className="max-w-lg font-serif text-3xl font-medium text-cream sm:text-4xl">
          Your next test starts here.
        </h2>
        <Button asChild size="lg">
          <Link href="/signup">
            Create your free account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
