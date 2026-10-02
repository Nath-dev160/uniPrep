import { createServerClient } from "@supabase/ssr";
import {
  createClient as createSupabaseJsClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { getSupabasePublicEnv, getSupabaseSecretEnv } from "./env";

/**
 * Creates a request-scoped Supabase client for Server Components,
 * Server Actions, and Route Handlers using Next.js `cookies()`.
 *
 * Respects the caller's session and Row Level Security (RLS) policies.
 */
export function createClient(): SupabaseClient {
  const cookieStore = cookies();
  const { url, anonKey } = getSupabasePublicEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // `setAll` can be called from a Server Component where setting
          // cookies is not permitted by Next.js. This is safe to ignore
          // when the Supabase middleware refreshes user sessions.
        }
      },
    },
  });
}

/**
 * Creates a privileged server-only Supabase client using SUPABASE_SECRET_KEY
 * (or SUPABASE_SERVICE_ROLE_KEY).
 *
 * SECURITY:
 * - Bypasses Row Level Security (RLS).
 * - Must ONLY be used in trusted server contexts (Server Actions / Route Handlers)
 *   for operations that explicitly require elevated privileges.
 * - Never expose this client or its key to browser/client code.
 */
export function createAdminClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "Security violation: createAdminClient() must never be called in browser/client code."
    );
  }

  const { url, secretKey } = getSupabaseSecretEnv();

  return createSupabaseJsClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
