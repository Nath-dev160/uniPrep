/**
 * Shared, hand-written TypeScript types live here.
 *
 * Once the database schema exists (Phase 2), generated Supabase types
 * (Database, Tables<...>, etc.) will be added alongside these — this file
 * is intentionally left minimal until then, rather than guessing at a
 * schema ahead of PROJECT_SPEC.md's Phase 2 work.
 */

export type UserRole = "student" | "admin";
