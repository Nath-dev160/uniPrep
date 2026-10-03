import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { signOutAction } from "@/features/auth/actions";
import { getCurrentSessionUser } from "@/features/auth/server";

const NAV_LINKS = [
  { href: "/courses", label: "Courses" },
  { href: "/practice", label: "Practice" },
  { href: "/exams", label: "Exams" },
  { href: "/performance", label: "Performance" },
] as const;

export async function SiteHeader() {
  const { user, profile } = await getCurrentSessionUser();
  const isAuthenticated = Boolean(user);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-serif text-lg font-medium text-foreground"
        >
          <GraduationCap className="h-5 w-5 text-primary" aria-hidden />
          UniPrep
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/profile">
                  {profile?.display_name || "Profile"}
                </Link>
              </Button>
              <form action={signOutAction}>
                <Button type="submit" variant="outline" size="sm">
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        <MobileNav isAuthenticated={isAuthenticated} />
      </div>
    </header>
  );
}
