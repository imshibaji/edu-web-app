import { Sun, Moon, Monitor, Check } from "lucide-react";

import { useTheme } from "@/utils/theme.jsx";

const OPTIONS = [
    { mode: "light", label: "Day", icon: Sun },
    { mode: "dark", label: "Night", icon: Moon },
    { mode: "system", label: "System", icon: Monitor },
];

export default function ThemeToggle() {
    const [mode, setMode] = useTheme();
    const ActiveIcon = OPTIONS.find((o) => o.mode === mode)?.icon ?? Monitor;

    return (
        <div className="dropdown dropdown-end">
            <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle"
                aria-label="Colour mode"
            >
                <ActiveIcon className="size-5 text-base-content/60" />
            </div>
            <ul
                tabIndex={0}
                className="dropdown-content menu mt-2 w-48 rounded-box border border-base-content/10 bg-base-200 p-1.5 shadow-2xl"
            >
                {OPTIONS.map(({ mode: m, label, icon: Icon }) => (
                    <li key={m}>
                        <button
                            type="button"
                            onClick={(e) => {
                                setMode(m);
                                e.currentTarget.blur();
                            }}
                            className={`flex items-center justify-between rounded-lg text-sm ${
                                mode === m ? "text-primary" : "text-base-content/60"
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <Icon className="size-4" />
                                {label}
                            </span>
                            {mode === m && <Check className="size-4" />}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
