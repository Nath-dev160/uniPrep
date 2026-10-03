import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ForgotPasswordForm } from "@/features/auth/components/auth-forms";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function ForgotPasswordPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 py-16 md:py-24">
        <div className="container">
          <nav
            aria-label="Breadcrumb"
            className="mx-auto mb-6 flex max-w-md items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Link
              href="/"
              className="transition-colors hover:text-foreground"
            >
              Home
            </Link>
            <span aria-hidden>/</span>
            <span className="font-medium text-foreground">
              Forgot your password?
            </span>
          </nav>

          <ForgotPasswordForm configured={configured} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
