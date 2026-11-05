"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  GraduationCap,
  Layers,
  LogOut,
  School,
  UserCircle,
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
import {
  signOutAction,
  updateProfileAction,
  type AuthActionState,
} from "@/features/auth/actions";
import type {
  AcademicLevelRow,
  DepartmentRow,
  FacultyRow,
  ProfileRow,
  UniversityRow,
} from "@/types/database";

const INITIAL_STATE: AuthActionState = { status: "idle" };

interface ProfileCardProps {
  configured: boolean;
  email: string | null;
  emailVerified: boolean;
  profile: ProfileRow | null;
  academicDetails?: {
    university: UniversityRow | null;
    faculty: FacultyRow | null;
    department: DepartmentRow | null;
    academicLevel: AcademicLevelRow | null;
  };
  universities?: UniversityRow[];
  faculties?: FacultyRow[];
  departments?: DepartmentRow[];
  academicLevels?: AcademicLevelRow[];
}

export function ProfileCard({
  configured,
  email,
  emailVerified,
  profile,
  academicDetails,
  universities = [],
  faculties = [],
  departments = [],
  academicLevels = [],
}: ProfileCardProps) {
  const [state, setState] = React.useState<AuthActionState>(INITIAL_STATE);
  const [isPending, startTransition] = React.useTransition();

  // Academic editing mode
  const [isEditingAcademic, setIsEditingAcademic] = React.useState(false);
  const [selectedUniId, setSelectedUniId] = React.useState(
    profile?.university_id ?? ""
  );
  const [selectedFacId, setSelectedFacId] = React.useState(
    profile?.faculty_id ?? ""
  );
  const [selectedDeptId, setSelectedDeptId] = React.useState(
    profile?.department_id ?? ""
  );
  const [selectedLevelId, setSelectedLevelId] = React.useState(
    profile?.academic_level_id ?? ""
  );
  const [academicActionResult, setAcademicActionResult] =
    React.useState<AcademicActionResult | null>(null);

  // Cascading filters for editing
  const filteredFaculties = React.useMemo(() => {
    if (!selectedUniId) return [];
    return faculties.filter((f) => f.university_id === selectedUniId);
  }, [faculties, selectedUniId]);

  const filteredDepartments = React.useMemo(() => {
    if (!selectedFacId) return [];
    return departments.filter((d) => d.faculty_id === selectedFacId);
  }, [departments, selectedFacId]);

  const filteredLevels = React.useMemo(() => {
    return academicLevels.filter(
      (l) => !l.university_id || l.university_id === selectedUniId
    );
  }, [academicLevels, selectedUniId]);

  function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateProfileAction(state, formData);
      if (result) {
        setState(result);
      }
    });
  }

  function handleAcademicSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAcademicActionResult(null);

    const formData = new FormData();
    formData.append("university_id", selectedUniId);
    formData.append("faculty_id", selectedFacId);
    formData.append("department_id", selectedDeptId);
    formData.append("academic_level_id", selectedLevelId);

    startTransition(async () => {
      const res = await saveStudentAcademicContextAction(formData);
      setAcademicActionResult(res);
      if (res.success) {
        setTimeout(() => {
          setIsEditingAcademic(false);
        }, 1500);
      }
    });
  }

  if (!email) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader className="items-start space-y-3">
          <div className="flex w-full items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-primary">
              <UserCircle className="h-5 w-5" aria-hidden />
            </div>
            <Badge variant="muted">
              {configured ? "Not signed in" : "Supabase env not connected"}
            </Badge>
          </div>
          <CardTitle className="text-2xl">Profile</CardTitle>
          <CardDescription className="text-base">
            Sign in to view and manage your UniPrep profile and academic context.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/login">Go to login</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const role = profile?.role ?? "student";

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader className="items-start space-y-3">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-primary">
            <UserCircle className="h-5 w-5" aria-hidden />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={role === "admin" ? "accent" : "default"}>
              Role: {role}
            </Badge>
            <Badge variant={emailVerified ? "accent" : "muted"}>
              {emailVerified ? "Email verified" : "Verification pending"}
            </Badge>
            {profile?.onboarding_completed && (
              <Badge variant="secondary">Onboarded</Badge>
            )}
          </div>
        </div>
        <CardTitle className="text-2xl">
          {profile?.display_name || email}
        </CardTitle>
        <CardDescription className="text-base">
          Manage your personal account details and academic context.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {state.status === "error" && state.message && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{state.message}</span>
          </div>
        )}

        {state.status === "success" && state.message && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-md border border-teal/40 bg-teal/10 px-3.5 py-3 text-sm text-foreground"
          >
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-teal"
              aria-hidden
            />
            <span>{state.message}</span>
          </div>
        )}

        {/* Display name form */}
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="profile-email"
              className="block text-sm font-medium text-foreground"
            >
              Email address
            </label>
            <Input
              id="profile-email"
              type="email"
              value={email}
              disabled
              readOnly
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="profile-display-name"
              className="block text-sm font-medium text-foreground"
            >
              Display name
            </label>
            <Input
              id="profile-display-name"
              name="displayName"
              type="text"
              defaultValue={profile?.display_name ?? ""}
              placeholder="Your full name or display name"
              required
              disabled={isPending}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Saving..." : "Update display name"}
            </Button>
          </div>
        </form>

        {/* Academic Hierarchy Information Section */}
        <div className="rounded-lg border border-border bg-background/60 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Academic Context
              </h3>
              <p className="text-xs text-muted-foreground">
                Determines which courses and questions are presented to you.
              </p>
            </div>
            {!isEditingAcademic && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingAcademic(true)}
              >
                {profile?.onboarding_completed ? "Edit Context" : "Complete Setup"}
              </Button>
            )}
          </div>

          {!isEditingAcademic ? (
            <div className="grid gap-3 sm:grid-cols-2 pt-1 text-sm">
              <div className="flex items-start gap-2">
                <School className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">University</p>
                  <p className="font-medium text-foreground">
                    {academicDetails?.university?.name || (
                      <span className="italic text-muted-foreground">Not set yet</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Faculty</p>
                  <p className="font-medium text-foreground">
                    {academicDetails?.faculty?.name || (
                      <span className="italic text-muted-foreground">Not set yet</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Layers className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="font-medium text-foreground">
                    {academicDetails?.department?.name || (
                      <span className="italic text-muted-foreground">Not set yet</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <GraduationCap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Academic Level</p>
                  <p className="font-medium text-foreground">
                    {academicDetails?.academicLevel ? (
                      `${academicDetails.academicLevel.name} (${academicDetails.academicLevel.code})`
                    ) : (
                      <span className="italic text-muted-foreground">Not set yet</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAcademicSubmit} className="space-y-4 pt-2">
              {academicActionResult?.error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{academicActionResult.error}</span>
                </div>
              )}

              {academicActionResult?.success && (
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-md border border-teal/40 bg-teal/10 p-3 text-xs text-foreground"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-teal mt-0.5" />
                  <span className="text-teal font-medium">
                    {academicActionResult.message}
                  </span>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                {/* University */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-foreground">
                    University
                  </label>
                  <select
                    value={selectedUniId}
                    onChange={(e) => {
                      setSelectedUniId(e.target.value);
                      setSelectedFacId("");
                      setSelectedDeptId("");
                      setSelectedLevelId("");
                    }}
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                  >
                    <option value="">Select University...</option>
                    {universities.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Faculty */}
                <div>
                  <label className="text-xs font-medium text-foreground">
                    Faculty
                  </label>
                  <select
                    value={selectedFacId}
                    onChange={(e) => {
                      setSelectedFacId(e.target.value);
                      setSelectedDeptId("");
                    }}
                    required
                    disabled={!selectedUniId}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs disabled:opacity-50"
                  >
                    <option value="">Select Faculty...</option>
                    {filteredFaculties.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="text-xs font-medium text-foreground">
                    Department
                  </label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    required
                    disabled={!selectedFacId}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs disabled:opacity-50"
                  >
                    <option value="">Select Department...</option>
                    {filteredDepartments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Academic Level */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-foreground">
                    Academic Level
                  </label>
                  <select
                    value={selectedLevelId}
                    onChange={(e) => setSelectedLevelId(e.target.value)}
                    required
                    disabled={!selectedUniId}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs disabled:opacity-50"
                  >
                    <option value="">Select Academic Level...</option>
                    {filteredLevels.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
                <Button
                  type="submit"
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={
                    !selectedUniId ||
                    !selectedFacId ||
                    !selectedDeptId ||
                    !selectedLevelId ||
                    isPending
                  }
                >
                  {isPending ? "Saving..." : "Save Academic Details"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setIsEditingAcademic(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Admin Navigation Shortcut if user is admin */}
        {role === "admin" && (
          <div className="rounded-md border border-primary/30 bg-primary/5 p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Administrator Workspace</p>
              <p className="text-xs text-muted-foreground">
                Manage universities, faculties, departments, courses, and syllabus topics.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/admin">Open Admin</Link>
            </Button>
          </div>
        )}

        <div className="border-t border-border pt-4 flex flex-wrap items-center justify-between gap-3">
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </Button>
          </form>

          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
