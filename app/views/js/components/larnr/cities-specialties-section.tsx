import { useMemo } from 'react';

import SectionHeading from '@/components/larnr/section-heading';
import type { CityBreakdownItem, SpecialtyItem } from '@/types';

interface Props {
    cityBreakdown: CityBreakdownItem[];
    specialties: SpecialtyItem[];
    onSelectSpecialty: (name: string) => void;
}

export default function CitiesSpecialtiesSection({ cityBreakdown, specialties, onSelectSpecialty }: Props) {
    const maxCityCount = useMemo(
        () => Math.max(1, ...cityBreakdown.map((c) => c.count)),
        [cityBreakdown],
    );

    return (
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
                                            style={{ width: `${(c.count / maxCityCount) * 100}%` }}
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
                                    onClick={() => onSelectSpecialty(s.name)}
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
    );
}
