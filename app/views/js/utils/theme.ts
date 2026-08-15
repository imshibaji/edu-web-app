import { useEffect, useState } from 'react';

const STORAGE_KEY = 'larnr-theme';
const MODES = ['light', 'dark', 'system'] as const;
const THEMES = { light: 'larnr-day', dark: 'larnr' } as const;
const THEME_COLORS = { light: '#f4f6fb', dark: '#07080d' } as const;

type ThemeMode = typeof MODES[number];
type ThemeName = typeof THEMES[keyof typeof THEMES];

function systemPrefersDark(): boolean {
    return (
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
    );
}

export function getThemeMode(): ThemeMode {
    if (typeof window === 'undefined') return 'system';
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (MODES.includes(stored as ThemeMode)) return stored as ThemeMode;
    } catch {
        // ignore storage errors
    }
    return 'system';
}

export function effectiveTheme(mode: ThemeMode): ThemeName {
    const resolved = mode === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : mode;
    return THEMES[resolved] ?? THEMES.dark;
}

export function applyTheme(themeName: ThemeName): void {
    const root = document.documentElement;
    root.setAttribute('data-theme', themeName);
    root.style.colorScheme = themeName === 'larnr-day' ? 'light' : 'dark';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.setAttribute(
            'content',
            THEME_COLORS[themeName === 'larnr-day' ? 'light' : 'dark'],
        );
    }
}

export function setThemeMode(mode: ThemeMode): void {
    if (!MODES.includes(mode)) mode = 'system';
    try {
        window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
        // ignore storage errors
    }
    applyTheme(effectiveTheme(mode));
    window.dispatchEvent(new CustomEvent('larnr:theme', { detail: mode }));
}

export function initTheme(): void {
    if (typeof window === 'undefined') return;
    applyTheme(effectiveTheme(getThemeMode()));
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = () => {
        if (getThemeMode() === 'system') applyTheme(effectiveTheme('system'));
    };
    mq.addEventListener('change', onSystemChange);
}

export function useTheme(): [ThemeMode, (mode: ThemeMode) => void] {
    const [mode, setMode] = useState<ThemeMode>(getThemeMode);

    useEffect(() => {
        const onChange = (e: CustomEvent<ThemeMode>) => setMode(e.detail);
        window.addEventListener('larnr:theme', onChange as EventListener);
        return () => window.removeEventListener('larnr:theme', onChange as EventListener);
    }, []);

    return [mode, setThemeMode];
}