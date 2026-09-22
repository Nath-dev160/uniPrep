"use client";

import * as React from "react";
import Link from "next/link";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { GraduationCap, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/courses", label: "Courses" },
  { href: "/practice", label: "Practice" },
  { href: "/exams", label: "Exams" },
  { href: "/performance", label: "Performance" },
] as const;

export function MobileNav() {
  const [open, setOpen] = React.useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-espresso/60 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 md:hidden" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 right-0 z-50 flex w-[86%] max-w-sm flex-col bg-cream shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-300 md:hidden"
        >
          <DialogPrimitive.Title className="sr-only">
            Navigation menu
          </DialogPrimitive.Title>

          <div className="flex h-16 items-center justify-between border-b border-border px-6">
            <span className="flex items-center gap-2 font-serif text-lg font-medium text-foreground">
              <GraduationCap className="h-5 w-5 text-primary" aria-hidden />
              UniPrep
            </span>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </DialogPrimitive.Close>
          </div>

          <nav className="flex flex-col gap-1 px-4 py-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-3 text-base text-foreground transition-colors hover:bg-muted/60"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-3 border-t border-border px-4 py-6">
            <Button asChild variant="outline" onClick={() => setOpen(false)}>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild onClick={() => setOpen(false)}>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
