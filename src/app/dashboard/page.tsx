import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Gauge,
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

export default function DashboardPage() {
  return (
    <>
      <SiteHeader />
      <main className="container py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="font-serif text-3xl font-medium text-foreground">
              Let's get you ready.
            </h1>
          </div>
          <Badge variant="muted">Demo preview — no data connected yet</Badge>
        </div>

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
    </>
  );
}
