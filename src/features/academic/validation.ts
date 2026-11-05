import { z } from "zod";

/**
 * Utility to generate a URL-friendly slug from a name or code.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ----------------------------------------------------------------------------
// 1. Universities
// ----------------------------------------------------------------------------
export const universitySchema = z.object({
  name: z.string().trim().min(2, "University name must be at least 2 characters").max(200),
  short_name: z.string().trim().max(50).nullable().optional(),
  slug: z.string().trim().min(2).max(100),
  country: z.string().trim().min(2).max(100).default("Nigeria"),
  is_active: z.boolean().default(true),
});

export type UniversityInput = z.infer<typeof universitySchema>;

// ----------------------------------------------------------------------------
// 2. Faculties
// ----------------------------------------------------------------------------
export const facultySchema = z.object({
  university_id: z.string().uuid("Please select a valid university"),
  name: z.string().trim().min(2, "Faculty name must be at least 2 characters").max(200),
  code: z.string().trim().max(30).nullable().optional(),
  slug: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).nullable().optional(),
  is_active: z.boolean().default(true),
});

export type FacultyInput = z.infer<typeof facultySchema>;

// ----------------------------------------------------------------------------
// 3. Departments
// ----------------------------------------------------------------------------
export const departmentSchema = z.object({
  faculty_id: z.string().uuid("Please select a valid faculty"),
  name: z.string().trim().min(2, "Department name must be at least 2 characters").max(200),
  code: z.string().trim().max(30).nullable().optional(),
  slug: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).nullable().optional(),
  is_active: z.boolean().default(true),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;

// ----------------------------------------------------------------------------
// 4. Academic Levels
// ----------------------------------------------------------------------------
export const academicLevelSchema = z.object({
  university_id: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(2, "Level name must be at least 2 characters").max(100),
  code: z.string().trim().min(1, "Level code is required").max(30),
  rank: z.coerce.number().int().positive("Rank must be a positive integer (e.g. 100, 200, 1, 2)"),
  is_active: z.boolean().default(true),
});

export type AcademicLevelInput = z.infer<typeof academicLevelSchema>;

// ----------------------------------------------------------------------------
// 5. Courses
// ----------------------------------------------------------------------------
export const courseSchema = z.object({
  department_id: z.string().uuid("Please select a valid department"),
  academic_level_id: z.string().uuid("Please select a valid academic level").nullable().optional(),
  code: z.string().trim().min(2, "Course code is required (e.g. CSC 201)").max(30),
  title: z.string().trim().min(2, "Course title is required").max(200),
  slug: z.string().trim().min(2).max(100),
  description: z.string().trim().max(2000).nullable().optional(),
  credit_units: z.coerce
    .number()
    .int()
    .min(0, "Credit units must be between 0 and 30")
    .max(30, "Credit units must be between 0 and 30")
    .nullable()
    .optional(),
  semester: z.coerce
    .number()
    .int()
    .refine((val) => val === 1 || val === 2 || val === 0, {
      message: "Semester must be 1 or 2",
    })
    .nullable()
    .optional(),
  is_active: z.boolean().default(true),
});

export type CourseInput = z.infer<typeof courseSchema>;

// ----------------------------------------------------------------------------
// 6. Topics
// ----------------------------------------------------------------------------
export const topicSchema = z.object({
  course_id: z.string().uuid("Please select a valid course"),
  name: z.string().trim().min(2, "Topic name is required").max(200),
  slug: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).nullable().optional(),
  display_order: z.coerce.number().int().min(0, "Display order must be 0 or greater").default(0),
  is_active: z.boolean().default(true),
});

export type TopicInput = z.infer<typeof topicSchema>;

// ----------------------------------------------------------------------------
// 7. Student Onboarding
// ----------------------------------------------------------------------------
export const studentOnboardingSchema = z.object({
  university_id: z.string().uuid("Please select your university"),
  faculty_id: z.string().uuid("Please select your faculty"),
  department_id: z.string().uuid("Please select your department"),
  academic_level_id: z.string().uuid("Please select your current academic level"),
  display_name: z.string().trim().min(2, "Display name must be at least 2 characters").max(100).optional(),
});

export type StudentOnboardingInput = z.infer<typeof studentOnboardingSchema>;
