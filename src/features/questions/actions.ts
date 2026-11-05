"use server";

import { revalidatePath } from "next/cache";

import { getCurrentSessionUser } from "@/features/auth/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createAdminClient } from "@/lib/supabase/server";
import type { QuestionStatus } from "@/types/database";
import {
  questionInputSchema,
  questionSourceSchema,
  type QuestionInput,
} from "./validation";

export interface QuestionActionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

/**
 * Server-side helper to verify that the active user possesses an 'admin' profile.
 * Defends against client-side role forgery.
 */
async function verifyAdminSession() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured in this environment.");
  }

  const { user, profile } = await getCurrentSessionUser();

  if (!user || !profile) {
    throw new Error("Authentication required. Please sign in as an administrator.");
  }

  if (profile.role !== "admin") {
    throw new Error("Access restricted: Administrator privileges required.");
  }

  return { user, profile, supabase: createAdminClient() };
}

// ----------------------------------------------------------------------------
// 1. Create Question Action
// ----------------------------------------------------------------------------
export async function createQuestionAction(
  rawInput: QuestionInput
): Promise<QuestionActionResult> {
  try {
    const { user, supabase } = await verifyAdminSession();

    // 1. Zod validation
    const parsed = questionInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
      return { success: false, error: errorMsg };
    }

    const data = parsed.data;

    // 2. Academic Hierarchy relational validation
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", data.course_id)
      .maybeSingle();

    if (courseError || !course) {
      return {
        success: false,
        error: "The selected course does not exist in the database.",
      };
    }

    if (data.topic_id) {
      const { data: topic, error: topicError } = await supabase
        .from("topics")
        .select("id, course_id")
        .eq("id", data.topic_id)
        .maybeSingle();

      if (topicError || !topic || topic.course_id !== data.course_id) {
        return {
          success: false,
          error: "The selected topic does not belong to the selected course.",
        };
      }
    }

    // 3. Insert question row
    const { data: insertedQuestion, error: questionError } = await supabase
      .from("questions")
      .insert({
        course_id: data.course_id,
        topic_id: data.topic_id || null,
        source_id: data.source_id || null,
        question_type: data.question_type,
        difficulty: data.difficulty,
        status: data.status,
        stem: data.stem,
        explanation: data.explanation || null,
        hint: data.hint || null,
        marks: data.marks,
        estimated_time_seconds: data.estimated_time_seconds || null,
        current_version: 1,
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();

    if (questionError || !insertedQuestion) {
      return {
        success: false,
        error: questionError?.message || "Failed to create question.",
      };
    }

    const questionId = insertedQuestion.id;

    // 4. Insert question options (for multiple_choice and true_false)
    if (
      (data.question_type === "multiple_choice" ||
        data.question_type === "true_false") &&
      data.options.length > 0
    ) {
      const optionsToInsert = data.options.map((opt, index) => ({
        question_id: questionId,
        label: opt.label.trim().toUpperCase(),
        content: opt.content.trim(),
        is_correct: opt.is_correct,
        feedback: opt.feedback || null,
        display_order: index,
      }));

      const { error: optionsError } = await supabase
        .from("question_options")
        .insert(optionsToInsert);

      if (optionsError) {
        // Rollback question if option insert fails
        await supabase.from("questions").delete().eq("id", questionId);
        return {
          success: false,
          error: `Failed to save options: ${optionsError.message}`,
        };
      }
    }

    // 5. Insert accepted answers (for fill_in_the_blank)
    if (
      data.question_type === "fill_in_the_blank" &&
      data.accepted_answers.length > 0
    ) {
      const acceptedToInsert = data.accepted_answers.map((ans, idx) => ({
        question_id: questionId,
        accepted_text: ans.accepted_text.trim(),
        normalized_text: ans.accepted_text.trim().toLowerCase(),
        is_case_sensitive: ans.is_case_sensitive,
        is_primary: ans.is_primary || idx === 0,
      }));

      const { error: answersError } = await supabase
        .from("question_accepted_answers")
        .insert(acceptedToInsert);

      if (answersError) {
        await supabase.from("questions").delete().eq("id", questionId);
        return {
          success: false,
          error: `Failed to save accepted answers: ${answersError.message}`,
        };
      }
    }

    // 6. Record initial version in question_versions (v1)
    await supabase.from("question_versions").insert({
      question_id: questionId,
      version_number: 1,
      question_type: data.question_type,
      difficulty: data.difficulty,
      stem: data.stem,
      explanation: data.explanation || null,
      change_summary: data.change_summary || "Initial creation",
      created_by: user.id,
    });

    revalidatePath("/admin");
    return {
      success: true,
      message: "Question created successfully.",
      data: { id: questionId },
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

// ----------------------------------------------------------------------------
// 2. Update Question Action
// ----------------------------------------------------------------------------
export async function updateQuestionAction(
  questionId: string,
  rawInput: QuestionInput
): Promise<QuestionActionResult> {
  try {
    const { user, supabase } = await verifyAdminSession();

    if (!questionId) {
      return { success: false, error: "Question ID is required for update." };
    }

    const parsed = questionInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
      return { success: false, error: errorMsg };
    }

    const data = parsed.data;

    // Fetch existing question
    const { data: existingQuestion, error: fetchError } = await supabase
      .from("questions")
      .select("id, current_version")
      .eq("id", questionId)
      .maybeSingle();

    if (fetchError || !existingQuestion) {
      return { success: false, error: "Question not found." };
    }

    // Academic hierarchy relationship validation
    if (data.topic_id) {
      const { data: topic } = await supabase
        .from("topics")
        .select("id, course_id")
        .eq("id", data.topic_id)
        .maybeSingle();

      if (!topic || topic.course_id !== data.course_id) {
        return {
          success: false,
          error: "The selected topic does not belong to the selected course.",
        };
      }
    }

    const nextVersion = (existingQuestion.current_version ?? 1) + 1;

    // Update base question
    const { error: updateError } = await supabase
      .from("questions")
      .update({
        course_id: data.course_id,
        topic_id: data.topic_id || null,
        source_id: data.source_id || null,
        question_type: data.question_type,
        difficulty: data.difficulty,
        status: data.status,
        stem: data.stem,
        explanation: data.explanation || null,
        hint: data.hint || null,
        marks: data.marks,
        estimated_time_seconds: data.estimated_time_seconds || null,
        current_version: nextVersion,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", questionId);

    if (updateError) {
      return {
        success: false,
        error: updateError.message || "Failed to update question.",
      };
    }

    // Refresh child options
    await supabase.from("question_options").delete().eq("question_id", questionId);
    if (
      (data.question_type === "multiple_choice" ||
        data.question_type === "true_false") &&
      data.options.length > 0
    ) {
      const optionsToInsert = data.options.map((opt, index) => ({
        question_id: questionId,
        label: opt.label.trim().toUpperCase(),
        content: opt.content.trim(),
        is_correct: opt.is_correct,
        feedback: opt.feedback || null,
        display_order: index,
      }));

      await supabase.from("question_options").insert(optionsToInsert);
    }

    // Refresh accepted answers
    await supabase
      .from("question_accepted_answers")
      .delete()
      .eq("question_id", questionId);

    if (
      data.question_type === "fill_in_the_blank" &&
      data.accepted_answers.length > 0
    ) {
      const acceptedToInsert = data.accepted_answers.map((ans, idx) => ({
        question_id: questionId,
        accepted_text: ans.accepted_text.trim(),
        normalized_text: ans.accepted_text.trim().toLowerCase(),
        is_case_sensitive: ans.is_case_sensitive,
        is_primary: ans.is_primary || idx === 0,
      }));

      await supabase
        .from("question_accepted_answers")
        .insert(acceptedToInsert);
    }

    // Record immutable snapshot in question_versions
    await supabase.from("question_versions").insert({
      question_id: questionId,
      version_number: nextVersion,
      question_type: data.question_type,
      difficulty: data.difficulty,
      stem: data.stem,
      explanation: data.explanation || null,
      change_summary: data.change_summary || `Updated to version ${nextVersion}`,
      created_by: user.id,
    });

    revalidatePath("/admin");
    return {
      success: true,
      message: `Question updated successfully (Version ${nextVersion} saved).`,
      data: { id: questionId, version: nextVersion },
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

// ----------------------------------------------------------------------------
// 3. Update Question Status (Publish / Unpublish / Archive)
// ----------------------------------------------------------------------------
export async function updateQuestionStatusAction(
  questionId: string,
  newStatus: QuestionStatus
): Promise<QuestionActionResult> {
  try {
    const { user, supabase } = await verifyAdminSession();

    if (!questionId) {
      return { success: false, error: "Question ID is required." };
    }

    // If publishing, verify question completeness first!
    if (newStatus === "published") {
      const { data: q } = await supabase
        .from("questions")
        .select("id, question_type, stem")
        .eq("id", questionId)
        .maybeSingle();

      if (!q) {
        return { success: false, error: "Question not found." };
      }

      if (q.question_type === "multiple_choice" || q.question_type === "true_false") {
        const { data: options } = await supabase
          .from("question_options")
          .select("id, is_correct")
          .eq("question_id", questionId);

        if (!options || options.length < 2) {
          return {
            success: false,
            error:
              "Cannot publish: Question requires at least 2 answer options.",
          };
        }

        const hasCorrect = options.some((o) => o.is_correct);
        if (!hasCorrect) {
          return {
            success: false,
            error:
              "Cannot publish: At least one option must be marked as correct before publishing.",
          };
        }
      } else if (q.question_type === "fill_in_the_blank") {
        const { data: answers } = await supabase
          .from("question_accepted_answers")
          .select("id")
          .eq("question_id", questionId);

        if (!answers || answers.length === 0) {
          return {
            success: false,
            error:
              "Cannot publish: Fill-in-the-blank question requires at least one accepted answer.",
          };
        }
      }
    }

    const { error: updateError } = await supabase
      .from("questions")
      .update({
        status: newStatus,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", questionId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/admin");
    const statusLabel =
      newStatus === "published"
        ? "published"
        : newStatus === "archived"
          ? "archived"
          : "moved to draft";

    return {
      success: true,
      message: `Question successfully ${statusLabel}.`,
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

// ----------------------------------------------------------------------------
// 4. Delete Question Action
// ----------------------------------------------------------------------------
export async function deleteQuestionAction(
  questionId: string
): Promise<QuestionActionResult> {
  try {
    const { supabase } = await verifyAdminSession();

    if (!questionId) {
      return { success: false, error: "Question ID is required." };
    }

    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin");
    return {
      success: true,
      message: "Question permanently deleted.",
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

// ----------------------------------------------------------------------------
// 5. Create Question Source Action
// ----------------------------------------------------------------------------
export async function createQuestionSourceAction(
  formData: FormData
): Promise<QuestionActionResult> {
  try {
    const { user, supabase } = await verifyAdminSession();

    const rawData = {
      name: formData.get("name")?.toString() ?? "",
      source_type: formData.get("source_type")?.toString() ?? "past_paper",
      academic_year: formData.get("academic_year")?.toString() || null,
      semester: formData.get("semester")
        ? Number(formData.get("semester"))
        : null,
      course_id: formData.get("course_id")?.toString() || null,
      university_id: formData.get("university_id")?.toString() || null,
      reference_notes: formData.get("reference_notes")?.toString() || null,
    };

    const parsed = questionSourceSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const { data: newSource, error } = await supabase
      .from("question_sources")
      .insert({
        ...parsed.data,
        created_by: user.id,
      })
      .select("id, name")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin");
    return {
      success: true,
      message: "Source created successfully.",
      data: newSource,
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

// ----------------------------------------------------------------------------
// 6. Data Fetching Server Actions for Client Components
// ----------------------------------------------------------------------------
export async function fetchAdminQuestionsAction(
  filters: Partial<any> = {},
  page: number = 1,
  pageSize: number = 15
) {
  if (!isSupabaseConfigured()) {
    return { questions: [], totalCount: 0, page: 1, pageSize, totalPages: 0 };
  }
  await verifyAdminSession();
  const { getAdminQuestions } = await import("./queries");
  return await getAdminQuestions(filters, page, pageSize);
}

export async function fetchQuestionDetailsAction(questionId: string) {
  if (!isSupabaseConfigured() || !questionId) {
    return null;
  }
  await verifyAdminSession();
  const { getQuestionDetails } = await import("./queries");
  return await getQuestionDetails(questionId);
}
