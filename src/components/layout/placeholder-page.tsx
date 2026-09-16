import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PlaceholderPageProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Short note about what real functionality will land here later. */
  comingSoon: string;
}

/**
 * Shared shell for routes that exist in the route map (Section 23 of
 * PROJECT_SPEC.md) but don't have real functionality yet. Keeps every
 * placeholder visually consistent and clearly labelled as a placeholder,
 * rather than silently pretending the feature works.
 */
export function PlaceholderPage({
  icon: Icon,
  title,
  description,
  comingSoon,
}: PlaceholderPageProps) {
  return (
    <>
      <SiteHeader />
      <main className="container flex min-h-[70vh] flex-col items-center justify-center gap-5 py-24 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sand/60">
          <Icon className="h-5 w-5 text-brown" aria-hidden />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-medium text-foreground">
            {title}
          </h1>
          <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        <Badge variant="muted" className="mt-1">
          {comingSoon}
        </Badge>

        <Button asChild variant="outline" className="mt-2">
          <Link href="/">Back to home</Link>
        </Button>
      </main>
      <SiteFooter />
    </>
  );
}
