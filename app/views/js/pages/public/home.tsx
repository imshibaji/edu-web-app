import PublicLayout from '@/components/larnr/public-layout';
import BookTrialModal from '@/components/larnr/book-trial-modal';
import Hero from '@/components/larnr/hero';
import EducatorsSection from '@/components/larnr/educators-section';
import StatsSection from '@/components/larnr/stats-section';
import CitiesSpecialtiesSection from '@/components/larnr/cities-specialties-section';
import QualitySection from '@/components/larnr/quality-section';
import InterviewPrepSection from '@/components/larnr/interview-prep-section';
import CtaSection from '@/components/larnr/cta-section';
import { useHomePage } from '@/hooks/use-home-page';
import type { HomeProps } from '@/types';

export default function Home(props: HomeProps) {
    const { tutors, total, cityBreakdown, specialties, subjects, stats, filters, auth } = props;

    const {
        level,
        perPage,
        setLevel,
        setPerPage,
        setQuery,
        clearFilters,
        selectedTutor,
        openBook,
        closeBook,
    } = useHomePage(filters, auth);

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
                onClose={closeBook}
            />
        </PublicLayout>
    );
}
