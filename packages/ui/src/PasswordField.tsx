import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { checkPassword, passwordScore } from "@neo/genome";

export interface PasswordFieldProps {
    value: string;
    onChange: (v: string) => void;
    id?: string;
    placeholder?: string;
    showMeter?: boolean;
    inputClassName?: string;
    autoComplete?: string;
}

// Strength bar colours, indexed by passwordScore() 0..4.
const SCORE_COLORS = ["bg-black/20", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];

const RULES: Array<{ key: "length" | "upper" | "lower" | "digit"; label: string }> = [
    { key: "length", label: "8+ characters" },
    { key: "upper", label: "an uppercase letter" },
    { key: "lower", label: "a lowercase letter" },
    { key: "digit", label: "a number" },
];

export function PasswordField({ value, onChange, id, placeholder, showMeter = false, inputClassName = "", autoComplete }: PasswordFieldProps) {
    const [visible, setVisible] = useState(false);
    const checks = showMeter ? checkPassword(value) : null;
    const score = showMeter ? passwordScore(value) : 0;
    const unmet = checks ? RULES.filter((rule) => !checks[rule.key]) : [];

    return (
        <div>
            <div className="relative">
                <input
                    id={id}
                    type={visible ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className={`w-full pr-12 ${inputClassName}`}
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-black/60 hover:text-black">
                    {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
            </div>
            {showMeter && (
                <div className="mt-2">
                    <div className="flex gap-1">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? SCORE_COLORS[score] : "bg-black/10"}`} />
                        ))}
                    </div>
                    {unmet.length > 0 && (
                        <ul className="mt-1 space-y-0.5 text-xs text-black/60">
                            {unmet.map((rule) => (
                                <li key={rule.key}>Needs {rule.label}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
