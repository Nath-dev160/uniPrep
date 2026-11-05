"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, LogIn, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sanitized client diagnostic log for developer troubleshooting
    const correlationId = error.digest || "client-uncaught";
    console.error(`[UniPrep:ErrorBoundary:${correlationId}]`, {
      digest: error.digest,
      message: error.message || "An unexpected rendering error occurred",
    });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-7 w-7" aria-hidden />
      </div>

      <div className="space-y-2">
        <h1 className="font-serif text-3xl font-medium text-foreground">
          Something went wrong.
        </h1>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          UniPrep encountered an unexpected issue while loading this view. You
          can try refreshing the state, return to the login screen, or head back
          to the homepage.
        </p>
      </div>

      {error.digest && (
        <div className="rounded-md border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground font-mono">
          <span>Error Reference: </span>
          <span className="font-semibold text-foreground">{error.digest}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => reset()} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Try again
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <a href="/login">
            <LogIn className="h-4 w-4" />
            Sign in
          </a>
        </Button>
        <Button asChild variant="ghost" className="gap-2">
          <a href="/">
            <Home className="h-4 w-4" />
            Homepage
          </a>
        </Button>
      </div>
    </div>
  );
}
