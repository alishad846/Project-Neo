import type { LucideIcon } from "lucide-react";

export function PopButton({ text, color, icon: Icon, onClick }: { text: string, color: string, icon: LucideIcon, onClick?: () => void }) {
    return (
        <button onClick={onClick}
            className="group relative flex items-center gap-3 rounded-xl border-4 border-black px-8 py-4 font-bold text-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]"
            style={{ backgroundColor: color }}>
            <span className="relative z-10 text-xl tracking-tight">{text}</span>
            <Icon className="h-6 w-6 stroke-[3px] transition-transform group-hover:rotate-12" />
        </button>
    );
}
