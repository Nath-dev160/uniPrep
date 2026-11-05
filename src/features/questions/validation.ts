import { z } from "zod";

// ----------------------------------------------------------------------------
// Question Enums
// ----------------------------------------------------------------------------
export const questionTypeEnum = z.enum([
  "multiple_choice",
  "true_false",
  "fill_in_the_blank",
]);

export const difficultyLevelEnum = z.enum(["easy", "medium", "hard"]);

export const questionStatusEnum = z.enum(["draft", "published", "archived"]);

export const questionSourceTypeEnum = z.enum([
  "past_paper",
  "lecturer_notes",
  "textbook",
  "curated",
  "other",
]);

// ----------------------------------------------------------------------------
// Child schemas: Options & Accepted Answers
// ----------------------------------------------------------------------------
export const questionOptionInputSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1, "Option label is required (e.g. A, B, True)"),
  content: z.string().trim().min(1, "Option content cannot be empty"),
  is_correct: z.boolean().default(false),
  feedback: z.string().trim().max(1000).nullable().optional(),
  display_order: z.number().int().min(0).default(0),
});

export type QuestionOptionInput = z.infer<typeof questionOptionInputSchema>;

export const questionAcceptedAnswerInputSchema = z.object({
  id: z.string().uuid().optional(),
  accepted_text: z.string().trim().min(1, "Accepted answer text cannot be empty"),
  is_case_sensitive: z.boolean().default(false),
  is_primary: z.boolean().default(false),
});

export type QuestionAcceptedAnswerInput = z.infer<
  typeof questionAcceptedAnswerInputSchema
>;

// ----------------------------------------------------------------------------
// Question Sources Schema
// ----------------------------------------------------------------------------
export const questionSourceSchema = z.object({
  course_id: z.string().uuid().nullable().optional(),
  university_id: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(2, "Source name must be at least 2 characters").max(200),
  source_type: questionSourceTypeEnum.default("past_paper"),
  academic_year: z.string().trim().max(30).nullable().optional(),
  semester: z.coerce.number().int().min(1).max(2).nullable().optional(),
  reference_notes: z.string().trim().max(1000).nullable().optional(),
});

export type QuestionSourceInput = z.infer<typeof questionSourceSchema>;

// ----------------------------------------------------------------------------
// Main Question Form Schema
// ----------------------------------------------------------------------------
export const questionInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    course_id: z.string().uuid("Please select a valid course"),
    topic_id: z.string().uuid().nullable().optional(),
    source_id: z.string().uuid().nullable().optional(),
    question_type: questionTypeEnum,
    difficulty: difficultyLevelEnum.default("medium"),
    status: questionStatusEnum.default("draft"),
    stem: z
      .string()
      .trim()
      .min(3, "Question text (stem) must be at least 3 characters long")
      .max(10000, "Question text cannot exceed 10,000 characters"),
    explanation: z.string().trim().max(10000).nullable().optional(),
    hint: z.string().trim().max(1000).nullable().optional(),
    marks: z.coerce
      .number()
      .positive("Marks must be greater than 0")
      .max(100, "Marks cannot exceed 100")
      .default(1.0),
    estimated_time_seconds: z.coerce
      .number()
      .int()
      .positive("Estimated time must be positive")
      .max(3600, "Estimated time cannot exceed 1 hour")
      .nullable()
      .optional(),
    change_summary: z.string().trim().max(500).optional(),
    // Conditional child entities
    options: z.array(questionOptionInputSchema).optional().default([]),
    accepted_answers: z
      .array(questionAcceptedAnswerInputSchema)
      .optional()
      .default([]),
  })
  .superRefine((data, ctx) => {
    // 1. Multiple Choice validation
    if (data.question_type === "multiple_choice") {
      if (data.options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Multiple-choice questions must have at least 2 options.",
          path: ["options"],
        });
      }
      const hasCorrect = data.options.some((opt) => opt.is_correct);
      if (!hasCorrect) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one option must be marked as correct.",
          path: ["options"],
        });
      }
    }

    // 2. True / False validation
    if (data.question_type === "true_false") {
      if (data.options.length !== 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "True/False questions must contain exactly 2 options (True and False).",
          path: ["options"],
        });
      }
      const correctCount = data.options.filter((opt) => opt.is_correct).length;
      if (correctCount !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Exactly one option (True or False) must be marked as correct.",
          path: ["options"],
        });
      }
    }

    // 3. Fill in the blank validation
    if (data.question_type === "fill_in_the_blank") {
      if (data.accepted_answers.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Fill-in-the-blank questions require at least one accepted answer.",
          path: ["accepted_answers"],
        });
      }
    }
  });

export type QuestionInput = z.infer<typeof questionInputSchema>;

// ----------------------------------------------------------------------------
// Question Filter Schema
// ----------------------------------------------------------------------------
export const questionFilterSchema = z.object({
  search: z.string().trim().optional(),
  university_id: z.string().uuid().optional().or(z.literal("all")),
  faculty_id: z.string().uuid().optional().or(z.literal("all")),
  department_id: z.string().uuid().optional().or(z.literal("all")),
  academic_level_id: z.string().uuid().optional().or(z.literal("all")),
  course_id: z.string().uuid().optional().or(z.literal("all")),
  topic_id: z.string().uuid().optional().or(z.literal("all")),
  question_type: questionTypeEnum.optional().or(z.literal("all")),
  difficulty: difficultyLevelEnum.optional().or(z.literal("all")),
  status: questionStatusEnum.optional().or(z.literal("all")),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(5).max(100).default(15),
});

export type QuestionFilterInput = z.infer<typeof questionFilterSchema>;
