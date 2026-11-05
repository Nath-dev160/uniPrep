"use client";

import * as React from "react";
import {
  AlertCircle,
  Archive,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  Eye,
  FileQuestion,
  Filter,
  GraduationCap,
  Layers,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AcademicHierarchyData } from "@/features/academic/queries";
import {
  deleteQuestionAction,
  fetchAdminQuestionsAction,
  fetchQuestionDetailsAction,
  updateQuestionStatusAction,
  type QuestionActionResult,
} from "@/features/questions/actions";
import type {
  AdminQuestionListItem,
  QuestionDetailWithRelations,
  QuestionSourceRow,
} from "@/features/questions/queries";
import type {
  DifficultyLevel,
  QuestionStatus,
  QuestionType,
} from "@/types/database";
import { QuestionEditorModal } from "./question-editor-modal";
import { QuestionPreviewModal } from "./question-preview-modal";

interface AdminQuestionBankProps {
  initialQuestions: AdminQuestionListItem[];
  initialTotalCount: number;
  initialPage: number;
  initialPageSize: number;
  hierarchy: AcademicHierarchyData;
  sources: QuestionSourceRow[];
  onSwitchToAcademic?: () => void;
}

export function AdminQuestionBank({
  initialQuestions,
  initialTotalCount,
  initialPage,
  initialPageSize,
  hierarchy,
  sources,
  onSwitchToAcademic,
}: AdminQuestionBankProps) {
  // Questions list state
  const [questions, setQuestions] =
    React.useState<AdminQuestionListItem[]>(initialQuestions);
  const [totalCount, setTotalCount] = React.useState(initialTotalCount);
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [pageSize] = React.useState(initialPageSize);
  const [isListLoading, setIsListLoading] = React.useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedUniversity, setSelectedUniversity] = React.useState("all");
  const [selectedFaculty, setSelectedFaculty] = React.useState("all");
  const [selectedDepartment, setSelectedDepartment] = React.useState("all");
  const [selectedAcademicLevel, setSelectedAcademicLevel] = React.useState("all");
  const [selectedCourse, setSelectedCourse] = React.useState("all");
  const [selectedTopic, setSelectedTopic] = React.useState("all");
  const [selectedType, setSelectedType] = React.useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = React.useState("all");
  const [selectedStatus, setSelectedStatus] = React.useState("all");

  // Modals state
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingQuestion, setEditingQuestion] =
    React.useState<QuestionDetailWithRelations | null>(null);
  const [previewQuestion, setPreviewQuestion] =
    React.useState<QuestionDetailWithRelations | null>(null);
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(
    null
  );

  // Notifications
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isPending, startTransition] = React.useTransition();

  // Cascading Hierarchy Filters
  const filteredFaculties = React.useMemo(() => {
    if (selectedUniversity === "all") return hierarchy.faculties;
    return hierarchy.faculties.filter(
      (f) => f.university_id === selectedUniversity
    );
  }, [hierarchy.faculties, selectedUniversity]);

  const filteredDepartments = React.useMemo(() => {
    if (selectedFaculty === "all") return hierarchy.departments;
    return hierarchy.departments.filter((d) => d.faculty_id === selectedFaculty);
  }, [hierarchy.departments, selectedFaculty]);

  const filteredLevels = React.useMemo(() => {
    if (selectedUniversity === "all") return hierarchy.academicLevels;
    return hierarchy.academicLevels.filter(
      (lvl) => lvl.university_id === selectedUniversity
    );
  }, [hierarchy.academicLevels, selectedUniversity]);

  const filteredCourses = React.useMemo(() => {
    let courses = hierarchy.courses;
    if (selectedDepartment !== "all") {
      courses = courses.filter(
        (c) => c.department_id === selectedDepartment
      );
    }
    if (selectedAcademicLevel !== "all") {
      courses = courses.filter(
        (c) => c.academic_level_id === selectedAcademicLevel
      );
    }
    return courses;
  }, [hierarchy.courses, selectedDepartment, selectedAcademicLevel]);

  const filteredTopics = React.useMemo(() => {
    if (selectedCourse === "all") return hierarchy.topics;
    return hierarchy.topics.filter((t) => t.course_id === selectedCourse);
  }, [hierarchy.topics, selectedCourse]);

  // Fetch / Refresh Questions List
  const fetchQuestions = React.useCallback(
    async (pageToFetch: number = 1) => {
      setIsListLoading(true);
      try {
        const result = await fetchAdminQuestionsAction(
          {
            search: searchQuery,
            university_id: selectedUniversity,
            faculty_id: selectedFaculty,
            department_id: selectedDepartment,
            academic_level_id: selectedAcademicLevel,
            course_id: selectedCourse,
            topic_id: selectedTopic,
            question_type: selectedType as any,
            difficulty: selectedDifficulty as any,
            status: selectedStatus as any,
          },
          pageToFetch,
          pageSize
        );

        setQuestions(result.questions);
        setTotalCount(result.totalCount);
        setCurrentPage(result.page);
      } catch {
        setFeedback({
          type: "error",
          message: "Failed to reload questions.",
        });
      } finally {
        setIsListLoading(false);
      }
    },
    [
      searchQuery,
      selectedUniversity,
      selectedFaculty,
      selectedDepartment,
      selectedAcademicLevel,
      selectedCourse,
      selectedTopic,
      selectedType,
      selectedDifficulty,
      selectedStatus,
      pageSize,
    ]
  );

  // Trigger search on filter changes (skip redundant call on initial mount)
  const isInitialMount = React.useRef(true);
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetchQuestions(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchQuestions]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedUniversity("all");
    setSelectedFaculty("all");
    setSelectedDepartment("all");
    setSelectedAcademicLevel("all");
    setSelectedCourse("all");
    setSelectedTopic("all");
    setSelectedType("all");
    setSelectedDifficulty("all");
    setSelectedStatus("all");
  };

  // Open Editor for Edit Mode
  const handleOpenEdit = async (questionId: string) => {
    setIsListLoading(true);
    const detail = await fetchQuestionDetailsAction(questionId);
    setIsListLoading(false);
    if (detail) {
      setEditingQuestion(detail);
      setEditorOpen(true);
    } else {
      setFeedback({
        type: "error",
        message: "Unable to load question details.",
      });
    }
  };

  // Open Preview Modal
  const handleOpenPreview = async (questionId: string) => {
    setIsListLoading(true);
    const detail = await fetchQuestionDetailsAction(questionId);
    setIsListLoading(false);
    if (detail) {
      setPreviewQuestion(detail);
    } else {
      setFeedback({
        type: "error",
        message: "Unable to load question preview.",
      });
    }
  };

  // Status Toggle (Publish / Unpublish / Archive)
  const handleStatusChange = (questionId: string, newStatus: QuestionStatus) => {
    startTransition(async () => {
      const result = await updateQuestionStatusAction(questionId, newStatus);
      if (result.success) {
        setFeedback({ type: "success", message: result.message! });
        fetchQuestions(currentPage);
      } else {
        setFeedback({ type: "error", message: result.error! });
      }
    });
  };

  // Delete Question
  const handleConfirmDelete = () => {
    if (!deleteTargetId) return;
    startTransition(async () => {
      const result = await deleteQuestionAction(deleteTargetId);
      setDeleteTargetId(null);
      if (result.success) {
        setFeedback({ type: "success", message: result.message! });
        fetchQuestions(currentPage);
      } else {
        setFeedback({ type: "error", message: result.error! });
      }
    });
  };

  // Badges & Color Helpers
  const difficultyBadges: Record<DifficultyLevel, { variant: "outline"; className: string }> = {
    easy: { variant: "outline", className: "border-teal/40 bg-teal/10 text-teal" },
    medium: { variant: "outline", className: "border-sand bg-secondary text-secondary-foreground" },
    hard: { variant: "outline", className: "border-destructive/40 bg-destructive/10 text-destructive" },
  };

  const statusBadges: Record<QuestionStatus, { label: string; className: string }> = {
    draft: { label: "Draft", className: "border-border bg-muted/60 text-muted-foreground" },
    published: { label: "Published", className: "border-teal/40 bg-teal/10 text-teal" },
    archived: { label: "Archived", className: "border-border bg-background text-muted-foreground line-through" },
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  // Stats calculation
  const publishedCount = questions.filter((q) => q.status === "published").length;
  const draftCount = questions.filter((q) => q.status === "draft").length;

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div
          role="alert"
          className={`flex items-start justify-between gap-3 rounded-md border p-3.5 text-xs ${
            feedback.type === "success"
              ? "border-teal/40 bg-teal/10 text-teal"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Missing Academic Structure Warning */}
      {hierarchy.universities.length === 0 && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Institution Setup Required
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No universities have been configured yet. Questions must belong to courses within an institution. Configure universities, faculties, and courses in the Academic Hierarchy to enable question mapping.
                </p>
              </div>
            </div>
            {onSwitchToAcademic && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSwitchToAcademic}
                className="shrink-0 gap-1.5 border-amber-500/40 text-amber-700 hover:bg-amber-500/20"
              >
                <GraduationCap className="h-4 w-4" /> Go to Academic Hierarchy
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {hierarchy.universities.length > 0 && hierarchy.courses.length === 0 && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Course Configuration Required
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your institution is set up, but no courses have been added yet. Questions must be linked to a specific course. Add your courses in the Academic Hierarchy to start authoring questions.
                </p>
              </div>
            </div>
            {onSwitchToAcademic && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSwitchToAcademic}
                className="shrink-0 gap-1.5 border-amber-500/40 text-amber-700 hover:bg-amber-500/20"
              >
                <GraduationCap className="h-4 w-4" /> Add Courses
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Header & Primary Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-medium text-foreground">
            Question Bank
          </h2>
          <p className="text-xs text-muted-foreground">
            Author, review, version, and publish curriculum questions mapped to
            courses and syllabus topics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setEditingQuestion(null);
              setEditorOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" /> Create Question
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <Card className="border-border bg-card/60">
        <CardContent className="p-4 space-y-3">
          {/* Top row: search & primary filters */}
          <div className="grid gap-2.5 sm:grid-cols-4">
            {/* Search Input */}
            <div className="relative sm:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search questions by prompt text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 text-xs"
              />
            </div>

            {/* University Filter */}
            <div>
              <select
                value={selectedUniversity}
                onChange={(e) => {
                  setSelectedUniversity(e.target.value);
                  setSelectedFaculty("all");
                  setSelectedDepartment("all");
                  setSelectedCourse("all");
                  setSelectedTopic("all");
                }}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
              >
                <option value="all">All Universities</option>
                {hierarchy.universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.short_name || u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Faculty Filter */}
            <div>
              <select
                value={selectedFaculty}
                onChange={(e) => {
                  setSelectedFaculty(e.target.value);
                  setSelectedDepartment("all");
                  setSelectedCourse("all");
                  setSelectedTopic("all");
                }}
                disabled={selectedUniversity === "all"}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs disabled:opacity-50"
              >
                <option value="all">All Faculties</option>
                {filteredFaculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Secondary Filter Row: Department, Academic Level, Course, Topic, Status, Type */}
          <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 pt-1">
            {/* Department */}
            <div>
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setSelectedCourse("all");
                  setSelectedTopic("all");
                }}
                disabled={selectedFaculty === "all"}
                className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs disabled:opacity-50"
              >
                <option value="all">All Depts</option>
                {filteredDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Level */}
            <div>
              <select
                value={selectedAcademicLevel}
                onChange={(e) => {
                  setSelectedAcademicLevel(e.target.value);
                  setSelectedCourse("all");
                  setSelectedTopic("all");
                }}
                className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs"
              >
                <option value="all">All Levels</option>
                {filteredLevels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.name} ({lvl.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Course */}
            <div>
              <select
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setSelectedTopic("all");
                }}
                className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs"
              >
                <option value="all">All Courses</option>
                {filteredCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                disabled={selectedCourse === "all"}
                className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs disabled:opacity-50"
              >
                <option value="all">All Topics</option>
                {filteredTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Question Type */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs"
              >
                <option value="all">All Types</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True / False</option>
                <option value="fill_in_the_blank">Fill in Blank</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 w-full gap-1 text-xs"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Counter / Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-3">
          <span>
            Total in view: <strong className="text-foreground">{totalCount}</strong>
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">
            Page {currentPage} of {Math.max(1, totalPages)}
          </span>
        </div>

        {isListLoading && (
          <span className="animate-pulse text-primary font-medium">
            Updating questions...
          </span>
        )}
      </div>

      {/* Question List Items */}
      {questions.length === 0 ? (
        <Card className="border-border p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
            <FileQuestion className="h-6 w-6" />
          </div>
          <CardTitle className="mt-3 font-serif text-xl">
            {totalCount === 0 && searchQuery === "" && selectedCourse === "all"
              ? "Question Bank is Empty"
              : "No Questions Match Your Filters"}
          </CardTitle>
          <CardDescription className="mx-auto mt-1 max-w-sm text-xs">
            {totalCount === 0 && searchQuery === "" && selectedCourse === "all"
              ? "Start populating the question bank by creating your first course question."
              : "Try adjusting your search query, or clear some of your selected filters to find questions."}
          </CardDescription>
          <div className="mt-4 flex justify-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setEditingQuestion(null);
                setEditorOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" /> Create Question
            </Button>
            {hierarchy.courses.length === 0 && onSwitchToAcademic && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSwitchToAcademic}
                className="gap-1.5"
              >
                <GraduationCap className="h-4 w-4" /> Setup Academic Hierarchy
              </Button>
            )}
            {(searchQuery || selectedCourse !== "all") && (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => {
            const statusConfig = statusBadges[q.status];
            const diffConfig = difficultyBadges[q.difficulty];

            return (
              <Card
                key={q.id}
                className="border-border transition-colors hover:border-primary/40 bg-card"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    {/* Left: Metadata badges & Question prompt */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <Badge
                          variant="outline"
                          className={statusConfig.className}
                        >
                          {statusConfig.label}
                        </Badge>
                        <Badge
                          variant={diffConfig.variant}
                          className={diffConfig.className}
                        >
                          {q.difficulty}
                        </Badge>
                        <Badge variant="muted">
                          {q.question_type.replace(/_/g, " ")}
                        </Badge>
                        <Badge variant="muted">v{q.current_version}</Badge>
                        <span className="text-muted-foreground">
                          {Number(q.marks).toFixed(1)} marks
                        </span>
                        {q.estimated_time_seconds && (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {Math.round(q.estimated_time_seconds / 60)}m
                          </span>
                        )}
                      </div>

                      {/* Stem Text Snippet */}
                      <p className="text-sm font-medium text-foreground line-clamp-2 leading-relaxed">
                        {q.stem}
                      </p>

                      {/* Academic Context breadcrumb */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {q.course?.code}: {q.course?.title}
                        </span>
                        {q.topic && (
                          <>
                            <span>›</span>
                            <span>{q.topic.name}</span>
                          </>
                        )}
                        {q.course?.department?.faculty?.university && (
                          <>
                            <span>•</span>
                            <span>
                              {q.course.department.faculty.university.short_name ||
                                q.course.department.faculty.university.name}
                            </span>
                          </>
                        )}
                        {q.source && (
                          <>
                            <span>•</span>
                            <span className="italic">
                              Source: {q.source.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0 pt-2 sm:pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenPreview(q.id)}
                        className="h-8 gap-1 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(q.id)}
                        className="h-8 gap-1 text-xs"
                      >
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </Button>

                      {/* Quick Status Toggles */}
                      {q.status === "draft" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleStatusChange(q.id, "published")}
                          className="h-8 gap-1 text-xs text-teal hover:bg-teal/10 hover:text-teal border-teal/40"
                          title="Publish question to active question bank"
                        >
                          <UploadCloud className="h-3.5 w-3.5" /> Publish
                        </Button>
                      )}

                      {q.status === "published" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleStatusChange(q.id, "draft")}
                          className="h-8 gap-1 text-xs text-muted-foreground"
                          title="Revert to draft status"
                        >
                          Unpublish
                        </Button>
                      )}

                      {q.status !== "archived" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleStatusChange(q.id, "archived")}
                          className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                          title="Archive question"
                          aria-label="Archive question"
                        >
                          <Archive className="h-3.5 w-3.5" /> Archive
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleStatusChange(q.id, "draft")}
                          className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                          title="Restore question to draft status"
                          aria-label="Restore question to draft"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Restore
                        </Button>
                      )}

                      {/* Delete */}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => setDeleteTargetId(q.id)}
                        className="h-8 gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                        title="Delete question permanently"
                        aria-label="Delete question permanently"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages} ({totalCount} items)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isListLoading}
              onClick={() => fetchQuestions(currentPage - 1)}
              className="h-8 gap-1 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || isListLoading}
              onClick={() => fetchQuestions(currentPage + 1)}
              className="h-8 gap-1 text-xs"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Question Editor Modal */}
      {editorOpen && (
        <QuestionEditorModal
          question={editingQuestion}
          hierarchy={hierarchy}
          sources={sources}
          onClose={() => {
            setEditorOpen(false);
            setEditingQuestion(null);
          }}
          onSuccess={(result) => {
            setFeedback({ type: "success", message: result.message! });
            fetchQuestions(currentPage);
          }}
        />
      )}

      {/* Question Preview Modal */}
      {previewQuestion && (
        <QuestionPreviewModal
          question={previewQuestion}
          onClose={() => setPreviewQuestion(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-destructive/40 bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-medium text-foreground">
                  Permanently Delete Question?
                </h3>
                <p className="text-xs text-muted-foreground">
                  This action is irreversible and will remove all associated
                  options, accepted answers, and revision history.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTargetId(null)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isPending}
              >
                {isPending ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
