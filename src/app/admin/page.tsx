import Link from "next/link";
import { ShieldAlert, ShieldCheck } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminWorkspace } from "@/features/admin/components/admin-workspace";
import { getFullAcademicHierarchy } from "@/features/academic/queries";
import { getCurrentSessionUser } from "@/features/auth/server";
import {
  getAdminQuestions,
  getQuestionSources,
} from "@/features/questions/queries";

interface AdminPageProps {
  searchParams?: Promise<{ tab?: string }> | { tab?: string };
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const resolvedParams = await searchParams;
  const initialTab =
    resolvedParams?.tab === "academic" ? "academic" : "questions";
  const { user, profile } = await getCurrentSessionUser();

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="container flex-1 py-16">
          <Card className="mx-auto max-w-md border-border">
            <CardHeader>
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-primary">
                <ShieldAlert className="h-5 w-5" aria-hidden />
              </div>
              <CardTitle className="mt-2 text-2xl">Sign In Required</CardTitle>
              <CardDescription className="text-base">
                Administrator privileges are required to access this area. Please sign in with an administrator account to continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/login?next=/admin">Sign in</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">Return to Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Enforce server-side role check
  if (profile?.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="container flex-1 py-16">
          <Card className="mx-auto max-w-md border-destructive/30">
            <CardHeader>
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                <ShieldAlert className="h-5 w-5" aria-hidden />
              </div>
              <CardTitle className="mt-2 text-2xl">Access Restricted</CardTitle>
              <CardDescription className="text-base">
                Administrator privileges are required to access this area. Your current account role is{" "}
                <span className="font-semibold text-foreground">{profile?.role || "student"}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If you believe you should have administrative access, please contact the system administrator to configure your profile role.
              </p>
              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/dashboard">Return to Dashboard</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/profile">View Profile</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // User is confirmed administrator
  const [hierarchyData, questionsResult, sources] = await Promise.all([
    getFullAcademicHierarchy(),
    getAdminQuestions({}, 1, 15),
    getQuestionSources(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container flex-1 py-10">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                Administration Workspace
              </span>
              <Badge variant="accent" className="gap-1">
                <ShieldCheck className="h-3 w-3" /> Admin Mode
              </Badge>
            </div>
            <h1 className="font-serif text-3xl font-medium text-foreground mt-1">
              Curriculum & Question Bank
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage institution academic hierarchies and author questions with full version tracking.
            </p>
          </div>
        </div>

        {/* Manager Interface */}
        <AdminWorkspace
          hierarchyData={hierarchyData}
          initialQuestions={questionsResult.questions}
          initialTotalCount={questionsResult.totalCount}
          initialPage={questionsResult.page}
          initialPageSize={questionsResult.pageSize}
          sources={sources}
          initialTab={initialTab}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
