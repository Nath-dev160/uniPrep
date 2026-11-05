"use server";

import { revalidatePath } from "next/cache";

import {
  academicLevelSchema,
  courseSchema,
  departmentSchema,
  facultySchema,
  slugify,
  studentOnboardingSchema,
  topicSchema,
  universitySchema,
} from "./validation";
import { getCurrentSessionUser } from "@/features/auth/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export interface AcademicActionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

/**
 * Server-side helper to verify that the current user has the 'admin' role.
 * Enforces security in the application layer before passing to Supabase RLS.
 */
async function verifyAdminSession() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured in this environment.");
  }

  const { user, profile } = await getCurrentSessionUser();

  if (!user || !profile) {
    throw new Error("Authentication required. Please sign in.");
  }

  if (profile.role !== "admin") {
    throw new Error("Access restricted: Administrator privileges required.");
  }

  return { user, profile, supabase: createClient() };
}

// ----------------------------------------------------------------------------
// UNIVERSITIES CRUD
// ----------------------------------------------------------------------------

export async function createUniversityAction(
  formData: FormData
): Promise<AcademicActionResult> {
  try {
    const { supabase } = await verifyAdminSession();

    const rawName = formData.get("name")?.toString() ?? "";
    const rawShortName = formData.get("short_name")?.toString() || null;
    const rawCountry = formData.get("country")?.toString() || "Nigeria";
    const rawSlug = formData.get("slug")?.toString() || slugify(rawName);
    const rawIsActive = formData.get("is_active") !== "false";

    const parsed = universitySchema.safeParse({
      name: rawName,
      short_name: rawShortName,
      slug: rawSlug,
      country: rawCountry,
      is_active: rawIsActive,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid university data.",
      };
    }

    const { data, error } = await supabase
      .from("universities")
      .insert({
        name: parsed.data.name,
        short_name: parsed.data.short_name,
        slug: parsed.data.slug,
        country: parsed.data.country,
        is_active: parsed.data.is_active,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          error: "A university with this name or slug already exists.",
        };
      }
      return {
        success: false,
        error: "Unable to save this university. Please try again.",
      };
    }

    revalidatePath("/admin");
    return {
      success: true,
      message: `University "${parsed.data.name}" created successfully.`,
      data,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function updateUniversityAction(
  formData: FormData
): Promise<AcademicActionResult> {
  try {
    const { supabase } = await verifyAdminSession();

    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "Missing university ID." };

    const rawName = formData.get("name")?.toString() ?? "";
    const rawShortName = formData.get("short_name")?.toString() || null;
    const rawCountry = formData.get("country")?.toString() || "Nigeria";
    const rawSlug = formData.get("slug")?.toString() || slugify(rawName);
    const rawIsActive = formData.get("is_active") === "true";

    const parsed = universitySchema.safeParse({
      name: rawName,
      short_name: rawShortName,
      slug: rawSlug,
      country: rawCountry,
      is_active: rawIsActive,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid university data.",
      };
    }

    const { error } = await supabase
      .from("universities")
      .update({
        name: parsed.data.name,
        short_name: parsed.data.short_name,
        slug: parsed.data.slug,
        country: parsed.data.country,
        is_active: parsed.data.is_active,
      })
      .eq("id", id);

    if (error) {
      return {
        success: false,
        error: "Unable to update this university. Please verify details and try again.",
      };
    }

    revalidatePath("/admin");
    return {
      success: true,
      message: `University "${parsed.data.name}" updated successfully.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function deleteUniversityAction(
  formData: FormData
): Promise<AcademicActionResult> {
  try {
    const { supabase } = await verifyAdminSession();
    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "Missing university ID." };

    const { error } = await supabase.from("universities").delete().eq("id", id);

    if (error) {
      return {
        success: false,
        error: "Unable to delete this university. It may have associated faculties or student profiles.",
      };
    }

    revalidatePath("/admin");
    return { success: true, message: "University deleted successfully." };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

// ----------------------------------------------------------------------------
// FACULTIES CRUD
// ----------------------------------------------------------------------------

export async function createFacultyAction(
  formData: FormData
): Promise<AcademicActionResult> {
  try {
    const { supabase } = await verifyAdminSession();

    const university_id = formData.get("university_id")?.toString() ?? "";
    const rawName = formData.get("name")?.toString() ?? "";
    const rawCode = formData.get("code")?.toString() || null;
    const rawSlug = formData.get("slug")?.toString() || slugify(rawName);
    const rawDesc = formData.get("description")?.toString() || null;
    const rawIsActive = formData.get("is_active") !== "false";

    const parsed = facultySchema.safeParse({
      university_id,
      name: rawName,
      code: rawCode,
      slug: rawSlug,
      description: rawDesc,
      is_active: rawIsActive,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid faculty data.",
      };
    }

    // Verify parent university exists
    const { data: uniCheck } = await supabase
      .from("universities")
      .select("id")
      .eq("id", parsed.data.university_id)
      .maybeSingle();

    if (!uniCheck) {
      return {
        success: false,
        error: "Selected university does not exist. Please check your selection.",
      };
    }

    const { data, error } = await supabase
      .from("faculties")
      .insert({
        university_id: parsed.data.university_id,
        name: parsed.data.name,
        code: parsed.data.code,
        slug: parsed.data.slug,
        description: parsed.data.description,
        is_active: parsed.data.is_active,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          error: "A faculty with this name or slug already exists under this university.",
        };
      }
      return {
        success: false,
        error: "Unable to save this faculty. Please try again.",
      };
    }

    revalidatePath("/admin");
    return {
      success: true,
      message: `Faculty "${parsed.data.name}" created successfully.`,
      data,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function updateFacultyAction(
  formData: FormData
): Promise<AcademicActionResult> {
  try {
    const { supabase } = await verifyAdminSession();

    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "Missing faculty ID." };

    const university_id = formData.get("university_id")?.toString() ?? "";
    const rawName = formData.get("name")?.toString() ?? "";
    const rawCode = formData.get("code")?.toString() || null;
    const rawSlug = formData.get("slug")?.toString() || slugify(rawName);
    const rawDesc = formData.get("description")?.toString() || null;
    const rawIsActive = formData.get("is_active") === "true";

    const parsed = facultySchema.safeParse({
      university_id,
      name: rawName,
      code: rawCode,
      slug: rawSlug,
      description: rawDesc,
      is_active: rawIsActive,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid faculty data.",
      };
    }

    const { error } = await supabase
      .from("faculties")
      .update({
        university_id: parsed.data.university_id,
        name: parsed.data.name,
        code: parsed.data.code,
        slug: parsed.data.slug,
        description: parsed.data.description,
        is_active: parsed.data.is_active,
      })
      .eq("id", id);

    if (error) {
      return {
        success: false,
        error: "Unable to update this faculty. Please verify details and try again.",
      };
    }

    revalidatePath("/admin");
    return {
      success: true,
      message: `Faculty "${parsed.data.name}" updated successfully.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function deleteFacultyAction(
  formData: FormData
): Promise<AcademicActionResult> {
  try {
    const { supabase } = await verifyAdminSession();
    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "Missing faculty ID." };

    const { error } = await supabase.from("faculties").delete().eq("id", id);

    if (error) {
      return {
        success: false,
        error: "Unable to delete this faculty. It may have associated departments.",
      };
    }

    revalidatePath("/admin");
    return { success: true, message: "Faculty deleted successfully." };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

// ----------------------------------------------------------------------------
// DEPARTMENTS CRUD
// ----------------------------------------------------------------------------

export async function createDepartmentAction(
  formData: FormData
): Promise<AcademicActionResult> {
  try {
    const { supabase } = await verifyAdminSession();

    const faculty_id = formData.get("faculty_id")?.toString() ?? "";
    const rawName = formData.get("name")?.toString() ?? "";
    const rawCode = formData.get("code")?.toString() || null;
    const rawSlug = formData.get("slug")?.toString() || slugify(rawName);
    const rawDesc = formData.get("description")?.toString() || null;
    const rawIsActive = formData.get("is_active") !== "false";

    const parsed = departmentSchema.safeParse({
      faculty_id,
      name: rawName,
      code: rawCode,
      slug: rawSlug,
      description: rawDesc,
      is_active: rawIsActive,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid department data.",
      };
    }

    // Verify parent faculty exists
    const { data: facCheck } = await supabase
      .from("faculties")
      .select("id")
      .eq("id", parsed.data.faculty_id)
      .maybeSingle();

    if (!facCheck) {
      return {
        success: false,
        error: "Selected faculty does not exist. Please check your selection.",
      };
    }

    const { data, error } = await supabase
      .from("departments")
      .insert({
        faculty_id: parsed.data.faculty_id,
        name: parsed.data.name,
        code: parsed.data.code,
        slug: parsed.data.slug,
        description: parsed.data.description,
        is_active: parsed.data.is_active,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          error: "A department with this name or slug already exists in this faculty.",
        };
      }
      return {
        success: false,
        error: "Unable to save this department. Please try again.",
      };
    }

    revalidatePath("/admin");
    return {
      success: true,
      message: `Department "${parsed.data.name}" created successfully.`,
      data,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function updateDepartmentAction(
  formData: FormData
): Promise<AcademicActionResult> {
  try {
    const { supabase } = await verifyAdminSession();

    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "Missing department ID." };

    const faculty_id = formData.get("faculty_id")?.toString() ?? "";
    const rawName = formData.get("name")?.toString() ?? "";
    const rawCode = formData.get("code")?.toString() || null;
    const rawSlug = formData.get("slug")?.toString() || slugify(rawName);
    const rawDesc = formData.get("description")?.toString() || null;
    const rawIsActive = formData.get("is_active") === "true";

    const parsed = departmentSchema.safeParse({
      faculty_id,
      name: rawName,
      code: rawCode,
      slug: rawSlug,
      description: rawDesc,
      is_active: rawIsActive,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid department data.",
      };
    }

    const { error } = await supabase
      .from("departments")
      .update({
        faculty_id: parsed.data.faculty_id,
        name: parsed.data.name,
        code: parsed.data.code,
        slug: parsed.data.slug,
        description: parsed.data.description,
        is_active: parsed.data.is_active,
      })
      .eq("id", id);

    if (error) {
      return {
        success: false,
        error: "Unable to update this department. Please verify details and try again.",
      };
    }

    revalidatePath("/admin");
    return {
      success: true,
      message: `Department "${parsed.data.name}" updated successfully.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function deleteDepartmentAction(
  formData: FormData
): Promise<AcademicActionResult> {
  try {
    const { supabase } = await verifyAdminSession();
    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "Missing department ID." };

    const { error } = await supabase.from("departments").delete().eq("id", id);

    if (error) {
      return {
        success: false,
        error: "Unable to delete this department. It may have associated courses.",
      };
    }

    revalidatePath("/admin");
    return { success: true, message: "Department deleted successfully." };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

// ----------------------------------------------------------------------------
// ACADEMIC LEVELS CRUD
// ----------------------------------------------------------------------------

export async function createAcademicLevelAction(
  formData: FormData
): Promise<AcademicActionResult> {
  try {
    const { supabase } = await verifyAdminSession();

    const university_id = formData.get("university_id")?.toString() || null;
    const rawName = formData.get("name")?.toString() ?? "";
    const rawCode = formData.get("code")?.toString() ?? "";
    const rawRank = formData.get("rank")?.toString() ?? "100";
    const rawIsActive = formData.get("is_active") !== "false";

    const parsed = academicLevelSchema.safeParse({
      university_id: university_id || null,
      name: rawName,
      code: rawCode,
      rank: rawRank,
      is_active: rawIsActive,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid academic level data.",
      };
    }

    const { data, error } = await supabase
      .from("academic_levels")
      .insert({
        university_id: parsed.data.university_id,
        name: parsed.data.name,
        code: parsed.data.code,
        rank: parsed.data.rank,
        is_active: parsed.data.is_active,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          error: "An academic level with this code or rank already exists.",
        };
      }
      return {
        success: false,
        error: "Unable to save this academic level. Please try again.",
      };
    }

    revalidatePath("/admin");
    return {
      success: true,
      message: `Academic level "${parsed.data.name}" created successfully.`,
      data,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function updateAcademicLevelAction(
  formData: FormData
): Promise<AcademicActionResult> {
  try {
    const { supabase } = await verifyAdminSession();

    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "Missing academic level ID." };

    const university_id = formData.get("university_id")?.toString() || null;
    const rawName = formData.get("name")?.toString() ?? "";
    const rawCode = formData.get("code")?.toString() ?? "";
    const rawRank = formData.get("rank")?.toString() ?? "100";
    const rawIsActive = formData.get("is_active") === "true";

    const parsed = academicLevelSchema.safeParse({
      university_id: university_id || null,
      name: rawName,
      code: rawCode,
      rank: rawRank,
      is_active: rawIsActive,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid academic level data.",
      };
    }

    const { error } = await supabase
      .from("academic_levels")
      .update({
        university_id: parsed.data.university_id,
        name: parsed.data.name,
        code: parsed.data.code,
        rank: parsed.data.rank,
        is_active: parsed.data.is_active,
      })
      .eq("id", id);

    if (error) {
      return {
        success: false,
        error: "Unable to update this academic level. Please verify details.",
      };
    }

    revalidatePath("/admin");
    return {
      success: true,
      message: `Academic level "${parsed.data.name}" updated successfully.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function deleteAcademicLevelAction(
  formData: FormData
): Promise<AcademicActionResult> {
  try {
    const { supabase } = await verifyAdminSession();
    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "Missing academic level ID." };

    const { error } = await supabase.from("academic_levels").delete().eq("id", id);

    if (error) {
      return {
        success: false,
        error: "Unable to delete this academic level. It may be associated with courses.",
      };
    }

    revalidatePath("/admin");
    return { success: true, message: "Academic level deleted successfully." };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

// ----------------------------------------------------------------------------
// COURSES CRUD
// ----------------------------------------------------------------------------

export async function createCourseAction(
  formData: FormData
): Promise<AcademicActionResult> {
  try {
    const { supabase } = await verifyAdminSession();

    const department_id = formData.get("department_id")?.toString() ?? "";
    const academic_level_id = formData.get("academic_level_id")?.toString() || null;
    const rawCode = formData.get("code")?.toString() ?? "";
    const rawTitle = formData.get("title")?.toString() ?? "";
    const rawSlug = formData.get("slug")?.toString() || slugify(`${rawCode}-${rawTitle}`);
    const rawDesc = formData.get("description")?.toString() || null;
    const rawCreditUnits = formData.get("credit_units")?.toString() || null;
    const rawSemester = formData.get("semester")?.toString() || null;
    const rawIsActive = formData.get("is_active") !== "false";

    const parsed = courseSchema.safeParse({
      department_id,
      academic_level_id: academic_level_id || null,
      code: rawCode,
      title: rawTitle,
      slug: rawSlug,
      description: rawDesc,
      credit_units: rawCreditUnits ? Number(rawCreditUnits) : null,
      semester: rawSemester ? Number(rawSemester) : null,
      is_active: rawIsActive,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid course data.",
      };
    }

    // Verify parent department exists
    const { data: deptCheck } = await supabase
      .from("departments")
      .select("id")
      .eq("id", parsed.data.department_id)
      .maybeSingle();

    if (!deptCheck) {
      return {
        success: false,
        error: "Selected department does not exist. Please check your selection.",
      };
    }

    const { data, error } = await supabase
      .from("courses")
      .insert({
        department_id: parsed.data.department_id,
        academic_level_id: parsed.data.academic_level_id,
        code: parsed.data.code,
        title: parsed.data.title,
        slug: parsed.data.slug,
        description: parsed.data.description,
        credit_units: parsed.data.credit_units,
        semester: parsed.data.semester,
        is_active: parsed.data.is_active,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          error: "A course with this code or slug already exists in this department.",
        };
      }
      return {
        success: false,
        error: "Unable to save this course. Please try again.",
      };
    }

    revalidatePath("/admin");
    return {
      success: true,
      message: `Course "${parsed.data.code} — ${parsed.data.title}" created successfully.`,
      data,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function updateCourseAction(
  formData: FormData
): Promise<AcademicActionResult> {
  try {
    const { supabase } = await verifyAdminSession();

    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "Missing course ID." };

    const department_id = formData.get("department_id")?.toString() ?? "";
    const academic_level_id = formData.get("academic_level_id")?.toString() || null;
    const rawCode = formData.get("code")?.toString() ?? "";
    const rawTitle = formData.get("title")?.toString() ?? "";
    const rawSlug = formData.get("slug")?.toString() || slugify(`${rawCode}-${rawTitle}`);
    const rawDesc = formData.get("description")?.toString() || null;
    const rawCreditUnits = formData.get("credit_units")?.toString() || null;
    const rawSemester = formData.get("semester")?.toString() || null;
    const rawIsActive = formData.get("is_active") === "true";

    const parsed = courseSchema.safeParse({
      department_id,
      academic_level_id: academic_level_id || null,
      code: rawCode,
      title: rawTitle,
      slug: rawSlug,
      description: rawDesc,
      credit_units: rawCreditUnits ? Number(rawCreditUnits) : null,
      semester: rawSemester ? Number(rawSemester) : null,
      is_active: rawIsActive,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid course data.",
      };
    }

    const { error } = await supabase
      .from("courses")
      .update({
        department_id: parsed.data.department_id,
        academic_level_id: parsed.data.academic_level_id,
        code: parsed.data.code,
        title: parsed.data.title,
        slug: parsed.data.slug,
        description: parsed.data.description,
        credit_units: parsed.data.credit_units,
        semester: parsed.data.semester,
        is_active: parsed.data.is_active,
      })
      .eq("id", id);

    if (error) {
      return {
        success: false,
        error: "Unable to update this course. Please verify details and try again.",
      };
    }

    revalidatePath("/admin");
    return {
      success: true,
      message: `Course "${parsed.data.code}" updated successfully.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function deleteCourseAction(
  formData: FormData
): Promise<AcademicActionResult> {
  try {
    const { supabase } = await verifyAdminSession();
    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "Missing course ID." };

    const { error } = await supabase.from("courses").delete().eq("id", id);

    if (error) {
      return {
        success: false,
        error: "Unable to delete this course. It may have associated topics.",
      };
    }

    revalidatePath("/admin");
    return { success: true, message: "Course deleted successfully." };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

// ----------------------------------------------------------------------------
// TOPICS CRUD
// ----------------------------------------------------------------------------

export async function createTopicAction(
  formData: FormData
): Promise<AcademicActionResult> {
  try {
    const { supabase } = await verifyAdminSession();

    const course_id = formData.get("course_id")?.toString() ?? "";
    const rawName = formData.get("name")?.toString() ?? "";
    const rawSlug = formData.get("slug")?.toString() || slugify(rawName);
    const rawDesc = formData.get("description")?.toString() || null;
    const rawOrder = formData.get("display_order")?.toString() ?? "0";
    const rawIsActive = formData.get("is_active") !== "false";

    const parsed = topicSchema.safeParse({
      course_id,
      name: rawName,
      slug: rawSlug,
      description: rawDesc,
      display_order: rawOrder,
      is_active: rawIsActive,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid topic data.",
      };
    }

    // Verify parent course exists
    const { data: courseCheck } = await supabase
      .from("courses")
      .select("id")
      .eq("id", parsed.data.course_id)
      .maybeSingle();

    if (!courseCheck) {
      return {
        success: false,
        error: "Selected course does not exist. Please check your selection.",
      };
    }

    const { data, error } = await supabase
      .from("topics")
      .insert({
        course_id: parsed.data.course_id,
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description,
        display_order: parsed.data.display_order,
        is_active: parsed.data.is_active,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          error: "A topic with this name or slug already exists in this course.",
        };
      }
      return {
        success: false,
        error: "Unable to save this topic. Please try again.",
      };
    }

    revalidatePath("/admin");
    return {
      success: true,
      message: `Topic "${parsed.data.name}" created successfully.`,
      data,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function updateTopicAction(
  formData: FormData
): Promise<AcademicActionResult> {
  try {
    const { supabase } = await verifyAdminSession();

    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "Missing topic ID." };

    const course_id = formData.get("course_id")?.toString() ?? "";
    const rawName = formData.get("name")?.toString() ?? "";
    const rawSlug = formData.get("slug")?.toString() || slugify(rawName);
    const rawDesc = formData.get("description")?.toString() || null;
    const rawOrder = formData.get("display_order")?.toString() ?? "0";
    const rawIsActive = formData.get("is_active") === "true";

    const parsed = topicSchema.safeParse({
      course_id,
      name: rawName,
      slug: rawSlug,
      description: rawDesc,
      display_order: rawOrder,
      is_active: rawIsActive,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid topic data.",
      };
    }

    const { error } = await supabase
      .from("topics")
      .update({
        course_id: parsed.data.course_id,
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description,
        display_order: parsed.data.display_order,
        is_active: parsed.data.is_active,
      })
      .eq("id", id);

    if (error) {
      return {
        success: false,
        error: "Unable to update this topic. Please verify details.",
      };
    }

    revalidatePath("/admin");
    return {
      success: true,
      message: `Topic "${parsed.data.name}" updated successfully.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function deleteTopicAction(
  formData: FormData
): Promise<AcademicActionResult> {
  try {
    const { supabase } = await verifyAdminSession();
    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "Missing topic ID." };

    const { error } = await supabase.from("topics").delete().eq("id", id);

    if (error) {
      return {
        success: false,
        error: "Unable to delete this topic.",
      };
    }

    revalidatePath("/admin");
    return { success: true, message: "Topic deleted successfully." };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

// ----------------------------------------------------------------------------
// STUDENT ONBOARDING & PROFILE ACADEMIC CONTEXT
// ----------------------------------------------------------------------------

export async function saveStudentAcademicContextAction(
  formData: FormData
): Promise<AcademicActionResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: "Supabase is not configured in this environment.",
    };
  }

  const { user, profile } = await getCurrentSessionUser();

  if (!user || !profile) {
    return {
      success: false,
      error: "You must be signed in to set your academic context.",
    };
  }

  const university_id = formData.get("university_id")?.toString() ?? "";
  const faculty_id = formData.get("faculty_id")?.toString() ?? "";
  const department_id = formData.get("department_id")?.toString() ?? "";
  const academic_level_id = formData.get("academic_level_id")?.toString() ?? "";
  const display_name = formData.get("display_name")?.toString() || undefined;

  const parsed = studentOnboardingSchema.safeParse({
    university_id,
    faculty_id,
    department_id,
    academic_level_id,
    display_name,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Please complete all academic selections.",
    };
  }

  const supabase = createClient();

  // Server-side hierarchy integrity checks:
  // 1. Verify faculty belongs to the selected university
  const { data: facultyRecord, error: facErr } = await supabase
    .from("faculties")
    .select("id, university_id")
    .eq("id", parsed.data.faculty_id)
    .maybeSingle();

  if (facErr || !facultyRecord || facultyRecord.university_id !== parsed.data.university_id) {
    return {
      success: false,
      error: "Invalid selection: The chosen faculty does not belong to the selected university.",
    };
  }

  // 2. Verify department belongs to the selected faculty
  const { data: deptRecord, error: deptErr } = await supabase
    .from("departments")
    .select("id, faculty_id")
    .eq("id", parsed.data.department_id)
    .maybeSingle();

  if (deptErr || !deptRecord || deptRecord.faculty_id !== parsed.data.faculty_id) {
    return {
      success: false,
      error: "Invalid selection: The chosen department does not belong to the selected faculty.",
    };
  }

  // 3. Verify academic level exists and is either global or scoped to this university
  const { data: levelRecord, error: levelErr } = await supabase
    .from("academic_levels")
    .select("id, university_id")
    .eq("id", parsed.data.academic_level_id)
    .maybeSingle();

  if (levelErr || !levelRecord) {
    return {
      success: false,
      error: "Invalid academic level selection.",
    };
  }

  if (levelRecord.university_id && levelRecord.university_id !== parsed.data.university_id) {
    return {
      success: false,
      error: "The chosen academic level is not valid for the selected university.",
    };
  }

  // Update profile
  const updatePayload: Record<string, any> = {
    university_id: parsed.data.university_id,
    faculty_id: parsed.data.faculty_id,
    department_id: parsed.data.department_id,
    academic_level_id: parsed.data.academic_level_id,
    onboarding_completed: true,
  };

  if (parsed.data.display_name) {
    updatePayload.display_name = parsed.data.display_name;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id);

  if (updateError) {
    return {
      success: false,
      error: "Unable to save your academic profile. Please try again.",
    };
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath("/onboarding");
  revalidatePath("/courses");

  return {
    success: true,
    message: "Academic profile successfully saved!",
  };
}
