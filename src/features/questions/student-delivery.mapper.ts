import type {
  StudentSafeOption,
  StudentSafeQuestion,
} from "./student-delivery.types";

/**
 * Raw database representation before student sanitization.
 */
export interface RawDeliveryQuestionRow {
  id: string;
  course_id: string;
  topic_id: string | null;
  question_type: any;
  difficulty: any;
  stem: string;
  marks: number | string;
  estimated_time_seconds: number | null;
  created_at: string;
  // Sensitive fields that MUST be stripped:
  explanation?: string | null;
  hint?: string | null;
  status?: string;
  created_by?: string | null;
  updated_by?: string | null;
  current_version?: number;
  options?: Array<{
    id: string;
    question_id?: string;
    label: string;
    content: string;
    display_order: number;
    is_correct?: boolean;
    feedback?: string | null;
  }> | null;
  topic?: {
    id: string;
    name: string;
  } | null;
  accepted_answers?: any[] | null;
}

/**
 * STRICT EXPLICIT FIELD MAPPER
 * Strips all protected fields (is_correct, feedback, explanation, hint, accepted_answers, etc.)
 * Returns only the StudentSafeQuestion contract.
 */
export function mapToStudentSafeQuestion(
  raw: RawDeliveryQuestionRow
): StudentSafeQuestion {
  // Sort and sanitize options: never include `is_correct` or `feedback`
  const sanitizedOptions: StudentSafeOption[] = (raw.options || [])
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((opt) => ({
      id: opt.id,
      label: opt.label,
      content: opt.content,
      display_order: opt.display_order,
    }));

  return {
    id: raw.id,
    course_id: raw.course_id,
    topic_id: raw.topic_id ?? null,
    question_type: raw.question_type,
    stem: raw.stem,
    marks: Number(raw.marks) || 1,
    estimated_time_seconds: raw.estimated_time_seconds ?? null,
    difficulty: raw.difficulty,
    options: sanitizedOptions,
    topic: raw.topic ? { id: raw.topic.id, name: raw.topic.name } : null,
  };
}
