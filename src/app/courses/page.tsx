import { BookOpen } from "lucide-react";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function CoursesPage() {
  return (
    <PlaceholderPage
      icon={BookOpen}
      title="Courses"
      description="Browse courses within your university, department, and academic level. The question bank and course catalogue aren't connected yet."
      primaryCta={{ label: "Preview the dashboard", href: "/dashboard" }}
    />
  );
}
