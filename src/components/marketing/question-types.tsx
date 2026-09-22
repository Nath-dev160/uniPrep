import { CheckSquare, PenLine, ToggleLeft } from "lucide-react";

const QUESTION_TYPES = [
  {
    icon: CheckSquare,
    title: "Multiple Choice",
    body: "Select the correct option from a set of possible answers.",
  },
  {
    icon: ToggleLeft,
    title: "True / False",
    body: "Decide whether a statement holds up.",
  },
  {
    icon: PenLine,
    title: "Fill in the Blank",
    body: "Type the answer yourself — no options to lean on.",
  },
] as const;

export function QuestionTypes() {
  return (
    <section className="bg-cream">
      <div className="container py-24 sm:py-28">
        <div className="max-w-2xl">
          <h2 className="text-balance font-serif text-3xl font-medium text-foreground sm:text-4xl">
            Question formats that match real exams.
          </h2>
        </div>

        <div className="mt-14 flex flex-col divide-y divide-border rounded-lg border border-border sm:flex-row sm:divide-x sm:divide-y-0">
          {QUESTION_TYPES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex-1 p-7">
              <Icon className="h-5 w-5 text-teal" aria-hidden />
              <h3 className="mt-4 text-base font-medium text-foreground">
                {title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
