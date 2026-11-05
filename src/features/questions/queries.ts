import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type {
  DifficultyLevel,
  QuestionRow,
  QuestionSourceRow,
  QuestionStatus,
  QuestionType,
  QuestionVersionRow,
  ServerQuestionAcceptedAnswerRow,
  ServerQuestionOptionRow,
} from "@/types/database";
export type { QuestionSourceRow };
import type { QuestionFilterInput } from "./validation";

export interface AdminQuestionListItem extends QuestionRow {
  course?: {
    id: string;
    code: string;
    title: string;
    academic_level_id?: string | null;
    department?: {
      id: string;
      name: string;
      faculty?: {
        id: string;
        name: string;
        university?: {
          id: string;
          name: string;
          short_name: string | null;
        } | null;
      } | null;
    } | null;
  } | null;
  topic?: {
    id: string;
    name: string;
  } | null;
  source?: {
    id: string;
    name: string;
    source_type: string;
  } | null;
  options_count?: number;
  accepted_answers_count?: number;
}

export interface AdminQuestionListResult {
  questions: AdminQuestionListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface QuestionDetailWithRelations extends QuestionRow {
  options: ServerQuestionOptionRow[];
  accepted_answers: ServerQuestionAcceptedAnswerRow[];
  versions: QuestionVersionRow[];
  source: QuestionSourceRow | null;
  course?: {
    id: string;
    code: string;
    title: string;
    academic_level_id?: string | null;
    department?: {
      id: string;
      name: string;
      faculty?: {
        id: string;
        name: string;
        university?: {
          id: string;
          name: string;
          short_name: string | null;
        } | null;
      } | null;
    } | null;
  } | null;
  topic?: {
    id: string;
    name: string;
  } | null;
}

/**
 * Retrieves a bounded, paginated list of questions with relational academic context.
 * Strictly for authorized administrative inspection.
 */
export async function getAdminQuestions(
  filters: Partial<QuestionFilterInput> = {},
  page: number = 1,
  pageSize: number = 15
): Promise<AdminQuestionListResult> {
  if (!isSupabaseConfigured()) {
    return { questions: [], totalCount: 0, page: 1, pageSize, totalPages: 0 };
  }

  try {
    const supabase = createAdminClient();

    let query = supabase.from("questions").select(
      `
        *,
        course:courses (
          id,
          code,
          title,
          academic_level_id,
          department:departments (
            id,
            name,
            faculty:faculties (
              id,
              name,
              university:universities (
                id,
                name,
                short_name
              )
            )
          )
        ),
        topic:topics (
          id,
          name
        ),
        source:question_sources (
          id,
          name,
          source_type
        ),
        options:question_options (id),
        accepted_answers:question_accepted_answers (id)
      `,
      { count: "exact" }
    );

    // Apply Filters
    if (filters.search && filters.search.trim().length > 0) {
      query = query.ilike("stem", `%${filters.search.trim()}%`);
    }

    if (filters.question_type && filters.question_type !== "all") {
      query = query.eq("question_type", filters.question_type as QuestionType);
    }

    if (filters.difficulty && filters.difficulty !== "all") {
      query = query.eq("difficulty", filters.difficulty as DifficultyLevel);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status as QuestionStatus);
    }

    if (filters.course_id && filters.course_id !== "all") {
      query = query.eq("course_id", filters.course_id);
    }

    if (filters.topic_id && filters.topic_id !== "all") {
      query = query.eq("topic_id", filters.topic_id);
    }

    // Pagination calculations
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query
      .order("created_at", { ascending: false })
      .range(from, to);

    const { data, count, error } = await query;

    if (error || !data) {
      return { questions: [], totalCount: 0, page, pageSize, totalPages: 0 };
    }

    // Map counts and relational hierarchy
    let mappedQuestions: AdminQuestionListItem[] = data.map((item: any) => ({
      ...item,
      options_count: Array.isArray(item.options) ? item.options.length : 0,
      accepted_answers_count: Array.isArray(item.accepted_answers)
        ? item.accepted_answers.length
        : 0,
    }));

    // Filter post-query by university/faculty/department if filtered at higher tiers
    if (filters.university_id && filters.university_id !== "all") {
      mappedQuestions = mappedQuestions.filter(
        (q) =>
          q.course?.department?.faculty?.university?.id ===
          filters.university_id
      );
    }

    if (filters.faculty_id && filters.faculty_id !== "all") {
      mappedQuestions = mappedQuestions.filter(
        (q) => q.course?.department?.faculty?.id === filters.faculty_id
      );
    }

    if (filters.department_id && filters.department_id !== "all") {
      mappedQuestions = mappedQuestions.filter(
        (q) => q.course?.department?.id === filters.department_id
      );
    }

    if (filters.academic_level_id && filters.academic_level_id !== "all") {
      mappedQuestions = mappedQuestions.filter(
        (q) => q.course?.academic_level_id === filters.academic_level_id
      );
    }

    const totalCount = count ?? mappedQuestions.length;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      questions: mappedQuestions,
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  } catch {
    return { questions: [], totalCount: 0, page, pageSize, totalPages: 0 };
  }
}

/**
 * Retrieves the full question with its options, accepted answers, version history,
 * and academic context.
 */
export async function getQuestionDetails(
  questionId: string
): Promise<QuestionDetailWithRelations | null> {
  if (!isSupabaseConfigured() || !questionId) return null;

  try {
    const supabase = createAdminClient();

    const [
      questionRes,
      optionsRes,
      acceptedAnswersRes,
      versionsRes,
    ] = await Promise.all([
      supabase
        .from("questions")
        .select(
          `
          *,
          course:courses (
            id,
            code,
            title,
            academic_level_id,
            department:departments (
              id,
              name,
              faculty:faculties (
                id,
                name,
                university:universities (
                  id,
                  name,
                  short_name
                )
              )
            )
          ),
          topic:topics (
            id,
            name
          ),
          source:question_sources (
            *
          )
        `
        )
        .eq("id", questionId)
        .maybeSingle(),
      supabase
        .from("question_options")
        .select("*")
        .eq("question_id", questionId)
        .order("display_order", { ascending: true }),
      supabase
        .from("question_accepted_answers")
        .select("*")
        .eq("question_id", questionId)
        .order("is_primary", { ascending: false }),
      supabase
        .from("question_versions")
        .select("*")
        .eq("question_id", questionId)
        .order("version_number", { ascending: false }),
    ]);

    if (!questionRes.data) return null;

    return {
      ...questionRes.data,
      options: (optionsRes.data as ServerQuestionOptionRow[]) ?? [],
      accepted_answers:
        (acceptedAnswersRes.data as ServerQuestionAcceptedAnswerRow[]) ?? [],
      versions: (versionsRes.data as QuestionVersionRow[]) ?? [],
      source: (questionRes.data.source as QuestionSourceRow) ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Retrieves question sources, optionally filtered by course or university.
 */
export async function getQuestionSources(
  courseId?: string,
  universityId?: string
): Promise<QuestionSourceRow[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = createClient();
    let query = supabase
      .from("question_sources")
      .select("*")
      .order("name", { ascending: true });

    if (courseId) {
      query = query.eq("course_id", courseId);
    }

    if (universityId) {
      query = query.eq("university_id", universityId);
    }

    const { data } = await query;
    return (data as QuestionSourceRow[]) ?? [];
  } catch {
    return [];
  }
}
