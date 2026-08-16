import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';

import type { PaginationMeta } from '@/types';

interface PaginationProps {
    meta: PaginationMeta;
    route: string;
    params: Record<string, string>;
    perPageOptions?: number[];
    onPerPageChange: (perPage: string) => void;
}

const PRESETS = [5, 10, 15, 20, 25] as const;

function go(route: string, params: Record<string, string>, page: number) {
    router.get(route, { ...params, page: String(page) }, {
        preserveState: true,
        preserveScroll: true,
    });
}

export default function Pagination({
    meta,
    route,
    params,
    perPageOptions,
    onPerPageChange,
}: PaginationProps) {
    const presets = perPageOptions ?? [...PRESETS];
    const currentPerPage = meta.per_page;
    const isPreset = presets.includes(currentPerPage);
    const [customOpen, setCustomOpen] = useState(false);

    return (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-base-content/40">
                Showing {meta.from}–{meta.to} of {meta.total}
            </p>

            <div className="flex items-center gap-3">
                <span className="text-xs text-base-content/40">Rows</span>

                <select
                    className="select select-bordered select-sm rounded-full text-xs"
                    value={isPreset ? String(currentPerPage) : '__custom'}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__custom') {
                            setCustomOpen(true);
                        } else {
                            setCustomOpen(false);
                            onPerPageChange(val);
                        }
                    }}
                >
                    {presets.map((n) => (
                        <option key={n} value={n}>
                            {n}
                        </option>
                    ))}
                    {!isPreset && (
                        <option value="__custom" disabled>
                            {currentPerPage} rows
                        </option>
                    )}
                    <option value="__custom">Custom…</option>
                </select>

                {customOpen && (
                    <CustomPerPageInput
                        value={currentPerPage}
                        onChange={(v) => {
                            setCustomOpen(false);
                            onPerPageChange(v);
                        }}
                        onCancel={() => setCustomOpen(false)}
                    />
                )}

                {meta.last_page > 1 && (
                    <nav className="join">
                        <button
                            type="button"
                            className="join-item btn btn-sm"
                            disabled={meta.current_page <= 1}
                            onClick={() => go(route, params, meta.current_page - 1)}
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        <PageNumbers
                            current={meta.current_page}
                            last={meta.last_page}
                            onPageClick={(p) => go(route, params, p)}
                        />
                        <button
                            type="button"
                            className="join-item btn btn-sm"
                            disabled={meta.current_page >= meta.last_page}
                            onClick={() => go(route, params, meta.current_page + 1)}
                            aria-label="Next page"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </nav>
                )}
            </div>
        </div>
    );
}

function PageNumbers({
    current,
    last,
    onPageClick,
}: {
    current: number;
    last: number;
    onPageClick: (page: number) => void;
}) {
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(last, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);

    return (
        <>
            {pages.map((p) => (
                <button
                    key={p}
                    type="button"
                    className={`join-item btn btn-sm ${
                        p === current ? 'btn-primary' : ''
                    }`}
                    onClick={() => onPageClick(p)}
                >
                    {p}
                </button>
            ))}
        </>
    );
}

function CustomPerPageInput({
    value,
    onChange,
    onCancel,
}: {
    value: number;
    onChange: (v: string) => void;
    onCancel: () => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [local, setLocal] = useState(String(value));

    const commit = () => {
        const v = parseInt(local, 10);
        if (v >= 1 && v <= 100) onChange(String(v));
        else onCancel();
    };

    return (
        <input
            ref={inputRef}
            type="number"
            min={1}
            max={100}
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            className="input input-bordered input-sm w-20 rounded-full text-xs"
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') onCancel();
            }}
            autoFocus
        />
    );
}
