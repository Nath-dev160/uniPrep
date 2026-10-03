-- ============================================================================
-- Migration 004: Exam Attempts, Practice, Engagement, Performance & Content Ops
-- Phase 2 — UniPrep Database & Authentication Foundation
--
-- Entities:
--   EXAM ATTEMPTS:
--    16. exam_sessions
--    17. exam_answers
--    18. exam_events
--   PRACTICE:
--    19. practice_sessions
--    20. practice_answers
--   FEEDBACK / ENGAGEMENT:
--    21. question_reports
--    22. bookmarks
--   PERFORMANCE:
--    23. performance_snapshots
--    24. topic_performance
--    25. course_performance
--   AI / CONTENT OPERATIONS:
--    26. ai_explanations
--    27. question_imports
--    28. admin_actions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 16. exam_sessions
-- Timed examination attempt by a student.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exam_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  test_id uuid REFERENCES public.tests(id) ON DELETE SET NULL,
  status public.session_status NOT NULL DEFAULT 'in_progress',
  duration_minutes integer NOT NULL,
  total_questions integer NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  submitted_at timestamptz,
  time_spent_seconds integer,
  score numeric(7,2),
  max_score numeric(7,2),
  percentage numeric(5,2),
  correct_count integer,
  incorrect_count integer,
  unanswered_count integer,
  integrity_flags_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exam_sessions_duration_positive CHECK (duration_minutes > 0),
  CONSTRAINT exam_sessions_total_questions_positive CHECK (total_questions > 0),
  CONSTRAINT exam_sessions_expires_after_start CHECK (expires_at > started_at),
  CONSTRAINT exam_sessions_time_spent_non_negative CHECK (
    time_spent_seconds IS NULL OR time_spent_seconds >= 0
  ),
  CONSTRAINT exam_sessions_score_non_negative CHECK (score IS NULL OR score >= 0),
  CONSTRAINT exam_sessions_max_score_non_negative CHECK (max_score IS NULL OR max_score >= 0),
  CONSTRAINT exam_sessions_percentage_valid CHECK (
    percentage IS NULL OR (percentage >= 0 AND percentage <= 100)
  ),
  CONSTRAINT exam_sessions_counts_non_negative CHECK (
    (correct_count IS NULL OR correct_count >= 0) AND
    (incorrect_count IS NULL OR incorrect_count >= 0) AND
    (unanswered_count IS NULL OR unanswered_count >= 0) AND
    integrity_flags_count >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_status
  ON public.exam_sessions (user_id, status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_course_id
  ON public.exam_sessions (course_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_test_id
  ON public.exam_sessions (test_id);

CREATE TRIGGER set_exam_sessions_updated_at
  BEFORE UPDATE ON public.exam_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 17. exam_answers
-- Student responses within an exam session.
-- Becoming read-only once the parent exam_session is submitted/expired.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exam_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_session_id uuid NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  question_order integer NOT NULL,
  selected_option_id uuid REFERENCES public.question_options(id) ON DELETE SET NULL,
  text_answer text,
  is_flagged_for_review boolean NOT NULL DEFAULT false,
  is_correct boolean,
  marks_awarded numeric(5,2),
  time_spent_seconds integer NOT NULL DEFAULT 0,
  answered_at timestamptz,
  graded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exam_answers_session_question_unique UNIQUE (exam_session_id, question_id),
  CONSTRAINT exam_answers_session_order_unique UNIQUE (exam_session_id, question_order),
  CONSTRAINT exam_answers_question_order_non_negative CHECK (question_order >= 0),
  CONSTRAINT exam_answers_marks_awarded_non_negative CHECK (
    marks_awarded IS NULL OR marks_awarded >= 0
  ),
  CONSTRAINT exam_answers_time_spent_non_negative CHECK (time_spent_seconds >= 0)
);

CREATE INDEX IF NOT EXISTS idx_exam_answers_session_id
  ON public.exam_answers (exam_session_id, question_order);
CREATE INDEX IF NOT EXISTS idx_exam_answers_question_id
  ON public.exam_answers (question_id);

CREATE TRIGGER set_exam_answers_updated_at
  BEFORE UPDATE ON public.exam_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Prevent silent alteration of submitted answers on exam_answers
CREATE OR REPLACE FUNCTION public.protect_submitted_exam_answers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_session_status public.session_status;
BEGIN
  SELECT status INTO v_session_status
  FROM public.exam_sessions
  WHERE id = COALESCE(OLD.exam_session_id, NEW.exam_session_id);

  IF TG_OP = 'DELETE' THEN
    IF v_session_status IS DISTINCT FROM 'in_progress'::public.session_status THEN
      RAISE EXCEPTION 'Submitted or closed exam answers cannot be deleted.';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Once an exam session is no longer in_progress, the student's recorded
    -- response choices (selected_option_id, text_answer, question_id) are immutable.
    IF v_session_status IS DISTINCT FROM 'in_progress'::public.session_status THEN
      IF NEW.selected_option_id IS DISTINCT FROM OLD.selected_option_id
         OR NEW.text_answer IS DISTINCT FROM OLD.text_answer
         OR NEW.question_id IS DISTINCT FROM OLD.question_id
         OR NEW.exam_session_id IS DISTINCT FROM OLD.exam_session_id THEN
        RAISE EXCEPTION 'Submitted exam answers are read-only and cannot be altered.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.protect_submitted_exam_answers() IS
  'Prevents modification or deletion of student response fields once an exam session is submitted, expired, or abandoned.';

CREATE TRIGGER enforce_submitted_exam_answers_immutability
  BEFORE UPDATE OR DELETE ON public.exam_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_submitted_exam_answers();

-- ----------------------------------------------------------------------------
-- 18. exam_events
-- Append-only log of exam session lifecycle and academic integrity events.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exam_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_session_id uuid NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type public.exam_event_type NOT NULL,
  event_details text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_events_session_id
  ON public.exam_events (exam_session_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_exam_events_user_id
  ON public.exam_events (user_id, occurred_at DESC);

-- ----------------------------------------------------------------------------
-- 19. practice_sessions
-- Untimed or self-paced topic/course practice sessions.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  status public.session_status NOT NULL DEFAULT 'in_progress',
  difficulty_filter public.difficulty_level,
  question_type_filter public.question_type,
  total_questions integer NOT NULL,
  answered_count integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  total_time_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT practice_sessions_total_questions_positive CHECK (total_questions > 0),
  CONSTRAINT practice_sessions_counts_valid CHECK (
    answered_count >= 0 AND
    correct_count >= 0 AND
    correct_count <= answered_count AND
    total_time_seconds >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id
  ON public.practice_sessions (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_course_id
  ON public.practice_sessions (course_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_topic_id
  ON public.practice_sessions (topic_id);

CREATE TRIGGER set_practice_sessions_updated_at
  BEFORE UPDATE ON public.practice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 20. practice_answers
-- Student responses recorded during a practice session.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.practice_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_session_id uuid NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  question_order integer NOT NULL,
  selected_option_id uuid REFERENCES public.question_options(id) ON DELETE SET NULL,
  text_answer text,
  is_correct boolean,
  time_spent_seconds integer NOT NULL DEFAULT 0,
  answered_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT practice_answers_session_question_unique UNIQUE (practice_session_id, question_id),
  CONSTRAINT practice_answers_question_order_non_negative CHECK (question_order >= 0),
  CONSTRAINT practice_answers_time_spent_non_negative CHECK (time_spent_seconds >= 0)
);

CREATE INDEX IF NOT EXISTS idx_practice_answers_session_id
  ON public.practice_answers (practice_session_id, question_order);
CREATE INDEX IF NOT EXISTS idx_practice_answers_user_id
  ON public.practice_answers (user_id, answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_practice_answers_question_id
  ON public.practice_answers (question_id);

-- ----------------------------------------------------------------------------
-- 21. question_reports
-- Student-submitted quality/error reports on questions, reviewed by admins.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.question_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  description text NOT NULL,
  status public.report_status NOT NULL DEFAULT 'open',
  resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT question_reports_reason_valid CHECK (
    reason IN (
      'incorrect_answer',
      'typo_or_unclear',
      'out_of_syllabus',
      'duplicate',
      'broken_formatting',
      'other'
    )
  ),
  CONSTRAINT question_reports_description_not_blank CHECK (char_length(btrim(description)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_question_reports_status
  ON public.question_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_reports_question_id
  ON public.question_reports (question_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_reporter_id
  ON public.question_reports (reporter_id);

CREATE TRIGGER set_question_reports_updated_at
  BEFORE UPDATE ON public.question_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 22. bookmarks
-- Student-saved questions for later review.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookmarks_user_question_unique UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id
  ON public.bookmarks (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_question_id
  ON public.bookmarks (question_id);

-- ----------------------------------------------------------------------------
-- 23. performance_snapshots
-- Daily/periodic aggregate snapshots of a student's overall performance.
-- Written authoritatively by server-side logic only.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.performance_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  total_questions_answered integer NOT NULL DEFAULT 0,
  total_correct integer NOT NULL DEFAULT 0,
  overall_accuracy numeric(5,2) NOT NULL DEFAULT 0.00,
  average_time_seconds numeric(7,2) NOT NULL DEFAULT 0.00,
  exams_completed integer NOT NULL DEFAULT 0,
  practice_sessions_completed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT performance_snapshots_user_date_unique UNIQUE (user_id, snapshot_date),
  CONSTRAINT performance_snapshots_counts_valid CHECK (
    total_questions_answered >= 0 AND
    total_correct >= 0 AND
    total_correct <= total_questions_answered AND
    overall_accuracy >= 0 AND overall_accuracy <= 100 AND
    average_time_seconds >= 0 AND
    exams_completed >= 0 AND
    practice_sessions_completed >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_performance_snapshots_user_date
  ON public.performance_snapshots (user_id, snapshot_date DESC);

-- ----------------------------------------------------------------------------
-- 24. course_performance
-- Per-course aggregate performance metrics for a student.
-- Written authoritatively by server-side logic only.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  questions_attempted integer NOT NULL DEFAULT 0,
  questions_correct integer NOT NULL DEFAULT 0,
  accuracy_percentage numeric(5,2) NOT NULL DEFAULT 0.00,
  average_time_seconds numeric(7,2) NOT NULL DEFAULT 0.00,
  exams_taken integer NOT NULL DEFAULT 0,
  last_practiced_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT course_performance_user_course_unique UNIQUE (user_id, course_id),
  CONSTRAINT course_performance_metrics_valid CHECK (
    questions_attempted >= 0 AND
    questions_correct >= 0 AND
    questions_correct <= questions_attempted AND
    accuracy_percentage >= 0 AND accuracy_percentage <= 100 AND
    average_time_seconds >= 0 AND
    exams_taken >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_course_performance_user_id
  ON public.course_performance (user_id, accuracy_percentage);
CREATE INDEX IF NOT EXISTS idx_course_performance_course_id
  ON public.course_performance (course_id);

CREATE TRIGGER set_course_performance_updated_at
  BEFORE UPDATE ON public.course_performance
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 25. topic_performance
-- Per-topic aggregate performance and mastery metrics for a student.
-- Written authoritatively by server-side logic only.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.topic_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  questions_attempted integer NOT NULL DEFAULT 0,
  questions_correct integer NOT NULL DEFAULT 0,
  accuracy_percentage numeric(5,2) NOT NULL DEFAULT 0.00,
  average_time_seconds numeric(7,2) NOT NULL DEFAULT 0.00,
  mastery_level text NOT NULL DEFAULT 'unassessed',
  last_practiced_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT topic_performance_user_topic_unique UNIQUE (user_id, topic_id),
  CONSTRAINT topic_performance_metrics_valid CHECK (
    questions_attempted >= 0 AND
    questions_correct >= 0 AND
    questions_correct <= questions_attempted AND
    accuracy_percentage >= 0 AND accuracy_percentage <= 100 AND
    average_time_seconds >= 0
  ),
  CONSTRAINT topic_performance_mastery_valid CHECK (
    mastery_level IN ('unassessed', 'needs_work', 'developing', 'proficient', 'mastered')
  )
);

CREATE INDEX IF NOT EXISTS idx_topic_performance_user_course
  ON public.topic_performance (user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_topic_performance_topic_id
  ON public.topic_performance (topic_id);

CREATE TRIGGER set_topic_performance_updated_at
  BEFORE UPDATE ON public.topic_performance
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 26. ai_explanations
-- Cached, server-generated AI explanations for questions.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_explanations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  prompt_hash text NOT NULL,
  model_name text NOT NULL,
  explanation_markdown text NOT NULL,
  key_takeaways text,
  is_verified boolean NOT NULL DEFAULT false,
  verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_explanations_question_hash_unique UNIQUE (question_id, prompt_hash),
  CONSTRAINT ai_explanations_markdown_not_blank CHECK (char_length(btrim(explanation_markdown)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_ai_explanations_question_id
  ON public.ai_explanations (question_id);

CREATE TRIGGER set_ai_explanations_updated_at
  BEFORE UPDATE ON public.ai_explanations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 27. question_imports
-- Tracks admin batch question import jobs and their outcomes.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.question_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  source_filename text NOT NULL,
  format text NOT NULL,
  status public.import_status NOT NULL DEFAULT 'pending',
  total_rows integer NOT NULL DEFAULT 0,
  imported_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  error_summary text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT question_imports_format_valid CHECK (format IN ('csv', 'json', 'markdown')),
  CONSTRAINT question_imports_counts_valid CHECK (
    total_rows >= 0 AND
    imported_count >= 0 AND
    failed_count >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_question_imports_uploaded_by
  ON public.question_imports (uploaded_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_imports_status
  ON public.question_imports (status, created_at DESC);

CREATE TRIGGER set_question_imports_updated_at
  BEFORE UPDATE ON public.question_imports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 28. admin_actions
-- Immutable audit log of administrative actions across the platform.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action_type text NOT NULL,
  target_table text NOT NULL,
  target_id uuid,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_actions_action_type_not_blank CHECK (char_length(btrim(action_type)) > 0),
  CONSTRAINT admin_actions_target_table_not_blank CHECK (char_length(btrim(target_table)) > 0),
  CONSTRAINT admin_actions_description_not_blank CHECK (char_length(btrim(description)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id
  ON public.admin_actions (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target
  ON public.admin_actions (target_table, target_id);
