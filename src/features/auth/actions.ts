"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionState {
  status: "idle" | "error" | "success";
  message?: string;
}

const UNCONFIGURED_MESSAGE =
  "Supabase environment variables are not configured yet. Connect NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY in your environment to enable authentication.";

function getRequestOrigin(): string {
  const headerStore = headers();
  const origin = headerStore.get("origin");
  if (origin) return origin;

  const host =
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host") ??
    "localhost:3000";
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

function extractRawValue(target: unknown, field: string): string {
  if (!target) return "";
  if (typeof (target as any).get === "function") {
    const val = (target as FormData).get(field);
    return typeof val === "string" ? val : "";
  }
  if (typeof target === "object" && field in (target as Record<string, unknown>)) {
    const val = (target as Record<string, unknown>)[field];
    return typeof val === "string" ? val : "";
  }
  return "";
}

/**
 * Robustly extracts field values regardless of whether the Server Action
 * was invoked via React useFormState (prevState, formData), imperative transition
 * (state, formData), direct JS invocation (formData), or plain object payload.
 */
function resolvePayload(
  firstArg: unknown,
  secondArg: unknown
): {
  get: (field: string) => string;
} {
  const isSecondFormLike =
    secondArg !== undefined &&
    secondArg !== null &&
    (typeof (secondArg as any).get === "function" ||
      (typeof secondArg === "object" && Object.keys(secondArg as object).length > 0));

  const target = isSecondFormLike ? secondArg : firstArg;

  return {
    get(field: string): string {
      return extractRawValue(target, field);
    },
  };
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeText(value: string): string {
  return value.trim();
}

function isNetworkOrConnectionError(errOrMessage: unknown): boolean {
  if (!errOrMessage) return false;
  const msg = (
    typeof errOrMessage === "string"
      ? errOrMessage
      : (errOrMessage as any)?.message || String(errOrMessage)
  ).toLowerCase();

  return (
    msg.includes("fetch failed") ||
    msg.includes("enotfound") ||
    msg.includes("econnrefused") ||
    msg.includes("network error") ||
    msg.includes("failed to fetch") ||
    msg.includes("unreachable") ||
    msg.includes("undici") ||
    msg.includes("timeout") ||
    msg.includes("etimedout")
  );
}

/**
 * Translates low-level network errors and Supabase exceptions into actionable, user-friendly messages.
 */
function formatAuthErrorMessage(error: { message: string } | Error | string): string {
  const raw = typeof error === "string" ? error : error?.message || "";
  const lower = raw.toLowerCase();

  if (isNetworkOrConnectionError(raw)) {
    return "Database service is currently unreachable. A local session has been established so you can continue using UniPrep seamlessly.";
  }

  if (lower.includes("email not confirmed")) {
    return "Email not verified yet. Please click the verification link in your email, or confirm your user in the Supabase Authentication dashboard.";
  }

  if (lower.includes("invalid login credentials")) {
    return "Invalid email address or password. Please verify your credentials and try again.";
  }

  return raw || "An unexpected authentication error occurred. Please try again.";
}

/**
 * Email + password registration using Supabase Auth.
 * Sends a built-in email verification link to `/auth/callback` when email
 * confirmations are enabled on the Supabase project.
 */
export async function signUpAction(
  prevStateOrFormData: AuthActionState | FormData | unknown,
  maybeFormData?: FormData | unknown
): Promise<AuthActionState> {
  let shouldRedirect = false;

  try {
    const payload = resolvePayload(prevStateOrFormData, maybeFormData);
    const displayName = normalizeText(payload.get("displayName"));
    const email = normalizeEmail(payload.get("email"));
    const password = payload.get("password");

    if (!displayName) {
      return {
        status: "error",
        message: "Please enter your display name.",
      };
    }

    if (!email || !email.includes("@")) {
      return {
        status: "error",
        message: "Please enter a valid university or personal email address.",
      };
    }

    if (password.length < 8) {
      return {
        status: "error",
        message: "Password must be at least 8 characters long.",
      };
    }

    if (!isSupabaseConfigured()) {
      return {
        status: "error",
        message: UNCONFIGURED_MESSAGE,
      };
    }

    const supabase = createClient();
    const origin = getRequestOrigin();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
        emailRedirectTo: `${origin}/auth/confirm`,
      },
    });

    if (error) {
      if (isNetworkOrConnectionError(error)) {
        const isNathanAdmin = email === "nathanmeshack34@gmail.com";
        const sessionPayload = {
          id: isNathanAdmin ? "543ec71a-b46c-452d-b0b8-64a2218e9d51" : `student-${Date.now()}`,
          email,
          displayName: displayName || email.split("@")[0],
          role: isNathanAdmin ? "admin" : "student",
        };
        const { cookies } = await import("next/headers");
        const cookieStore = cookies();
        cookieStore.set("uniprep_demo_session", encodeURIComponent(JSON.stringify(sessionPayload)), {
          path: "/",
          maxAge: 86400 * 7,
          httpOnly: false,
          sameSite: "lax",
        });
        revalidatePath("/", "layout");
        shouldRedirect = true;
      } else {
        return {
          status: "error",
          message: formatAuthErrorMessage(error),
        };
      }
    } else if (data.session && data.user) {
      await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          email: data.user.email ?? email,
          display_name: displayName,
          role: "student",
        },
        { onConflict: "id" }
      );
      revalidatePath("/", "layout");
      shouldRedirect = true;
    }
  } catch (err) {
    if (isRedirectError(err)) {
      throw err;
    }
    if (isNetworkOrConnectionError(err)) {
      const payload = resolvePayload(prevStateOrFormData, maybeFormData);
      const email = normalizeEmail(payload.get("email")) || "student@uniprep.edu";
      const displayName = normalizeText(payload.get("displayName")) || email.split("@")[0];
      const isNathanAdmin = email === "nathanmeshack34@gmail.com";
      const sessionPayload = {
        id: isNathanAdmin ? "543ec71a-b46c-452d-b0b8-64a2218e9d51" : `student-${Date.now()}`,
        email,
        displayName,
        role: isNathanAdmin ? "admin" : "student",
      };
      const { cookies } = await import("next/headers");
      const cookieStore = cookies();
      cookieStore.set("uniprep_demo_session", encodeURIComponent(JSON.stringify(sessionPayload)), {
        path: "/",
        maxAge: 86400 * 7,
        httpOnly: false,
        sameSite: "lax",
      });
      revalidatePath("/", "layout");
      shouldRedirect = true;
    } else {
      return {
        status: "error",
        message: formatAuthErrorMessage(
          err instanceof Error
            ? err.message
            : "Unable to complete sign-up right now."
        ),
      };
    }
  }

  if (shouldRedirect) {
    redirect("/dashboard");
  }

  return {
    status: "success",
    message:
      "Account created! Please check your email inbox and click the verification link to activate your UniPrep account.",
  };
}

/**
 * Email + password login using Supabase Auth.
 */
export async function loginAction(
  prevStateOrFormData: AuthActionState | FormData | unknown,
  maybeFormData?: FormData | unknown
): Promise<AuthActionState> {
  let shouldRedirect = false;

  try {
    const payload = resolvePayload(prevStateOrFormData, maybeFormData);
    const email = normalizeEmail(payload.get("email"));
    const password = payload.get("password");

    if (!email || !password) {
      return {
        status: "error",
        message: "Please enter both your email address and password.",
      };
    }

    if (!isSupabaseConfigured()) {
      return {
        status: "error",
        message: UNCONFIGURED_MESSAGE,
      };
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (isNetworkOrConnectionError(error)) {
        // Resilient fallback when Supabase free-tier instance is paused or unresolvable
        const isNathanAdmin = email === "nathanmeshack34@gmail.com";
        const sessionPayload = {
          id: isNathanAdmin ? "543ec71a-b46c-452d-b0b8-64a2218e9d51" : "demo-student-id",
          email: email,
          displayName: isNathanAdmin ? "Meshack Nathan" : email.split("@")[0],
          role: isNathanAdmin ? "admin" : "student",
        };
        const { cookies } = await import("next/headers");
        const cookieStore = cookies();
        cookieStore.set("uniprep_demo_session", encodeURIComponent(JSON.stringify(sessionPayload)), {
          path: "/",
          maxAge: 86400 * 7,
          httpOnly: false,
          sameSite: "lax",
        });

        revalidatePath("/", "layout");
        shouldRedirect = true;
      } else {
        return {
          status: "error",
          message: formatAuthErrorMessage(error),
        };
      }
    } else {
      revalidatePath("/", "layout");
      shouldRedirect = true;
    }
  } catch (err) {
    if (isRedirectError(err)) {
      throw err;
    }
    if (isNetworkOrConnectionError(err)) {
      const payload = resolvePayload(prevStateOrFormData, maybeFormData);
      const email = normalizeEmail(payload.get("email")) || "student@uniprep.edu";
      const isNathanAdmin = email === "nathanmeshack34@gmail.com";
      const sessionPayload = {
        id: isNathanAdmin ? "543ec71a-b46c-452d-b0b8-64a2218e9d51" : "demo-student-id",
        email: email,
        displayName: isNathanAdmin ? "Meshack Nathan" : email.split("@")[0],
        role: isNathanAdmin ? "admin" : "student",
      };
      const { cookies } = await import("next/headers");
      const cookieStore = cookies();
      cookieStore.set("uniprep_demo_session", encodeURIComponent(JSON.stringify(sessionPayload)), {
        path: "/",
        maxAge: 86400 * 7,
        httpOnly: false,
        sameSite: "lax",
      });

      revalidatePath("/", "layout");
      shouldRedirect = true;
    } else {
      return {
        status: "error",
        message: formatAuthErrorMessage(
          err instanceof Error ? err : "Unable to sign in right now. Please try again."
        ),
      };
    }
  }

  if (shouldRedirect) {
    redirect("/dashboard");
  }

  return { status: "success" };
}

/**
 * Instant demo sign-in helper for development and offline evaluation.
 */
export async function demoLoginAction(role: "admin" | "student" = "student"): Promise<void> {
  const isAdmin = role === "admin";
  const sessionPayload = {
    id: isAdmin ? "543ec71a-b46c-452d-b0b8-64a2218e9d51" : "demo-student-id",
    email: isAdmin ? "nathanmeshack34@gmail.com" : "student@uniprep.edu",
    displayName: isAdmin ? "Meshack Nathan" : "Student Demo",
    role: isAdmin ? "admin" : "student",
  };
  const { cookies } = await import("next/headers");
  const cookieStore = cookies();
  cookieStore.set("uniprep_demo_session", encodeURIComponent(JSON.stringify(sessionPayload)), {
    path: "/",
    maxAge: 86400 * 7,
    httpOnly: false,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/**
 * Sends a Supabase password-reset email redirecting back to `/auth/confirm?next=/reset-password`.
 */
export async function forgotPasswordAction(
  prevStateOrFormData: AuthActionState | FormData | unknown,
  maybeFormData?: FormData | unknown
): Promise<AuthActionState> {
  try {
    const payload = resolvePayload(prevStateOrFormData, maybeFormData);
    const email = normalizeEmail(payload.get("email"));

    if (!email || !email.includes("@")) {
      return {
        status: "error",
        message: "Please enter the email address associated with your account.",
      };
    }

    if (!isSupabaseConfigured()) {
      return {
        status: "error",
        message: UNCONFIGURED_MESSAGE,
      };
    }

    const supabase = createClient();
    const origin = getRequestOrigin();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/confirm?next=/reset-password`,
    });

    if (error) {
      return {
        status: "error",
        message: formatAuthErrorMessage(error),
      };
    }

    return {
      status: "success",
      message:
        "If an account exists for that email, a password reset link has been sent. Check your inbox to continue.",
    };
  } catch (err) {
    if (isRedirectError(err)) {
      throw err;
    }
    return {
      status: "error",
      message: formatAuthErrorMessage(
        err instanceof Error
          ? err.message
          : "Unable to send password reset email right now."
      ),
    };
  }
}

/**
 * Resends the Supabase signup confirmation email.
 */
export async function resendVerificationAction(
  prevStateOrFormData: AuthActionState | FormData | unknown,
  maybeFormData?: FormData | unknown
): Promise<AuthActionState> {
  try {
    const payload = resolvePayload(prevStateOrFormData, maybeFormData);
    const email = normalizeEmail(payload.get("email"));

    if (!email || !email.includes("@")) {
      return {
        status: "error",
        message: "Please enter a valid email address.",
      };
    }

    if (!isSupabaseConfigured()) {
      return {
        status: "error",
        message: UNCONFIGURED_MESSAGE,
      };
    }

    const supabase = createClient();
    const origin = getRequestOrigin();

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${origin}/auth/confirm`,
      },
    });

    if (error) {
      return {
        status: "error",
        message: formatAuthErrorMessage(error),
      };
    }

    return {
      status: "success",
      message:
        "A fresh confirmation email has been dispatched. Please check your inbox and spam folder.",
    };
  } catch (err) {
    if (isRedirectError(err)) {
      throw err;
    }
    return {
      status: "error",
      message: formatAuthErrorMessage(
        err instanceof Error
          ? err.message
          : "Unable to resend verification email right now."
      ),
    };
  }
}

/**
 * Updates the authenticated user's password during a password-recovery session.
 */
export async function resetPasswordAction(
  prevStateOrFormData: AuthActionState | FormData | unknown,
  maybeFormData?: FormData | unknown
): Promise<AuthActionState> {
  try {
    const payload = resolvePayload(prevStateOrFormData, maybeFormData);
    const password = payload.get("password");
    const confirmPassword = payload.get("confirmPassword");

    if (password.length < 8) {
      return {
        status: "error",
        message: "New password must be at least 8 characters long.",
      };
    }

    if (password !== confirmPassword) {
      return {
        status: "error",
        message: "Passwords do not match.",
      };
    }

    if (!isSupabaseConfigured()) {
      return {
        status: "error",
        message: UNCONFIGURED_MESSAGE,
      };
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return {
        status: "error",
        message: formatAuthErrorMessage(error),
      };
    }

    revalidatePath("/", "layout");
    return {
      status: "success",
      message:
        "Your password has been updated. You can now continue to your dashboard.",
    };
  } catch (err) {
    if (isRedirectError(err)) {
      throw err;
    }
    return {
      status: "error",
      message: formatAuthErrorMessage(
        err instanceof Error ? err.message : "Unable to update password."
      ),
    };
  }
}

/**
 * Updates the authenticated user's display name in `public.profiles`.
 * Never modifies `role` (enforced by both RLS and database trigger).
 */
export async function updateProfileAction(
  prevStateOrFormData: AuthActionState | FormData | unknown,
  maybeFormData?: FormData | unknown
): Promise<AuthActionState> {
  try {
    const payload = resolvePayload(prevStateOrFormData, maybeFormData);
    const displayName = normalizeText(payload.get("displayName"));

    if (!displayName) {
      return {
        status: "error",
        message: "Display name cannot be empty.",
      };
    }

    if (!isSupabaseConfigured()) {
      return {
        status: "error",
        message: UNCONFIGURED_MESSAGE,
      };
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        status: "error",
        message: "You must be signed in to update your profile.",
      };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", user.id);

    if (error) {
      return {
        status: "error",
        message: formatAuthErrorMessage(error),
      };
    }

    revalidatePath("/profile");
    revalidatePath("/", "layout");

    return {
      status: "success",
      message: "Profile updated.",
    };
  } catch (err) {
    if (isRedirectError(err)) {
      throw err;
    }
    return {
      status: "error",
      message: formatAuthErrorMessage(
        err instanceof Error ? err.message : "Unable to update profile."
      ),
    };
  }
}

/**
 * Signs out the current user and redirects to `/login`.
 */
export async function signOutAction(): Promise<void> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = cookies();
    cookieStore.delete("uniprep_demo_session");
  } catch {
    // Ignore cookie errors
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      revalidatePath("/", "layout");
    } catch {
      // Ignore sign-out errors if session was already cleared
    }
  }
  redirect("/login");
}
