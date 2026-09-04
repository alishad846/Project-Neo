import { ProsePage, ProseHeading, ProseText } from "../components/ProsePage";

// Placeholder terms of service. Honest about the trial and the account-safety
// posture; company/jurisdiction specifics are TODO pending real details.
export function Terms() {
  return (
    <ProsePage title="Terms of Service" intro="Last updated: launch preview. This is a working draft — final legal copy pending.">
      <ProseText>
        By using Neo you agree to these terms. They are written to be readable; where a legal
        specific is still being finalised it is marked clearly.
      </ProseText>

      <ProseHeading>The service</ProseHeading>
      <ProseText>
        Neo helps you manage one product catalogue across marketplaces — composing listings, managing
        prices, and filling marketplace forms. You are responsible for the accuracy of the listings
        you publish and for complying with each marketplace&rsquo;s own rules.
      </ProseText>

      <ProseHeading>Trial and billing</ProseHeading>
      <ProseText>
        New accounts get a 7-day free trial. Pricing shown on the site is launch pricing and may
        change before general availability. {/* TODO: confirm final prices, billing cycle, refund policy */}
        You can cancel any time before the trial ends and you will not be charged.
      </ProseText>

      <ProseHeading>Account safety</ProseHeading>
      <ProseText>
        Neo fills marketplace forms for you but always stops at the marketplace&rsquo;s own submit
        button so you can review and confirm every change. Neo never auto-submits into your seller
        account and never bypasses a marketplace&rsquo;s security checks.
      </ProseText>

      <ProseHeading>Acceptable use</ProseHeading>
      <ProseText>
        Do not use Neo to publish unlawful, infringing, or misleading listings, or to abuse a
        marketplace&rsquo;s systems. We may suspend accounts that do.
      </ProseText>

      <ProseHeading>Liability</ProseHeading>
      <ProseText>
        Neo is provided &ldquo;as is&rdquo; during this launch preview. {/* TODO: full liability limitation + governing law once entity confirmed */}
        To the extent permitted by law, we are not liable for indirect or consequential losses.
      </ProseText>

      <ProseHeading>Contact</ProseHeading>
      <ProseText>
        Questions about these terms? See the contact page.
      </ProseText>
    </ProsePage>
  );
}
