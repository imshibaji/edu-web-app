import { ChevronRight, GraduationCap, Users } from 'lucide-react';
import { Link } from '@inertiajs/react';

const INTERVIEW_PREP = [
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

export default function InterviewPrepSection() {
    return (
        <section id="interview" className="scroll-mt-24 py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-5 md:grid-cols-2">
                    {INTERVIEW_PREP.map((c) => (
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
                                        href={
                                            c.title.startsWith('Why')
                                                ? '/#educators'
                                                : '/auth/register'
                                        }
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
    );
}
