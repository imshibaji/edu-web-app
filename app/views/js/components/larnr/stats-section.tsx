import { BadgeCheck, Clock, Globe, TrendingUp, Users } from 'lucide-react';

import SectionHeading from '@/components/larnr/section-heading';
import { getCurrencyCookie } from '@/utils/currency';
import type { TutorStats } from '@/types';

const ACCENTS = {
    primary: 'text-primary',
    success: 'text-success',
    secondary: 'text-secondary',
    warning: 'text-warning',
    info: 'text-info',
} as const;

interface Props {
    stats: TutorStats;
}

export default function StatsSection({ stats }: Props) {
    const statsItems = [
        { label: 'Total Educators', value: stats.totalTutors, icon: Users, accent: ACCENTS.primary },
        { label: 'Verified Tutors', value: stats.verifiedCount, icon: BadgeCheck, accent: ACCENTS.success },
        { label: 'Active Right Now', value: stats.activeNow, icon: Clock, accent: ACCENTS.secondary },
        {
            label: 'Avg. Hourly Rate',
            value: `${getCurrencyCookie() === 'INR' ? '₹' : '$'}${Math.round(stats.avgRate / 100)}`,
            icon: TrendingUp,
            accent: ACCENTS.warning,
        },
        { label: 'Cities Covered', value: stats.citiesCount, icon: Globe, accent: ACCENTS.info },
    ];

    return (
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
    );
}
