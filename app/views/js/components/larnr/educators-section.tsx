import { Search } from 'lucide-react';

import SectionHeading from '@/components/larnr/section-heading';
import TutorCard from '@/components/larnr/tutor-card';
import type { AuthProps, Tutor } from '@/types';

const LEVELS = [
    { value: '', label: 'All levels' },
    { value: 'ENTRY', label: 'Entry' },
    { value: 'MID', label: 'Mid' },
    { value: 'SENIOR', label: 'Senior' },
] as const;

const PER_PAGE_OPTIONS = [5, 10, 15];

interface Props {
    tutors: Tutor[];
    total: number;
    level: string;
    perPage: number;
    auth: AuthProps;
    onLevelChange: (level: string) => void;
    onPerPageChange: (perPage: number) => void;
    onClearFilters: () => void;
    onBook: (tutor: Tutor) => void;
}

export default function EducatorsSection({
    tutors,
    total,
    level,
    perPage,
    auth,
    onLevelChange,
    onPerPageChange,
    onClearFilters,
    onBook,
}: Props) {
    return (
        <section id="educators" className="scroll-mt-24 py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <SectionHeading
                    eyebrow="Premium Educators"
                    title="Handpicked tutors, ready to teach"
                    description="Every tutor is interviewed, verified, and prepared with a structured first-lesson plan."
                />

                <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <div className="flex items-center gap-2">
                        {LEVELS.map((l) => (
                            <button
                                key={l.value}
                                onClick={() => onLevelChange(l.value)}
                                className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                                    level === l.value
                                        ? 'border-primary bg-primary/20 text-primary'
                                        : 'border-base-content/10 bg-base-content/5 text-base-content/60 hover:text-base-content'
                                }`}
                            >
                                {l.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-1 rounded-full border border-base-content/10 bg-base-content/5 p-1">
                        {PER_PAGE_OPTIONS.map((n) => (
                            <button
                                key={n}
                                onClick={() => onPerPageChange(n)}
                                className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${
                                    perPage === n
                                        ? 'bg-indigo-500 text-white'
                                        : 'text-base-content/60 hover:text-base-content'
                                }`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-8 grid gap-5 lg:grid-cols-2">
                    {tutors.length === 0 ? (
                        <div className="card card-border col-span-full border-base-content/10 bg-base-content/[0.04]">
                            <div className="card-body items-center py-16 text-center">
                                <Search className="size-10 text-base-content/40" />
                                <h3 className="font-display mt-4 text-lg font-semibold text-base-content">
                                    No tutors match your search
                                </h3>
                                <p className="max-w-sm text-sm text-base-content/60">
                                    Try a different keyword, city, or filter to see more premium
                                    educators.
                                </p>
                                <button
                                    onClick={onClearFilters}
                                    className="btn btn-ghost btn-sm mt-2 rounded-full"
                                >
                                    Clear filters
                                </button>
                            </div>
                        </div>
                    ) : (
                        tutors.map((t) => (
                            <TutorCard key={t.id} tutor={t} onBook={onBook} auth={auth} />
                        ))
                    )}
                </div>

                <p className="mt-6 text-center text-xs text-base-content/50">
                    Showing {tutors.length} of {total} educators
                    {total > tutors.length && (
                        <>
                            {' '}
                            ·{' '}
                            <button
                                onClick={() => onPerPageChange(Math.max(perPage, 15))}
                                className="link link-hover text-primary"
                            >
                                load more
                            </button>
                        </>
                    )}
                </p>
            </div>
        </section>
    );
}
