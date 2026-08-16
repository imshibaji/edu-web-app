import { Link } from '@inertiajs/react';
import { Briefcase, ArrowRight, MapPin, Clock } from 'lucide-react';

import PublicLayout from '@/components/larnr/public-layout';
import PageHeader from '@/components/larnr/page-header';
import ContentSection from '@/components/larnr/content-section';
import { useAuth } from '@/utils';

const ROLES = [
    {
        title: 'Senior Product Engineer',
        team: 'Engineering',
        location: 'Remote · Worldwide',
        type: 'Full-time',
    },
    {
        title: 'Educator Success Manager',
        team: 'Operations',
        location: 'Remote · Worldwide',
        type: 'Full-time',
    },
    {
        title: 'Product Designer',
        team: 'Design',
        location: 'Remote · Worldwide',
        type: 'Full-time',
    },
    {
        title: 'Growth Marketing Lead',
        team: 'Marketing',
        location: 'Remote · Worldwide',
        type: 'Full-time',
    },
];

export default function Careers() {
    const auth = useAuth();

    return (
        <PublicLayout auth={auth} title="Careers">
            <PageHeader
                eyebrow="Careers"
                title="Do the best work of your career"
                description="We are building the most trusted marketplace for premium education. Join a small, ambitious team that cares deeply about learners."
            />

            <ContentSection title="Why Larnr">
                <p>
                    We are a remote-first team obsessed with two things: quality teaching and the
                    students who benefit from it. You will work on problems that matter, ship
                    quickly, and learn constantly.
                </p>
                <p>
                    We pay fairly, communicate openly, and judge work on outcomes — not hours. If
                    you are excited by the idea of reshaping how the world finds great teachers,
                    you will feel at home here.
                </p>
            </ContentSection>

            <section className="py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h2 className="font-display text-2xl font-bold text-base-content">
                        Open roles
                    </h2>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        {ROLES.map((r) => (
                            <div
                                key={r.title}
                                className="card card-border border-base-content/10 bg-base-content/[0.04]"
                            >
                                <div className="card-body">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                                                <Briefcase className="size-5" />
                                            </span>
                                            <div>
                                                <h3 className="font-display font-semibold text-base-content">
                                                    {r.title}
                                                </h3>
                                                <p className="text-xs text-base-content/50">
                                                    {r.team}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-base-content/60">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="size-3.5" /> {r.location}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="size-3.5" /> {r.type}
                                        </span>
                                    </div>
                                    <div className="card-actions mt-3">
                                        <Link
                                            href="/contact"
                                            className="btn btn-primary btn-sm rounded-full"
                                        >
                                            Apply
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="card card-border mt-8 border-primary/20 bg-primary/5">
                        <div className="card-body items-center gap-2 py-10 text-center">
                            <h3 className="font-display text-xl font-bold text-base-content">
                                Don&apos;t see your role?
                            </h3>
                            <p className="max-w-md text-sm text-base-content/60">
                                We are always looking for exceptional people. Tell us how you can
                                help.
                            </p>
                            <Link href="/contact" className="btn btn-ghost btn-sm rounded-full mt-2 text-primary">
                                Get in touch
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
