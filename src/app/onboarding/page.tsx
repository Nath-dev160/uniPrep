import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OnboardingForm } from "@/features/academic/components/onboarding-form";
import {
  getAcademicLevels,
  getDepartments,
  getFaculties,
  getUniversities,
} from "@/features/academic/queries";
import { getCurrentSessionUser } from "@/features/auth/server";

export default async function OnboardingPage() {
  const { user, profile } = await getCurrentSessionUser();

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="container flex-1 py-16">
          <Card className="mx-auto max-w-md text-center">
            <CardHeader className="items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
                <GraduationCap className="h-6 w-6" aria-hidden />
              </div>
              <CardTitle className="font-serif text-2xl mt-2">
                Sign In Required
              </CardTitle>
              <CardDescription className="text-base max-w-md">
                Please sign in or create an account to configure your university, faculty, department, and academic level.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-3">
              <Button asChild>
                <Link href="/login?next=/onboarding">Sign in</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/signup">Create account</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Fetch all active hierarchy items so client cascading selector is responsive and instant
  const [universities, faculties, departments, academicLevels] = await Promise.all([
    getUniversities(true),
    getFaculties(undefined, true),
    getDepartments(undefined, true),
    getAcademicLevels(undefined, true),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-16">
        <div className="container">
          <nav
            aria-label="Breadcrumb"
            className="mx-auto mb-6 flex max-w-2xl items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Link href="/" className="transition-colors hover:text-foreground">
              Home
            </Link>
            <span aria-hidden>/</span>
            <Link
              href="/dashboard"
              className="transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <span aria-hidden>/</span>
            <span className="font-medium text-foreground">Academic Onboarding</span>
          </nav>

          <OnboardingForm
            initialProfile={profile}
            universities={universities}
            faculties={faculties}
            departments={departments}
            academicLevels={academicLevels}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
