"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AcademicHierarchyData } from "@/features/academic/queries";
import {
  createQuestionAction,
  updateQuestionAction,
  type QuestionActionResult,
} from "@/features/questions/actions";
import type {
  QuestionDetailWithRelations,
  QuestionSourceRow,
} from "@/features/questions/queries";
import type {
  DifficultyLevel,
  QuestionStatus,
  QuestionType,
} from "@/types/database";

interface QuestionEditorModalProps {
  question: QuestionDetailWithRelations | null; // null for Create mode
  hierarchy: AcademicHierarchyData;
  sources: QuestionSourceRow[];
  onClose: () => void;
  onSuccess: (result: QuestionActionResult) => void;
}

export function QuestionEditorModal({
  question,
  hierarchy,
  sources,
  onClose,
  onSuccess,
}: QuestionEditorModalProps) {
  const isEditing = Boolean(question);

  // Cascading Academic Hierarchy state
  const initialCourse = hierarchy.courses.find(
    (c) => c.id === question?.course_id
  );
  const initialDept = hierarchy.departments.find(
    (d) => d.id === initialCourse?.department_id
  );
  const initialFac = hierarchy.faculties.find(
    (f) => f.id === initialDept?.faculty_id
  );

  const [selectedUniversityId, setSelectedUniversityId] = React.useState<string>(
    initialFac?.university_id ?? ""
  );
  const [selectedFacultyId, setSelectedFacultyId] = React.useState<string>(
    initialFac?.id ?? ""
  );
  const [selectedDepartmentId, setSelectedDepartmentId] = React.useState<string>(
    initialDept?.id ?? ""
  );
  const [selectedCourseId, setSelectedCourseId] = React.useState<string>(
    question?.course_id ?? ""
  );
  const [selectedTopicId, setSelectedTopicId] = React.useState<string>(
    question?.topic_id ?? ""
  );
  const [selectedSourceId, setSelectedSourceId] = React.useState<string>(
    question?.source_id ?? ""
  );

  // Question Form Fields
  const [questionType, setQuestionType] = React.useState<QuestionType>(
    question?.question_type ?? "multiple_choice"
  );
  const [difficulty, setDifficulty] = React.useState<DifficultyLevel>(
    question?.difficulty ?? "medium"
  );
  const [status, setStatus] = React.useState<QuestionStatus>(
    question?.status ?? "draft"
  );
  const [stem, setStem] = React.useState<string>(question?.stem ?? "");
  const [explanation, setExplanation] = React.useState<string>(
    question?.explanation ?? ""
  );
  const [hint, setHint] = React.useState<string>(question?.hint ?? "");
  const [marks, setMarks] = React.useState<number>(
    question?.marks ? Number(question.marks) : 1.0
  );
  const [estimatedTime, setEstimatedTime] = React.useState<string>(
    question?.estimated_time_seconds
      ? question.estimated_time_seconds.toString()
      : "60"
  );
  const [changeSummary, setChangeSummary] = React.useState<string>("");

  // Conditional Options state (for multiple_choice and true_false)
  const defaultOptions = [
    { label: "A", content: "", is_correct: true, feedback: "" },
    { label: "B", content: "", is_correct: false, feedback: "" },
    { label: "C", content: "", is_correct: false, feedback: "" },
    { label: "D", content: "", is_correct: false, feedback: "" },
  ];

  const [options, setOptions] = React.useState<
    Array<{
      id?: string;
      label: string;
      content: string;
      is_correct: boolean;
      feedback: string;
    }>
  >(
    question?.options && question.options.length > 0
      ? question.options.map((o) => ({
          id: o.id,
          label: o.label,
          content: o.content,
          is_correct: o.is_correct,
          feedback: o.feedback || "",
        }))
      : defaultOptions
  );

  // Accepted Answers state (for fill_in_the_blank)
  const [acceptedAnswers, setAcceptedAnswers] = React.useState<
    Array<{
      id?: string;
      accepted_text: string;
      is_case_sensitive: boolean;
      is_primary: boolean;
    }>
  >(
    question?.accepted_answers && question.accepted_answers.length > 0
      ? question.accepted_answers.map((a) => ({
          id: a.id,
          accepted_text: a.accepted_text,
          is_case_sensitive: a.is_case_sensitive,
          is_primary: a.is_primary,
        }))
      : [{ accepted_text: "", is_case_sensitive: false, is_primary: true }]
  );

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  // Cascading Filters
  const filteredFaculties = React.useMemo(() => {
    if (!selectedUniversityId) return [];
    return hierarchy.faculties.filter(
      (f) => f.university_id === selectedUniversityId && f.is_active
    );
  }, [hierarchy.faculties, selectedUniversityId]);

  const filteredDepartments = React.useMemo(() => {
    if (!selectedFacultyId) return [];
    return hierarchy.departments.filter(
      (d) => d.faculty_id === selectedFacultyId && d.is_active
    );
  }, [hierarchy.departments, selectedFacultyId]);

  const filteredCourses = React.useMemo(() => {
    if (!selectedDepartmentId) return [];
    return hierarchy.courses.filter(
      (c) => c.department_id === selectedDepartmentId && c.is_active
    );
  }, [hierarchy.courses, selectedDepartmentId]);

  const filteredTopics = React.useMemo(() => {
    if (!selectedCourseId) return [];
    return hierarchy.topics.filter(
      (t) => t.course_id === selectedCourseId && t.is_active
    );
  }, [hierarchy.topics, selectedCourseId]);

  // Options Helpers
  const handleAddOption = () => {
    const nextLabelCode = 65 + options.length; // A = 65, B = 66, etc.
    const nextLabel =
      nextLabelCode <= 90 ? String.fromCharCode(nextLabelCode) : `OPT${options.length + 1}`;
    setOptions((prev) => [
      ...prev,
      { label: nextLabel, content: "", is_correct: false, feedback: "" },
    ]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      setErrorMsg("Multiple-choice questions require at least 2 options.");
      return;
    }
    setOptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleOptionChange = (
    index: number,
    field: "content" | "feedback" | "label",
    value: string
  ) => {
    setOptions((prev) =>
      prev.map((opt, idx) => (idx === index ? { ...opt, [field]: value } : opt))
    );
  };

  const handleSetCorrectOption = (index: number, multiSelect: boolean) => {
    if (multiSelect) {
      setOptions((prev) =>
        prev.map((opt, idx) =>
          idx === index ? { ...opt, is_correct: !opt.is_correct } : opt
        )
      );
    } else {
      setOptions((prev) =>
        prev.map((opt, idx) => ({ ...opt, is_correct: idx === index }))
      );
    }
  };

  // Accepted Answers Helpers
  const handleAddAcceptedAnswer = () => {
    setAcceptedAnswers((prev) => [
      ...prev,
      { accepted_text: "", is_case_sensitive: false, is_primary: false },
    ]);
  };

  const handleRemoveAcceptedAnswer = (index: number) => {
    if (acceptedAnswers.length <= 1) {
      setErrorMsg("Fill-in-the-blank questions require at least one accepted answer.");
      return;
    }
    setAcceptedAnswers((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedCourseId) {
      setErrorMsg("Please select a valid course for this question.");
      return;
    }

    if (!stem.trim()) {
      setErrorMsg("Question text (stem) is required.");
      return;
    }

    // Prepare payload
    let preparedOptions: any[] = [];
    let preparedAnswers: any[] = [];

    if (questionType === "multiple_choice" || questionType === "true_false") {
      const activeOptions =
        questionType === "true_false"
          ? [
              {
                label: "A",
                content: "True",
                is_correct: options[0]?.is_correct ?? true,
                feedback: options[0]?.feedback || null,
                display_order: 0,
              },
              {
                label: "B",
                content: "False",
                is_correct: !(options[0]?.is_correct ?? true),
                feedback: options[1]?.feedback || null,
                display_order: 1,
              },
            ]
          : options.map((o, idx) => ({
              id: o.id,
              label: o.label.trim().toUpperCase(),
              content: o.content.trim(),
              is_correct: o.is_correct,
              feedback: o.feedback.trim() || null,
              display_order: idx,
            }));

      // Validation
      const emptyContent = activeOptions.some((o) => !o.content);
      if (emptyContent) {
        setErrorMsg("All option content fields must be filled out.");
        return;
      }

      const hasCorrect = activeOptions.some((o) => o.is_correct);
      if (!hasCorrect) {
        setErrorMsg("Please select at least one correct option.");
        return;
      }

      preparedOptions = activeOptions;
    } else if (questionType === "fill_in_the_blank") {
      const emptyAnswers = acceptedAnswers.some((a) => !a.accepted_text.trim());
      if (emptyAnswers) {
        setErrorMsg("Accepted answer strings cannot be empty.");
        return;
      }
      preparedAnswers = acceptedAnswers.map((a, idx) => ({
        id: a.id,
        accepted_text: a.accepted_text.trim(),
        is_case_sensitive: a.is_case_sensitive,
        is_primary: a.is_primary || idx === 0,
      }));
    }

    const payload = {
      id: question?.id,
      course_id: selectedCourseId,
      topic_id: selectedTopicId || null,
      source_id: selectedSourceId || null,
      question_type: questionType,
      difficulty,
      status,
      stem: stem.trim(),
      explanation: explanation.trim() || null,
      hint: hint.trim() || null,
      marks: Number(marks) || 1.0,
      estimated_time_seconds: estimatedTime ? parseInt(estimatedTime, 10) : null,
      change_summary: changeSummary.trim() || undefined,
      options: preparedOptions,
      accepted_answers: preparedAnswers,
    };

    startTransition(async () => {
      try {
        const result = isEditing
          ? await updateQuestionAction(question!.id, payload)
          : await createQuestionAction(payload);

        if (result.success) {
          onSuccess(result);
          onClose();
        } else {
          setErrorMsg(result.error || "Failed to save question.");
        }
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg border border-border bg-card text-card-foreground shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Question Authoring
              </span>
              <Badge variant="accent">
                {isEditing ? `Edit Question (v${question?.current_version})` : "New Question"}
              </Badge>
            </div>
            <h2 className="mt-1 font-serif text-2xl font-medium text-foreground">
              {isEditing ? "Update Question & Record Revision" : "Create Course Question"}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label="Close editor"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {errorMsg && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {hierarchy.courses.length === 0 && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-md border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-900"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  No courses are configured in the database yet. Questions require a linked course. Please add institutions and courses in the Academic Hierarchy first.
                </span>
              </div>
            )}

            {/* 1. Academic Hierarchy Cascading Selectors */}
            <div className="rounded-lg border border-border bg-background/50 p-4 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                1. Academic Hierarchy Placement
              </h3>

              <div className="grid gap-3 sm:grid-cols-3">
                {/* University */}
                <div>
                  <label className="text-xs font-medium text-foreground">
                    University <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={selectedUniversityId}
                    onChange={(e) => {
                      setSelectedUniversityId(e.target.value);
                      setSelectedFacultyId("");
                      setSelectedDepartmentId("");
                      setSelectedCourseId("");
                      setSelectedTopicId("");
                    }}
                    required
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                  >
                    <option value="">Select University...</option>
                    {hierarchy.universities.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Faculty */}
                <div>
                  <label className="text-xs font-medium text-foreground">
                    Faculty <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={selectedFacultyId}
                    onChange={(e) => {
                      setSelectedFacultyId(e.target.value);
                      setSelectedDepartmentId("");
                      setSelectedCourseId("");
                      setSelectedTopicId("");
                    }}
                    required
                    disabled={!selectedUniversityId}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs disabled:opacity-50"
                  >
                    <option value="">Select Faculty...</option>
                    {filteredFaculties.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="text-xs font-medium text-foreground">
                    Department <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={selectedDepartmentId}
                    onChange={(e) => {
                      setSelectedDepartmentId(e.target.value);
                      setSelectedCourseId("");
                      setSelectedTopicId("");
                    }}
                    required
                    disabled={!selectedFacultyId}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs disabled:opacity-50"
                  >
                    <option value="">Select Department...</option>
                    {filteredDepartments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {/* Course */}
                <div>
                  <label className="text-xs font-medium text-foreground">
                    Course <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      setSelectedTopicId("");
                    }}
                    required
                    disabled={!selectedDepartmentId}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs disabled:opacity-50"
                  >
                    <option value="">Select Course...</option>
                    {filteredCourses.map((c) => {
                      const level = hierarchy.academicLevels.find(
                        (l) => l.id === c.academic_level_id
                      );
                      return (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.title}
                          {level ? ` (${level.name})` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Topic (optional) */}
                <div>
                  <label className="text-xs font-medium text-foreground">
                    Syllabus Topic (Optional)
                  </label>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    disabled={!selectedCourseId || filteredTopics.length === 0}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs disabled:opacity-50"
                  >
                    <option value="">
                      {filteredTopics.length === 0
                        ? "No topics configured"
                        : "General / Unassigned"}
                    </option>
                    {filteredTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Question Source (optional) */}
                <div>
                  <label className="text-xs font-medium text-foreground">
                    Source Attribution (Optional)
                  </label>
                  <select
                    value={selectedSourceId}
                    onChange={(e) => setSelectedSourceId(e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                  >
                    <option value="">No source linked</option>
                    {sources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.source_type.replace(/_/g, " ")})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Metadata & Classification */}
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className="text-xs font-medium text-foreground">
                  Question Type <span className="text-destructive">*</span>
                </label>
                <select
                  value={questionType}
                  onChange={(e) =>
                    setQuestionType(e.target.value as QuestionType)
                  }
                  required
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                >
                  <option value="multiple_choice">Single / Multiple Choice</option>
                  <option value="true_false">True / False</option>
                  <option value="fill_in_the_blank">Fill in the Blank / Short Answer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(e.target.value as DifficultyLevel)
                  }
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">
                  Marks
                </label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="50"
                  value={marks}
                  onChange={(e) => setMarks(parseFloat(e.target.value) || 1.0)}
                  className="mt-1 h-9 text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">
                  Lifecycle Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as QuestionStatus)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                >
                  <option value="draft">Draft (Private)</option>
                  <option value="published">Published (Live for Practice)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* 3. Question Prompt (Stem) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Question Text (Stem) <span className="text-destructive">*</span>
              </label>
              <textarea
                value={stem}
                onChange={(e) => setStem(e.target.value)}
                placeholder="Enter the full question prompt or problem statement..."
                rows={4}
                required
                className="w-full rounded-md border border-input bg-background p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* 4. Conditional Answer Configuration */}
            <div className="rounded-lg border border-border bg-background/50 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Answer Options & Key
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {questionType === "multiple_choice"
                      ? "Configure options and click the checkmark to designate the correct answer(s)."
                      : questionType === "true_false"
                        ? "Select which statement is correct (True or False)."
                        : "Enter accepted matching strings for grading."}
                  </p>
                </div>
                {questionType === "multiple_choice" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                    className="h-7 gap-1 text-xs"
                  >
                    <Plus className="h-3 w-3" /> Add Option
                  </Button>
                )}
              </div>

              {/* Multiple Choice Options */}
              {questionType === "multiple_choice" && (
                <div className="space-y-3">
                  {options.map((opt, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col gap-2 rounded-md border p-3 transition-colors ${
                        opt.is_correct
                          ? "border-teal/60 bg-teal/5"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {/* Correct indicator button */}
                        <button
                          type="button"
                          onClick={() => handleSetCorrectOption(idx, true)}
                          title="Click to toggle correct answer"
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-semibold transition-colors ${
                            opt.is_correct
                              ? "border-teal bg-teal text-white"
                              : "border-border bg-secondary text-muted-foreground hover:border-primary"
                          }`}
                        >
                          {opt.label}
                        </button>

                        <Input
                          placeholder={`Option ${opt.label} content...`}
                          value={opt.content}
                          onChange={(e) =>
                            handleOptionChange(idx, "content", e.target.value)
                          }
                          required
                          className="h-8 flex-1 text-xs"
                        />

                        {opt.is_correct ? (
                          <Badge
                            variant="accent"
                            className="shrink-0 gap-1 text-[11px] border-teal/40 bg-teal/20 text-teal"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Correct
                          </Badge>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetCorrectOption(idx, false)}
                            className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Make Correct
                          </button>
                        )}

                        {options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOption(idx)}
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                            aria-label={`Remove option ${opt.label}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      {/* Option feedback (optional) */}
                      <Input
                        placeholder="Optional feedback for this specific option..."
                        value={opt.feedback}
                        onChange={(e) =>
                          handleOptionChange(idx, "feedback", e.target.value)
                        }
                        className="h-7 text-[11px] bg-background/50"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* True / False Options */}
              {questionType === "true_false" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div
                    onClick={() => handleSetCorrectOption(0, false)}
                    className={`flex cursor-pointer items-center justify-between rounded-md border p-4 transition-colors ${
                      options[0]?.is_correct
                        ? "border-teal bg-teal/10"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-foreground">True</span>
                    </div>
                    {options[0]?.is_correct && (
                      <Badge variant="accent" className="gap-1 border-teal/40 bg-teal/20 text-teal">
                        <CheckCircle2 className="h-3 w-3" /> Correct Answer
                      </Badge>
                    )}
                  </div>

                  <div
                    onClick={() => handleSetCorrectOption(1, false)}
                    className={`flex cursor-pointer items-center justify-between rounded-md border p-4 transition-colors ${
                      options[1]?.is_correct
                        ? "border-teal bg-teal/10"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-foreground">False</span>
                    </div>
                    {options[1]?.is_correct && (
                      <Badge variant="accent" className="gap-1 border-teal/40 bg-teal/20 text-teal">
                        <CheckCircle2 className="h-3 w-3" /> Correct Answer
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Fill in the blank accepted answers */}
              {questionType === "fill_in_the_blank" && (
                <div className="space-y-3">
                  {acceptedAnswers.map((ans, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-md border border-border bg-card p-3"
                    >
                      <Input
                        placeholder="Accepted answer string (e.g. Mitochondria)..."
                        value={ans.accepted_text}
                        onChange={(e) =>
                          setAcceptedAnswers((prev) =>
                            prev.map((a, i) =>
                              i === idx
                                ? { ...a, accepted_text: e.target.value }
                                : a
                            )
                          )
                        }
                        required
                        className="h-8 flex-1 text-xs"
                      />

                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ans.is_case_sensitive}
                          onChange={(e) =>
                            setAcceptedAnswers((prev) =>
                              prev.map((a, i) =>
                                i === idx
                                  ? { ...a, is_case_sensitive: e.target.checked }
                                  : a
                              )
                            )
                          }
                          className="rounded border-input text-primary"
                        />
                        Case-sensitive
                      </label>

                      {acceptedAnswers.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAcceptedAnswer(idx)}
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          aria-label="Remove answer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddAcceptedAnswer}
                    className="h-7 gap-1 text-xs"
                  >
                    <Plus className="h-3 w-3" /> Add Alternative Accepted Answer
                  </Button>
                </div>
              )}
            </div>

            {/* 5. Solution & Hints */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Explanation / Full Solution (Optional)
                </label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain why the answer is correct..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Student Hint (Optional)
                </label>
                <textarea
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="Optional conceptual hint before revealing answer..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground"
                />
              </div>
            </div>

            {/* 6. Version History Audit Summary (if editing) */}
            {isEditing && (
              <div className="space-y-1.5 rounded-md border border-sand bg-secondary/30 p-3">
                <label className="text-xs font-medium text-foreground">
                  Change Summary for Version History (Optional)
                </label>
                <Input
                  placeholder="e.g. Corrected typo in option B, clarified question stem"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
                <p className="text-[11px] text-muted-foreground">
                  Saving will record a new revision snapshot (v
                  {(question?.current_version ?? 1) + 1}) in the question audit
                  log.
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
            <div className="text-xs text-muted-foreground">
              {isEditing ? (
                <span>Editing Question #{question?.id.slice(0, 8)}</span>
              ) : (
                <span>New question will default to Draft status</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending
                  ? "Saving Question..."
                  : isEditing
                    ? "Save Changes"
                    : "Create Question"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
