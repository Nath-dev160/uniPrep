import type { DifficultyLevel, QuestionType } from "@/types/database";

/**
 * Sanitized question option safe for student delivery.
 * STRICT SECURITY REQUIREMENT:
 * Never includes `is_correct` or `feedback`.
 */
export interface StudentSafeOption {
  id: string;
  label: string;
  content: string;
  display_order: number;
}

export interface StudentSafeTopic {
  id: string;
  name: string;
}

export interface StudentSafeCourse {
  id: string;
  code: string;
  title: string;
  credit_units?: number | null;
  semester?: 1 | 2 | null;
}

/**
 * Student-safe question contract.
 * STRICT SECURITY REQUIREMENT:
 * Explicitly excludes `is_correct`, `feedback`, `explanation`, `hint`,
 * `accepted_answers`, `created_by`, `updated_by`, `current_version`,
 * and internal moderation/version history.
 */
export interface StudentSafeQuestion {
  id: string;
  course_id: string;
  topic_id: string | null;
  question_type: QuestionType;
  stem: string;
  marks: number;
  estimated_time_seconds: number | null;
  difficulty: DifficultyLevel;
  options: StudentSafeOption[];
  topic: StudentSafeTopic | null;
}

export interface StudentQuestionsPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface StudentQuestionsResponse {
  questions: StudentSafeQuestion[];
  pagination: StudentQuestionsPagination;
  course: StudentSafeCourse;
  availableTopics: StudentSafeTopic[];
}

export type StudentDeliveryErrorCode =
  | "UNAUTHENTICATED"
  | "UNAUTHORIZED"
  | "ONBOARDING_REQUIRED"
  | "COURSE_NOT_FOUND"
  | "INVALID_FILTER"
  | "DATABASE_ERROR"
  | "SERVICE_UNAVAILABLE";

export interface StudentDeliveryError {
  code: StudentDeliveryErrorCode;
  message: string;
}

export interface StudentDeliveryResult<T = StudentQuestionsResponse> {
  success: boolean;
  data?: T;
  error?: StudentDeliveryError;
}

export interface StudentDeliveryFilterInput {
  courseId: string;
  topicId?: string;
  questionType?: QuestionType | "all";
  difficulty?: DifficultyLevel | "all";
  search?: string;
  page?: number;
  pageSize?: number;
}
