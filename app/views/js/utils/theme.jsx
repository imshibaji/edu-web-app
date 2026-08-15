import { useEffect, useState } from "react";

const STORAGE_KEY = "larnr-theme";
const MODES = ["light", "dark", "system"];
const THEMES = { light: "larnr-day", dark: "larnr" };
const THEME_COLORS = { light: "#f4f6fb", dark: "#07080d" };

function systemPrefersDark() {
    return (
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
    );
}

export function getThemeMode() {
    if (typeof window === "undefined") return "system";
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (MODES.includes(stored)) return stored;
    } catch {
        // ignore storage errors
    }
    return "system";
}

export function effectiveTheme(mode) {
    const resolved = mode === "system" ? (systemPrefersDark() ? "dark" : "light") : mode;
    return THEMES[resolved] ?? THEMES.dark;
}

export function applyTheme(themeName) {
    const root = document.documentElement;
    root.setAttribute("data-theme", themeName);
    root.style.colorScheme = themeName === "larnr-day" ? "light" : "dark";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.setAttribute(
            "content",
            THEME_COLORS[themeName === "larnr-day" ? "light" : "dark"],
        );
    }
}

export function setThemeMode(mode) {
    if (!MODES.includes(mode)) mode = "system";
    try {
        window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
        // ignore storage errors
    }
    applyTheme(effectiveTheme(mode));
    window.dispatchEvent(new CustomEvent("larnr:theme", { detail: mode }));
}

export function initTheme() {
    if (typeof window === "undefined") return;
    applyTheme(effectiveTheme(getThemeMode()));
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
        if (getThemeMode() === "system") applyTheme(effectiveTheme("system"));
    };
    mq.addEventListener("change", onSystemChange);
}

export function useTheme() {
    const [mode, setMode] = useState(getThemeMode());

    useEffect(() => {
        const onChange = (e) => setMode(e.detail);
        window.addEventListener("larnr:theme", onChange);
        return () => window.removeEventListener("larnr:theme", onChange);
    }, []);

    return [mode, setThemeMode];
}
