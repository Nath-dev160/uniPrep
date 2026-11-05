import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  FileQuestion,
  Gauge,
  GraduationCap,
  Layers,
  School,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { getStudentAcademicDetails } from "@/features/academic/queries";
import { getCurrentSessionUser } from "@/features/auth/server";

/**
 * DEMO DATA — visual foundation only.
 *
 * Nothing on this page is connected to Supabase, a real student, or any
 * database table yet. Every number below is a placeholder used purely to
 * establish the dashboard's layout ahead of Phase 2 (database + auth) and
 * the performance-tracking work in Phase 7 of PROJECT_SPEC.md.
 */
const DEMO_STATS = [
  { label: "Accuracy", value: "—", icon: Target },
  { label: "Avg. answering speed", value: "—", icon: Zap },
  { label: "Questions answered", value: "0", icon: BookOpenCheck },
] as const;

const DEMO_COURSE_PROGRESS = [
  { course: "EEE305 — Control Systems", progress: 0 },
  { course: "EEE301 — Electromagnetics", progress: 0 },
  { course: "EEE309 — Power Systems I", progress: 0 },
] as const;

export default async function DashboardPage() {
  const { user, profile } = await getCurrentSessionUser();
  const academicDetails = await getStudentAcademicDetails(profile);

  const isAdmin = profile?.role === "admin";
  const needsOnboarding = Boolean(user && !isAdmin && !profile?.onboarding_completed);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container flex-1 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {profile?.display_name ? `Welcome back, ${profile.display_name}` : "Welcome back"}
            </p>
            <h1 className="font-serif text-3xl font-medium text-foreground">
              Let&apos;s get you ready.
            </h1>

            {/* Active Academic Context Badge */}
            {profile?.onboarding_completed && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <School className="mr-1 h-3 w-3" />
                  {academicDetails.university?.name || "University"}
                </Badge>
                {academicDetails.department && (
                  <Badge variant="secondary" className="text-xs">
                    <Layers className="mr-1 h-3 w-3" />
                    {academicDetails.department.name}
                  </Badge>
                )}
                {academicDetails.academicLevel && (
                  <Badge variant="accent" className="text-xs">
                    {academicDetails.academicLevel.code}
                  </Badge>
                )}
                <Link
                  href="/profile"
                  className="text-xs text-primary hover:underline ml-1"
                >
                  Change
                </Link>
              </div>
            )}
          </div>
          <Badge variant="muted">
            {user ? (isAdmin ? "Admin Account" : "Student Account") : "Demo preview — no data connected yet"}
          </Badge>
        </div>

        {/* Onboarding Incomplete Banner */}
        {needsOnboarding && (
          <div className="mt-6 rounded-lg border border-terracotta/40 bg-terracotta/10 p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-foreground">Academic Setup Incomplete</h3>
              <p className="text-sm text-muted-foreground">
                Select your university, faculty, department, and academic level so UniPrep can tailor your courses.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/onboarding">Complete Setup Now</Link>
            </Button>
          </div>
        )}

        {/* Admin Shortcut Banner */}
        {isAdmin && (
          <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Administrator Workspace</p>
                <p className="text-xs text-muted-foreground">
                  You have administrator access. Manage curriculum questions and institutional academic hierarchies.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="default" className="gap-1.5">
                <Link href="/admin?tab=questions">
                  <FileQuestion className="h-4 w-4" />
                  Question Bank
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link href="/admin?tab=academic">
                  <GraduationCap className="h-4 w-4" />
                  Academic Hierarchy
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Primary actions */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card className="border-terracotta/30 bg-terracotta/5 transition-colors hover:border-terracotta/50">
            <CardHeader>
              <BookOpenCheck className="h-5 w-5 text-terracotta" aria-hidden />
              <CardTitle className="mt-2">Practice</CardTitle>
              <CardDescription>
                Work through questions at your own pace and see where you
                stand.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/practice">
                  Start practicing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-teal/30 bg-teal/5 transition-colors hover:border-teal/50">
            <CardHeader>
              <Gauge className="h-5 w-5 text-teal" aria-hidden />
              <CardTitle className="mt-2">Exam Simulation</CardTitle>
              <CardDescription>
                Sit a timed test under real examination conditions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary">
                <Link href="/exams">
                  Start a simulation
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {DEMO_STATS.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-1 font-serif text-3xl font-medium text-foreground">
                    {value}
                  </p>
                </div>
                <Icon className="h-5 w-5 text-warmgray" aria-hidden />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Course progress + strengths/weaknesses */}
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Course progress</CardTitle>
              <CardDescription>
                Once you start practicing, your progress per course will show
                up here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {DEMO_COURSE_PROGRESS.map(({ course, progress }) => (
                <div key={course}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-foreground">{course}</span>
                    <span className="text-muted-foreground">
                      {progress}%
                    </span>
                  </div>
                  <Progress value={progress} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Strengths &amp; gaps</CardTitle>
              <CardDescription>
                Topic-level insight will appear after your first practice
                session.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2.5">
                <TrendingUp
                  className="mt-0.5 h-4 w-4 shrink-0 text-success"
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Strengths
                  </p>
                  <p className="text-sm text-muted-foreground">
                    No practice data yet.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-2.5">
                <TrendingDown
                  className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Areas needing improvement
                  </p>
                  <p className="text-sm text-muted-foreground">
                    No practice data yet.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
