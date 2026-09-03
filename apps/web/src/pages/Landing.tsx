import { Hero } from "../sections/Hero";
import { HowItWorks } from "../sections/HowItWorks";
import { CompileDemo } from "../sections/CompileDemo";
import { PriceShowcase } from "../sections/PriceShowcase";
import { Pricing } from "../sections/Pricing";
import { MediaSlots } from "../sections/MediaSlots";
import { CTA } from "../sections/CTA";

export function Landing() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <CompileDemo />
      <PriceShowcase />
      <Pricing />
      <MediaSlots />
      <CTA />
    </>
  );
}
