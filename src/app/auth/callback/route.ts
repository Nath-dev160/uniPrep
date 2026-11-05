import type { NextRequest } from "next/server";

import { handleAuthCallback } from "@/features/auth/callback-handler";

export const dynamic = "force-dynamic";

/**
 * Route handler for `/auth/callback`.
 * Handles PKCE authorization codes, email token verification, and password recovery redirects.
 */
export async function GET(request: NextRequest) {
  return await handleAuthCallback(request);
}
