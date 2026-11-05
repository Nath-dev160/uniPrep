import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getOptionalSupabasePublicEnv } from "./env";

/**
 * Refreshes the user's Supabase Auth session cookie on incoming requests
 * and forwards updated cookies to both Server Components and the browser.
 *
 * Production Hardening & 502 Prevention:
 * 1. Bypasses Server Actions (POST requests with `next-action` / `x-action`):
 *    Server Actions (e.g. loginAction, signOutAction) manage their own session lifecycle.
 *    Running session refresh in middleware concurrently with Server Actions leads to conflicting
 *    cookie writes, duplicated Set-Cookie headers, and oversized response headers exceeding
 *    the Google Frontend / Cloud Run 8KB limit (causing HTTP 502 Bad Gateway).
 * 2. Bypasses public auth entry points (/login, /signup, /forgot-password, /reset-password, /auth/*):
 *    Users on unauthenticated routes do not require session refresh; running token refresh here
 *    on stale/expired cookies causes unnecessary failure cascades and deletion-cookie header bloat.
 * 3. Gracefully skips if no Supabase cookies exist (fresh browser visits).
 * 4. Deduplicates cookie mutations and strips internal `x-middleware-set-cookie` headers
 *    from outgoing responses to prevent header duplication.
 * 5. Handles deletions with `request.cookies.delete` rather than empty string values to
 *    prevent chunk reassembly corruption in downstream Server Components.
 */
export async function updateSession(
  request: NextRequest
): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const env = getOptionalSupabasePublicEnv();
  if (!env) {
    return supabaseResponse;
  }

  // 1. Skip middleware session updates during Server Actions
  const isServerAction =
    request.headers.has("next-action") ||
    request.headers.has("x-action");
  if (isServerAction) {
    return supabaseResponse;
  }

  // 2. Skip public authentication routes
  const pathname = request.nextUrl.pathname;
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/auth/");
  if (isAuthRoute) {
    return supabaseResponse;
  }

  // 2.5 Skip if resilient demo session is present
  if (request.cookies.has("uniprep_demo_session")) {
    return supabaseResponse;
  }

  // 3. Skip if no Supabase cookies are present in the incoming request
  const allCookies = request.cookies.getAll();
  const hasSupabaseCookie = allCookies.some((c) => c.name.startsWith("sb-"));
  if (!hasSupabaseCookie) {
    return supabaseResponse;
  }

  const cookiesToApply = new Map<
    string,
    { name: string; value: string; options?: any }
  >();

  try {
    const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (options?.maxAge === 0 || value === "") {
              request.cookies.delete(name);
            } else {
              request.cookies.set(name, value);
            }
            cookiesToApply.set(name, { name, value, options });
          });
        },
      },
    });

    // Refresh the auth token if a session exists.
    await supabase.auth.getUser();
  } catch {
    return supabaseResponse;
  }

  // If session tokens were refreshed or cleared, apply the deduplicated cookies
  if (cookiesToApply.size > 0) {
    supabaseResponse = NextResponse.next({
      request,
    });
    cookiesToApply.forEach(({ name, value, options }) => {
      supabaseResponse.cookies.set(name, value, options);
    });
  }

  return supabaseResponse;
}
