/**
 * Synchronized PostgreSQL / Supabase schema types for UniPrep (Phase 2).
 *
 * SECURITY NOTE:
 * Raw question-bank answer key types (`QuestionOptionRow`, `QuestionAcceptedAnswerRow`)
 * are for trusted server-side or admin contexts only. Never use them in student-facing
 * client components — use `SanitizedQuestionOption` and `SanitizedQuestion` from
 * `@/types` instead so answer keys never reach the browser during an active exam.
 */

export type UserRole = "student" | "admin";

export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "fill_in_the_blank";

export type DifficultyLevel = "easy" | "medium" | "hard";

export type QuestionStatus = "draft" | "published" | "archived";

export type TestType =
  | "practice_preset"
  | "mock_exam"
  | "course_test"
  | "custom";

export type SessionStatus =
  | "in_progress"
  | "submitted"
  | "abandoned"
  | "expired";

export type ExamEventType =
  | "session_started"
  | "tab_hidden"
  | "window_blur"
  | "fullscreen_exited"
  | "copy_attempt"
  | "paste_attempt"
  | "navigation_warning"
  | "reconnect"
  | "auto_submitted"
  | "session_submitted";

export type ReportStatus = "open" | "under_review" | "resolved" | "dismissed";

export type ImportStatus = "pending" | "processing" | "completed" | "failed";

export type QuestionSourceType =
  | "past_paper"
  | "lecturer_notes"
  | "textbook"
  | "curated"
  | "other";

export type QuestionReportReason =
  | "incorrect_answer"
  | "typo_or_unclear"
  | "out_of_syllabus"
  | "duplicate"
  | "broken_formatting"
  | "other";

export type TopicMasteryLevel =
  | "unassessed"
  | "needs_work"
  | "developing"
  | "proficient"
  | "mastered";

export type QuestionImportFormat = "csv" | "json" | "markdown";

// ----------------------------------------------------------------------------
// 1. Academic Hierarchy Rows
// ----------------------------------------------------------------------------

export interface UniversityRow {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  country: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FacultyRow {
  id: string;
  university_id: string;
  name: string;
  code: string | null;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentRow {
  id: string;
  faculty_id: string;
  name: string;
  code: string | null;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcademicLevelRow {
  id: string;
  university_id: string | null;
  name: string;
  code: string;
  rank: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseRow {
  id: string;
  department_id: string;
  academic_level_id: string | null;
  code: string;
  title: string;
  slug: string;
  description: string | null;
  credit_units: number | null;
  semester: 1 | 2 | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TopicRow {
  id: string;
  course_id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// 2. Users / Profiles Row
// ----------------------------------------------------------------------------

export interface ProfileRow {
  id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  university_id: string | null;
  faculty_id: string | null;
  department_id: string | null;
  academic_level_id: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// 3. Question Bank Rows (Server / Admin Only for Answer-Bearing Entities)
// ----------------------------------------------------------------------------

export interface QuestionSourceRow {
  id: string;
  course_id: string | null;
  university_id: string | null;
  name: string;
  source_type: QuestionSourceType;
  academic_year: string | null;
  semester: 1 | 2 | null;
  reference_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionRow {
  id: string;
  course_id: string;
  topic_id: string | null;
  source_id: string | null;
  question_type: QuestionType;
  difficulty: DifficultyLevel;
  status: QuestionStatus;
  stem: string;
  explanation: string | null;
  hint: string | null;
  marks: number;
  estimated_time_seconds: number | null;
  current_version: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * SERVER / ADMIN ONLY — contains `is_correct` answer key flag.
 * Never pass this type directly to student exam components.
 */
export interface ServerQuestionOptionRow {
  id: string;
  question_id: string;
  label: string;
  content: string;
  is_correct: boolean;
  feedback: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * SERVER / ADMIN ONLY — contains accepted fill-in-the-blank answer strings.
 * Never pass this type to student exam components.
 */
export interface ServerQuestionAcceptedAnswerRow {
  id: string;
  question_id: string;
  accepted_text: string;
  normalized_text: string;
  is_case_sensitive: boolean;
  is_primary: boolean;
  created_at: string;
}

export interface QuestionVersionRow {
  id: string;
  question_id: string;
  version_number: number;
  question_type: QuestionType;
  difficulty: DifficultyLevel;
  stem: string;
  explanation: string | null;
  change_summary: string | null;
  created_by: string | null;
  created_at: string;
}

// ----------------------------------------------------------------------------
// 4. Tests Rows
// ----------------------------------------------------------------------------

export interface TestRow {
  id: string;
  course_id: string;
  title: string;
  slug: string;
  description: string | null;
  instructions: string | null;
  test_type: TestType;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestConfigurationRow {
  id: string;
  test_id: string;
  duration_minutes: number;
  total_questions: number;
  pass_mark_percentage: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  allow_back_navigation: boolean;
  show_results_immediately: boolean;
  max_attempts: number | null;
  strict_integrity_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface TestQuestionRow {
  id: string;
  test_id: string;
  question_id: string;
  display_order: number;
  marks_override: number | null;
  created_at: string;
}

// ----------------------------------------------------------------------------
// 5. Exam Attempts Rows
// ----------------------------------------------------------------------------

export interface ExamSessionRow {
  id: string;
  user_id: string;
  course_id: string;
  test_id: string | null;
  status: SessionStatus;
  duration_minutes: number;
  total_questions: number;
  started_at: string;
  expires_at: string;
  submitted_at: string | null;
  time_spent_seconds: number | null;
  score: number | null;
  max_score: number | null;
  percentage: number | null;
  correct_count: number | null;
  incorrect_count: number | null;
  unanswered_count: number | null;
  integrity_flags_count: number;
  created_at: string;
  updated_at: string;
}

export interface ExamAnswerRow {
  id: string;
  exam_session_id: string;
  question_id: string;
  question_order: number;
  selected_option_id: string | null;
  text_answer: string | null;
  is_flagged_for_review: boolean;
  is_correct: boolean | null;
  marks_awarded: number | null;
  time_spent_seconds: number;
  answered_at: string | null;
  graded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExamEventRow {
  id: string;
  exam_session_id: string;
  user_id: string;
  event_type: ExamEventType;
  event_details: string | null;
  occurred_at: string;
}

// ----------------------------------------------------------------------------
// 6. Practice Rows
// ----------------------------------------------------------------------------

export interface PracticeSessionRow {
  id: string;
  user_id: string;
  course_id: string;
  topic_id: string | null;
  status: SessionStatus;
  difficulty_filter: DifficultyLevel | null;
  question_type_filter: QuestionType | null;
  total_questions: number;
  answered_count: number;
  correct_count: number;
  started_at: string;
  completed_at: string | null;
  total_time_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface PracticeAnswerRow {
  id: string;
  practice_session_id: string;
  user_id: string;
  question_id: string;
  question_order: number;
  selected_option_id: string | null;
  text_answer: string | null;
  is_correct: boolean | null;
  time_spent_seconds: number;
  answered_at: string;
  created_at: string;
}

// ----------------------------------------------------------------------------
// 7. Feedback / Engagement Rows
// ----------------------------------------------------------------------------

export interface QuestionReportRow {
  id: string;
  question_id: string;
  reporter_id: string;
  reason: QuestionReportReason;
  description: string;
  status: ReportStatus;
  resolved_by: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookmarkRow {
  id: string;
  user_id: string;
  question_id: string;
  note: string | null;
  created_at: string;
}

// ----------------------------------------------------------------------------
// 8. Performance Rows
// ----------------------------------------------------------------------------

export interface PerformanceSnapshotRow {
  id: string;
  user_id: string;
  snapshot_date: string;
  total_questions_answered: number;
  total_correct: number;
  overall_accuracy: number;
  average_time_seconds: number;
  exams_completed: number;
  practice_sessions_completed: number;
  created_at: string;
}

export interface CoursePerformanceRow {
  id: string;
  user_id: string;
  course_id: string;
  questions_attempted: number;
  questions_correct: number;
  accuracy_percentage: number;
  average_time_seconds: number;
  exams_taken: number;
  last_practiced_at: string | null;
  updated_at: string;
}

export interface TopicPerformanceRow {
  id: string;
  user_id: string;
  course_id: string;
  topic_id: string;
  questions_attempted: number;
  questions_correct: number;
  accuracy_percentage: number;
  average_time_seconds: number;
  mastery_level: TopicMasteryLevel;
  last_practiced_at: string | null;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// 9. AI / Content Operations Rows
// ----------------------------------------------------------------------------

export interface AiExplanationRow {
  id: string;
  question_id: string;
  prompt_hash: string;
  model_name: string;
  explanation_markdown: string;
  key_takeaways: string | null;
  is_verified: boolean;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionImportRow {
  id: string;
  uploaded_by: string;
  course_id: string | null;
  source_filename: string;
  format: QuestionImportFormat;
  status: ImportStatus;
  total_rows: number;
  imported_count: number;
  failed_count: number;
  error_summary: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminActionRow {
  id: string;
  admin_id: string;
  action_type: string;
  target_table: string;
  target_id: string | null;
  description: string;
  created_at: string;
}
