import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getOptionalSupabasePublicEnv } from "./env";

/**
 * Refreshes the user's Supabase Auth session cookie on incoming requests
 * and forwards updated cookies to both Server Components and the browser.
 *
 * Phase 1B foundation behavior:
 * - Gracefully no-ops if Supabase environment variables are absent.
 * - Does NOT enforce authentication or redirect unauthenticated users.
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

  try {
    const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // Refresh the auth token if a session exists. Do not add route redirects
    // or authorization rules in Phase 1B.
    await supabase.auth.getUser();
  } catch {
    // Gracefully return the unmodified response if Supabase is not reachable
    // or credentials are not yet valid.
    return NextResponse.next({
      request,
    });
  }

  return supabaseResponse;
}
