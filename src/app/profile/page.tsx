import { UserCircle } from "lucide-react";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function ProfilePage() {
  return (
    <PlaceholderPage
      icon={UserCircle}
      title="Profile"
      description="Manage your account details and academic context. Authentication and profiles aren't connected yet."
      primaryCta={{ label: "Go to login", href: "/login" }}
    />
  );
}
