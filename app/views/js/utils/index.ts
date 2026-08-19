import { usePage } from '@inertiajs/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { AuthUser, AuthProps } from '@/types';

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export function getInitials(fullName: string): string {
    const names = fullName.trim().split(' ');

    if (names.length === 0) return '';
    if (names.length === 1) return names[0].charAt(0).toUpperCase();

    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
}

export function useAuth(): AuthProps {
    return usePage().props.auth as AuthProps;
}

export function avatarSrc(src: string | null | undefined): string | null {
    if (!src) return null;
    if (/^(https?:\/\/|blob:)/.test(src)) return src;
    return src.startsWith('/') ? src : `/${src}`;
}