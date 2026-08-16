import { Activity, Search } from 'lucide-react';

import AdminLayout from '@/components/larnr/admin-layout';
import Pagination from '@/components/larnr/pagination';
import { getInitials, useAuth } from '@/utils/index';
import { formatDateTime } from '@/utils/tutor';
import { useAdminQuery } from '@/hooks/use-admin-query';
import type { AdminActivitiesProps, ActivityItem } from '@/types';

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
    const auth = useAuth();
    const { params, setFilter } = useAdminQuery('/admin/activities', {
        role: props.role,
        search: props.search,
    });

    return (
        <AdminLayout
            auth={auth}
            section="activities"
            title="Activity log"
            heading="Activity log"
            description="Monitor what tutors and students are doing on the platform."
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    {TABS.map((tab) => {
                        const active = props.role === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setFilter({ role: tab.key })}
                                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                                    active
                                        ? 'bg-primary/15 text-primary'
                                        : 'bg-base-content/5 text-base-content/60 hover:bg-base-content/10 hover:text-base-content'
                                }`}
                            >
                                {tab.label} ({props.counts[tab.key]})
                            </button>
                        );
                    })}
                </div>

                <label className="input input-bordered flex w-full items-center gap-2 rounded-full sm:w-72">
                    <Search className="size-4 text-base-content/40" />
                    <input
                        type="search"
                        defaultValue={props.search}
                        placeholder="Search name, email or action…"
                        className="grow"
                        onInput={(e) => setFilter({ search: e.currentTarget.value })}
                    />
                </label>
            </div>

            <div className="mt-5 space-y-2">
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

            <Pagination
                meta={props.pagination}
                route="/admin/activities"
                params={params}
                onPerPageChange={(v) => setFilter({ per_page: v })}
            />
        </AdminLayout>
    );
}