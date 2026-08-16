import { Link } from '@inertiajs/react';
import { ShieldCheck, Users, BookOpenCheck, MessageCircle, ArrowRight } from 'lucide-react';

import PublicLayout from '@/components/larnr/public-layout';
import PageHeader from '@/components/larnr/page-header';
import ContentSection from '@/components/larnr/content-section';
import { useAuth } from '@/utils';

const VALUES = [
    {
        icon: ShieldCheck,
        title: 'Trust first',
        text: 'Every educator is interviewed and verified before they can teach on Larnr.',
    },
    {
        icon: Users,
        title: 'Students first',
        text: 'Transparent pricing, no hidden fees, and a free trial lesson before you commit.',
    },
    {
        icon: BookOpenCheck,
        title: 'Quality teaching',
        text: 'Structured, goal-oriented lesson plans prepared by every tutor on the platform.',
    },
    {
        icon: MessageCircle,
        title: 'Open communication',
        text: 'Regular progress reviews keep students, parents and tutors aligned.',
    },
];

const MILESTONES = [
    { value: '1:1', label: 'personal trial lessons' },
    { value: 'Vetted', label: 'educators, every one' },
    { value: 'Global', label: 'reach, local focus' },
    { value: 'Free', label: 'to start learning' },
];

export default function About() {
    const auth = useAuth();

    return (
        <PublicLayout auth={auth} title="About">
            <PageHeader
                eyebrow="About Larnr"
                title="Connecting students with premium educators worldwide"
                description="Larnr started with a simple idea: learning is better when great teachers are easy to find."
            />

            <ContentSection>
                <p>
                    Larnr is a marketplace that pairs students with premium, interview-prepared
                    tutors. We believe a great teacher can change everything — so we obsess over
                    quality at every step of the journey.
                </p>
                <p>
                    Every educator on Larnr passes a rigorous interview covering teaching method,
                    subject mastery, and communication. Their qualifications, experience and
                    credentials are checked before they are listed as verified. The result is a
                    shortlist of tutors you can actually trust with your learning.
                </p>
            </ContentSection>

            <section className="py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {MILESTONES.map((m) => (
                            <div
                                key={m.label}
                                className="card card-border border-base-content/10 bg-base-content/[0.04]"
                            >
                                <div className="card-body items-center gap-1 py-8 text-center">
                                    <p className="font-display text-3xl font-bold text-primary">
                                        {m.value}
                                    </p>
                                    <p className="text-xs text-base-content/50">{m.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h2 className="font-display text-2xl font-bold text-base-content">
                        What we stand for
                    </h2>
                    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {VALUES.map((v) => (
                            <div
                                key={v.title}
                                className="card card-border border-base-content/10 bg-base-content/[0.04]"
                            >
                                <div className="card-body">
                                    <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                                        <v.icon className="size-5" />
                                    </span>
                                    <h3 className="font-display mt-3 font-semibold text-base-content">
                                        {v.title}
                                    </h3>
                                    <p className="text-sm leading-relaxed text-base-content/60">
                                        {v.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <ContentSection>
                <p>
                    Today, students use Larnr for school subjects, competitive exams, and
                    professional skills — with educators across dozens of cities and formats. And
                    we are just getting started.
                </p>
            </ContentSection>

            <section className="py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="card relative overflow-hidden border border-primary/30 bg-gradient-to-r from-primary/20 via-secondary/15 to-secondary/20">
                        <div className="card-body items-center gap-4 py-12 text-center">
                            <h2 className="font-display max-w-xl text-3xl font-bold text-base-content sm:text-4xl">
                                Come learn with us
                            </h2>
                            <p className="max-w-lg text-sm text-base-content/80 sm:text-base">
                                Find a premium educator today — or join our team and help shape the
                                future of learning.
                            </p>
                            <div className="card-actions mt-4 flex flex-wrap justify-center gap-3">
                                <Link href="/tutors" className="btn btn-primary rounded-full px-8">
                                    Find Tutors
                                    <ArrowRight className="size-4" />
                                </Link>
                                <Link
                                    href="/careers"
                                    className="btn btn-ghost rounded-full px-8 text-base-content/80"
                                >
                                    View Careers
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
