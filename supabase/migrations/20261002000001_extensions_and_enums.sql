-- ============================================================================
-- Migration 001: Extensions, Utility Triggers, and Domain Enums
-- Phase 2 — UniPrep Database & Authentication Foundation
-- ============================================================================

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ----------------------------------------------------------------------------
-- Shared updated_at timestamp trigger function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS
  'Automatically updates the updated_at timestamp column before row update.';

-- ----------------------------------------------------------------------------
-- Domain Enums
-- Restricted to clear, stable domain enumerations per PROJECT_SPEC.md.
-- ----------------------------------------------------------------------------

-- User roles: strictly restricted to student and admin per Phase 2 spec.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.user_role AS ENUM ('student', 'admin');
  END IF;
END
$$;

-- Question types supported by the platform
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.question_type AS ENUM (
      'multiple_choice',
      'true_false',
      'fill_in_the_blank'
    );
  END IF;
END
$$;

-- Question difficulty levels
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_level' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.difficulty_level AS ENUM ('easy', 'medium', 'hard');
  END IF;
END
$$;

-- Lifecycle status of a question in the question bank
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_status' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.question_status AS ENUM ('draft', 'published', 'archived');
  END IF;
END
$$;

-- Test classification
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'test_type' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.test_type AS ENUM (
      'practice_preset',
      'mock_exam',
      'course_test',
      'custom'
    );
  END IF;
END
$$;

-- Practice and Exam session lifecycle status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.session_status AS ENUM (
      'in_progress',
      'submitted',
      'abandoned',
      'expired'
    );
  END IF;
END
$$;

-- Exam integrity / lifecycle event types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exam_event_type' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.exam_event_type AS ENUM (
      'session_started',
      'tab_hidden',
      'window_blur',
      'fullscreen_exited',
      'copy_attempt',
      'paste_attempt',
      'navigation_warning',
      'reconnect',
      'auto_submitted',
      'session_submitted'
    );
  END IF;
END
$$;

-- Student question report status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.report_status AS ENUM (
      'open',
      'under_review',
      'resolved',
      'dismissed'
    );
  END IF;
END
$$;

-- Batch question import job status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'import_status' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.import_status AS ENUM (
      'pending',
      'processing',
      'completed',
      'failed'
    );
  END IF;
END
$$;
