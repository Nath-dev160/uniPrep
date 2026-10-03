-- ============================================================================
-- Migration 002: Academic Hierarchy & User Profiles
-- Phase 2 — UniPrep Database & Authentication Foundation
--
-- Entities:
--   1. universities
--   2. faculties
--   3. departments
--   4. academic_levels
--   5. courses
--   6. topics
--   7. profiles (1-to-1 with auth.users)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. universities
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text,
  slug text NOT NULL,
  country text NOT NULL DEFAULT 'Nigeria',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT universities_name_unique UNIQUE (name),
  CONSTRAINT universities_slug_unique UNIQUE (slug),
  CONSTRAINT universities_name_not_blank CHECK (char_length(btrim(name)) > 0),
  CONSTRAINT universities_slug_not_blank CHECK (char_length(btrim(slug)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_universities_is_active
  ON public.universities (is_active);

CREATE TRIGGER set_universities_updated_at
  BEFORE UPDATE ON public.universities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. faculties
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faculties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  slug text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT faculties_university_name_unique UNIQUE (university_id, name),
  CONSTRAINT faculties_university_slug_unique UNIQUE (university_id, slug),
  CONSTRAINT faculties_name_not_blank CHECK (char_length(btrim(name)) > 0),
  CONSTRAINT faculties_slug_not_blank CHECK (char_length(btrim(slug)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_faculties_university_id
  ON public.faculties (university_id);

CREATE TRIGGER set_faculties_updated_at
  BEFORE UPDATE ON public.faculties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. departments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id uuid NOT NULL REFERENCES public.faculties(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  slug text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT departments_faculty_name_unique UNIQUE (faculty_id, name),
  CONSTRAINT departments_faculty_slug_unique UNIQUE (faculty_id, slug),
  CONSTRAINT departments_name_not_blank CHECK (char_length(btrim(name)) > 0),
  CONSTRAINT departments_slug_not_blank CHECK (char_length(btrim(slug)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_departments_faculty_id
  ON public.departments (faculty_id);

CREATE TRIGGER set_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. academic_levels
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academic_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  rank integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academic_levels_university_code_unique UNIQUE NULLS NOT DISTINCT (university_id, code),
  CONSTRAINT academic_levels_university_rank_unique UNIQUE NULLS NOT DISTINCT (university_id, rank),
  CONSTRAINT academic_levels_rank_positive CHECK (rank > 0),
  CONSTRAINT academic_levels_name_not_blank CHECK (char_length(btrim(name)) > 0),
  CONSTRAINT academic_levels_code_not_blank CHECK (char_length(btrim(code)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_academic_levels_university_id
  ON public.academic_levels (university_id);

CREATE TRIGGER set_academic_levels_updated_at
  BEFORE UPDATE ON public.academic_levels
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. courses
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  academic_level_id uuid REFERENCES public.academic_levels(id) ON DELETE SET NULL,
  code text NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  credit_units smallint,
  semester smallint,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT courses_department_code_unique UNIQUE (department_id, code),
  CONSTRAINT courses_department_slug_unique UNIQUE (department_id, slug),
  CONSTRAINT courses_code_not_blank CHECK (char_length(btrim(code)) > 0),
  CONSTRAINT courses_title_not_blank CHECK (char_length(btrim(title)) > 0),
  CONSTRAINT courses_slug_not_blank CHECK (char_length(btrim(slug)) > 0),
  CONSTRAINT courses_credit_units_valid CHECK (credit_units IS NULL OR (credit_units >= 0 AND credit_units <= 30)),
  CONSTRAINT courses_semester_valid CHECK (semester IS NULL OR semester IN (1, 2))
);

CREATE INDEX IF NOT EXISTS idx_courses_department_id
  ON public.courses (department_id);
CREATE INDEX IF NOT EXISTS idx_courses_academic_level_id
  ON public.courses (academic_level_id);
CREATE INDEX IF NOT EXISTS idx_courses_code
  ON public.courses (code);

CREATE TRIGGER set_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. topics
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT topics_course_name_unique UNIQUE (course_id, name),
  CONSTRAINT topics_course_slug_unique UNIQUE (course_id, slug),
  CONSTRAINT topics_name_not_blank CHECK (char_length(btrim(name)) > 0),
  CONSTRAINT topics_slug_not_blank CHECK (char_length(btrim(slug)) > 0),
  CONSTRAINT topics_display_order_non_negative CHECK (display_order >= 0)
);

CREATE INDEX IF NOT EXISTS idx_topics_course_id_order
  ON public.topics (course_id, display_order);

CREATE TRIGGER set_topics_updated_at
  BEFORE UPDATE ON public.topics
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 7. profiles
-- Strictly 1-to-1 with auth.users via shared UUID primary key.
-- Role is restricted to 'student' | 'admin' via public.user_role enum.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  role public.user_role NOT NULL DEFAULT 'student',
  university_id uuid REFERENCES public.universities(id) ON DELETE SET NULL,
  faculty_id uuid REFERENCES public.faculties(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  academic_level_id uuid REFERENCES public.academic_levels(id) ON DELETE SET NULL,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_email_not_blank CHECK (char_length(btrim(email)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_university_id
  ON public.profiles (university_id);
CREATE INDEX IF NOT EXISTS idx_profiles_faculty_id
  ON public.profiles (faculty_id);
CREATE INDEX IF NOT EXISTS idx_profiles_department_id
  ON public.profiles (department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_academic_level_id
  ON public.profiles (academic_level_id);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- SECURITY DEFINER helper 1: public.is_admin()
--
-- Why SECURITY DEFINER is required:
--   Evaluating whether the current user has role = 'admin' inside RLS policies
--   on `public.profiles` (and other tables) would cause infinite policy recursion
--   if it queried `public.profiles` as SECURITY INVOKER.
--
-- Security hardening:
--   - Explicit `SET search_path = public`
--   - Takes no parameters (always inspects `auth.uid()` directly)
--   - Read-only boolean check (`STABLE`)
--   - Execute permission revoked from PUBLIC/anon and granted only to
--     authenticated and service_role.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'::public.user_role
  );
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'Returns true iff the currently authenticated user (auth.uid()) has role = admin in public.profiles. Uses SECURITY DEFINER with fixed search_path to prevent RLS recursion.';

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- SECURITY DEFINER helper 2: public.handle_new_user()
--
-- Why SECURITY DEFINER is required:
--   Triggered by insertions into `auth.users` (owned by supabase_auth_admin)
--   to guarantee every authenticated user immediately receives a corresponding
--   1-to-1 row in `public.profiles`.
--
-- Security hardening:
--   - Explicit `SET search_path = public`
--   - Hardcodes `role` to `'student'` — NEVER reads or trusts `role` from
--     client-supplied `raw_user_meta_data`.
--   - Cannot be called directly by clients (trigger function).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display_name text;
BEGIN
  v_display_name := NULLIF(
    btrim(COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', '')),
    ''
  );

  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_display_name,
    'student'::public.user_role
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Trigger function that creates a student profile row in public.profiles whenever a new auth.users record is created. Never trusts client metadata for role assignment.';

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Defense-in-depth trigger: public.prevent_unauthorized_role_change()
--
-- Prevents a student from promoting themselves to 'admin' via profile UPDATE,
-- even if an RLS policy were ever misconfigured in the future.
-- Only service_role or an existing admin may alter `profiles.role`.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role'
       AND current_user NOT IN ('postgres', 'supabase_admin', 'service_role')
       AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized role change: users cannot modify their own role.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_unauthorized_role_change() IS
  'Enforces at the database trigger level that non-admin users cannot change profiles.role.';

CREATE TRIGGER enforce_profile_role_immutability
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_unauthorized_role_change();
