import { Head, Link } from '@inertiajs/react';
import {
    CalendarCheck,
    ArrowRight,
    Users,
    UserRound,
    TrendingUp,
    Activity,
} from 'lucide-react';

import AdminLayout from '@/components/larnr/admin-layout';
import { getInitials } from '@/utils/index';
import { formatDateTime } from '@/utils/tutor';
import type { AuthProps, Stats, ActivityItem } from '@/types';

function StatCard({ icon: Icon, label, value, accent }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number | string;
    accent?: string;
}) {
    return (
        <div className="card card-border border-base-content/10 bg-base-content/4">
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
}

interface Props {
    auth: AuthProps;
    stats: Stats;
    activities: ActivityItem[];
}

export default function AdminDashboard({ auth, stats, activities }: Props) {
    const items = [
        { icon: Users, label: 'Tutors', value: stats.tutors, accent: 'text-primary' },
        { icon: UserRound, label: 'Students', value: stats.students, accent: 'text-success' },
        { icon: CalendarCheck, label: 'Total bookings', value: stats.bookings, accent: 'text-info' },
        { icon: TrendingUp, label: 'Pending payments', value: stats.pending, accent: 'text-warning' },
        { icon: Activity, label: 'Activities today', value: stats.activityToday, accent: 'text-secondary' },
    ];

    return (
        <AdminLayout
            auth={auth}
            section="dashboard"
            title="Admin Dashboard – Larnr"
            heading="Dashboard"
            description="Platform overview and live activity."
        >
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                {items.map((s) => (
                    <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} accent={s.accent} />
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
                <div className="card card-border border-base-content/10 bg-base-content/4 lg:col-span-3">
                    <div className="card-body gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-display text-lg font-semibold text-base-content">
                                    Recent activity
                                </h2>
                                <p className="text-xs text-base-content/50">
                                    The last 5 actions by tutors and students.
                                </p>
                            </div>
                            <Link
                                href="/admin/activities"
                                className="btn btn-ghost btn-xs rounded-full text-primary"
                            >
                                View all <ArrowRight className="size-3.5" />
                            </Link>
                        </div>

                        <div className="space-y-2">
                            {activities?.length === 0 && (
                                <p className="rounded-xl border border-dashed border-base-content/10 p-6 text-center text-sm text-base-content/50">
                                    No activity recorded yet.
                                </p>
                            )}
                            {activities?.map((a) => (
                                <div
                                    key={a.id}
                                    className="flex items-center gap-3 rounded-xl bg-base-content/5 px-3 py-2.5"
                                >
                                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-[10px] font-bold text-white">
                                        {getInitials(a.actor.name)}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm text-base-content/80">
                                            {a.description}
                                        </p>
                                        <p className="text-xs text-base-content/50">
                                            {a.actor.name} · {formatDateTime(a.created_at)}
                                        </p>
                                    </div>
                                    <span className="badge badge-sm badge-neutral shrink-0">
                                        {a.actor.role.toLowerCase()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card card-border border-base-content/10 bg-base-content/4 lg:col-span-2">
                    <div className="card-body items-center justify-center gap-3 py-14 text-center">
                        <Users className="size-10 text-base-content/40" />
                        <h3 className="font-display text-lg font-semibold text-base-content">
                            Manage the platform
                        </h3>
                        <p className="max-w-md text-sm text-base-content/60">
                            Tutor approvals, booking management, and platform analytics will live
                            here as Larnr grows.
                        </p>
                        <Link
                            href="/admin/reviews"
                            className="btn btn-primary btn-sm mt-3 rounded-full"
                        >
                            Review tutor profiles
                        </Link>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
