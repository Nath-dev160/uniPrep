import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createAdminClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";
import {
  mapToStudentSafeQuestion,
  type RawDeliveryQuestionRow,
} from "./student-delivery.mapper";
import type {
  StudentDeliveryResult,
  StudentQuestionsResponse,
  StudentSafeCourse,
  StudentSafeOption,
  StudentSafeQuestion,
  StudentSafeTopic,
} from "./student-delivery.types";
import {
  StudentQuestionsFilterSchema,
  type StudentQuestionsFilterValues,
} from "./student-delivery.validation";

export { mapToStudentSafeQuestion, type RawDeliveryQuestionRow };

/**
 * Server-side query layer that enforces student academic authorization
 * and returns strictly sanitized questions.
 */
export async function getStudentDeliveredQuestions(
  profile: ProfileRow | null,
  rawFilters: unknown
): Promise<StudentDeliveryResult<StudentQuestionsResponse>> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Database service is not configured.",
      },
    };
  }

  // 1. Authenticate user profile on server
  if (!profile) {
    return {
      success: false,
      error: {
        code: "UNAUTHENTICATED",
        message: "You must be signed in to access course questions.",
      },
    };
  }

  // 2. Validate student onboarding status
  const isAdmin = profile.role === "admin";
  if (!isAdmin && !profile.onboarding_completed) {
    return {
      success: false,
      error: {
        code: "ONBOARDING_REQUIRED",
        message: "Please complete your academic onboarding to access course materials.",
      },
    };
  }

  // 3. Validate filter inputs
  const parseResult = StudentQuestionsFilterSchema.safeParse(rawFilters);
  if (!parseResult.success) {
    const errorMsg = (parseResult.error as any).issues
      ? (parseResult.error as any).issues.map((i: any) => i.message).join(", ")
      : parseResult.error.message;
    return {
      success: false,
      error: {
        code: "INVALID_FILTER",
        message: `Invalid filters: ${errorMsg}`,
      },
    };
  }

  const filters: StudentQuestionsFilterValues = parseResult.data;

  try {
    const adminClient = createAdminClient();

    // 4. Verify course existence and student course context authorization
    const { data: courseRow, error: courseError } = await adminClient
      .from("courses")
      .select("id, code, title, department_id, academic_level_id, credit_units, semester, is_active")
      .eq("id", filters.courseId)
      .maybeSingle();

    if (courseError || !courseRow || !courseRow.is_active) {
      return {
        success: false,
        error: {
          code: "COURSE_NOT_FOUND",
          message: "The requested course could not be found or is inactive.",
        },
      };
    }

    // Authorization check: If not admin, the course MUST belong to the student's department
    if (!isAdmin) {
      if (courseRow.department_id !== profile.department_id) {
        return {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "You do not have permission to access questions for this course.",
          },
        };
      }
    }

    // 5. Fetch available active topics for this course for filter UI
    const { data: topicsData } = await adminClient
      .from("topics")
      .select("id, name, display_order")
      .eq("course_id", filters.courseId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    const availableTopics: StudentSafeTopic[] = (topicsData || []).map((t) => ({
      id: t.id,
      name: t.name,
    }));

    // 6. Build question query with strict server filters
    // SECURITY CRITICAL: strictly status = 'published'
    let query = adminClient
      .from("questions")
      .select(
        `
        id,
        course_id,
        topic_id,
        question_type,
        difficulty,
        stem,
        marks,
        estimated_time_seconds,
        created_at,
        topic:topics(id, name)
      `,
        { count: "exact" }
      )
      .eq("course_id", filters.courseId)
      .eq("status", "published");

    if (filters.topicId) {
      query = query.eq("topic_id", filters.topicId);
    }

    if (filters.questionType && filters.questionType !== "all") {
      query = query.eq("question_type", filters.questionType);
    }

    if (filters.difficulty && filters.difficulty !== "all") {
      query = query.eq("difficulty", filters.difficulty);
    }

    if (filters.search) {
      query = query.ilike("stem", `%${filters.search}%`);
    }

    // Stable ordering
    query = query
      .order("created_at", { ascending: false })
      .order("id", { ascending: true });

    // Pagination
    const page = filters.page;
    const pageSize = filters.pageSize;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.range(from, to);

    const { data: rawQuestions, count, error: qError } = await query;

    if (qError) {
      return {
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: "Unable to retrieve questions at this time.",
        },
      };
    }

    const questionList = (rawQuestions as any[]) || [];
    const questionIds = questionList.map((q) => q.id);

    // 7. Fetch sanitized options for these questions
    // DEFENSE IN DEPTH: Select ONLY safe columns (never is_correct, never feedback)
    let optionsByQuestionId: Record<string, StudentSafeOption[]> = {};
    if (questionIds.length > 0) {
      const { data: rawOptions, error: optError } = await adminClient
        .from("question_options")
        .select("id, question_id, label, content, display_order")
        .in("question_id", questionIds)
        .order("display_order", { ascending: true });

      if (!optError && rawOptions) {
        for (const opt of rawOptions as any[]) {
          const qId = opt.question_id;
          if (!qId) continue;
          if (!optionsByQuestionId[qId]) {
            optionsByQuestionId[qId] = [];
          }
          optionsByQuestionId[qId]!.push({
            id: opt.id,
            label: opt.label,
            content: opt.content,
            display_order: opt.display_order,
          });
        }
      }
    }

    // 8. Map to StudentSafeQuestion items
    const sanitizedQuestions: StudentSafeQuestion[] = questionList.map((q) => {
      const rawWithOpts: RawDeliveryQuestionRow = {
        ...q,
        options: optionsByQuestionId[q.id] || [],
      };
      return mapToStudentSafeQuestion(rawWithOpts);
    });

    const totalCount = count ?? sanitizedQuestions.length;
    const totalPages = Math.ceil(totalCount / pageSize);

    const safeCourse: StudentSafeCourse = {
      id: courseRow.id,
      code: courseRow.code,
      title: courseRow.title,
      credit_units: courseRow.credit_units,
      semester: courseRow.semester as any,
    };

    return {
      success: true,
      data: {
        questions: sanitizedQuestions,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
        },
        course: safeCourse,
        availableTopics,
      },
    };
  } catch {
    return {
      success: false,
      error: {
        code: "DATABASE_ERROR",
        message: "An unexpected error occurred while fetching course questions.",
      },
    };
  }
}
