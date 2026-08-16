import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Search, MapPin, Video, Building2 } from 'lucide-react';

import PublicLayout from '@/components/larnr/public-layout';
import PageHeader from '@/components/larnr/page-header';
import EducatorsSection from '@/components/larnr/educators-section';
import BookTrialModal from '@/components/larnr/book-trial-modal';
import { useTutorFilters } from '@/hooks/use-tutor-filters';
import type { HomeProps, Tutor } from '@/types';

const FORMATS = [
    { value: '', label: 'All formats' },
    { value: 'ONLINE', label: 'Online' },
    { value: 'IN_PERSON', label: 'In-person' },
    { value: 'BOTH', label: 'Online & In-person' },
];

export default function Tutors(props: HomeProps) {
    const { tutors, total, cities, subjects, filters, auth } = props;

    const {
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
    } = useTutorFilters(filters, '/tutors');

    const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);

    const openBook = (tutor: Tutor) => {
        if (auth?.user) {
            setSelectedTutor(tutor);
        } else {
            router.visit('/auth/login');
        }
    };

    return (
        <PublicLayout auth={auth} title="Find Tutors">
            <PageHeader
                eyebrow="Find Tutors"
                title="Browse premium educators"
                description="Search by subject, city or format. Every tutor is interviewed, verified and ready for a trial lesson."
            />

            <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        router.get(
                            '/tutors',
                            { keyword: query, city, format, experience: level, perPage },
                            { preserveState: true, preserveScroll: true, replace: true },
                        );
                    }}
                    className="flex flex-col gap-3 rounded-2xl border border-base-content/10 bg-base-content/5 p-3 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:rounded-full"
                >
                    <div className="flex flex-1 items-center gap-2 px-3">
                        <Search className="size-5 shrink-0 text-primary" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by subject, tutor, or keyword..."
                            className="w-full bg-transparent py-2.5 text-sm text-base-content placeholder:text-base-content/50 focus:outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2 border-base-content/10 px-3 sm:border-l">
                        <MapPin className="size-5 shrink-0 text-primary" />
                        <select
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full cursor-pointer bg-transparent py-2.5 text-sm text-base-content/80 focus:outline-none sm:w-40"
                        >
                            <option value="" className="bg-base-200">
                                All cities
                            </option>
                            {cities.map((c) => (
                                <option key={c} value={c} className="bg-base-200">
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 border-base-content/10 px-3 sm:border-l">
                        {format === 'ONLINE' ? (
                            <Video className="size-5 shrink-0 text-primary" />
                        ) : (
                            <Building2 className="size-5 shrink-0 text-primary" />
                        )}
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                            className="w-full cursor-pointer bg-transparent py-2.5 text-sm text-base-content/80 focus:outline-none sm:w-44"
                        >
                            {FORMATS.map((f) => (
                                <option key={f.value} value={f.value} className="bg-base-200">
                                    {f.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary rounded-full px-6">
                        Search
                    </button>
                </form>
            </div>

            <EducatorsSection
                tutors={tutors}
                total={total}
                level={level}
                perPage={perPage}
                auth={auth}
                onLevelChange={setLevel}
                onPerPageChange={setPerPage}
                onClearFilters={clearFilters}
                onBook={openBook}
            />

            <BookTrialModal
                tutor={selectedTutor}
                subjects={subjects}
                onClose={() => setSelectedTutor(null)}
            />
        </PublicLayout>
    );
}
