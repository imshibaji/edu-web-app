import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';

import PublicLayout from '@/components/larnr/public-layout';
import BookTrialModal from '@/components/larnr/book-trial-modal';
import Hero from '@/components/larnr/hero';
import EducatorsSection from '@/components/larnr/educators-section';
import StatsSection from '@/components/larnr/stats-section';
import CitiesSpecialtiesSection from '@/components/larnr/cities-specialties-section';
import QualitySection from '@/components/larnr/quality-section';
import InterviewPrepSection from '@/components/larnr/interview-prep-section';
import CtaSection from '@/components/larnr/cta-section';
import type { HomeProps, Tutor } from '@/types';

export default function Home(props: HomeProps) {
    const { tutors, total, cityBreakdown, specialties, subjects, stats, filters, auth } = props;

    const [query, setQuery] = useState(filters.keyword);
    const [city, setCity] = useState(filters.city);
    const [format, setFormat] = useState(filters.format);
    const [level, setLevel] = useState(filters.experience);
    const [perPage, setPerPage] = useState(filters.perPage);
    const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mountedRef = useRef(false);

    const applyFilters = (patch: Record<string, unknown> = {}, opts: Record<string, unknown> = {}) => {
        router.get(
            '/',
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

    const openBook = (tutor: Tutor) => {
        if (auth?.user) {
            setSelectedTutor(tutor);
        } else {
            router.visit('/auth/login');
        }
    };

    const clearFilters = () => {
        setQuery('');
        setCity('');
        setFormat('');
        setLevel('');
    };

    return (
        <PublicLayout auth={auth} title="Find Premium Tutors & Mentors">
            <Hero {...props} />

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

            <StatsSection stats={stats} />

            <CitiesSpecialtiesSection
                cityBreakdown={cityBreakdown}
                specialties={specialties}
                onSelectSpecialty={setQuery}
            />

            <QualitySection />

            <InterviewPrepSection />

            <CtaSection auth={auth} />

            <BookTrialModal
                tutor={selectedTutor}
                subjects={subjects}
                onClose={() => setSelectedTutor(null)}
            />
        </PublicLayout>
    );
}
