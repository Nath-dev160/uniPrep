"use server";

import { revalidatePath } from "next/cache";
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

function normalizeEmail(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Email + password registration using Supabase Auth.
 * Sends a built-in email verification link to `/auth/callback` when email
 * confirmations are enabled on the Supabase project.
 */
export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const displayName = normalizeText(formData.get("displayName"));
  const email = normalizeEmail(formData.get("email"));
  const password =
    typeof formData.get("password") === "string"
      ? (formData.get("password") as string)
      : "";

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

  let shouldRedirect = false;

  try {
    const supabase = createClient();
    const origin = getRequestOrigin();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      return {
        status: "error",
        message: error.message,
      };
    }

    // If email confirmation is disabled in Supabase, a session is returned immediately
    if (data.session && data.user) {
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
    return {
      status: "error",
      message:
        err instanceof Error
          ? err.message
          : "Unable to complete sign-up right now.",
    };
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
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = normalizeEmail(formData.get("email"));
  const password =
    typeof formData.get("password") === "string"
      ? (formData.get("password") as string)
      : "";

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

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        status: "error",
        message: error.message,
      };
    }

    revalidatePath("/", "layout");
  } catch (err) {
    return {
      status: "error",
      message:
        err instanceof Error
          ? err.message
          : "Unable to sign in right now. Please try again.",
    };
  }

  redirect("/dashboard");
}

/**
 * Sends a Supabase password-reset email redirecting back to `/auth/callback?next=/reset-password`.
 */
export async function forgotPasswordAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = normalizeEmail(formData.get("email"));

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

  try {
    const supabase = createClient();
    const origin = getRequestOrigin();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      return {
        status: "error",
        message: error.message,
      };
    }

    return {
      status: "success",
      message:
        "If an account exists for that email, a password reset link has been sent. Check your inbox to continue.",
    };
  } catch (err) {
    return {
      status: "error",
      message:
        err instanceof Error
          ? err.message
          : "Unable to send password reset email right now.",
    };
  }
}

/**
 * Updates the authenticated user's password during a password-recovery session.
 */
export async function resetPasswordAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const password =
    typeof formData.get("password") === "string"
      ? (formData.get("password") as string)
      : "";
  const confirmPassword =
    typeof formData.get("confirmPassword") === "string"
      ? (formData.get("confirmPassword") as string)
      : "";

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

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return {
        status: "error",
        message: error.message,
      };
    }

    revalidatePath("/", "layout");
    return {
      status: "success",
      message:
        "Your password has been updated. You can now continue to your dashboard.",
    };
  } catch (err) {
    return {
      status: "error",
      message:
        err instanceof Error ? err.message : "Unable to update password.",
    };
  }
}

/**
 * Updates the authenticated user's display name in `public.profiles`.
 * Never modifies `role` (enforced by both RLS and database trigger).
 */
export async function updateProfileAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const displayName = normalizeText(formData.get("displayName"));

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

  try {
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
        message: error.message,
      };
    }

    revalidatePath("/profile");
    revalidatePath("/", "layout");

    return {
      status: "success",
      message: "Profile updated.",
    };
  } catch (err) {
    return {
      status: "error",
      message:
        err instanceof Error ? err.message : "Unable to update profile.",
    };
  }
}

/**
 * Signs out the current user and redirects to `/login`.
 */
export async function signOutAction(): Promise<void> {
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
