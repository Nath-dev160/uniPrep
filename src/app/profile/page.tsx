import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProfileCard } from "@/features/auth/components/profile-card";
import { getCurrentSessionUser } from "@/features/auth/server";

export default async function ProfilePage() {
  const { configured, user, profile } = await getCurrentSessionUser();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 py-16 md:py-24">
        <div className="container">
          <nav
            aria-label="Breadcrumb"
            className="mx-auto mb-6 flex max-w-xl items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Link
              href="/"
              className="transition-colors hover:text-foreground"
            >
              Home
            </Link>
            <span aria-hidden>/</span>
            <span className="font-medium text-foreground">Profile</span>
          </nav>

          <ProfileCard
            configured={configured}
            email={user?.email ?? null}
            emailVerified={Boolean(user?.email_confirmed_at)}
            profile={profile}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
