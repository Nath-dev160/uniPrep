import { ShieldHalf } from "lucide-react";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function AdminPage() {
  return (
    <PlaceholderPage
      icon={ShieldHalf}
      title="Admin"
      description="Manage the academic hierarchy, question bank, tests, and question reports."
      comingSoon="The admin dashboard isn't built yet"
    />
  );
}
