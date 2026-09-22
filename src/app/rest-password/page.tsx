import { ShieldCheck } from "lucide-react";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function ResetPasswordPage() {
  return (
    <PlaceholderPage
      icon={ShieldCheck}
      title="Reset your password"
      description="Choose a new password for your UniPrep account. Authentication isn't connected yet."
      primaryCta={{ label: "Back to login", href: "/login" }}
    />
  );
}
