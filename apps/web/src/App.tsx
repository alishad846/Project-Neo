import { Hero } from "./sections/Hero";
import { HowItWorks } from "./sections/HowItWorks";
import { CompileDemo } from "./sections/CompileDemo";
import { PriceShowcase } from "./sections/PriceShowcase";
import { Comparison } from "./sections/Comparison";
import { MediaSlots } from "./sections/MediaSlots";
import { CTA } from "./sections/CTA";

export function App() {
  return (
    <div className="bg-[#fff0f5] text-black font-cartoon">
      <Hero />
      <HowItWorks />
      <CompileDemo />
      <PriceShowcase />
      <Comparison />
      <MediaSlots />
      <CTA />
    </div>
  );
}
