"use client";

import * as React from "react";
import Link from "next/link";
import { isRedirectError } from "next/dist/client/components/redirect";
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
  demoLoginAction,
  forgotPasswordAction,
  loginAction,
  resendVerificationAction,
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
        ? "The verification or password recovery link has expired or is invalid. Please request a new one below."
        : initialError === "otp_expired"
          ? "The verification link has expired. Please sign in or request a new confirmation email."
          : initialError === "missing_verification_token"
            ? "Missing verification token in confirmation link."
            : initialError
              ? decodeURIComponent(initialError)
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
  const [resendState, setResendState] = React.useState<AuthActionState>(INITIAL_STATE);
  const [emailValue, setEmailValue] = React.useState("");
  const [isPending, startTransition] = React.useTransition();
  const [isResending, startResendTransition] = React.useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await loginAction(state, formData);
        if (result) {
          setState(result);
        }
      } catch (err) {
        if (!isRedirectError(err)) {
          setState({
            status: "error",
            message:
              err instanceof Error
                ? err.message
                : "Unable to sign in right now. Please try again.",
          });
        }
      }
    });
  }

  function handleResend() {
    if (!emailValue) {
      setResendState({
        status: "error",
        message: "Please enter your email address in the field above to resend verification.",
      });
      return;
    }
    const formData = new FormData();
    formData.append("email", emailValue);
    startResendTransition(async () => {
      const result = await resendVerificationAction(resendState, formData);
      setResendState(result);
    });
  }

  const showResendOption =
    state.message?.toLowerCase().includes("not verified") ||
    initialError?.toLowerCase().includes("verif") ||
    initialError?.toLowerCase().includes("expired");

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="items-start space-y-3">
        <div className="flex w-full items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-primary">
            <LogIn className="h-5 w-5" aria-hidden />
          </div>
          {configured ? (
            <Badge variant="accent" className="gap-1 border-teal/40 bg-teal/10 text-teal">
              <CheckCircle2 className="h-3 w-3" /> Supabase Connected
            </Badge>
          ) : (
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
          {resendState.status !== "idle" && <StatusBanner state={resendState} />}

          {showResendOption && (
            <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-background/50 p-3 text-xs">
              <span className="text-muted-foreground">Need a fresh verification link?</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={isResending}
                onClick={handleResend}
              >
                {isResending ? "Sending..." : "Resend Link"}
              </Button>
            </div>
          )}

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
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
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

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or quick 1-click preview
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  try {
                    await demoLoginAction("admin");
                  } catch (err) {
                    if (!isRedirectError(err)) {
                      setState({
                        status: "error",
                        message: "Unable to start admin session.",
                      });
                    }
                  }
                });
              }}
              className="w-full gap-1.5 text-xs font-medium"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Admin Demo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  try {
                    await demoLoginAction("student");
                  } catch (err) {
                    if (!isRedirectError(err)) {
                      setState({
                        status: "error",
                        message: "Unable to start student session.",
                      });
                    }
                  }
                });
              }}
              className="w-full gap-1.5 text-xs font-medium"
            >
              <LogIn className="h-3.5 w-3.5 text-teal" />
              Student Demo
            </Button>
          </div>

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
      try {
        const result = await signUpAction(state, formData);
        if (result) {
          setState(result);
        }
      } catch (err) {
        if (!isRedirectError(err)) {
          setState({
            status: "error",
            message:
              err instanceof Error
                ? err.message
                : "Unable to sign up right now. Please try again.",
          });
        }
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
          {configured ? (
            <Badge variant="accent" className="gap-1 border-teal/40 bg-teal/10 text-teal">
              <CheckCircle2 className="h-3 w-3" /> Supabase Connected
            </Badge>
          ) : (
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
      try {
        const result = await forgotPasswordAction(state, formData);
        if (result) {
          setState(result);
        }
      } catch (err) {
        if (!isRedirectError(err)) {
          setState({
            status: "error",
            message:
              err instanceof Error
                ? err.message
                : "Unable to send password reset email right now. Please try again.",
          });
        }
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
          {configured ? (
            <Badge variant="accent" className="gap-1 border-teal/40 bg-teal/10 text-teal">
              <CheckCircle2 className="h-3 w-3" /> Supabase Connected
            </Badge>
          ) : (
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
      try {
        const result = await resetPasswordAction(state, formData);
        if (result) {
          setState(result);
        }
      } catch (err) {
        if (!isRedirectError(err)) {
          setState({
            status: "error",
            message:
              err instanceof Error
                ? err.message
                : "Unable to reset password right now. Please try again.",
          });
        }
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
          {configured ? (
            <Badge variant="accent" className="gap-1 border-teal/40 bg-teal/10 text-teal">
              <CheckCircle2 className="h-3 w-3" /> Supabase Connected
            </Badge>
          ) : (
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
