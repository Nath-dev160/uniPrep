import { Gauge } from "lucide-react";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function ExamsPage() {
  return (
    <PlaceholderPage
      icon={Gauge}
      title="Exam Simulation"
      description="Sit a timed, exam-style test that mirrors real examination conditions. The exam engine isn't built yet."
      primaryCta={{ label: "See practice mode instead", href: "/practice" }}
    />
  );
}
