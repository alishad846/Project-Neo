import { Mail, MessageCircle, MapPin } from "lucide-react";
import { ProsePage, ProseText } from "../components/ProsePage";

// Contact details are PLACEHOLDERS, clearly marked TODO until the user provides
// real values (see progress.md "OPEN QUESTIONS"). The page is intentionally
// static info + links, not a form — a contact form needs a backend endpoint /
// mail service that doesn't exist yet and would be a hollow promise otherwise.
const CONTACT = {
  // TODO: replace with real support email
  email: "hello@neo.example",
  // TODO: replace with real support channel (WhatsApp/chat) once decided
  support: "Support chat — coming soon",
  // TODO: replace with real registered business address
  address: "Registered address to be confirmed",
};

export function Contact() {
  return (
    <ProsePage
      title="Contact Us"
      intro="Questions, feedback, or need a hand getting set up? We'd love to hear from you."
    >
      <ProseText>
        The fastest way to reach us right now is email. These details are being finalised as we get
        ready for launch — the email below is monitored.
      </ProseText>

      <ul className="mt-6 flex flex-col gap-4">
        <li className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-[#b2ff59]">
            <Mail className="h-5 w-5 stroke-[3px] text-black" />
          </span>
          <span className="font-body text-base text-black">
            <span className="block font-accent text-lg">Email</span>
            {/* TODO: real support email */}
            <a href={`mailto:${CONTACT.email}`} className="underline decoration-2 underline-offset-2 hover:text-[#ff90e8]">
              {CONTACT.email}
            </a>
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-[#ffe680]">
            <MessageCircle className="h-5 w-5 stroke-[3px] text-black" />
          </span>
          <span className="font-body text-base text-black">
            <span className="block font-accent text-lg">Support</span>
            <span className="text-black/70">{CONTACT.support}</span>
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-[#8ecdff]">
            <MapPin className="h-5 w-5 stroke-[3px] text-black" />
          </span>
          <span className="font-body text-base text-black">
            <span className="block font-accent text-lg">Address</span>
            <span className="text-black/70">{CONTACT.address}</span>
          </span>
        </li>
      </ul>
    </ProsePage>
  );
}
