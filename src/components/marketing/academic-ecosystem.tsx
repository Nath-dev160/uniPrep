import { ArrowRight } from "lucide-react";

const HIERARCHY = [
  "University",
  "Faculty",
  "Department",
  "Course",
  "Topic",
] as const;

/**
 * A structural, content-accurate illustration of how UniPrep organizes
 * itself — the same academic hierarchy documented in PROJECT_SPEC.md
 * Section 14. Intentionally generic (no invented university/course
 * names) since no real academic data exists yet.
 */
export function AcademicEcosystem() {
  return (
    <section className="container py-24 sm:py-28">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
        <div className="max-w-md">
          <h2 className="text-balance font-serif text-3xl font-medium text-foreground sm:text-4xl">
            Organized the way your university already is.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Every question in UniPrep is tied to your university, faculty,
            department, course, and topic — so what you practice always
            matches what you're actually studying.
          </p>
        </div>

        <div
          className="flex flex-col justify-center gap-2 sm:flex-row sm:items-center sm:gap-2"
          aria-label="Academic hierarchy: University, Faculty, Department, Course, Topic"
        >
          {HIERARCHY.map((level, i) => (
            <div key={level} className="flex items-center gap-2">
              <div className="rounded-md border border-border bg-card px-4 py-3 text-sm font-medium text-foreground sm:px-3 sm:py-2.5">
                {level}
              </div>
              {i < HIERARCHY.length - 1 && (
                <ArrowRight
                  className="hidden h-4 w-4 shrink-0 text-sand sm:block"
                  aria-hidden
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
