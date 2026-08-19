import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BadgeCheck, GraduationCap, Users } from 'lucide-react';

import PublicLayout from '@/components/larnr/public-layout';
import Avatar from '@/components/larnr/avatar';
import { displayAmount } from '@/utils/currency';
import type { SubjectPageProps } from '@/types';

export default function SubjectPage(props: SubjectPageProps) {
    const { auth, subject, tutors, totalTutors } = props;

    const title = `${subject.name} Tutors`;
    const description =
        subject.description ??
        `Find and book expert ${subject.name} tutors on Larnr. Compare rates, reviews and availability.`;

    return (
        <PublicLayout auth={auth} title={title}>
            <Head>
                <meta name="description" content={description} />
                <link rel="canonical" href={`/subject/${subject.slug}`} />
            </Head>

            <section className="relative overflow-hidden">
                <div className="mx-auto max-w-5xl px-4 pt-16 pb-10 text-center sm:px-6 sm:pt-24 lg:px-8">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        Subject
                    </span>
                    <h1 className="font-display mt-4 text-4xl font-extrabold leading-tight tracking-tight text-base-content sm:text-5xl">
                        {title}
                    </h1>
                    <p className="mx-auto mt-5 max-w-2xl text-base text-base-content/60 sm:text-lg">
                        {description}
                    </p>
                    <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-base-content/10 bg-base-content/5 px-4 py-1.5 text-sm text-base-content/70">
                        <Users className="size-4 text-primary" />
                        {totalTutors} tutor{totalTutors === 1 ? '' : 's'} available
                    </p>
                </div>
            </section>

            <div className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl font-bold text-base-content">
                        {subject.name} tutors
                    </h2>
                    <Link href={`/tutors?keyword=${encodeURIComponent(subject.name)}`} className="btn btn-outline btn-sm rounded-full">
                        View all <ArrowRight className="size-4" />
                    </Link>
                </div>

                {tutors.length === 0 ? (
                    <div className="card card-border mt-6 border-base-content/10 bg-base-content/[0.04]">
                        <div className="card-body items-center py-14 text-center">
                            <GraduationCap className="size-10 text-base-content/40" />
                            <h3 className="font-display mt-4 text-lg font-semibold">No tutors yet</h3>
                            <p className="max-w-sm text-sm text-base-content/60">
                                No {subject.name} tutors are available right now. Check back soon or
                                browse all tutors.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {tutors.map((t) => {
                            const rate = displayAmount(t.rate, t.currency, auth);
                            return (
                                <Link
                                    key={t.id}
                                    href={`/t/${t.username ?? t.id}`}
                                    className="card card-border border-base-content/10 bg-base-content/[0.04] transition-colors hover:border-primary/40"
                                >
                                    <div className="card-body gap-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar src={t.avatar} name={t.name} className="size-11" textClass="text-sm" />
                                            <div className="min-w-0 flex-1">
                                                <p className="flex items-center gap-1 truncate text-sm font-semibold text-base-content">
                                                    {t.name}
                                                    {t.verified && (
                                                        <BadgeCheck className="size-4 shrink-0 text-primary" />
                                                    )}
                                                </p>
                                                <p className="truncate text-xs text-base-content/60">{t.headline}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-base-content/70">
                                                {t.rating > 0 ? `★ ${t.rating.toFixed(1)}` : 'New tutor'}
                                            </span>
                                            <span className="text-xs font-semibold text-primary">
                                                {t.rate > 0 ? `${rate.text}/hr` : 'Rate on request'}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}