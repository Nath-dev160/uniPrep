import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <Compass className="h-8 w-8 text-terracotta" aria-hidden />
      <h1 className="font-serif text-3xl font-medium text-foreground">
        This page hasn't been mapped yet.
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page you're looking for doesn't exist, or hasn't been built yet.
      </p>
      <Button asChild className="mt-2">
        <Link href="/">Back to UniPrep</Link>
      </Button>
    </div>
  );
}
