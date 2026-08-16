import { router } from '@inertiajs/react';
import { Users as UsersIcon, Search } from 'lucide-react';

import AdminLayout from '@/components/larnr/admin-layout';
import Pagination from '@/components/larnr/pagination';
import { getInitials, useAuth } from '@/utils/index';
import { formatDateTime } from '@/utils/tutor';
import { useAdminQuery } from '@/hooks/use-admin-query';
import type { AdminUsersProps } from '@/types';

const ROLE_BADGE = {
    TUTOR: 'badge-primary',
    STUDENT: 'badge-info',
    ADMIN: 'badge-warning',
} as const;

const ROLE_TABS = [
    { key: 'all', label: 'All' },
    { key: 'STUDENT', label: 'Students' },
    { key: 'TUTOR', label: 'Tutors' },
    { key: 'ADMIN', label: 'Admins' },
] as const;

export default function AdminUsers(props: AdminUsersProps) {
    const auth = useAuth();
    const { params, setFilter } = useAdminQuery('/admin/users', {
        role: props.role,
        search: props.search,
    });

    const toggleActive = (user: AdminUsersProps['users'][number]) => {
        const verb = user.is_active ? 'deactivate' : 'activate';
        if (window.confirm(`Are you sure you want to ${verb} ${user.email}?`)) {
            router.post(
                '/admin/users/toggle',
                { user: user.id },
                { preserveScroll: true },
            );
        }
    };

    return (
        <AdminLayout
            auth={auth}
            section="users"
            title="Users"
            heading="Users"
            description="Manage every account on the platform — activate or deactivate access."
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    {ROLE_TABS.map((tab) => {
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
                                {tab.label} ({props.counts[tab.key] ?? props.counts.all})
                            </button>
                        );
                    })}
                </div>

                <label className="input input-bordered flex w-full items-center gap-2 rounded-full sm:w-72">
                    <Search className="size-4 text-base-content/40" />
                    <input
                        type="search"
                        defaultValue={props.search}
                        placeholder="Search name or email…"
                        className="grow"
                        onInput={(e) => setFilter({ search: e.currentTarget.value })}
                    />
                </label>
            </div>

            <div className="mt-5 overflow-x-auto rounded-2xl border border-base-content/10">
                <table className="table">
                    <thead>
                        <tr className="text-xs text-base-content/50">
                            <th className="font-medium">User</th>
                            <th className="font-medium">Role</th>
                            <th className="font-medium">Status</th>
                            <th className="font-medium">Joined</th>
                            <th className="text-right font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.users.length === 0 && (
                            <tr>
                                <td colSpan={5} className="bg-base-100">
                                    <div className="py-10 text-center">
                                        <UsersIcon className="mx-auto size-8 text-base-content/40" />
                                        <p className="mt-3 text-sm text-base-content/50">
                                            No users match your search.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {props.users.map((user) => (
                            <tr key={user.id} className="hover:bg-base-content/[0.03]">
                                <td>
                                    <div className="flex items-center gap-3">
                                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-xs font-bold text-white">
                                            {getInitials(user.name ?? user.email)}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-base-content">
                                                {user.name ?? '—'}
                                            </p>
                                            <p className="truncate text-xs text-base-content/50">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span
                                        className={`badge badge-sm ${
                                            ROLE_BADGE[user.role] ?? 'badge-neutral'
                                        }`}
                                    >
                                        {user.role.toLowerCase()}
                                    </span>
                                </td>
                                <td>
                                    <span
                                        className={`badge badge-sm ${
                                            user.is_active ? 'badge-success' : 'badge-neutral'
                                        }`}
                                    >
                                        {user.is_active ? 'Active' : 'Deactivated'}
                                    </span>
                                </td>
                                <td className="text-sm text-base-content/60">
                                    {formatDateTime(user.created_at)}
                                </td>
                                <td className="text-right">
                                    <button
                                        onClick={() => toggleActive(user)}
                                        className={`btn btn-xs rounded-full ${
                                            user.is_active
                                                ? 'btn-outline border-error/40 text-error hover:bg-error/10'
                                                : 'btn-primary'
                                        }`}
                                    >
                                        {user.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination
                meta={props.pagination}
                route="/admin/users"
                params={params}
                onPerPageChange={(v) => setFilter({ per_page: v })}
            />
        </AdminLayout>
    );
}
