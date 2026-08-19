import { Head, Link } from '@inertiajs/react';
import {
    BadgeCheck,
    MapPin,
    Star,
    Video,
    Building2,
    CalendarCheck,
    Clock,
    Inbox,
    MessageSquare,
    ArrowRight,
    GraduationCap,
    ArrowUpRight,
} from 'lucide-react';

import FlashToast from '@/components/larnr/flash-toast';
import Avatar from '@/components/larnr/avatar';
import { FORMAT_LABELS, LEVEL_LABELS, STATUS_BADGE, statusLabel, formatDateTime } from '@/utils/tutor';
import { displayAmount } from '@/utils/currency';
import type { TutorIndexProps, TutorProfile, TutorSubject, AuthProps, Enquiry, Stats } from '@/types';
import TutorLayout from '@/components/larnr/tutor-layout';

function StatCard({ icon: Icon, label, value, accent, href }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number | string;
    accent?: string;
    href?: string;
}) {
    const inner = (
        <div className="card card-border border-base-content/10 bg-base-content/[0.04] transition-colors hover:border-primary/30 hover:bg-base-content/[0.06]">
            <div className="card-body flex-row items-center gap-4 py-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-base-content/5 text-base-content/80">
                    <Icon className="size-5" />
                </span>
                <div>
                    <p className={`font-display text-2xl font-bold ${accent ?? 'text-base-content'}`}>
                        {value}
                    </p>
                    <p className="text-xs text-base-content/50">{label}</p>
                </div>
            </div>
        </div>
    );

    return href ? <Link href={href}>{inner}</Link> : inner;
}

function ProfileHeader({ profile, auth }: { profile: TutorProfile; auth: AuthProps }) {
    const rate = displayAmount(profile.rate, profile.currency, auth);

    return (
        <div className="card card-border relative overflow-hidden border-base-content/10 bg-gradient-to-r from-primary/15 via-secondary/10 to-transparent">
            <div className="card-body sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Avatar
                        src={profile.avatar}
                        name={profile.name}
                        className="size-16 shadow-lg shadow-primary/20"
                        textClass="text-lg"
                    />
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="font-display text-2xl font-bold text-base-content">
                                {profile.name}
                            </h1>
                            {profile.verified && <BadgeCheck className="size-5 text-success" />}
                            <span className="badge badge-outline badge-sm border-primary/40 text-primary">
                                Tutor
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-base-content/60">{profile.headline}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-base-content/60">
                            {profile.city && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="size-3.5" /> {profile.city}
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                {profile.format === 'ONLINE' ? (
                                    <Video className="size-3.5" />
                                ) : (
                                    <Building2 className="size-3.5" />
                                )}
                                {FORMAT_LABELS[profile.format] ?? profile.format}
                            </span>
                            <span className="flex items-center gap-1">
                                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                                {Number(profile.rating).toFixed(1)}
                            </span>
                            <span>{LEVEL_LABELS[profile.level as keyof typeof LEVEL_LABELS] ?? profile.level}</span>
                        </div>
                    </div>
                </div>
                <div className="mt-4 text-left sm:mt-0 sm:text-right">
                    <p className="font-display text-3xl font-bold text-primary">
                        {profile.rate > 0 ? rate.text : '—'}
                    </p>
                    <p className="text-xs text-base-content/50">
                        {profile.rate > 0 ? `per hour · ${profile.currency}` : 'per hour'}
                    </p>
                    {rate.note && (
                        <p className="text-xs text-base-content/50">≈ {rate.note}</p>
                    )}
                    <Link
                        href="/tutor/profile"
                        className="btn btn-ghost btn-xs mt-2 rounded-full text-primary hover:bg-base-content/5"
                    >
                        Edit public profile
                    </Link>
                </div>
            </div>
        </div>
    );
}

function EnquiriesPreview({ enquiries }: { enquiries: Enquiry[] }) {
    return (
        <div className="card card-border border-base-content/10 bg-base-content/[0.04]">
            <div className="card-body gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-display text-lg font-semibold text-base-content">
                            Recent Enquiries
                        </h2>
                        <p className="text-xs text-base-content/50">Latest trial lesson requests.</p>
                    </div>
                    <Link href="/tutor/enquiries" className="btn btn-ghost btn-xs rounded-full text-primary">
                        View all <ArrowUpRight className="size-3.5" />
                    </Link>
                </div>

                <div className="space-y-2">
                    {enquiries.length === 0 && (
                        <div className="rounded-xl border border-dashed border-base-content/10 p-8 text-center">
                            <Inbox className="mx-auto size-8 text-base-content/40" />
                            <p className="mt-2 text-sm text-base-content/50">
                                No enquiries yet. Students will appear here when they book a trial.
                            </p>
                        </div>
                    )}
                    {enquiries.map((e) => (
                        <div
                            key={e.id}
                            className="flex items-center justify-between gap-3 rounded-xl bg-base-content/5 px-4 py-3"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-base-content">{e.student}</p>
                                <p className="text-xs text-base-content/50">
                                    {e.subject ?? 'Any'} · {formatDateTime(e.scheduled_at)}
                                </p>
                                {e.notes && (
                                    <p className="mt-0.5 truncate text-xs text-base-content/50">"{e.notes}"</p>
                                )}
                            </div>
                            <span className={`badge badge-sm ${STATUS_BADGE[e.status as keyof typeof STATUS_BADGE] ?? 'badge-neutral'}`}>
                                {statusLabel(e.status)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function TutorIndex(props: TutorIndexProps) {
    const pendingReviewBanner = props.pendingReview && (
        <div className="mb-6">
            <div className="card card-border border-warning/30 bg-warning/10">
                <div className="card-body flex-row items-center gap-3 py-3">
                    <Clock className="size-4 shrink-0 text-warning" />
                    <p className="text-sm text-base-content/80">
                        You have profile changes awaiting admin review. They will
                        appear publicly once approved.
                    </p>
                    <Link
                        href="/tutor/profile"
                        className="btn btn-ghost btn-xs ml-auto rounded-full text-primary"
                    >
                        View
                    </Link>
                </div>
            </div>
        </div>
    );

    return (
        <TutorLayout title="Dashboard">
            <Head title="Tutor Dashboard" />

            <FlashToast />

            {pendingReviewBanner}

            <ProfileHeader profile={props.profile} auth={props.auth} />

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mt-6">
                <StatCard icon={CalendarCheck} label="Total slots" value={props.stats.slots} href="/tutor/availability" />
                <StatCard icon={Clock} label="Upcoming & open" value={props.stats.open} accent="text-success" href="/tutor/availability" />
                <StatCard icon={Inbox} label="Enquiries" value={props.stats.enquiries} accent="text-info" href="/tutor/enquiries" />
                <StatCard icon={MessageSquare} label="Pending requests" value={props.stats.pending} accent="text-warning" href="/tutor/enquiries" />
            </div>

            <div className="grid gap-6 lg:grid-cols-5 mt-6">
                <div className="space-y-6 lg:col-span-2">
                    <div className="card card-border border-base-content/10 bg-base-content/[0.04]">
                        <div className="card-body">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <h2 className="font-display text-lg font-semibold text-base-content">
                                        Subjects
                                    </h2>
                                    <p className="text-xs text-base-content/50">
                                        What you teach on Larnr.
                                    </p>
                                </div>
                                <Link
                                    href="/tutor/subjects"
                                    className="btn btn-ghost btn-xs rounded-full text-primary"
                                >
                                    Manage <ArrowUpRight className="size-3.5" />
                                </Link>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {props.subjects.length === 0 && (
                                    <span className="text-sm text-base-content/50">
                                        No subjects linked yet.
                                    </span>
                                )}
                                {props.subjects.map((s) => {
                                    const subj = displayAmount(s.rate_cents, props.profile.currency, props.auth);
                                    return (
                                        <span
                                            key={s.id}
                                            className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary"
                                        >
                                            {s.name}
                                            {s.rate_cents > 0 && (
                                                <span className="ml-1 text-primary/60">
                                                    · {subj.text}/hr
                                                </span>
                                            )}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="card card-border border-base-content/10 bg-base-content/[0.04]">
                        <div className="card-body gap-3">
                            <h2 className="font-display text-lg font-semibold text-base-content">
                                Quick actions
                            </h2>
                            <Link
                                href="/tutor/availability"
                                className="btn btn-primary btn-sm w-full rounded-full"
                            >
                                Manage availability
                            </Link>
                            <Link
                                href="/tutor/subjects"
                                className="btn btn-outline btn-sm w-full rounded-full border-base-content/15 text-base-content/80 hover:bg-base-content/5"
                            >
                                Manage subjects & charges
                            </Link>
                            <Link
                                href="/tutor/enquiries"
                                className="btn btn-outline btn-sm w-full rounded-full border-base-content/15 text-base-content/80 hover:bg-base-content/5"
                            >
                                Review enquiries
                            </Link>
                            <Link
                                href="/tutor/profile"
                                className="btn btn-outline btn-sm w-full rounded-full border-base-content/15 text-base-content/80 hover:bg-base-content/5"
                            >
                                Edit public profile
                            </Link>
                            <Link
                                href="/settings/profile"
                                className="btn btn-ghost btn-xs w-full rounded-full text-base-content/60 hover:bg-base-content/5"
                            >
                                Account settings
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <EnquiriesPreview enquiries={props.recentEnquiries} />
                </div>
            </div>
        </TutorLayout>
    );
}