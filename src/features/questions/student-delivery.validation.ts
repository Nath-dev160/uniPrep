import { z } from "zod";

export const StudentQuestionsFilterSchema = z.object({
  courseId: z
    .string()
    .uuid("Invalid course identifier"),
  topicId: z
    .string()
    .optional()
    .transform((val) => (val === "all" || !val ? undefined : val)),
  questionType: z
    .enum(["all", "multiple_choice", "true_false", "fill_in_the_blank"])
    .optional()
    .default("all"),
  difficulty: z
    .enum(["all", "easy", "medium", "hard"])
    .optional()
    .default("all"),
  search: z
    .string()
    .max(100, "Search term cannot exceed 100 characters")
    .optional()
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  page: z
    .coerce
    .number()
    .int()
    .min(1, "Page must be at least 1")
    .optional()
    .default(1),
  pageSize: z
    .coerce
    .number()
    .int()
    .min(1, "Page size must be at least 1")
    .max(50, "Page size cannot exceed 50")
    .optional()
    .default(10),
});

export type StudentQuestionsFilterValues = z.infer<typeof StudentQuestionsFilterSchema>;
