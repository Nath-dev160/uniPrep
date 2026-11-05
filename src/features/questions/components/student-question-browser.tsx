"use client";

import * as React from "react";
import {
  AlertCircle,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  FileQuestion,
  Filter,
  GraduationCap,
  Layers,
  ListFilter,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
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
import { fetchStudentQuestionsAction } from "@/features/questions/student-actions";
import type {
  StudentDeliveryError,
  StudentQuestionsResponse,
  StudentSafeCourse,
  StudentSafeQuestion,
  StudentSafeTopic,
} from "@/features/questions/student-delivery.types";
import type { DifficultyLevel, QuestionType } from "@/types/database";

interface StudentQuestionBrowserProps {
  courses: StudentSafeCourse[];
  initialCourseId?: string;
  initialResponse?: StudentQuestionsResponse | null;
  initialError?: StudentDeliveryError | null;
}

export function StudentQuestionBrowser({
  courses,
  initialCourseId,
  initialResponse,
  initialError,
}: StudentQuestionBrowserProps) {
  // Course selection
  const defaultCourseId =
    initialCourseId || (courses.length > 0 && courses[0] ? courses[0].id : "");
  const [selectedCourseId, setSelectedCourseId] =
    React.useState<string>(defaultCourseId);

  // Question data state
  const [response, setResponse] =
    React.useState<StudentQuestionsResponse | null>(initialResponse || null);
  const [error, setError] = React.useState<StudentDeliveryError | null>(
    initialError || null
  );
  const [isLoading, setIsLoading] = React.useState<boolean>(
    !initialResponse && Boolean(defaultCourseId)
  );

  // Filter state
  const [selectedTopicId, setSelectedTopicId] = React.useState<string>("all");
  const [selectedType, setSelectedType] = React.useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] =
    React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [page, setPage] = React.useState<number>(1);

  // View mode: 'list' or 'single'
  const [viewMode, setViewMode] = React.useState<"list" | "single">("list");
  const [singleIndex, setSingleIndex] = React.useState<number>(0);

  // Client-side visual choice selection (for student exploration only — no submission in Phase 4B)
  const [selectedChoices, setSelectedChoices] = React.useState<
    Record<string, string>
  >({});

  // Sync with prop changes if initialCourseId changes
  React.useEffect(() => {
    if (initialCourseId && initialCourseId !== selectedCourseId) {
      setSelectedCourseId(initialCourseId);
      setSelectedTopicId("all");
      setPage(1);
      setSingleIndex(0);
    }
  }, [initialCourseId, selectedCourseId]);

  // Load questions whenever course or filters change
  const loadQuestions = React.useCallback(
    async (
      targetCourseId: string,
      targetPage: number = 1,
      targetTopic: string = selectedTopicId,
      targetType: string = selectedType,
      targetDiff: string = selectedDifficulty,
      targetSearch: string = searchQuery
    ) => {
      if (!targetCourseId) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchStudentQuestionsAction({
          courseId: targetCourseId,
          topicId: targetTopic === "all" ? undefined : targetTopic,
          questionType: targetType === "all" ? undefined : (targetType as QuestionType),
          difficulty:
            targetDiff === "all" ? undefined : (targetDiff as DifficultyLevel),
          search: targetSearch.trim() || undefined,
          page: targetPage,
          pageSize: 10,
        });

        if (result.success && result.data) {
          setResponse(result.data);
          setPage(result.data.pagination.page);
        } else {
          setError(
            result.error || {
              code: "DATABASE_ERROR",
              message: "Failed to load course questions.",
            }
          );
          setResponse(null);
        }
      } catch {
        setError({
          code: "DATABASE_ERROR",
          message: "An unexpected network or server error occurred.",
        });
        setResponse(null);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedTopicId, selectedType, selectedDifficulty, searchQuery]
  );

  const initialLoadedRef = React.useRef(Boolean(initialResponse));
  React.useEffect(() => {
    if (!initialLoadedRef.current && defaultCourseId) {
      initialLoadedRef.current = true;
      loadQuestions(defaultCourseId, 1);
    }
  }, [defaultCourseId, loadQuestions]);

  // Course change handler
  const handleCourseChange = (newCourseId: string) => {
    setSelectedCourseId(newCourseId);
    setSelectedTopicId("all");
    setSearchQuery("");
    setPage(1);
    setSingleIndex(0);
    loadQuestions(newCourseId, 1, "all", selectedType, selectedDifficulty, "");
  };

  // Filter change handlers
  const handleTopicChange = (newTopicId: string) => {
    setSelectedTopicId(newTopicId);
    setPage(1);
    setSingleIndex(0);
    loadQuestions(selectedCourseId, 1, newTopicId);
  };

  const handleTypeChange = (newType: string) => {
    setSelectedType(newType);
    setPage(1);
    setSingleIndex(0);
    loadQuestions(selectedCourseId, 1, selectedTopicId, newType);
  };

  const handleDifficultyChange = (newDiff: string) => {
    setSelectedDifficulty(newDiff);
    setPage(1);
    setSingleIndex(0);
    loadQuestions(
      selectedCourseId,
      1,
      selectedTopicId,
      selectedType,
      newDiff
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSingleIndex(0);
    loadQuestions(
      selectedCourseId,
      1,
      selectedTopicId,
      selectedType,
      selectedDifficulty,
      searchQuery
    );
  };

  const handleResetFilters = () => {
    setSelectedTopicId("all");
    setSelectedType("all");
    setSelectedDifficulty("all");
    setSearchQuery("");
    setPage(1);
    setSingleIndex(0);
    loadQuestions(selectedCourseId, 1, "all", "all", "all", "");
  };

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setSelectedChoices((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // Badges & metadata helpers
  const difficultyBadges: Record<
    DifficultyLevel,
    { label: string; className: string }
  > = {
    easy: {
      label: "Easy",
      className: "border-teal/30 bg-teal/10 text-teal",
    },
    medium: {
      label: "Medium",
      className: "border-sand bg-secondary text-secondary-foreground",
    },
    hard: {
      label: "Hard",
      className: "border-destructive/30 bg-destructive/10 text-destructive",
    },
  };

  const formatQuestionType = (type: QuestionType) => {
    switch (type) {
      case "multiple_choice":
        return "Multiple Choice";
      case "true_false":
        return "True / False";
      case "fill_in_the_blank":
        return "Fill in the Blank";
      default:
        return type;
    }
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const questions = response?.questions || [];
  const pagination = response?.pagination;
  const availableTopics = response?.availableTopics || [];

  const hasActiveFilters =
    selectedTopicId !== "all" ||
    selectedType !== "all" ||
    selectedDifficulty !== "all" ||
    searchQuery.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Course Context & Selector Header Card */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold tracking-wider uppercase text-primary">
                  Student Question Delivery
                </span>
                <Badge variant="outline" className="text-[11px] gap-1">
                  <BookOpen className="h-3 w-3" /> Published Syllabus Items
                </Badge>
              </div>
              <h2 className="font-serif text-2xl font-medium text-foreground">
                {selectedCourse
                  ? `${selectedCourse.code} — ${selectedCourse.title}`
                  : "Course Question Bank"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Browse official published course questions in your academic curriculum. Questions are delivered securely without answer keys.
              </p>
            </div>

            {/* Course Selector Dropdown */}
            {courses.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="course-select"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Switch Course:
                </label>
                <select
                  id="course-select"
                  value={selectedCourseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-xs font-medium shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} — {course.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filter and View Controls Bar */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3.5 sm:p-4">
          {/* Top Filter Row: Search & View Toggle */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex-1 max-w-md"
            >
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search question text or concepts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-8 text-xs bg-background"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    loadQuestions(
                      selectedCourseId,
                      1,
                      selectedTopicId,
                      selectedType,
                      selectedDifficulty,
                      ""
                    );
                  }}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <span className="text-[11px] text-muted-foreground mr-1 hidden sm:inline">
                View:
              </span>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2.5 text-xs gap-1.5"
                onClick={() => setViewMode("list")}
              >
                <ListFilter className="h-3.5 w-3.5" /> List
              </Button>
              <Button
                variant={viewMode === "single" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2.5 text-xs gap-1.5"
                onClick={() => setViewMode("single")}
              >
                <Eye className="h-3.5 w-3.5" /> Focus Card
              </Button>
            </div>
          </div>

          {/* Secondary Filter Row: Topic, Type, Difficulty */}
          <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3">
            {/* Topic Filter */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Topic ({availableTopics.length} available)
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => handleTopicChange(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All Topics</option>
                {availableTopics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Question Type Filter */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Question Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All Question Types</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True / False</option>
                <option value="fill_in_the_blank">Fill in the Blank</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Difficulty
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => handleDifficultyChange(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Active Filter Indicators & Reset Action */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
                <span className="text-[11px]">Active Filters:</span>
                {selectedTopicId !== "all" && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    Topic:{" "}
                    {availableTopics.find((t) => t.id === selectedTopicId)?.name ||
                      "Selected"}
                  </Badge>
                )}
                {selectedType !== "all" && (
                  <Badge variant="outline" className="text-[10px]">
                    Type: {selectedType.replace(/_/g, " ")}
                  </Badge>
                )}
                {selectedDifficulty !== "all" && (
                  <Badge variant="outline" className="text-[10px]">
                    Diff: {selectedDifficulty}
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="outline" className="text-[10px]">
                    &quot;{searchQuery}&quot;
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Reset Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area: Loading, Error, Empty, or Question Display */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse border-border">
              <CardHeader className="space-y-2">
                <div className="h-4 w-1/4 rounded bg-muted"></div>
                <div className="h-6 w-3/4 rounded bg-muted"></div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-10 rounded bg-muted/60"></div>
                <div className="h-10 rounded bg-muted/60"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive/30 bg-destructive/5 text-center py-10">
          <CardContent className="space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {error.code === "UNAUTHORIZED"
                ? "Course Access Restricted"
                : error.code === "ONBOARDING_REQUIRED"
                ? "Academic Onboarding Incomplete"
                : "Unable to Load Questions"}
            </h3>
            <p className="mx-auto max-w-md text-xs text-muted-foreground">
              {error.message}
            </p>
            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadQuestions(selectedCourseId, page)}
                className="gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : questions.length === 0 ? (
        <Card className="text-center py-12 border-border">
          <CardContent className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FileQuestion className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {hasActiveFilters
                ? "No questions match your current filters"
                : "No published questions yet for this course"}
            </h3>
            <p className="mx-auto max-w-md text-xs text-muted-foreground">
              {hasActiveFilters
                ? "Try clearing your topic, question type, or difficulty filter to view all available syllabus items."
                : `Instructors have not yet published questions for ${selectedCourse?.code || "this course"}. As soon as items are published in the Question Bank, they will appear here.`}
            </p>
            {hasActiveFilters && (
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetFilters}
                  className="gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        /* ================= LIST VIEW ================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Showing {questions.length} of {pagination?.totalCount || questions.length} published questions
            </span>
            <span>
              Page {pagination?.page || 1} of {pagination?.totalPages || 1}
            </span>
          </div>

          {questions.map((question, index) => {
            const questionNumber =
              (pagination ? (pagination.page - 1) * pagination.pageSize : 0) +
              index +
              1;
            const diffConfig = difficultyBadges[question.difficulty];

            return (
              <Card
                key={question.id}
                className="border-border transition-colors hover:border-primary/30"
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-primary">
                        Q{questionNumber}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {formatQuestionType(question.question_type)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${diffConfig.className}`}
                      >
                        {diffConfig.label}
                      </Badge>
                      {question.topic && (
                        <Badge variant="secondary" className="text-[10px]">
                          {question.topic.name}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{question.marks} mark{question.marks !== 1 ? "s" : ""}</span>
                      {question.estimated_time_seconds && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {question.estimated_time_seconds}s
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Stem */}
                  <div className="mt-2 text-sm leading-relaxed text-foreground font-serif whitespace-pre-wrap">
                    {question.stem}
                  </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-3">
                  {/* Multiple Choice & True/False Display Options */}
                  {question.question_type !== "fill_in_the_blank" ? (
                    <div className="space-y-2">
                      {question.options.map((opt) => {
                        const isSelected =
                          selectedChoices[question.id] === opt.id;
                        return (
                          <div
                            key={opt.id}
                            onClick={() =>
                              handleOptionSelect(question.id, opt.id)
                            }
                            className={`flex items-start gap-3 rounded-md border p-2.5 text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? "border-primary bg-primary/5 text-foreground"
                                : "border-border bg-card hover:bg-muted/50 text-foreground"
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/40 bg-muted/60 text-muted-foreground"
                              }`}
                            >
                              {opt.label}
                            </span>
                            <span className="leading-snug pt-0.5">
                              {opt.content}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Fill in the blank display placeholder */
                    <div className="rounded-md border border-dashed border-border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">
                        Text or numerical input prompt:
                      </p>
                      <div className="mt-2">
                        <Input
                          disabled
                          placeholder="Student response input..."
                          className="h-8 text-xs bg-background cursor-not-allowed"
                        />
                      </div>
                    </div>
                  )}

                  {/* Subtext explaining answer security */}
                  <div className="border-t border-border/60 pt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary/70" />
                      Delivery Mode — Answers & AI explanations evaluate in Phase 5.
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4 text-xs">
              <span className="text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    loadQuestions(
                      selectedCourseId,
                      pagination.page - 1,
                      selectedTopicId,
                      selectedType,
                      selectedDifficulty,
                      searchQuery
                    )
                  }
                  className="h-8 gap-1 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    loadQuestions(
                      selectedCourseId,
                      pagination.page + 1,
                      selectedTopicId,
                      selectedType,
                      selectedDifficulty,
                      searchQuery
                    )
                  }
                  className="h-8 gap-1 text-xs"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ================= SINGLE QUESTION FOCUS VIEW ================= */
        <div className="space-y-4">
          {(() => {
            const currentQ = questions[singleIndex] || questions[0];
            if (!currentQ) return null;
            const diffConfig = difficultyBadges[currentQ.difficulty];

            return (
              <Card className="border-border shadow-xs">
                <CardHeader className="pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-mono">
                        Question {singleIndex + 1} of {questions.length}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {formatQuestionType(currentQ.question_type)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${diffConfig.className}`}
                      >
                        {diffConfig.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {currentQ.topic && (
                        <Badge variant="secondary" className="text-xs">
                          {currentQ.topic.name}
                        </Badge>
                      )}
                      <span>
                        {currentQ.marks} mark{currentQ.marks !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 font-serif text-lg leading-relaxed text-foreground whitespace-pre-wrap">
                    {currentQ.stem}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Options */}
                  {currentQ.question_type !== "fill_in_the_blank" ? (
                    <div className="space-y-2.5">
                      {currentQ.options.map((opt) => {
                        const isSelected =
                          selectedChoices[currentQ.id] === opt.id;
                        return (
                          <div
                            key={opt.id}
                            onClick={() =>
                              handleOptionSelect(currentQ.id, opt.id)
                            }
                            className={`flex items-start gap-3.5 rounded-lg border p-3.5 text-sm transition-all cursor-pointer ${
                              isSelected
                                ? "border-primary bg-primary/5 text-foreground shadow-xs ring-1 ring-primary/40"
                                : "border-border bg-card hover:bg-muted/50 text-foreground"
                            }`}
                          >
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/40 bg-muted/60 text-muted-foreground"
                              }`}
                            >
                              {opt.label}
                            </span>
                            <span className="leading-snug pt-0.5">
                              {opt.content}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
                      <p className="text-xs text-muted-foreground">
                        Type response in Phase 5:
                      </p>
                      <Input
                        disabled
                        placeholder="Expected numerical or term entry..."
                        className="mt-2 h-9 text-xs bg-background cursor-not-allowed"
                      />
                    </div>
                  )}

                  {/* Navigation footer */}
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={singleIndex <= 0}
                      onClick={() => setSingleIndex((prev) => prev - 1)}
                      className="gap-1 text-xs"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" /> Previous Question
                    </Button>

                    <span className="text-xs text-muted-foreground font-mono">
                      {singleIndex + 1} / {questions.length}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={singleIndex >= questions.length - 1}
                      onClick={() => setSingleIndex((prev) => prev + 1)}
                      className="gap-1 text-xs"
                    >
                      Next Question <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      )}
    </div>
  );
}
