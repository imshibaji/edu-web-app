import { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import { Search, GraduationCap, ArrowRight } from 'lucide-react';

import PublicLayout from '@/components/larnr/public-layout';
import PageHeader from '@/components/larnr/page-header';
import type { SubjectsProps } from '@/types';

export default function Subjects(props: SubjectsProps) {
    const { specialties, subjects, totalTutors, citiesCount, auth } = props;

    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return subjects;
        return subjects.filter((s) => s.name.toLowerCase().includes(q));
    }, [query, subjects]);

    const countFor = (name: string) =>
        specialties.find((s) => s.name === name)?.count ?? 0;

    return (
        <PublicLayout auth={auth} title="Subjects">
            <PageHeader
                eyebrow="Subjects"
                title="Find a subject to learn"
                description={`Browse ${subjects.length} subjects taught by ${totalTutors} premium educators across ${citiesCount}+ cities.`}
            />

            <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2 rounded-full border border-base-content/10 bg-base-content/5 px-4 py-2.5">
                    <Search className="size-5 shrink-0 text-primary" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search subjects..."
                        className="w-full bg-transparent text-sm text-base-content placeholder:text-base-content/50 focus:outline-none"
                    />
                </div>

                <div className="mt-10">
                    <h2 className="font-display text-2xl font-bold text-base-content">
                        Top subjects
                    </h2>
                    <p className="mt-1 text-sm text-base-content/60">
                        Subjects with the most active educators.
                    </p>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {specialties.map((s) => (
                            <Link
                                key={s.name}
                                href={`/tutors?keyword=${encodeURIComponent(s.name)}`}
                                className="card card-border border-base-content/10 bg-base-content/[0.04] transition-colors hover:border-primary/40"
                            >
                                <div className="card-body flex-row items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                                            <GraduationCap className="size-5" />
                                        </span>
                                        <div>
                                            <h3 className="font-display font-semibold text-base-content">
                                                {s.name}
                                            </h3>
                                            <p className="text-xs text-base-content/50">
                                                {s.count} tutor{s.count > 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight className="size-4 text-base-content/40" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="mt-12">
                    <h2 className="font-display text-2xl font-bold text-base-content">
                        All subjects
                    </h2>
                    <p className="mt-1 text-sm text-base-content/60">
                        Search the full catalog below.
                    </p>

                    {filtered.length === 0 ? (
                        <div className="card card-border mt-6 border-base-content/10 bg-base-content/[0.04]">
                            <div className="card-body items-center py-14 text-center">
                                <Search className="size-10 text-base-content/40" />
                                <h3 className="font-display mt-4 text-lg font-semibold">
                                    No subjects found
                                </h3>
                                <p className="max-w-sm text-sm text-base-content/60">
                                    Try a different keyword to see more subjects.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-6 flex flex-wrap gap-2">
                            {filtered.map((s) => (
                                <Link
                                    key={s.id}
                                    href={`/tutors?keyword=${encodeURIComponent(s.name)}`}
                                    className="group flex items-center gap-2 rounded-full border border-base-content/10 bg-base-content/5 px-4 py-2 text-sm text-base-content/80 transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-base-content"
                                >
                                    {s.name}
                                    {countFor(s.name) > 0 && (
                                        <span className="rounded-full bg-base-content/10 px-2 py-0.5 text-xs text-base-content/60 group-hover:bg-primary/30">
                                            {countFor(s.name)}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-12 flex justify-center">
                    <Link href="/tutors" className="btn btn-primary rounded-full px-8">
                        Browse Tutors
                        <ArrowRight className="size-4" />
                    </Link>
                </div>
            </div>
        </PublicLayout>
    );
}
