import { ProsePage, ProseHeading, ProseText } from "../components/ProsePage";

// Placeholder privacy policy. Copy is honest about what Neo actually does today
// (local-first tools, no upload for the PDF/calculator tools, extension stores
// auth token in the browser) but the legal specifics (company name, jurisdiction,
// contact address) are TODO until the user confirms real details.
export function Privacy() {
  return (
    <ProsePage title="Privacy Policy" intro="Last updated: launch preview. This is a working draft — final legal copy pending.">
      <ProseText>
        Neo is built to keep your data yours. This policy explains what we collect, why, and the
        control you have over it. Where a detail is still being finalised it is marked clearly.
      </ProseText>

      <ProseHeading>What we collect</ProseHeading>
      <ProseText>
        When you create an account we store your email and a securely hashed password so you can log
        in. If you connect a marketplace store, we store the catalogue data you choose to manage
        through Neo. We do not sell your data to anyone.
      </ProseText>

      <ProseHeading>Tools that never leave your browser</ProseHeading>
      <ProseText>
        Our free calculators and the PDF label tools run entirely on your device. Files you drop into
        the label crop and merge tools are processed locally in your browser and are never uploaded to
        our servers.
      </ProseText>

      <ProseHeading>The browser extension</ProseHeading>
      <ProseText>
        The Neo extension stores your login token in your browser&rsquo;s local storage so you stay
        signed in. It only reads and fills the marketplace pages you point it at, and it always stops
        at the marketplace&rsquo;s own submit button for you to review and confirm — it never submits
        on your behalf.
      </ProseText>

      <ProseHeading>Cookies</ProseHeading>
      <ProseText>
        We use a single stored preference to remember your cookie-consent choice. We do not run
        third-party advertising trackers.
      </ProseText>

      <ProseHeading>Your rights</ProseHeading>
      <ProseText>
        You can request a copy of your data or ask us to delete your account at any time. Reach us via
        the contact page. {/* TODO: confirm data-request SLA + jurisdiction-specific rights */}
      </ProseText>

      <ProseHeading>Contact</ProseHeading>
      <ProseText>
        {/* TODO: replace with real company name + registered address */}
        Questions about privacy? Email us at hello@neo.example — full contact details are on the
        contact page.
      </ProseText>
    </ProsePage>
  );
}
