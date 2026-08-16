import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';

import type { TutorFilter } from '@/types';

export interface TutorFilterHandlers {
    query: string;
    city: string;
    format: string;
    level: string;
    perPage: number;
    setQuery: (value: string) => void;
    setCity: (value: string) => void;
    setFormat: (value: string) => void;
    setLevel: (value: string) => void;
    setPerPage: (value: number) => void;
    clearFilters: () => void;
}

export function useTutorFilters(filters: TutorFilter, route = '/'): TutorFilterHandlers {
    const [query, setQuery] = useState(filters.keyword);
    const [city, setCity] = useState(filters.city);
    const [format, setFormat] = useState(filters.format);
    const [level, setLevel] = useState(filters.experience);
    const [perPage, setPerPage] = useState(filters.perPage);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mountedRef = useRef(false);

    const applyFilters = (patch: Record<string, unknown> = {}, opts: Record<string, unknown> = {}) => {
        router.get(
            route,
            { keyword: query, city, format, experience: level, perPage, ...patch },
            { preserveState: true, preserveScroll: true, replace: true, ...opts },
        );
    };

    useEffect(() => {
        if (!mountedRef.current) {
            mountedRef.current = true;
            return;
        }
        clearTimeout(debounceRef.current ?? undefined);
        debounceRef.current = setTimeout(() => applyFilters({}), 350);
        return () => clearTimeout(debounceRef.current ?? undefined);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    useEffect(() => {
        if (!mountedRef.current) return;
        applyFilters({ city });
    }, [city]);
    useEffect(() => {
        if (!mountedRef.current) return;
        applyFilters({ format });
    }, [format]);
    useEffect(() => {
        if (!mountedRef.current) return;
        applyFilters({ experience: level });
    }, [level]);
    useEffect(() => {
        if (!mountedRef.current) return;
        applyFilters({ perPage });
    }, [perPage]);

    const clearFilters = () => {
        setQuery('');
        setCity('');
        setFormat('');
        setLevel('');
    };

    return {
        query,
        city,
        format,
        level,
        perPage,
        setQuery,
        setCity,
        setFormat,
        setLevel,
        setPerPage,
        clearFilters,
    };
}
