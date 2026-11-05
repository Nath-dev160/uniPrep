import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { getOptionalSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Resolves the true public origin (protocol + host) of the incoming request,
 * correctly accounting for reverse proxies (Cloud Run, load balancers, Vercel).
 */
export function getRequestPublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const proto =
    forwardedProto ??
    (request.nextUrl.protocol.replace(":", "") || "http");

  if (host) {
    return `${proto}://${host}`;
  }

  return request.nextUrl.origin;
}

/**
 * Common handler for Supabase Auth email confirmation and OAuth callbacks.
 * Works seamlessly with both `/auth/confirm` and `/auth/callback`.
 *
 * Guarantees:
 * 1. Resolves the real public origin rather than internal container localhost.
 * 2. Writes session cookies directly to the returned `NextResponse.redirect` object
 *    so the browser retains the authenticated session immediately upon arrival.
 * 3. Handles both PKCE authorization codes (`code`) and email OTP token hashes
 *    (`token_hash` / `token`).
 * 4. Gracefully handles expired, invalid, and missing tokens with clear feedback.
 */
export async function handleAuthCallback(
  request: NextRequest
): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const origin = getRequestPublicOrigin(request);

  // Check for error parameters emitted by Supabase verify endpoint
  const errorParam = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");

  if (errorParam || errorCode || errorDescription) {
    const errorMsg =
      errorDescription ||
      (errorCode === "otp_expired"
        ? "The confirmation link has expired. Please sign in or request a new link."
        : errorParam || "Email verification failed.");

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorMsg)}`
    );
  }

  const code = searchParams.get("code");
  const tokenHash =
    searchParams.get("token_hash") ?? searchParams.get("token");
  const rawType = searchParams.get("type");
  const rawNext = searchParams.get("next");

  const type: EmailOtpType =
    rawType === "recovery"
      ? "recovery"
      : rawType === "invite"
        ? "invite"
        : rawType === "signup"
          ? "signup"
          : rawType === "email_change"
            ? "email_change"
            : "email";

  const safeNext =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : type === "recovery"
        ? "/reset-password"
        : "/dashboard";

  const env = getOptionalSupabasePublicEnv();
  if (!env) {
    return NextResponse.redirect(`${origin}/login?error=env_unconfigured`);
  }

  const redirectUrl = `${origin}${safeNext}`;
  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    if (code) {
      // PKCE flow code exchange
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return response;
      }
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(
          error.message || "Invalid or expired authorization code."
        )}`
      );
    }

    if (tokenHash) {
      // Email OTP verification flow
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });

      if (!error) {
        return response;
      }

      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(
          error.message || "Invalid or expired confirmation link."
        )}`
      );
    }

    // No code or token provided
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        "Missing verification token in link."
      )}`
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Verification error occurred.";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message)}`
    );
  }
}
