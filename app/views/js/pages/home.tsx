import { useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Search,
    BadgeCheck,
    Users,
    Clock,
    ShieldCheck,
    Globe,
    GraduationCap,
    BookOpenCheck,
    MessageCircle,
    ArrowRight,
    ChevronRight,
    TrendingUp,
} from 'lucide-react';

import { getCurrencyCookie } from '@/utils/currency';
import Navbar from '@/components/larnr/navbar';
import Footer from '@/components/larnr/footer';
import TutorCard from '@/components/larnr/tutor-card';
import BookTrialModal from '@/components/larnr/book-trial-modal';
import FlashToast from '@/components/larnr/flash-toast';
import Hero from '@/components/larnr/hero';
import SectionHeading from '@/components/larnr/section-heading';
import type { HomeProps, AuthProps, Tutor } from '@/types';

const LEVELS = [
    { value: '', label: 'All levels' },
    { value: 'ENTRY', label: 'Entry' },
    { value: 'MID', label: 'Mid' },
    { value: 'SENIOR', label: 'Senior' },
] as const;

export default function Home(props: HomeProps) {
    const { tutors, total, cities, cityBreakdown, specialties, subjects, stats, filters, auth } = props;

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

    const maxCityCount = useMemo(
        () => Math.max(1, ...cityBreakdown.map((c) => c.count)),
        [cityBreakdown],
    );

    const openBook = (tutor: Tutor) => {
        if (auth?.user) {
            setSelectedTutor(tutor);
        } else {
            router.visit('/auth/login');
        }
    };

    const quality = [
        {
            icon: ShieldCheck,
            title: 'Interview-Vetted Tutors',
            text: 'Every educator passes a rigorous interview covering teaching method, subject mastery, and communication.',
        },
        {
            icon: BadgeCheck,
            title: 'Verified Backgrounds',
            text: 'Qualifications, experience, and credentials are checked before a tutor is listed as verified.',
        },
        {
            icon: BookOpenCheck,
            title: 'Structured Lesson Plans',
            text: 'Tutors prepare structured, goal-oriented lessons with clear objectives and practice material.',
        },
        {
            icon: MessageCircle,
            title: 'Regular Progress Reviews',
            text: 'Frequent check-ins track your progress so lessons stay aligned with your goals.',
        },
    ];

    const interviewPrep = [
        {
            icon: GraduationCap,
            title: 'Tutor Interview Preparation',
            text: 'Free coaching materials to help you prepare for your tutor interview and win more students.',
            cta: 'Get Prep Materials',
        },
        {
            icon: Users,
            title: 'Why Students Choose Larnr',
            text: 'Premium educators, transparent pricing, and a 1:1 first trial lesson before you commit.',
            cta: 'Meet the Educators',
        },
    ];

    const statsItems = [
        { label: 'Total Educators', value: stats.totalTutors, icon: Users, accent: 'text-primary' },
        { label: 'Verified Tutors', value: stats.verifiedCount, icon: BadgeCheck, accent: 'text-success' },
        { label: 'Active Right Now', value: stats.activeNow, icon: Clock, accent: 'text-secondary' },
        { label: 'Avg. Hourly Rate', value: `${getCurrencyCookie() === 'INR' ? '₹' : '$'}${Math.round(stats.avgRate / 100)}`, icon: TrendingUp, accent: 'text-warning' },
        { label: 'Cities Covered', value: stats.citiesCount, icon: Globe, accent: 'text-info' },
    ];

    return (
        <div className="min-h-screen bg-base-100 text-base-content">
            <Head title="Find Premium Tutors & Mentors" />

            <FlashToast />

            {/* ambient background */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]" />
                <div className="absolute top-40 -left-32 h-96 w-96 rounded-full bg-secondary/10 blur-[120px]" />
                <div className="absolute top-64 -right-32 h-96 w-96 rounded-full bg-secondary/10 blur-[120px]" />
            </div>

            <div className="relative z-10">
                <Navbar auth={auth} />

                {/* ============ HERO ============ */}
                <Hero {...props} />

                {/* ============ EDUCATORS ============ */}
                <section id="educators" className="scroll-mt-24 py-14">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <SectionHeading
                            eyebrow="Premium Educators"
                            title="Handpicked tutors, ready to teach"
                            description="Every tutor is interviewed, verified, and prepared with a structured first-lesson plan."
                        />

                        {/* perPage + level controls */}
                        <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
                            <div className="flex items-center gap-2">
                                {LEVELS.map((l) => (
                                    <button
                                        key={l.value}
                                        onClick={() => setLevel(l.value)}
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
                                {[5, 10, 15].map((n) => (
                                    <button
                                        key={n}
                                        onClick={() => setPerPage(n)}
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
                                            Try a different keyword, city, or filter to see more
                                            premium educators.
                                        </p>
                                        <button
                                            onClick={() => {
                                                setQuery('');
                                                setCity('');
                                                setFormat('');
                                                setLevel('');
                                            }}
                                            className="btn btn-ghost btn-sm mt-2 rounded-full"
                                        >
                                            Clear filters
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                tutors.map((t) => (
                                    <TutorCard key={t.id} tutor={t} onBook={openBook} auth={auth} />
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
                                        onClick={() => setPerPage(Math.max(perPage, 15))}
                                        className="link link-hover text-primary"
                                    >
                                        load more
                                    </button>
                                </>
                            )}
                        </p>
                    </div>
                </section>

                {/* ============ STATS ============ */}
                <section id="about" className="scroll-mt-24 py-14">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <SectionHeading
                            eyebrow="Verified Tutors Overview"
                            title="A growing community of educators"
                            description="Live numbers across our verified tutor network."
                        />
                        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                            {statsItems.map((s) => (
                                <div
                                    key={s.label}
                                    className="card card-border border-base-content/10 bg-base-content/[0.04]"
                                >
                                    <div className="card-body items-center gap-1 py-7 text-center">
                                        <s.icon className={`size-6 ${s.accent}`} />
                                        <p className={`font-display mt-2 text-3xl font-bold ${s.accent}`}>
                                            {s.value}
                                        </p>
                                        <p className="text-xs text-base-content/50">{s.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============ CITY BREAKDOWN ============ */}
                <section id="cities" className="scroll-mt-24 py-14">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
                            <div>
                                <SectionHeading
                                    eyebrow="Tutor Locations"
                                    title="Premium educators near you"
                                    description="In-person and online tutoring across major cities."
                                />
                                <div className="mt-8 space-y-4">
                                    {cityBreakdown.map((c) => (
                                        <div key={c.city}>
                                            <div className="mb-1.5 flex items-center justify-between text-sm">
                                                <span className="text-base-content/80">{c.city}</span>
                                                <span className="text-xs text-base-content/50">
                                                    {c.count} tutor{c.count > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-base-content/5">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                                                    style={{
                                                        width: `${(c.count / maxCityCount) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <SectionHeading
                                    eyebrow="Specialties Breakdown"
                                    title="Find your subject"
                                    description="From core academics to competitive exams and skills."
                                />
                                <div className="mt-8 flex flex-wrap gap-2">
                                    {specialties.map((s) => (
                                        <span
                                            key={s.name}
                                            className="group flex cursor-pointer items-center gap-2 rounded-full border border-base-content/10 bg-base-content/5 px-4 py-2 text-sm text-base-content/80 transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-base-content"
                                            onClick={() => setQuery(s.name)}
                                        >
                                            {s.name}
                                            <span className="rounded-full bg-base-content/10 px-2 py-0.5 text-xs text-base-content/60 group-hover:bg-primary/30">
                                                {s.count}
                                            </span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============ QUALITY ============ */}
                <section id="quality" className="scroll-mt-24 py-14">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <SectionHeading
                            eyebrow="Tutor Quality Indicators"
                            title="How we keep quality high"
                            description="A multi-step vetting process that students can trust."
                        />
                        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {quality.map((q) => (
                                <div
                                    key={q.title}
                                    className="card card-border border-base-content/10 bg-base-content/[0.04] transition-colors hover:border-primary/40"
                                >
                                    <div className="card-body">
                                        <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                                            <q.icon className="size-5" />
                                        </span>
                                        <h3 className="font-display mt-3 font-semibold text-base-content">
                                            {q.title}
                                        </h3>
                                        <p className="text-sm leading-relaxed text-base-content/60">
                                            {q.text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============ INTERVIEW PREP ============ */}
                <section id="interview" className="scroll-mt-24 py-14">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid gap-5 md:grid-cols-2">
                            {interviewPrep.map((c) => (
                                <div
                                    key={c.title}
                                    className="card card-border relative overflow-hidden border-base-content/10 bg-base-content/[0.04]"
                                >
                                    <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/10 blur-3xl" />
                                    <div className="card-body">
                                        <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-secondary/20 to-primary/20 text-secondary">
                                            <c.icon className="size-5" />
                                        </span>
                                        <h3 className="font-display mt-3 text-xl font-bold text-base-content">
                                            {c.title}
                                        </h3>
                                        <p className="text-sm leading-relaxed text-base-content/60">
                                            {c.text}
                                        </p>
                                        <div className="card-actions mt-4">
                                            <Link
                                                href={c.title.startsWith('Why') ? '/#educators' : '/auth/register'}
                                                className="btn btn-ghost btn-sm rounded-full text-primary"
                                            >
                                                {c.cta}
                                                <ChevronRight className="size-4" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============ CTA ============ */}
                <section className="py-16">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="card relative overflow-hidden border border-primary/30 bg-gradient-to-r from-primary/20 via-secondary/15 to-secondary/20">
                            <div className="card-body items-center gap-4 py-14 text-center">
                                <h2 className="font-display max-w-xl text-3xl font-bold text-base-content sm:text-4xl">
                                    Ready to start your learning journey?
                                </h2>
                                <p className="max-w-lg text-sm text-base-content/80 sm:text-base">
                                    Book a free trial lesson with a premium educator today. No
                                    commitment, just great teaching.
                                </p>
                                <div className="card-actions mt-4 flex flex-wrap justify-center gap-3">
                                    <Link
                                        href={auth?.user ? '/dashboard' : '/auth/register'}
                                        className="btn btn-primary rounded-full px-8"
                                    >
                                        {auth?.user ? 'Go to Dashboard' : 'Get Started'}
                                        <ArrowRight className="size-4" />
                                    </Link>
                                    <Link
                                        href="/#educators"
                                        className="btn btn-ghost rounded-full px-8 text-base-content/80"
                                    >
                                        Browse Educators
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <Footer />
            </div>

            <BookTrialModal
                tutor={selectedTutor}
                subjects={subjects}
                onClose={() => setSelectedTutor(null)}
            />
        </div>
    );
}