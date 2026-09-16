import Link from "next/link";
import { GraduationCap } from "lucide-react";

const FOOTER_LINKS = [
  { href: "/courses", label: "Courses" },
  { href: "/practice", label: "Practice" },
  { href: "/exams", label: "Exams" },
  { href: "/performance", label: "Performance" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-cream">
      <div className="container flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 font-serif text-base text-foreground">
          <GraduationCap className="h-4 w-4 text-primary" aria-hidden />
          UniPrep
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} UniPrep. Prepare with purpose.
        </p>
      </div>
    </footer>
  );
}
