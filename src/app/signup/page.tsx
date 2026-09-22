import { UserPlus } from "lucide-react";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function SignupPage() {
  return (
    <PlaceholderPage
      icon={UserPlus}
      title="Create your account"
      description="Sign up to start practicing your courses and tracking your progress. Authentication isn't connected yet."
      primaryCta={{ label: "Already have an account? Log in", href: "/login" }}
    />
  );
}
