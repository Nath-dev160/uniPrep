"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Listens for Supabase Auth redirect hash fragments (`#access_token=...` or `#error=...`).
 *
 * Why this is needed:
 * When Supabase uses implicit redirects or falls back to the Site URL, credentials or errors
 * are placed in the URL hash fragment (`window.location.hash`), which is never sent to the server.
 * This client listener captures those tokens, stores the session via the browser Supabase client,
 * syncs cookies via `@supabase/ssr`, and cleans the URL without full page reloads.
 */
export function AuthHashListener() {
  const router = useRouter();

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash) {
      return;
    }

    const hashString = window.location.hash.startsWith("#")
      ? window.location.hash.substring(1)
      : window.location.hash;

    if (!hashString) return;

    const params = new URLSearchParams(hashString);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const errorDescription = params.get("error_description");
    const errorCode = params.get("error_code");
    const errorParam = params.get("error");

    if (errorParam || errorCode || errorDescription) {
      const message =
        errorDescription ||
        (errorCode === "otp_expired"
          ? "The verification link has expired. Please log in or request a new link."
          : errorParam || "Authentication error.");

      // Clean the hash from the URL
      window.history.replaceState(null, "", window.location.pathname);
      router.push(`/login?error=${encodeURIComponent(message)}`);
      return;
    }

    if (accessToken && refreshToken && isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        supabase.auth
          .setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          .then(({ error }) => {
            // Clean the hash from the URL
            window.history.replaceState(null, "", window.location.pathname);

            if (!error) {
              router.refresh();
              router.push("/dashboard");
            } else {
              router.push(
                `/login?error=${encodeURIComponent(
                  error.message || "Failed to set session."
                )}`
              );
            }
          })
          .catch(() => {
            window.history.replaceState(null, "", window.location.pathname);
          });
      } catch {
        // Ignore initialization errors
      }
    }
  }, [router]);

  return null;
}
