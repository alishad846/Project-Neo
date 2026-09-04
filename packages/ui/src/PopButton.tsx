import type { LucideIcon } from "lucide-react";

type PopButtonVariant = "site" | "panel";

// Cartoon "pop" comes from the offset drop-shadow, NOT a heavy outline: square
// corners + a thin 1px border + a hard offset ink shadow read as a comic
// sticker. No thick black outline. Shadow colour is a warm ink, not pure black.
const VARIANT_CLASSES: Record<PopButtonVariant, string> = {
    site: "rounded-md border border-black/40 px-8 py-4 shadow-[6px_6px_0px_0px_rgba(26,22,15,0.9)] hover:-translate-y-1 hover:shadow-[9px_9px_0px_0px_rgba(26,22,15,0.9)] active:translate-x-1 active:translate-y-1 active:shadow-[0px_0px_0px_0px_rgba(26,22,15,0.9)]",
    panel: "rounded-md border border-black/40 px-4 py-2 shadow-[3px_3px_0px_0px_rgba(26,22,15,0.9)] hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(26,22,15,0.9)] active:translate-x-1 active:translate-y-1 active:shadow-[0px_0px_0px_0px_rgba(26,22,15,0.9)]",
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
