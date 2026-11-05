"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  GraduationCap,
  Layers,
  School,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  saveStudentAcademicContextAction,
  type AcademicActionResult,
} from "@/features/academic/actions";
import type {
  AcademicLevelRow,
  DepartmentRow,
  FacultyRow,
  ProfileRow,
  UniversityRow,
} from "@/types/database";

interface OnboardingFormProps {
  initialProfile: ProfileRow | null;
  universities: UniversityRow[];
  faculties: FacultyRow[];
  departments: DepartmentRow[];
  academicLevels: AcademicLevelRow[];
}

export function OnboardingForm({
  initialProfile,
  universities,
  faculties,
  departments,
  academicLevels,
}: OnboardingFormProps) {
  const router = useRouter();
  const [selectedUniversityId, setSelectedUniversityId] = React.useState<string>(
    initialProfile?.university_id ?? ""
  );
  const [selectedFacultyId, setSelectedFacultyId] = React.useState<string>(
    initialProfile?.faculty_id ?? ""
  );
  const [selectedDepartmentId, setSelectedDepartmentId] = React.useState<string>(
    initialProfile?.department_id ?? ""
  );
  const [selectedAcademicLevelId, setSelectedAcademicLevelId] = React.useState<string>(
    initialProfile?.academic_level_id ?? ""
  );
  const [displayName, setDisplayName] = React.useState<string>(
    initialProfile?.display_name ?? ""
  );

  const [isPending, startTransition] = React.useTransition();
  const [result, setResult] = React.useState<AcademicActionResult | null>(null);

  // Cascading Filter: Faculties belonging to selected University
  const availableFaculties = React.useMemo(() => {
    if (!selectedUniversityId) return [];
    return faculties.filter((f) => f.university_id === selectedUniversityId);
  }, [faculties, selectedUniversityId]);

  // Cascading Filter: Departments belonging to selected Faculty
  const availableDepartments = React.useMemo(() => {
    if (!selectedFacultyId) return [];
    return departments.filter((d) => d.faculty_id === selectedFacultyId);
  }, [departments, selectedFacultyId]);

  // Cascading Filter: Academic Levels (either global or scoped to this University)
  const availableAcademicLevels = React.useMemo(() => {
    return academicLevels.filter(
      (l) => !l.university_id || l.university_id === selectedUniversityId
    );
  }, [academicLevels, selectedUniversityId]);

  // When University changes, reset child selections if no longer valid
  const handleUniversityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUniId = e.target.value;
    setSelectedUniversityId(newUniId);
    setSelectedFacultyId("");
    setSelectedDepartmentId("");
    setSelectedAcademicLevelId("");
  };

  // When Faculty changes, reset department
  const handleFacultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFacId = e.target.value;
    setSelectedFacultyId(newFacId);
    setSelectedDepartmentId("");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData();
    formData.append("university_id", selectedUniversityId);
    formData.append("faculty_id", selectedFacultyId);
    formData.append("department_id", selectedDepartmentId);
    formData.append("academic_level_id", selectedAcademicLevelId);
    if (displayName.trim()) {
      formData.append("display_name", displayName.trim());
    }

    startTransition(async () => {
      const res = await saveStudentAcademicContextAction(formData);
      setResult(res);
      if (res.success) {
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1200);
      }
    });
  };

  // Empty state if database has no universities yet
  if (universities.length === 0) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-primary">
            <School className="h-5 w-5" aria-hidden />
          </div>
          <CardTitle className="mt-2 text-2xl">Academic Setup Pending</CardTitle>
          <CardDescription className="text-base">
            No universities have been added to the platform yet. An administrator will need to add your institution to the academic hierarchy before you can select your courses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-border/80 bg-background/50 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">What happens next?</p>
            <p className="mt-1">
              Once an administrator configures your university, faculty, and department, you will be able to complete this onboarding step at any time from your profile.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <Button asChild variant="default" className="w-full sm:w-auto">
              <Link href="/dashboard">Continue to dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/profile">View profile</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isFormComplete =
    Boolean(selectedUniversityId) &&
    Boolean(selectedFacultyId) &&
    Boolean(selectedDepartmentId) &&
    Boolean(selectedAcademicLevelId);

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-primary">
            <GraduationCap className="h-5 w-5" aria-hidden />
          </div>
          {initialProfile?.onboarding_completed && (
            <Badge variant="accent">Onboarding completed</Badge>
          )}
        </div>
        <CardTitle className="font-serif text-2xl">Academic Context</CardTitle>
        <CardDescription className="text-base">
          Select your institution, faculty, department, and academic level. This allows UniPrep to organize your courses and future practice sessions specifically for your curriculum.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {result?.error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/10 p-3.5 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{result.error}</span>
          </div>
        )}

        {result?.success && (
          <div
            role="status"
            className="mb-6 flex items-start gap-2.5 rounded-md border border-teal/40 bg-teal/10 p-3.5 text-sm text-foreground"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
            <div>
              <p className="font-medium text-teal">{result.message}</p>
              <p className="text-xs text-muted-foreground">Redirecting to your dashboard...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Display Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="display_name"
              className="block text-sm font-medium text-foreground"
            >
              Your Full Name or Preferred Display Name
            </label>
            <Input
              id="display_name"
              name="display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Ada Lovelace"
              disabled={isPending}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Step 1: University */}
            <div className="space-y-1.5 sm:col-span-2">
              <label
                htmlFor="university"
                className="flex items-center gap-1.5 text-sm font-medium text-foreground"
              >
                <School className="h-4 w-4 text-primary" aria-hidden />
                1. University / Institution
              </label>
              <select
                id="university"
                value={selectedUniversityId}
                onChange={handleUniversityChange}
                required
                disabled={isPending}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select your university...</option>
                {universities.map((uni) => (
                  <option key={uni.id} value={uni.id}>
                    {uni.name} {uni.short_name ? `(${uni.short_name})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Faculty */}
            <div className="space-y-1.5">
              <label
                htmlFor="faculty"
                className="flex items-center gap-1.5 text-sm font-medium text-foreground"
              >
                <Building2 className="h-4 w-4 text-primary" aria-hidden />
                2. Faculty / College
              </label>
              <select
                id="faculty"
                value={selectedFacultyId}
                onChange={handleFacultyChange}
                required
                disabled={!selectedUniversityId || isPending}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {!selectedUniversityId
                    ? "Select a university first"
                    : availableFaculties.length === 0
                      ? "No faculties available for this university"
                      : "Select your faculty..."}
                </option>
                {availableFaculties.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} {fac.code ? `(${fac.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 3: Department */}
            <div className="space-y-1.5">
              <label
                htmlFor="department"
                className="flex items-center gap-1.5 text-sm font-medium text-foreground"
              >
                <Layers className="h-4 w-4 text-primary" aria-hidden />
                3. Department / Programme
              </label>
              <select
                id="department"
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                required
                disabled={!selectedFacultyId || isPending}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {!selectedFacultyId
                    ? "Select a faculty first"
                    : availableDepartments.length === 0
                      ? "No departments available for this faculty"
                      : "Select your department..."}
                </option>
                {availableDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} {dept.code ? `(${dept.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 4: Academic Level */}
            <div className="space-y-1.5 sm:col-span-2">
              <label
                htmlFor="academic_level"
                className="flex items-center gap-1.5 text-sm font-medium text-foreground"
              >
                <GraduationCap className="h-4 w-4 text-primary" aria-hidden />
                4. Academic Level
              </label>
              <select
                id="academic_level"
                value={selectedAcademicLevelId}
                onChange={(e) => setSelectedAcademicLevelId(e.target.value)}
                required
                disabled={!selectedUniversityId || isPending}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {!selectedUniversityId
                    ? "Select a university first"
                    : availableAcademicLevels.length === 0
                      ? "No academic levels configured"
                      : "Select your level..."}
                </option>
                {availableAcademicLevels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.name} ({lvl.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
            <Button
              type="submit"
              disabled={!isFormComplete || isPending}
              className="min-w-[140px]"
            >
              {isPending ? "Saving profile..." : "Save Academic Profile"}
            </Button>
            <Button asChild variant="ghost">
              <Link href="/dashboard">Skip for now</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
