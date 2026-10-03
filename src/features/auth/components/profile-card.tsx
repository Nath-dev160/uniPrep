"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, LogOut, UserCircle } from "lucide-react";

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
  signOutAction,
  updateProfileAction,
  type AuthActionState,
} from "@/features/auth/actions";
import type { ProfileRow } from "@/types/database";

const INITIAL_STATE: AuthActionState = { status: "idle" };

export function ProfileCard({
  configured,
  email,
  emailVerified,
  profile,
}: {
  configured: boolean;
  email: string | null;
  emailVerified: boolean;
  profile: ProfileRow | null;
}) {
  const [state, setState] = React.useState<AuthActionState>(INITIAL_STATE);
  const [isPending, startTransition] = React.useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateProfileAction(state, formData);
      if (result) {
        setState(result);
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
            Sign in to view and manage your UniPrep profile and academic
            context.
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
    <Card className="mx-auto max-w-xl">
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
          </div>
        </div>
        <CardTitle className="text-2xl">
          {profile?.display_name || email}
        </CardTitle>
        <CardDescription className="text-base">
          Manage your account details. Academic hierarchy selection (University,
          Faculty, Department, Academic Level) connects in Phase 3.
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

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid gap-3 rounded-md border border-border bg-background/60 p-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">University</p>
              <p className="font-medium text-foreground">
                {profile?.university_id ? "Assigned" : "Not set yet (Phase 3)"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Faculty</p>
              <p className="font-medium text-foreground">
                {profile?.faculty_id ? "Assigned" : "Not set yet (Phase 3)"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Department</p>
              <p className="font-medium text-foreground">
                {profile?.department_id ? "Assigned" : "Not set yet (Phase 3)"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Academic Level</p>
              <p className="font-medium text-foreground">
                {profile?.academic_level_id
                  ? "Assigned"
                  : "Not set yet (Phase 3)"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save display name"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          </div>
        </form>

        <div className="border-t border-border pt-4">
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
