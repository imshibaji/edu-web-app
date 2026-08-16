import { ShieldCheck, BadgeCheck, BookOpenCheck, MessageCircle, AlertTriangle, Eye } from 'lucide-react';

import PublicLayout from '@/components/larnr/public-layout';
import PageHeader from '@/components/larnr/page-header';
import ContentSection from '@/components/larnr/content-section';
import { useAuth } from '@/utils';

const PILLARS = [
    {
        icon: ShieldCheck,
        title: 'Interview-vetted educators',
        text: 'Every tutor passes a rigorous interview covering teaching method, subject mastery and communication before they can list on Larnr.',
    },
    {
        icon: BadgeCheck,
        title: 'Verified backgrounds',
        text: 'Qualifications, experience and credentials are checked before a tutor is listed as verified.',
    },
    {
        icon: BookOpenCheck,
        title: 'Structured lessons',
        text: 'Tutors prepare structured, goal-oriented lessons with clear objectives and practice material.',
    },
    {
        icon: MessageCircle,
        title: 'Progress reviews',
        text: 'Regular check-ins track progress so lessons stay aligned with student goals.',
    },
    {
        icon: Eye,
        title: 'Transparent pricing',
        text: 'Rates are shown up front. No hidden fees, ever.',
    },
    {
        icon: AlertTriangle,
        title: 'Clear reporting',
        text: 'Concerns can be reported directly to our team, and we act on every report.',
    },
];

export default function TrustSafety() {
    const auth = useAuth();

    return (
        <PublicLayout auth={auth} title="Trust & Safety">
            <PageHeader
                eyebrow="Trust & Safety"
                title="How we keep Larnr safe"
                description="Your safety is the foundation of everything we build. Here is how we protect students, families and educators."
            />

            <ContentSection title="Our approach">
                <p>
                    Trust is earned. We invest in verification, monitoring and human judgment so
                    that every lesson on Larnr happens between people who have been vetted. If
                    something feels off, you can report it — and we will act.
                </p>
            </ContentSection>

            <section className="py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {PILLARS.map((p) => (
                            <div
                                key={p.title}
                                className="card card-border border-base-content/10 bg-base-content/[0.04]"
                            >
                                <div className="card-body">
                                    <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                                        <p.icon className="size-5" />
                                    </span>
                                    <h3 className="font-display mt-3 font-semibold text-base-content">
                                        {p.title}
                                    </h3>
                                    <p className="text-sm leading-relaxed text-base-content/60">
                                        {p.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <ContentSection title="Reporting a concern">
                <p>
                    If you experience or witness anything that makes you uncomfortable — during a
                    lesson, in messages, or elsewhere on the platform — report it to{' '}
                    <a href="mailto:safety@larnr.com" className="link link-hover text-primary">
                        safety@larnr.com
                    </a>
                    . Our team reviews every report and will take appropriate action, up to and
                    including removal from the platform.
                </p>
                <p>
                    In an emergency, always contact local emergency services first. We are here to
                    support you, but urgent situations belong with professionals who can respond
                    immediately.
                </p>
            </ContentSection>

            <ContentSection title="Our commitments">
                <ul className="list-disc space-y-2 pl-5">
                    <li>Every reported concern is reviewed by a human.</li>
                    <li>We never publish personal contact details without consent.</li>
                    <li>We keep your data private and secure, per our Privacy Policy.</li>
                    <li>We continuously review and improve our vetting and safety processes.</li>
                </ul>
            </ContentSection>
        </PublicLayout>
    );
}
