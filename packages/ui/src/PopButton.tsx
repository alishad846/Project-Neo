import type { LucideIcon } from "lucide-react";

type PopButtonVariant = "site" | "panel";

// Square comic sticker: thin 1px border + a hard offset ink shadow. On hover the
// button translates INTO its shadow (down+right by exactly the shadow offset) and
// the shadow collapses to zero — so it reads as the button being pressed down
// under pressure. Corners are squared globally by the .site-canvas square rule.
const VARIANT_CLASSES: Record<PopButtonVariant, string> = {
    site: "border border-black/40 px-8 py-4 shadow-[6px_6px_0px_0px_rgba(26,22,15,0.9)] hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-[0px_0px_0px_0px_rgba(26,22,15,0.9)] active:translate-x-[6px] active:translate-y-[6px] active:shadow-[0px_0px_0px_0px_rgba(26,22,15,0.9)]",
    panel: "border border-black/40 px-4 py-2 shadow-[3px_3px_0px_0px_rgba(26,22,15,0.9)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[0px_0px_0px_0px_rgba(26,22,15,0.9)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[0px_0px_0px_0px_rgba(26,22,15,0.9)]",
};

const VARIANT_TEXT_CLASSES: Record<PopButtonVariant, string> = {
    site: "text-xl",
    panel: "text-base",
};

export interface PopButtonProps {
    text: string;
    color: string;
    icon: LucideIcon;
    onClick?: () => void;
    variant?: PopButtonVariant;
    disabled?: boolean;
}

export function PopButton({ text, color, icon: Icon, onClick, variant = "site", disabled = false }: PopButtonProps) {
    return (
        <button
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className={`group relative flex items-center gap-3 font-bold text-black transition-all ${VARIANT_CLASSES[variant]} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            style={{ backgroundColor: color }}>
            <span className={`relative z-10 font-semibold tracking-tight ${VARIANT_TEXT_CLASSES[variant]}`}>{text}</span>
            <Icon className="h-6 w-6 stroke-[3px] transition-transform group-hover:rotate-12" />
        </button>
    );
}
