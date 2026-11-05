"use client";

import * as React from "react";
import {
  CheckCircle2,
  Clock,
  Eye,
  HelpCircle,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { QuestionDetailWithRelations } from "@/features/questions/queries";

interface QuestionPreviewModalProps {
  question: QuestionDetailWithRelations | null;
  onClose: () => void;
}

export function QuestionPreviewModal({
  question,
  onClose,
}: QuestionPreviewModalProps) {
  const [showAnswerKey, setShowAnswerKey] = React.useState(false);
  const [selectedOptions, setSelectedOptions] = React.useState<string[]>([]);
  const [fillBlankInput, setFillBlankInput] = React.useState("");

  if (!question) return null;

  const handleOptionToggle = (label: string) => {
    if (question.question_type === "multiple_choice") {
      // Check if multiple options are correct to determine single vs multi-select behavior
      const correctCount = question.options.filter((o) => o.is_correct).length;
      if (correctCount > 1) {
        setSelectedOptions((prev) =>
          prev.includes(label)
            ? prev.filter((l) => l !== label)
            : [...prev, label]
        );
      } else {
        setSelectedOptions([label]);
      }
    } else if (question.question_type === "true_false") {
      setSelectedOptions([label]);
    }
  };

  const difficultyColors = {
    easy: "border-teal/40 bg-teal/10 text-teal",
    medium: "border-sand bg-secondary text-secondary-foreground",
    hard: "border-destructive/40 bg-destructive/10 text-destructive",
  };

  const statusColors = {
    draft: "border-border bg-muted/60 text-muted-foreground",
    published: "border-teal/40 bg-teal/10 text-teal",
    archived: "border-border bg-background text-muted-foreground",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg border border-border bg-card text-card-foreground shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Question Preview
              </span>
              <Badge variant="outline" className={statusColors[question.status]}>
                {question.status}
              </Badge>
              <Badge
                variant="outline"
                className={difficultyColors[question.difficulty]}
              >
                {question.difficulty}
              </Badge>
              <Badge variant="muted">v{question.current_version}</Badge>
            </div>
            <h2 className="mt-1 font-serif text-xl font-medium text-foreground">
              {question.course?.code} — {question.course?.title}
            </h2>
            {question.topic && (
              <p className="text-xs text-muted-foreground">
                Topic: {question.topic.name}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Metadata bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/80 bg-background/50 px-4 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                <strong className="text-foreground">Type:</strong>{" "}
                {question.question_type.replace(/_/g, " ")}
              </span>
              <span>
                <strong className="text-foreground">Marks:</strong>{" "}
                {Number(question.marks).toFixed(1)}
              </span>
              {question.estimated_time_seconds && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {Math.round(question.estimated_time_seconds / 60)} min
                </span>
              )}
            </div>
            {question.source && (
              <span>
                <strong className="text-foreground">Source:</strong>{" "}
                {question.source.name}
              </span>
            )}
          </div>

          {/* Question Stem */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Question Prompt
            </h3>
            <div className="rounded-md border border-border bg-background p-4 text-base font-normal leading-relaxed text-foreground whitespace-pre-wrap">
              {question.stem}
            </div>
          </div>

          {/* Hint (if available) */}
          {question.hint && (
            <div className="flex items-start gap-2.5 rounded-md border border-sand bg-secondary/50 p-3 text-xs text-muted-foreground">
              <Lightbulb className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <div>
                <strong className="text-foreground">Student Hint:</strong>{" "}
                {question.hint}
              </div>
            </div>
          )}

          {/* Options / Answer Input */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Student Interaction Simulation
            </h3>

            {(question.question_type === "multiple_choice" ||
              question.question_type === "true_false") && (
              <div className="space-y-2">
                {question.options.map((opt) => {
                  const isSelected = selectedOptions.includes(opt.label);
                  const isCorrect = opt.is_correct;

                  let borderClass = "border-border hover:border-primary/50";
                  let bgClass = "bg-background";

                  if (showAnswerKey) {
                    if (isCorrect) {
                      borderClass = "border-teal bg-teal/10 text-teal-900";
                    } else if (isSelected) {
                      borderClass = "border-destructive/40 bg-destructive/5";
                    }
                  } else if (isSelected) {
                    borderClass = "border-primary bg-primary/5";
                  }

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleOptionToggle(opt.label)}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border p-3.5 transition-colors ${borderClass} ${bgClass}`}
                    >
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-medium ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-secondary text-foreground"
                        }`}
                      >
                        {opt.label}
                      </div>
                      <div className="flex-1 text-sm text-foreground">
                        <p>{opt.content}</p>
                        {showAnswerKey && opt.feedback && (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            <em>Feedback:</em> {opt.feedback}
                          </p>
                        )}
                      </div>
                      {showAnswerKey && isCorrect && (
                        <Badge
                          variant="accent"
                          className="shrink-0 gap-1 border-teal/40 bg-teal/20 text-teal"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Correct
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {question.question_type === "fill_in_the_blank" && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Type simulated student answer..."
                  value={fillBlankInput}
                  onChange={(e) => setFillBlankInput(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                {showAnswerKey && (
                  <div className="rounded-md border border-teal/30 bg-teal/5 p-3 text-xs">
                    <p className="font-semibold text-foreground">
                      Accepted Answer Strings:
                    </p>
                    <ul className="mt-1 list-inside list-disc space-y-1 text-muted-foreground">
                      {question.accepted_answers.map((ans) => (
                        <li key={ans.id}>
                          <code className="font-semibold text-foreground">
                            {ans.accepted_text}
                          </code>{" "}
                          {ans.is_primary && (
                            <Badge variant="accent" className="ml-1 text-[10px]">
                              Primary
                            </Badge>
                          )}{" "}
                          {ans.is_case_sensitive && (
                            <span className="text-[11px] text-muted-foreground">
                              (case-sensitive)
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Admin Inspector Drawer */}
          <div className="rounded-lg border border-border bg-background/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  Admin Inspector
                </span>
              </div>
              <Button
                type="button"
                variant={showAnswerKey ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAnswerKey(!showAnswerKey)}
                className="h-8 gap-1.5 text-xs"
              >
                <Eye className="h-3.5 w-3.5" />
                {showAnswerKey ? "Hide Answer Key" : "Reveal Answer Key"}
              </Button>
            </div>

            {showAnswerKey && (
              <div className="space-y-3 pt-2 text-xs">
                {question.explanation && (
                  <div className="rounded-md border border-border bg-card p-3">
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Official Solution & Explanation:
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap text-muted-foreground leading-relaxed">
                      {question.explanation}
                    </p>
                  </div>
                )}

                {/* Version History */}
                {question.versions.length > 0 && (
                  <div className="rounded-md border border-border bg-card p-3">
                    <p className="font-semibold text-foreground">
                      Audit Revision History:
                    </p>
                    <div className="mt-1.5 space-y-1 text-muted-foreground">
                      {question.versions.map((ver) => (
                        <div
                          key={ver.id}
                          className="flex items-center justify-between border-b border-border/50 py-1 last:border-0"
                        >
                          <span>
                            <strong>v{ver.version_number}:</strong>{" "}
                            {ver.change_summary || "Revision snapshot"}
                          </span>
                          <span className="text-[11px]">
                            {new Date(ver.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-border p-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  );
}
