import { BadgeCheck, BookOpenCheck, MessageCircle, ShieldCheck } from 'lucide-react';

import SectionHeading from '@/components/larnr/section-heading';

const QUALITY = [
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

export default function QualitySection() {
    return (
        <section id="quality" className="scroll-mt-24 py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <SectionHeading
                    eyebrow="Tutor Quality Indicators"
                    title="How we keep quality high"
                    description="A multi-step vetting process that students can trust."
                />
                <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {QUALITY.map((q) => (
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
    );
}
