import type { LucideIcon } from "lucide-react";

type PopButtonVariant = "site" | "panel";

const VARIANT_CLASSES: Record<PopButtonVariant, string> = {
    site: "border-4 border-black px-8 py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]",
    panel: "border-2 border-black px-4 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]",
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
            className={`group relative flex items-center gap-3 rounded-xl font-bold text-black transition-all ${VARIANT_CLASSES[variant]} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            style={{ backgroundColor: color }}>
            <span className={`relative z-10 font-semibold tracking-tight ${VARIANT_TEXT_CLASSES[variant]}`}>{text}</span>
            <Icon className="h-6 w-6 stroke-[3px] transition-transform group-hover:rotate-12" />
        </button>
    );
}
