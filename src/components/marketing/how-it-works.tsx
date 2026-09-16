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
    <section className="container py-24">
      <div className="max-w-2xl">
        <h2 className="font-serif text-3xl font-medium text-foreground sm:text-4xl">
          How it works.
        </h2>
      </div>

      <ol className="mt-14 grid gap-10 sm:grid-cols-3">
        {STEPS.map((step) => (
          <li key={step.number}>
            <span className="font-serif text-4xl font-medium text-sand">
              {step.number}
            </span>
            <h3 className="mt-3 text-lg font-medium text-foreground">
              {step.title}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
