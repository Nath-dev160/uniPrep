import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PlaceholderCta {
  label: string;
  href: string;
}

interface PlaceholderPageProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Primary action for this placeholder — usually a link to a related, working page. */
  primaryCta?: PlaceholderCta;
  /** Secondary action. Defaults to "Back to home". */
  secondaryCta?: PlaceholderCta;
}

/**
 * Shared shell for routes that exist in the route map (Section 23 of
 * PROJECT_SPEC.md) but don't have real functionality yet. Keeps every
 * placeholder visually consistent with the UniPrep design system and
 * clearly labelled as not-yet-functional, rather than silently pretending
 * the feature works.
 */
export function PlaceholderPage({
  icon: Icon,
  title,
  description,
  primaryCta,
  secondaryCta = { label: "Back to home", href: "/" },
}: PlaceholderPageProps) {
  return (
    <>
      <SiteHeader />
      <main className="container py-16 sm:py-20">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-foreground">{title}</span>
        </nav>

        <div className="mx-auto mt-10 flex max-w-lg flex-col items-center gap-5 text-center sm:mt-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sand/60">
            <Icon className="h-5 w-5 text-brown" aria-hidden />
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-medium text-foreground">
              {title}
            </h1>
            <p className="text-balance text-[15px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>

          <Badge variant="muted">Coming in a future phase</Badge>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            {primaryCta && (
              <Button asChild>
                <Link href={primaryCta.href}>{primaryCta.label}</Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
