import { BookOpenCheck } from "lucide-react";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function PracticePage() {
  return (
    <PlaceholderPage
      icon={BookOpenCheck}
      title="Practice"
      description="Work through course questions at your own pace and learn from your mistakes as you go. The practice engine isn't built yet."
      primaryCta={{ label: "See exam simulation instead", href: "/exams" }}
    />
  );
}
