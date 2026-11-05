"use client";

import * as React from "react";
import { FileQuestion, GraduationCap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { AdminAcademicManager } from "@/features/academic/components/admin-academic-manager";
import type { AcademicHierarchyData } from "@/features/academic/queries";
import { AdminQuestionBank } from "@/features/questions/components/admin-question-bank";
import type {
  AdminQuestionListItem,
  QuestionSourceRow,
} from "@/features/questions/queries";

export type AdminWorkspaceTab = "questions" | "academic";

interface AdminWorkspaceProps {
  hierarchyData: AcademicHierarchyData;
  initialQuestions: AdminQuestionListItem[];
  initialTotalCount: number;
  initialPage: number;
  initialPageSize: number;
  sources: QuestionSourceRow[];
  initialTab?: AdminWorkspaceTab;
}

export function AdminWorkspace({
  hierarchyData,
  initialQuestions,
  initialTotalCount,
  initialPage,
  initialPageSize,
  sources,
  initialTab = "questions",
}: AdminWorkspaceProps) {
  const [activeArea, setActiveArea] = React.useState<AdminWorkspaceTab>(initialTab);

  // Sync with URL query parameter on mount or navigation if available
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "academic" || tabParam === "questions") {
        setActiveArea(tabParam);
      }
    }
  }, []);

  const handleSelectArea = (area: AdminWorkspaceTab) => {
    setActiveArea(area);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", area);
      window.history.replaceState({}, "", url.toString());
    }
  };

  return (
    <div className="space-y-6">
      {/* Workspace Area Navigation Switcher */}
      <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Admin Workspaces"
          className="flex flex-wrap items-center gap-2"
        >
          {/* Question Bank Tab */}
          <button
            type="button"
            role="tab"
            aria-selected={activeArea === "questions"}
            onClick={() => handleSelectArea("questions")}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
              activeArea === "questions"
                ? "border-primary bg-primary text-primary-foreground shadow-xs"
                : "border-border bg-card text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            <FileQuestion
              className={`h-4 w-4 ${
                activeArea === "questions"
                  ? "text-primary-foreground"
                  : "text-primary"
              }`}
            />
            <span>Question Bank</span>
            <Badge
              variant={activeArea === "questions" ? "outline" : "muted"}
              className={`ml-1 text-[11px] ${
                activeArea === "questions"
                  ? "border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground"
                  : ""
              }`}
            >
              {initialTotalCount}
            </Badge>
          </button>

          {/* Academic Hierarchy Tab */}
          <button
            type="button"
            role="tab"
            aria-selected={activeArea === "academic"}
            onClick={() => handleSelectArea("academic")}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
              activeArea === "academic"
                ? "border-primary bg-primary text-primary-foreground shadow-xs"
                : "border-border bg-card text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            <GraduationCap
              className={`h-4 w-4 ${
                activeArea === "academic"
                  ? "text-primary-foreground"
                  : "text-primary"
              }`}
            />
            <span>Academic Hierarchy</span>
            <Badge
              variant={activeArea === "academic" ? "outline" : "muted"}
              className={`ml-1 text-[11px] ${
                activeArea === "academic"
                  ? "border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground"
                  : ""
              }`}
            >
              {hierarchyData.courses.length} courses
            </Badge>
          </button>
        </div>

        {/* Current Area Indicator label */}
        <p className="text-xs text-muted-foreground">
          Viewing:{" "}
          <strong className="text-foreground">
            {activeArea === "questions" ? "Question Bank" : "Academic Hierarchy"}
          </strong>
        </p>
      </div>

      {/* Active Area View */}
      {activeArea === "questions" ? (
        <AdminQuestionBank
          initialQuestions={initialQuestions}
          initialTotalCount={initialTotalCount}
          initialPage={initialPage}
          initialPageSize={initialPageSize}
          hierarchy={hierarchyData}
          sources={sources}
          onSwitchToAcademic={() => handleSelectArea("academic")}
        />
      ) : (
        <AdminAcademicManager initialData={hierarchyData} />
      )}
    </div>
  );
}
