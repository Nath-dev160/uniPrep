"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  LogIn,
  ShieldCheck,
  UserPlus,
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
  forgotPasswordAction,
  loginAction,
  resetPasswordAction,
  signUpAction,
  type AuthActionState,
} from "@/features/auth/actions";

const INITIAL_STATE: AuthActionState = { status: "idle" };

function StatusBanner({
  state,
  initialError,
}: {
  state: AuthActionState;
  initialError?: string | null;
}) {
  const errorMessage =
    state.status === "error"
      ? state.message
      : initialError === "verification_failed"
        ? "The verification or password recovery link has expired or is invalid. Please request a new one."
        : null;

  if (errorMessage) {
    return (
      <div
        role="alert"
        className="flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
      >
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>{errorMessage}</span>
      </div>
    );
  }

  if (state.status === "success" && state.message) {
    return (
      <div
        role="status"
        className="flex items-start gap-2.5 rounded-md border border-teal/40 bg-teal/10 px-3.5 py-3 text-sm text-foreground"
      >
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
        <span>{state.message}</span>
      </div>
    );
  }

  return null;
}

export function LoginForm({
  configured,
  initialError,
}: {
  configured: boolean;
  initialError?: string | null;
}) {
  const [state, setState] = React.useState<AuthActionState>(INITIAL_STATE);
  const [isPending, startTransition] = React.useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await loginAction(state, formData);
      if (result) {
        setState(result);
      }
    });
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="items-start space-y-3">
        <div className="flex w-full items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-primary">
            <LogIn className="h-5 w-5" aria-hidden />
          </div>
          {!configured && (
            <Badge variant="muted">Supabase env not connected</Badge>
          )}
        </div>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription className="text-base">
          Sign in to your UniPrep account to access your courses, practice
          sessions, and exam history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <StatusBanner state={state} initialError={initialError} />

          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-foreground"
            >
              Email address
            </label>
            <Input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@university.edu"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              disabled={isPending}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Signing in..." : "Sign in"}
          </Button>

          <div className="pt-2 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-primary hover:underline"
            >
              Create an account
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function SignupForm({ configured }: { configured: boolean }) {
  const [state, setState] = React.useState<AuthActionState>(INITIAL_STATE);
  const [isPending, startTransition] = React.useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await signUpAction(state, formData);
      if (result) {
        setState(result);
      }
    });
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="items-start space-y-3">
        <div className="flex w-full items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-primary">
            <UserPlus className="h-5 w-5" aria-hidden />
          </div>
          {!configured && (
            <Badge variant="muted">Supabase env not connected</Badge>
          )}
        </div>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription className="text-base">
          Sign up with your email address to start practicing your courses and
          tracking your progress.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <StatusBanner state={state} />

          <div className="space-y-1.5">
            <label
              htmlFor="signup-display-name"
              className="block text-sm font-medium text-foreground"
            >
              Display name
            </label>
            <Input
              id="signup-display-name"
              name="displayName"
              type="text"
              autoComplete="name"
              placeholder="e.g. Adaobi Okafor"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="signup-email"
              className="block text-sm font-medium text-foreground"
            >
              Email address
            </label>
            <Input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@university.edu"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="signup-password"
              className="block text-sm font-medium text-foreground"
            >
              Password
            </label>
            <Input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              minLength={8}
              required
              disabled={isPending}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating account..." : "Create account"}
          </Button>

          <div className="pt-2 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Log in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function ForgotPasswordForm({ configured }: { configured: boolean }) {
  const [state, setState] = React.useState<AuthActionState>(INITIAL_STATE);
  const [isPending, startTransition] = React.useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await forgotPasswordAction(state, formData);
      if (result) {
        setState(result);
      }
    });
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="items-start space-y-3">
        <div className="flex w-full items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-primary">
            <KeyRound className="h-5 w-5" aria-hidden />
          </div>
          {!configured && (
            <Badge variant="muted">Supabase env not connected</Badge>
          )}
        </div>
        <CardTitle className="text-2xl">Forgot your password?</CardTitle>
        <CardDescription className="text-base">
          Enter the email address associated with your UniPrep account and
          we&apos;ll send you a password reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <StatusBanner state={state} />

          <div className="space-y-1.5">
            <label
              htmlFor="forgot-email"
              className="block text-sm font-medium text-foreground"
            >
              Email address
            </label>
            <Input
              id="forgot-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@university.edu"
              required
              disabled={isPending}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Sending reset link..." : "Send reset link"}
          </Button>

          <div className="pt-2 text-center text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Back to login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function ResetPasswordForm({ configured }: { configured: boolean }) {
  const [state, setState] = React.useState<AuthActionState>(INITIAL_STATE);
  const [isPending, startTransition] = React.useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await resetPasswordAction(state, formData);
      if (result) {
        setState(result);
      }
    });
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="items-start space-y-3">
        <div className="flex w-full items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-primary">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </div>
          {!configured && (
            <Badge variant="muted">Supabase env not connected</Badge>
          )}
        </div>
        <CardTitle className="text-2xl">Reset your password</CardTitle>
        <CardDescription className="text-base">
          Choose a new password for your UniPrep account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <StatusBanner state={state} />

          <div className="space-y-1.5">
            <label
              htmlFor="reset-password"
              className="block text-sm font-medium text-foreground"
            >
              New password
            </label>
            <Input
              id="reset-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              minLength={8}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="reset-confirm-password"
              className="block text-sm font-medium text-foreground"
            >
              Confirm new password
            </label>
            <Input
              id="reset-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              minLength={8}
              required
              disabled={isPending}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Updating password..." : "Update password"}
          </Button>

          <div className="pt-2 text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Back to login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
