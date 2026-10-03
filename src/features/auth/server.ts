import type { User } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";

export interface AuthSessionContext {
  configured: boolean;
  user: User | null;
  profile: ProfileRow | null;
}

/**
 * Retrieves the currently authenticated Supabase user and their 1-to-1
 * `public.profiles` record on the server.
 *
 * Gracefully returns `{ configured: false, user: null, profile: null }`
 * when Supabase environment variables are not configured.
 */
export async function getCurrentSessionUser(): Promise<AuthSessionContext> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      user: null,
      profile: null,
    };
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        configured: true,
        user: null,
        profile: null,
      };
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select(
        "id, email, display_name, role, university_id, faculty_id, department_id, academic_level_id, onboarding_completed, created_at, updated_at"
      )
      .eq("id", user.id)
      .maybeSingle<ProfileRow>();

    if (profileData) {
      return {
        configured: true,
        user,
        profile: profileData,
      };
    }

    // Fallback: if the user authenticated before the DB trigger existed,
    // create their student profile row adhering to RLS (`role = 'student'`).
    const fallbackDisplayName =
      typeof user.user_metadata?.display_name === "string" &&
      user.user_metadata.display_name.trim().length > 0
        ? user.user_metadata.display_name.trim()
        : null;

    const { data: insertedProfile } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email ?? "",
        display_name: fallbackDisplayName,
        role: "student",
      })
      .select(
        "id, email, display_name, role, university_id, faculty_id, department_id, academic_level_id, onboarding_completed, created_at, updated_at"
      )
      .maybeSingle<ProfileRow>();

    return {
      configured: true,
      user,
      profile: insertedProfile ?? null,
    };
  } catch {
    return {
      configured: true,
      user: null,
      profile: null,
    };
  }
}
