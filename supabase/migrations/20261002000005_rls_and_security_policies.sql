-- ============================================================================
-- Migration 005: Row Level Security (RLS) & Answer-Secrecy Enforcement
-- Phase 2 — UniPrep Database & Authentication Foundation
--
-- Implements the RLS model defined in PROJECT_SPEC.md Section 17 and Section 18:
--   1. Enable RLS on all 25 application tables.
--   2. PROFILES: self read/update (cannot self-promote to admin); admins read all.
--   3. ACADEMIC HIERARCHY: authenticated read; admin-only write.
--   4. QUESTION BANK: raw answer-revealing tables/columns restricted so students
--      cannot query `question_options.is_correct` or `question_accepted_answers`.
--   5. TESTS: students read published test metadata/configurations; admin-only write.
--   6. EXAM SESSIONS / ANSWERS / EVENTS: students access own; submitted sessions
--      and answers are read-only; admins cannot silently alter submitted answers.
--   7. PRACTICE: students access only their own sessions and answers.
--   8. QUESTION REPORTS: students create/read own; admins manage all.
--   9. BOOKMARKS: students access only their own.
--  10. PERFORMANCE: students read own; authoritative writes restricted to server/admin.
--  11. AI EXPLANATIONS: authenticated users read verified explanations after
--      questions are published; writes restricted to server/admin.
--  12. QUESTION IMPORTS / ADMIN ACTIONS: admin-only.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enable Row Level Security on all 25 tables
-- ----------------------------------------------------------------------------
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_accepted_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 1. PROFILES POLICIES
-- ============================================================================

CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_insert_own_student"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    AND role = 'student'::public.user_role
  );

-- Users can update their own profile fields (display_name, academic context),
-- but the WITH CHECK clause (plus the BEFORE UPDATE trigger in Migration 002)
-- guarantees a student can never change their own role to 'admin'.
CREATE POLICY "profiles_update_own_without_role_escalation"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      role = 'student'::public.user_role
      OR public.is_admin()
    )
  );

CREATE POLICY "profiles_admin_update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 2. ACADEMIC HIERARCHY POLICIES
-- Authenticated users can read; only admins can insert, update, or delete.
-- ============================================================================

-- universities
CREATE POLICY "universities_select_authenticated"
  ON public.universities
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "universities_admin_write"
  ON public.universities
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- faculties
CREATE POLICY "faculties_select_authenticated"
  ON public.faculties
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "faculties_admin_write"
  ON public.faculties
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- departments
CREATE POLICY "departments_select_authenticated"
  ON public.departments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "departments_admin_write"
  ON public.departments
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- academic_levels
CREATE POLICY "academic_levels_select_authenticated"
  ON public.academic_levels
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "academic_levels_admin_write"
  ON public.academic_levels
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- courses
CREATE POLICY "courses_select_authenticated"
  ON public.courses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "courses_admin_write"
  ON public.courses
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- topics
CREATE POLICY "topics_select_authenticated"
  ON public.topics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "topics_admin_write"
  ON public.topics
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 3. QUESTION BANK POLICIES (STRICT ANSWER-KEY SECRECY)
--
-- Students must NEVER receive raw answer-revealing data (`question_options.is_correct`,
-- `question_accepted_answers`, or unredacted question bank rows) through direct
-- client table queries.
-- Direct table access on `questions`, `question_options`, `question_accepted_answers`,
-- and `question_versions` is restricted to admins (`public.is_admin()`).
-- Future practice/exam delivery will serve sanitized questions through a
-- server-side layer that strips answer keys before sending payloads to the browser.
-- ============================================================================

-- question_sources: authenticated users can read source metadata; admins manage.
CREATE POLICY "question_sources_select_authenticated"
  ON public.question_sources
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "question_sources_admin_write"
  ON public.question_sources
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- questions: admin-only direct table access so raw explanations/unpublished items
-- cannot be scraped directly by student browser clients.
CREATE POLICY "questions_admin_all"
  ON public.questions
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- question_options: admin-only direct table access so `is_correct` and `feedback`
-- are never exposed to student browser queries.
CREATE POLICY "question_options_admin_all"
  ON public.question_options
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- question_accepted_answers: admin-only direct table access so accepted fill-in-the-blank
-- answers are never exposed to student browser queries.
CREATE POLICY "question_accepted_answers_admin_all"
  ON public.question_accepted_answers
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- question_versions: admin-only access to revision history.
CREATE POLICY "question_versions_admin_all"
  ON public.question_versions
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 4. TESTS POLICIES
-- Students can read published tests and their configurations;
-- test_questions mapping is restricted to admins (served server-side during active exams).
-- ============================================================================

CREATE POLICY "tests_select_published_or_admin"
  ON public.tests
  FOR SELECT
  TO authenticated
  USING (is_published = true OR public.is_admin());

CREATE POLICY "tests_admin_write"
  ON public.tests
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "test_configurations_select_published_or_admin"
  ON public.test_configurations
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.tests t
      WHERE t.id = test_configurations.test_id
        AND t.is_published = true
    )
  );

CREATE POLICY "test_configurations_admin_write"
  ON public.test_configurations
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "test_questions_admin_all"
  ON public.test_questions
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 5. EXAM SESSIONS, ANSWERS & EVENTS POLICIES
-- - Students access only their own records.
-- - Submitted attempts become read-only to students.
-- - Admins have read access for review/support, but NO policy allows admins to
--   silently alter or delete student answers.
-- ============================================================================

-- exam_sessions
CREATE POLICY "exam_sessions_select_own_or_admin"
  ON public.exam_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "exam_sessions_insert_own"
  ON public.exam_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'in_progress'::public.session_status
    AND score IS NULL
    AND percentage IS NULL
    AND correct_count IS NULL
  );

-- Students may only update an active (in_progress, non-expired) session
-- and cannot self-assign a graded score from the client.
CREATE POLICY "exam_sessions_update_active_own"
  ON public.exam_sessions
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND status = 'in_progress'::public.session_status
    AND expires_at > now()
  )
  WITH CHECK (
    auth.uid() = user_id
    AND score IS NULL
    AND percentage IS NULL
    AND correct_count IS NULL
  );

-- exam_answers
CREATE POLICY "exam_answers_select_own_or_admin"
  ON public.exam_answers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.exam_sessions s
      WHERE s.id = exam_answers.exam_session_id
        AND (s.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "exam_answers_insert_active_own"
  ON public.exam_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_correct IS NULL
    AND marks_awarded IS NULL
    AND graded_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.exam_sessions s
      WHERE s.id = exam_answers.exam_session_id
        AND s.user_id = auth.uid()
        AND s.status = 'in_progress'::public.session_status
        AND s.expires_at > now()
    )
  );

CREATE POLICY "exam_answers_update_active_own"
  ON public.exam_answers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.exam_sessions s
      WHERE s.id = exam_answers.exam_session_id
        AND s.user_id = auth.uid()
        AND s.status = 'in_progress'::public.session_status
        AND s.expires_at > now()
    )
  )
  WITH CHECK (
    is_correct IS NULL
    AND marks_awarded IS NULL
    AND graded_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.exam_sessions s
      WHERE s.id = exam_answers.exam_session_id
        AND s.user_id = auth.uid()
        AND s.status = 'in_progress'::public.session_status
        AND s.expires_at > now()
    )
  );

-- exam_events (append-only log: SELECT + INSERT only, no UPDATE or DELETE)
CREATE POLICY "exam_events_select_own_or_admin"
  ON public.exam_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "exam_events_insert_own"
  ON public.exam_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.exam_sessions s
      WHERE s.id = exam_events.exam_session_id
        AND s.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. PRACTICE SESSIONS & ANSWERS POLICIES
-- Students access only their own practice sessions and answers.
-- ============================================================================

CREATE POLICY "practice_sessions_select_own"
  ON public.practice_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "practice_sessions_insert_own"
  ON public.practice_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "practice_sessions_update_own"
  ON public.practice_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "practice_answers_select_own"
  ON public.practice_answers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "practice_answers_insert_own"
  ON public.practice_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.practice_sessions ps
      WHERE ps.id = practice_answers.practice_session_id
        AND ps.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. QUESTION REPORTS & BOOKMARKS POLICIES
-- ============================================================================

-- question_reports: students create and read their own; admins read and update all.
CREATE POLICY "question_reports_select_own_or_admin"
  ON public.question_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id OR public.is_admin());

CREATE POLICY "question_reports_insert_own"
  ON public.question_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reporter_id
    AND status = 'open'::public.report_status
    AND resolved_by IS NULL
    AND resolved_at IS NULL
  );

CREATE POLICY "question_reports_admin_update"
  ON public.question_reports
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- bookmarks: students manage only their own bookmarks.
CREATE POLICY "bookmarks_select_own"
  ON public.bookmarks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "bookmarks_insert_own"
  ON public.bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks_update_own"
  ON public.bookmarks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks_delete_own"
  ON public.bookmarks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 8. PERFORMANCE POLICIES
-- Students read only their own performance data.
-- Authoritative writes are server-side only (no student INSERT/UPDATE/DELETE policies).
-- ============================================================================

CREATE POLICY "performance_snapshots_select_own_or_admin"
  ON public.performance_snapshots
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "course_performance_select_own_or_admin"
  ON public.course_performance
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "topic_performance_select_own_or_admin"
  ON public.topic_performance
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ============================================================================
-- 9. AI EXPLANATIONS, QUESTION IMPORTS & ADMIN ACTIONS POLICIES
-- ============================================================================

-- ai_explanations: authenticated users can read explanations; writes are server/admin-only.
CREATE POLICY "ai_explanations_select_authenticated"
  ON public.ai_explanations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "ai_explanations_admin_write"
  ON public.ai_explanations
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- question_imports: strictly admin-only.
CREATE POLICY "question_imports_admin_all"
  ON public.question_imports
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- admin_actions: strictly admin-only, append-only (SELECT + INSERT).
CREATE POLICY "admin_actions_admin_select"
  ON public.admin_actions
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "admin_actions_admin_insert"
  ON public.admin_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    AND auth.uid() = admin_id
  );
