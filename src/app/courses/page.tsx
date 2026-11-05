import Link from "next/link";
import {
  BookOpen,
  FileQuestion,
  GraduationCap,
  Layers,
  School,
  Sparkles,
} from "lucide-react";

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
import {
  getStudentAcademicDetails,
  getStudentCourses,
} from "@/features/academic/queries";
import { getCurrentSessionUser } from "@/features/auth/server";
import { StudentQuestionBrowser } from "@/features/questions/components/student-question-browser";
import { getStudentDeliveredQuestions } from "@/features/questions/student-delivery.queries";
import type {
  StudentQuestionsResponse,
  StudentSafeCourse,
} from "@/features/questions/student-delivery.types";

interface CoursesPageProps {
  searchParams?:
    | Promise<{ courseId?: string; view?: string }>
    | { courseId?: string; view?: string };
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const resolvedParams = await searchParams;
  const { user, profile } = await getCurrentSessionUser();

  // If unauthenticated or onboarding not yet completed, render clean onboarding prompt
  if (!user || !profile?.onboarding_completed) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="container flex-1 py-16">
          <Card className="mx-auto max-w-xl text-center">
            <CardHeader className="items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
                <BookOpen className="h-6 w-6" aria-hidden />
              </div>
              <CardTitle className="font-serif text-2xl mt-2">
                Course Curriculum & Question Delivery
              </CardTitle>
              <CardDescription className="text-base max-w-md">
                {!user
                  ? "Sign in and complete your academic onboarding to see courses and browse published questions tailored to your university, department, and level."
                  : "Complete your academic onboarding to connect your department and access verified course questions."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-3">
              {!user ? (
                <>
                  <Button asChild>
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/signup">Create account</Link>
                  </Button>
                </>
              ) : (
                <Button asChild>
                  <Link href="/onboarding">Complete Academic Onboarding</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Student has completed onboarding
  const [academicDetails, rawCourses] = await Promise.all([
    getStudentAcademicDetails(profile),
    getStudentCourses(profile),
  ]);

  const courses: StudentSafeCourse[] = rawCourses.map((c) => ({
    id: c.id,
    code: c.code,
    title: c.title,
    credit_units: c.credit_units,
    semester: c.semester as any,
  }));

  // Resolve initial course to load
  const requestedCourseId = resolvedParams?.courseId;
  const initialCourse =
    courses.find((c) => c.id === requestedCourseId) || courses[0];
  const initialCourseId = initialCourse?.id;

  let initialDeliveryResponse: StudentQuestionsResponse | null = null;
  let initialDeliveryError: any = null;

  if (initialCourseId) {
    const deliveryResult = await getStudentDeliveredQuestions(profile, {
      courseId: initialCourseId,
      page: 1,
      pageSize: 10,
    });
    if (deliveryResult.success && deliveryResult.data) {
      initialDeliveryResponse = deliveryResult.data;
    } else if (deliveryResult.error) {
      initialDeliveryError = deliveryResult.error;
    }
  }

  const activeTab = resolvedParams?.view === "catalogue" ? "catalogue" : "browser";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container flex-1 py-10">
        {/* Header with Student Academic Context */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 text-primary">
                <School className="h-3 w-3" />
                {academicDetails.university?.name || "Your University"}
              </Badge>
              {academicDetails.academicLevel && (
                <Badge variant="secondary">
                  {academicDetails.academicLevel.code}
                </Badge>
              )}
              <Badge variant="outline" className="gap-1 text-xs">
                <Sparkles className="h-3 w-3 text-primary" /> Phase 4B Question Delivery
              </Badge>
            </div>
            <h1 className="font-serif text-3xl font-medium text-foreground mt-2">
              {academicDetails.department?.name || "Department Courses"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Curriculum courses and verified questions for your department. Browse syllabus questions safely without exposed answer keys ahead of Phase 5 Practice.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/profile">Change Academic Context</Link>
            </Button>
          </div>
        </div>

        {/* View Switcher: Question Browser vs Course Catalogue */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" className="flex items-center gap-2">
            <Button
              asChild
              variant={activeTab === "browser" ? "default" : "outline"}
              size="sm"
              className="gap-2"
            >
              <Link
                href={`/courses?${
                  initialCourseId ? `courseId=${initialCourseId}&` : ""
                }view=browser`}
              >
                <FileQuestion className="h-4 w-4" />
                Question Browser
              </Link>
            </Button>
            <Button
              asChild
              variant={activeTab === "catalogue" ? "default" : "outline"}
              size="sm"
              className="gap-2"
            >
              <Link
                href={`/courses?${
                  initialCourseId ? `courseId=${initialCourseId}&` : ""
                }view=catalogue`}
              >
                <Layers className="h-4 w-4" />
                Course Catalogue ({courses.length})
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {activeTab === "browser"
              ? "Browsing published course questions"
              : "Overview of registered curriculum courses"}
          </p>
        </div>

        {/* Empty Department Warning */}
        {courses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Layers
                className="mx-auto h-8 w-8 text-muted-foreground"
                aria-hidden
              />
              <h3 className="mt-3 text-lg font-medium text-foreground">
                No courses added for this department yet
              </h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                Your department ({academicDetails.department?.name}) currently has
                no active courses configured in the academic hierarchy.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button asChild variant="outline">
                  <Link href="/dashboard">Return to Dashboard</Link>
                </Button>
                <Button asChild>
                  <Link href="/profile">Update Profile</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : activeTab === "browser" ? (
          /* ================= QUESTION BROWSER VIEW ================= */
          <StudentQuestionBrowser
            courses={courses}
            initialCourseId={initialCourseId}
            initialResponse={initialDeliveryResponse}
            initialError={initialDeliveryError}
          />
        ) : (
          /* ================= COURSE CATALOGUE VIEW ================= */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="transition-colors hover:border-primary/40 flex flex-col justify-between"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-primary">
                      {course.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {course.credit_units !== null && (
                        <Badge variant="outline" className="text-xs">
                          {course.credit_units} Units
                        </Badge>
                      )}
                      {course.semester && (
                        <Badge variant="secondary" className="text-xs">
                          Sem {course.semester}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-1">{course.title}</CardTitle>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="pt-2">
                    <Button asChild size="sm" className="w-full gap-1.5">
                      <Link
                        href={`/courses?courseId=${course.id}&view=browser`}
                      >
                        <FileQuestion className="h-4 w-4" /> Browse Questions
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
