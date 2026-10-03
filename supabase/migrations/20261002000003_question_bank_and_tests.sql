-- ============================================================================
-- Migration 003: Question Bank & Tests
-- Phase 2 — UniPrep Database & Authentication Foundation
--
-- Entities:
--   QUESTION BANK:
--     8. question_sources
--     9. questions
--    10. question_options
--    11. question_accepted_answers
--    12. question_versions
--   TESTS:
--    13. tests
--    14. test_configurations
--    15. test_questions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 8. question_sources
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.question_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  university_id uuid REFERENCES public.universities(id) ON DELETE SET NULL,
  name text NOT NULL,
  source_type text NOT NULL DEFAULT 'past_paper',
  academic_year text,
  semester smallint,
  reference_notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT question_sources_name_not_blank CHECK (char_length(btrim(name)) > 0),
  CONSTRAINT question_sources_type_valid CHECK (
    source_type IN ('past_paper', 'lecturer_notes', 'textbook', 'curated', 'other')
  ),
  CONSTRAINT question_sources_semester_valid CHECK (
    semester IS NULL OR semester IN (1, 2)
  )
);

CREATE INDEX IF NOT EXISTS idx_question_sources_course_id
  ON public.question_sources (course_id);
CREATE INDEX IF NOT EXISTS idx_question_sources_university_id
  ON public.question_sources (university_id);

CREATE TRIGGER set_question_sources_updated_at
  BEFORE UPDATE ON public.question_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 9. questions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  source_id uuid REFERENCES public.question_sources(id) ON DELETE SET NULL,
  question_type public.question_type NOT NULL,
  difficulty public.difficulty_level NOT NULL DEFAULT 'medium',
  status public.question_status NOT NULL DEFAULT 'draft',
  stem text NOT NULL,
  explanation text,
  hint text,
  marks numeric(5,2) NOT NULL DEFAULT 1.00,
  estimated_time_seconds integer,
  current_version integer NOT NULL DEFAULT 1,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT questions_stem_not_blank CHECK (char_length(btrim(stem)) > 0),
  CONSTRAINT questions_marks_positive CHECK (marks > 0),
  CONSTRAINT questions_estimated_time_positive CHECK (
    estimated_time_seconds IS NULL OR estimated_time_seconds > 0
  ),
  CONSTRAINT questions_current_version_positive CHECK (current_version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_questions_course_status
  ON public.questions (course_id, status);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id
  ON public.questions (topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_source_id
  ON public.questions (source_id);
CREATE INDEX IF NOT EXISTS idx_questions_type_difficulty
  ON public.questions (question_type, difficulty);

CREATE TRIGGER set_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 10. question_options
-- Stores choices for multiple_choice and true_false questions.
-- SECURITY NOTE: `is_correct` and `feedback` are sensitive answer-key fields
-- protected by RLS in Migration 005 so students cannot query them directly.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  label text NOT NULL,
  content text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  feedback text,
  display_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT question_options_question_label_unique UNIQUE (question_id, label),
  CONSTRAINT question_options_question_order_unique UNIQUE (question_id, display_order),
  CONSTRAINT question_options_label_not_blank CHECK (char_length(btrim(label)) > 0),
  CONSTRAINT question_options_content_not_blank CHECK (char_length(btrim(content)) > 0),
  CONSTRAINT question_options_display_order_non_negative CHECK (display_order >= 0)
);

CREATE INDEX IF NOT EXISTS idx_question_options_question_id
  ON public.question_options (question_id, display_order);

CREATE TRIGGER set_question_options_updated_at
  BEFORE UPDATE ON public.question_options
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 11. question_accepted_answers
-- Stores accepted answer strings for fill_in_the_blank questions.
-- SECURITY NOTE: Entire table is sensitive answer-key data; restricted to
-- admins and server-side grading only via RLS in Migration 005.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.question_accepted_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  accepted_text text NOT NULL,
  normalized_text text NOT NULL,
  is_case_sensitive boolean NOT NULL DEFAULT false,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT question_accepted_answers_unique UNIQUE (question_id, normalized_text),
  CONSTRAINT question_accepted_answers_text_not_blank CHECK (char_length(btrim(accepted_text)) > 0),
  CONSTRAINT question_accepted_answers_norm_not_blank CHECK (char_length(btrim(normalized_text)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_question_accepted_answers_question_id
  ON public.question_accepted_answers (question_id);

-- ----------------------------------------------------------------------------
-- 12. question_versions
-- Immutable revision history snapshots whenever a question is versioned.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.question_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  question_type public.question_type NOT NULL,
  difficulty public.difficulty_level NOT NULL,
  stem text NOT NULL,
  explanation text,
  change_summary text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT question_versions_unique UNIQUE (question_id, version_number),
  CONSTRAINT question_versions_number_positive CHECK (version_number >= 1),
  CONSTRAINT question_versions_stem_not_blank CHECK (char_length(btrim(stem)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_question_versions_question_id
  ON public.question_versions (question_id, version_number DESC);

-- ----------------------------------------------------------------------------
-- 13. tests
-- Curated or configured examination templates scoped to a course.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  instructions text,
  test_type public.test_type NOT NULL DEFAULT 'mock_exam',
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tests_course_slug_unique UNIQUE (course_id, slug),
  CONSTRAINT tests_title_not_blank CHECK (char_length(btrim(title)) > 0),
  CONSTRAINT tests_slug_not_blank CHECK (char_length(btrim(slug)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_tests_course_published
  ON public.tests (course_id, is_published);

CREATE TRIGGER set_tests_updated_at
  BEFORE UPDATE ON public.tests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 14. test_configurations
-- Timing, question count, randomization, and integrity settings for a test.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.test_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL UNIQUE REFERENCES public.tests(id) ON DELETE CASCADE,
  duration_minutes integer NOT NULL,
  total_questions integer NOT NULL,
  pass_mark_percentage numeric(5,2) NOT NULL DEFAULT 50.00,
  shuffle_questions boolean NOT NULL DEFAULT true,
  shuffle_options boolean NOT NULL DEFAULT true,
  allow_back_navigation boolean NOT NULL DEFAULT true,
  show_results_immediately boolean NOT NULL DEFAULT true,
  max_attempts integer,
  strict_integrity_mode boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT test_configurations_duration_valid CHECK (duration_minutes > 0 AND duration_minutes <= 600),
  CONSTRAINT test_configurations_total_questions_valid CHECK (total_questions > 0 AND total_questions <= 500),
  CONSTRAINT test_configurations_pass_mark_valid CHECK (pass_mark_percentage >= 0 AND pass_mark_percentage <= 100),
  CONSTRAINT test_configurations_max_attempts_valid CHECK (max_attempts IS NULL OR max_attempts > 0)
);

CREATE TRIGGER set_test_configurations_updated_at
  BEFORE UPDATE ON public.test_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 15. test_questions
-- Ordered mapping of questions assigned to a fixed/curated test.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.test_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  display_order integer NOT NULL,
  marks_override numeric(5,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT test_questions_test_question_unique UNIQUE (test_id, question_id),
  CONSTRAINT test_questions_test_order_unique UNIQUE (test_id, display_order),
  CONSTRAINT test_questions_display_order_non_negative CHECK (display_order >= 0),
  CONSTRAINT test_questions_marks_override_positive CHECK (marks_override IS NULL OR marks_override > 0)
);

CREATE INDEX IF NOT EXISTS idx_test_questions_test_id
  ON public.test_questions (test_id, display_order);
CREATE INDEX IF NOT EXISTS idx_test_questions_question_id
  ON public.test_questions (question_id);
