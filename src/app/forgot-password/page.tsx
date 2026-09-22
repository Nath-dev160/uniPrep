import { KeyRound } from "lucide-react";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function ForgotPasswordPage() {
  return (
    <PlaceholderPage
      icon={KeyRound}
      title="Forgot your password?"
      description="We'll send you a link to reset your password once accounts are set up. Authentication isn't connected yet."
      primaryCta={{ label: "Back to login", href: "/login" }}
    />
  );
}
