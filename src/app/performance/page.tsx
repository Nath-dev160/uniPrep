import { LineChart } from "lucide-react";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function PerformancePage() {
  return (
    <PlaceholderPage
      icon={LineChart}
      title="Performance"
      description="Track your accuracy, answering speed, and progress by course and topic. Performance tracking isn't connected yet."
      primaryCta={{ label: "Preview the dashboard", href: "/dashboard" }}
    />
  );
}
