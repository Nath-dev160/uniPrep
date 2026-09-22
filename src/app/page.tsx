import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Hero } from "@/components/marketing/hero";
import { CoreFeatures } from "@/components/marketing/core-features";
import { QuestionTypes } from "@/components/marketing/question-types";
import { AcademicEcosystem } from "@/components/marketing/academic-ecosystem";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FinalCta } from "@/components/marketing/final-cta";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <CoreFeatures />
        <QuestionTypes />
        <AcademicEcosystem />
        <HowItWorks />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
