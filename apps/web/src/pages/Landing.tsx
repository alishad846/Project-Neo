import { Hero } from "../sections/Hero";
import { HowItWorks } from "../sections/HowItWorks";
import { CompileDemo } from "../sections/CompileDemo";
import { MediaSlots } from "../sections/MediaSlots";
import { PriceShowcase } from "../sections/PriceShowcase";
import { ToolsShowcase } from "../sections/ToolsShowcase";
import { Pricing } from "../sections/Pricing";
import { CTA } from "../sections/CTA";

export function Landing() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <CompileDemo />
      <MediaSlots />
      <PriceShowcase />
      <ToolsShowcase />
      <Pricing />
      <CTA />
    </>
  );
}
