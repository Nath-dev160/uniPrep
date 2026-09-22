import { LogIn } from "lucide-react";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function LoginPage() {
  return (
    <PlaceholderPage
      icon={LogIn}
      title="Login"
      description="Sign in to your UniPrep account to pick up your practice and exam history. Authentication isn't connected yet."
      primaryCta={{ label: "Create an account instead", href: "/signup" }}
    />
  );
}
