const STEPS = [
  {
    number: "01",
    title: "Choose your course",
    body: "Select your university, department, and course to see the topics you'll be tested on.",
  },
  {
    number: "02",
    title: "Practice or simulate",
    body: "Work through questions at your own pace, or sit a timed exam simulation under real conditions.",
  },
  {
    number: "03",
    title: "Review your performance",
    body: "See your accuracy and speed by topic, so you know exactly what to revisit before the real thing.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="bg-cream">
      <div className="container py-24 sm:py-28">
        <div className="max-w-2xl">
          <h2 className="text-balance font-serif text-3xl font-medium text-foreground sm:text-4xl">
            How it works.
          </h2>
        </div>

        <ol className="mt-14 grid gap-10 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.number} className="relative pl-0">
              <div className="flex items-center gap-3">
                <span className="font-serif text-3xl font-medium text-terracotta">
                  {step.number}
                </span>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="hidden h-px flex-1 bg-border sm:block"
                  />
                )}
              </div>
              <h3 className="mt-3 text-lg font-medium text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
