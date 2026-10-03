/**
 * Client-safe shared TypeScript types for UniPrep.
 *
 * SECURITY REQUIREMENT (PROJECT_SPEC.md Section 18):
 * Client-facing question and option types intentionally OMIT `is_correct`,
 * `feedback`, `explanation`, and `accepted_text` so answer keys are never
 * exposed through client TypeScript contracts during an active exam.
 */

import type {
  AcademicLevelRow,
  CourseRow,
  DepartmentRow,
  DifficultyLevel,
  FacultyRow,
  ProfileRow,
  QuestionType,
  TopicRow,
  UniversityRow,
  UserRole,
} from "./database";

export type {
  AcademicLevelRow,
  CourseRow,
  DepartmentRow,
  DifficultyLevel,
  FacultyRow,
  ProfileRow,
  QuestionType,
  TopicRow,
  UniversityRow,
  UserRole,
};

export type UserProfile = ProfileRow;

/**
 * Sanitized question option safe for student browser delivery during active exams.
 * Explicitly excludes `is_correct` and `feedback`.
 */
export interface ClientQuestionOption {
  id: string;
  question_id: string;
  label: string;
  content: string;
  display_order: number;
}

/**
 * Sanitized question safe for student browser delivery during active exams.
 * Explicitly excludes `explanation` and accepted answers.
 */
export interface ClientQuestion {
  id: string;
  course_id: string;
  topic_id: string | null;
  question_type: QuestionType;
  difficulty: DifficultyLevel;
  stem: string;
  marks: number;
  estimated_time_seconds: number | null;
  options: ClientQuestionOption[];
}
