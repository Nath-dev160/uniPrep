import test from "node:test";
import assert from "node:assert/strict";

// We import the mapper function directly from the source module:
import { mapToStudentSafeQuestion } from "../src/features/questions/student-delivery.mapper.ts";

const FORBIDDEN_QUESTION_KEYS = [
  "is_correct",
  "feedback",
  "explanation",
  "hint",
  "accepted_answers",
  "accepted_text",
  "normalized_text",
  "created_by",
  "updated_by",
  "current_version",
  "status",
  "version_history",
];

const FORBIDDEN_OPTION_KEYS = [
  "is_correct",
  "feedback",
  "explanation",
  "hint",
];

test("Student-safe question delivery regression test", async (t) => {
  await t.test("strips all protected fields from multiple-choice questions", () => {
    const rawMultipleChoice = {
      id: "q-101",
      course_id: "c-201",
      topic_id: "t-301",
      question_type: "multiple_choice",
      difficulty: "medium",
      stem: "What is Ohm's Law?",
      marks: "2.00",
      estimated_time_seconds: 60,
      created_at: "2026-10-01T00:00:00Z",
      // PROTECTED FIELDS THAT MUST BE STRIPPED:
      explanation: "V = IR states voltage equals current times resistance.",
      hint: "Think about the relationship between V, I, and R.",
      status: "published",
      current_version: 3,
      created_by: "admin-user-id",
      updated_by: "moderator-user-id",
      topic: {
        id: "t-301",
        name: "Electric Circuits",
      },
      options: [
        {
          id: "opt-2",
          question_id: "q-101",
          label: "B",
          content: "V = I / R",
          display_order: 1,
          is_correct: false,
          feedback: "Incorrect, inverse relationship.",
        },
        {
          id: "opt-1",
          question_id: "q-101",
          label: "A",
          content: "V = IR",
          display_order: 0,
          is_correct: true,
          feedback: "Correct, fundamental formulation.",
        },
      ],
    };

    const sanitized = mapToStudentSafeQuestion(rawMultipleChoice);

    // 1. Check permitted fields are preserved
    assert.strictEqual(sanitized.id, "q-101");
    assert.strictEqual(sanitized.course_id, "c-201");
    assert.strictEqual(sanitized.topic_id, "t-301");
    assert.strictEqual(sanitized.question_type, "multiple_choice");
    assert.strictEqual(sanitized.stem, "What is Ohm's Law?");
    assert.strictEqual(sanitized.marks, 2);
    assert.strictEqual(sanitized.estimated_time_seconds, 60);
    assert.strictEqual(sanitized.difficulty, "medium");
    assert.deepStrictEqual(sanitized.topic, { id: "t-301", name: "Electric Circuits" });

    // 2. Options are display-ordered and have only safe fields
    assert.strictEqual(sanitized.options.length, 2);
    assert.strictEqual(sanitized.options[0].label, "A");
    assert.strictEqual(sanitized.options[0].display_order, 0);
    assert.strictEqual(sanitized.options[1].label, "B");
    assert.strictEqual(sanitized.options[1].display_order, 1);

    // 3. Ensure NO forbidden keys exist on question
    const questionKeys = Object.keys(sanitized);
    for (const forbiddenKey of FORBIDDEN_QUESTION_KEYS) {
      assert.strictEqual(
        questionKeys.includes(forbiddenKey),
        false,
        `Question must not expose forbidden key: "${forbiddenKey}"`
      );
    }

    // 4. Ensure NO forbidden keys exist on options
    for (const option of sanitized.options) {
      const optionKeys = Object.keys(option);
      for (const forbiddenKey of FORBIDDEN_OPTION_KEYS) {
        assert.strictEqual(
          optionKeys.includes(forbiddenKey),
          false,
          `Option must not expose forbidden key: "${forbiddenKey}"`
        );
      }
    }

    // 5. Stringification scan: Ensure sensitive values are not present
    const serialized = JSON.stringify(sanitized);
    assert.strictEqual(serialized.includes("is_correct"), false);
    assert.strictEqual(serialized.includes("feedback"), false);
    assert.strictEqual(serialized.includes("fundamental formulation"), false);
    assert.strictEqual(serialized.includes("V = IR states voltage"), false);
    assert.strictEqual(serialized.includes("admin-user-id"), false);
  });

  await t.test("strips accepted answers from fill-in-the-blank questions", () => {
    const rawFillBlank = {
      id: "q-102",
      course_id: "c-201",
      topic_id: null,
      question_type: "fill_in_the_blank",
      difficulty: "hard",
      stem: "The unit of electrical resistance is the _____.",
      marks: 1,
      estimated_time_seconds: 30,
      created_at: "2026-10-01T00:00:00Z",
      explanation: "Ohm (symbol: Ω) is the SI unit.",
      hint: "Named after Georg Ohm.",
      status: "published",
      current_version: 1,
      options: [],
      accepted_answers: [
        {
          id: "ans-1",
          question_id: "q-102",
          accepted_text: "ohm",
          normalized_text: "ohm",
          is_case_sensitive: false,
          is_primary: true,
        },
        {
          id: "ans-2",
          question_id: "q-102",
          accepted_text: "ohms",
          normalized_text: "ohms",
          is_case_sensitive: false,
          is_primary: false,
        },
      ],
    };

    const sanitized = mapToStudentSafeQuestion(rawFillBlank);

    assert.strictEqual(sanitized.id, "q-102");
    assert.strictEqual(sanitized.stem, "The unit of electrical resistance is the _____.");
    assert.deepStrictEqual(sanitized.options, []);

    const serialized = JSON.stringify(sanitized);
    assert.strictEqual(serialized.includes("accepted_answers"), false);
    assert.strictEqual(serialized.includes("accepted_text"), false);
    assert.strictEqual(serialized.includes("normalized_text"), false);
    assert.strictEqual(serialized.includes("Georg Ohm"), false);
  });

  await t.test("preserves true/false question options without revealing the correct choice", () => {
    const rawTrueFalse = {
      id: "q-103",
      course_id: "c-201",
      topic_id: null,
      question_type: "true_false",
      difficulty: "easy",
      stem: "Direct current flows in a single constant direction.",
      marks: 1,
      estimated_time_seconds: 20,
      created_at: "2026-10-01T00:00:00Z",
      explanation: "DC voltage remains at a fixed polarity.",
      status: "published",
      options: [
        {
          id: "opt-tf-1",
          label: "True",
          content: "True",
          display_order: 0,
          is_correct: true,
          feedback: "Correct!",
        },
        {
          id: "opt-tf-2",
          label: "False",
          content: "False",
          display_order: 1,
          is_correct: false,
          feedback: "Incorrect. AC alternates direction, DC does not.",
        },
      ],
    };

    const sanitized = mapToStudentSafeQuestion(rawTrueFalse);

    assert.strictEqual(sanitized.options.length, 2);
    assert.strictEqual(sanitized.options[0].content, "True");
    assert.strictEqual(sanitized.options[1].content, "False");

    // Both options must have exactly and only safe fields
    for (const opt of sanitized.options) {
      assert.deepStrictEqual(Object.keys(opt).sort(), ["content", "display_order", "id", "label"]);
    }
  });
});
