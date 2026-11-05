"use server";

import { getCurrentSessionUser } from "@/features/auth/server";
import { getStudentCourses } from "@/features/academic/queries";
import { getStudentDeliveredQuestions } from "./student-delivery.queries";
import type {
  StudentDeliveryResult,
  StudentQuestionsResponse,
  StudentSafeCourse,
} from "./student-delivery.types";

/**
 * Server action to fetch sanitized published questions for an authorized course.
 * Authenticates user and checks role/department on the server.
 */
export async function fetchStudentQuestionsAction(
  rawFilters: unknown
): Promise<StudentDeliveryResult<StudentQuestionsResponse>> {
  const { profile } = await getCurrentSessionUser();
  return await getStudentDeliveredQuestions(profile, rawFilters);
}

/**
 * Server action to fetch the list of authorized courses for the current student.
 */
export async function fetchStudentAuthorizedCoursesAction(): Promise<{
  success: boolean;
  courses: StudentSafeCourse[];
  error?: string;
}> {
  const { user, profile } = await getCurrentSessionUser();

  if (!user || !profile) {
    return {
      success: false,
      courses: [],
      error: "You must be signed in to view courses.",
    };
  }

  if (profile.role !== "admin" && !profile.onboarding_completed) {
    return {
      success: false,
      courses: [],
      error: "Academic onboarding required.",
    };
  }

  try {
    const rawCourses = await getStudentCourses(profile);
    const sanitizedCourses: StudentSafeCourse[] = rawCourses.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      credit_units: c.credit_units,
      semester: c.semester as any,
    }));

    return {
      success: true,
      courses: sanitizedCourses,
    };
  } catch {
    return {
      success: false,
      courses: [],
      error: "Unable to load student courses.",
    };
  }
}
