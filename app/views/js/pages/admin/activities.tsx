import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    CheckCircle2,
    XCircle,
    CalendarPlus,
    CalendarMinus,
    BookPlus,
    BookMinus,
    CalendarCheck,
    Settings,
} from 'lucide-react';

import Navbar from '@/components/larnr/navbar';
import Footer from '@/components/larnr/footer';
import FlashToast from '@/components/larnr/flash-toast';
import { getInitials } from '@/utils/index';
import { formatDateTime } from '@/utils/tutor';
import type { AdminActivitiesProps, ActivityItem, AuthProps } from '@/types';

const TYPE_BADGE = {
    LOGIN: 'badge-info',
    LOGOUT: 'badge-neutral',
    REGISTERED: 'badge-info',
    PROFILE_SUBMITTED: 'badge-warning',
    PROFILE_APPROVED: 'badge-success',
    PROFILE_REJECTED: 'badge-error',
    SLOT_ADDED: 'badge-success',
    SLOT_DELETED: 'badge-neutral',
    SUBJECT_ADDED: 'badge-success',
    SUBJECT_UPDATED: 'badge-warning',
    SUBJECT_REMOVED: 'badge-neutral',
    TRIAL_BOOKED: 'badge-info',
    ACCOUNT_UPDATED: 'badge-neutral',
} as const;

const TYPE_LABEL = {
    LOGIN: 'Sign in',
    LOGOUT: 'Sign out',
    REGISTERED: 'Registered',
    PROFILE_SUBMITTED: 'Profile review',
    PROFILE_APPROVED: 'Approved',
    PROFILE_REJECTED: 'Rejected',
    SLOT_ADDED: 'Slot added',
    SLOT_DELETED: 'Slot removed',
    SUBJECT_ADDED: 'Subject added',
    SUBJECT_UPDATED: 'Subject updated',
    SUBJECT_REMOVED: 'Subject removed',
    TRIAL_BOOKED: 'Trial booked',
    ACCOUNT_UPDATED: 'Account settings',
} as const;

const ROLE_BADGE = {
    TUTOR: 'badge-primary',
    STUDENT: 'badge-info',
    ADMIN: 'badge-warning',
} as const;

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'tutor', label: 'Tutors' },
    { key: 'student', label: 'Students' },
    { key: 'admin', label: 'Admins' },
] as const;

function ActivityRow({ activity }: { activity: ActivityItem }) {
    return (
        <div className="card card-border border-base-content/10 bg-base-content/[0.04]">
            <div className="card-body flex-row items-center gap-3 py-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-xs font-bold text-white">
                    {getInitials(activity.actor.name)}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-base-content">
                            {activity.actor.name}
                        </p>
                        <span
                            className={`badge badge-sm ${
                                ROLE_BADGE[activity.actor.role as keyof typeof ROLE_BADGE] ?? 'badge-neutral'
                            }`}
                        >
                            {activity.actor.role.toLowerCase()}
                        </span>
                        <span
                            className={`badge badge-sm ${
                                TYPE_BADGE[activity.type as keyof typeof TYPE_BADGE] ?? 'badge-neutral'
                            }`}
                        >
                            {TYPE_LABEL[activity.type as keyof typeof TYPE_LABEL] ?? activity.type}
                        </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-base-content/60">
                        {activity.description}
                    </p>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                    <p className="text-xs text-base-content/70">{formatDateTime(activity.created_at)}</p>
                    {activity.ip_address && (
                        <p className="text-xs text-base-content/40">{activity.ip_address}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdminActivities(props: AdminActivitiesProps) {
    const { auth } = usePage().props as { auth: AuthProps };

    return (
        <div className="min-h-screen bg-base-100 text-base-content">
            <Head title="Activity log" />

            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
            </div>

            <div className="relative z-10">
                <Navbar auth={auth} />
                <FlashToast />

                <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        Admin
                    </span>
                    <h1 className="font-display mt-2 text-2xl font-bold text-base-content">
                        Activity log
                    </h1>
                    <p className="text-sm text-base-content/60">
                        Monitor what tutors and students are doing on the platform.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                        {TABS.map((tab) => {
                            const href =
                                tab.key === 'all' ? '/admin/activities' : `/admin/activities?role=${tab.key}`;
                            const active = props.role === tab.key;
                            return (
                                <Link
                                    key={tab.key}
                                    href={href}
                                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                                        active
                                            ? 'bg-primary/15 text-primary'
                                            : 'bg-base-content/5 text-base-content/60 hover:bg-base-content/10 hover:text-base-content'
                                    }`}
                                >
                                    {tab.label} ({props.counts[tab.key]})
                                </Link>
                            );
                        })}
                    </div>

                    <div className="mt-6 space-y-2">
                        {props.activities.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-base-content/10 p-12 text-center">
                                <Activity className="mx-auto size-8 text-base-content/40" />
                                <p className="mt-3 text-sm text-base-content/50">
                                    No activity recorded yet in this category.
                                </p>
                            </div>
                        )}
                        {props.activities.map((a) => (
                            <ActivityRow key={a.id} activity={a} />
                        ))}
                    </div>

                    {props.activities.length === 100 && (
                        <p className="mt-4 text-center text-xs text-base-content/40">
                            Showing the latest 100 events.
                        </p>
                    )}
                </div>

                <Footer />
            </div>
        </div>
    );
}