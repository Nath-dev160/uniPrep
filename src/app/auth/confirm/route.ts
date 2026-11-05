import type { NextRequest } from "next/server";

import { handleAuthCallback } from "@/features/auth/callback-handler";

export const dynamic = "force-dynamic";

/**
 * Route handler for `/auth/confirm`.
 * Standard server-side email verification endpoint recommended by Supabase for Next.js App Router SSR.
 * Handles `token_hash`, `token`, `code`, and redirects with established session cookies.
 */
export async function GET(request: NextRequest) {
  return await handleAuthCallback(request);
}
