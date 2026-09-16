"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for now. A real error-reporting pipeline can hook in here later.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden />
      <h1 className="font-serif text-3xl font-medium text-foreground">
        Something went wrong.
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        UniPrep ran into an unexpected error. You can try again, or head back
        to the homepage.
      </p>
      <Button className="mt-2" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
