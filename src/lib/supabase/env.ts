/**
 * Supabase environment variable resolution and validation (Phase 1B).
 *
 * Supports both the newer Supabase naming convention:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
 *   - SUPABASE_SECRET_KEY
 *
 * and the legacy fallback names:
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * SECURITY:
 * Secret / service-role keys must NEVER be accessed from browser code.
 */

export interface SupabasePublicEnv {
  url: string;
  anonKey: string;
}

export interface SupabaseSecretEnv extends SupabasePublicEnv {
  secretKey: string;
}

function isPlaceholderValue(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    lower.includes("your-project") ||
    lower.includes("your-publishable") ||
    lower.includes("your-legacy") ||
    lower.includes("your-secret") ||
    lower.startsWith("your_") ||
    lower.startsWith("my_") ||
    lower === "placeholder" ||
    lower === "undefined" ||
    lower === "null"
  );
}

function normalizeEnvValue(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || isPlaceholderValue(trimmed)) return null;
  return trimmed;
}

function normalizeSupabaseUrl(value: string | undefined): string | null {
  const normalized = normalizeEnvValue(value);
  if (!normalized) return null;

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return normalized;
  } catch {
    return null;
  }
}

/**
 * Returns the public Supabase URL and publishable/anon key if present and valid,
 * or `null` if either is missing/invalid. Used by middleware to gracefully no-op
 * when Supabase environment variables are not configured yet.
 */
export function getOptionalSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey =
    normalizeEnvValue(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
    ) ?? normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

/**
 * Returns true when both the Supabase URL and publishable/anon key are configured.
 */
export function isSupabaseConfigured(): boolean {
  return getOptionalSupabasePublicEnv() !== null;
}

/**
 * Returns the validated public Supabase environment variables or throws
 * a clear configuration error.
 */
export function getSupabasePublicEnv(): SupabasePublicEnv {
  const env = getOptionalSupabasePublicEnv();

  if (!env) {
    throw new Error(
      "Missing Supabase public environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in your environment."
    );
  }

  return env;
}

/**
 * Server-only helper to retrieve the privileged Supabase secret / service-role key.
 * Throws immediately if invoked in a browser context or if the key is missing.
 */
export function getSupabaseSecretEnv(): SupabaseSecretEnv {
  if (typeof window !== "undefined") {
    throw new Error(
      "Security violation: getSupabaseSecretEnv() must never be called in browser/client code."
    );
  }

  const { url, anonKey } = getSupabasePublicEnv();
  const secretKey =
    normalizeEnvValue(process.env.SUPABASE_SECRET_KEY) ??
    normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!secretKey) {
    throw new Error(
      "Missing Supabase server secret key. Set SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) in your server environment."
    );
  }

  return { url, anonKey, secretKey };
}
