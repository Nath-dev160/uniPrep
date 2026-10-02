import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "./env";

/**
 * Creates a Supabase client for use in Client Components (browser context).
 *
 * Uses only the public URL and publishable/anon key — all data access
 * through this client is subject to PostgreSQL Row Level Security (RLS).
 */
export function createClient(): SupabaseClient {
  const { url, anonKey } = getSupabasePublicEnv();
  return createBrowserClient(url, anonKey);
}
