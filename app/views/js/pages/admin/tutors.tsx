import { router } from '@inertiajs/react';
import { GraduationCap, Search, Star } from 'lucide-react';

import AdminLayout from '@/components/larnr/admin-layout';
import Pagination from '@/components/larnr/pagination';
import { getInitials, useAuth } from '@/utils/index';
import { displayAmount } from '@/utils/currency';
import { useAdminQuery } from '@/hooks/use-admin-query';
import type { AdminTutorsProps } from '@/types';

const VERIFIED_TABS = [
    { key: 'all', label: 'All' },
    { key: 'true', label: 'Verified' },
    { key: 'false', label: 'Unverified' },
] as const;

export default function AdminTutors(props: AdminTutorsProps) {
    const auth = useAuth();
    const { params, setFilter } = useAdminQuery('/admin/tutors', {
        verified: props.verified,
        search: props.search,
    });

    const toggleVerify = (tutor: AdminTutorsProps['tutors'][number]) => {
        const verb = tutor.verified ? 'unverify' : 'verify';
        if (window.confirm(`Are you sure you want to ${verb} ${tutor.name}?`)) {
            router.post('/admin/tutors/verify', { tutor: tutor.id }, { preserveScroll: true });
        }
    };

    return (
        <AdminLayout
            auth={auth}
            section="tutors"
            title="Tutors"
            heading="Tutors"
            description="Review the tutor marketplace — verify profiles and check their activity."
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    {VERIFIED_TABS.map((tab) => {
                        const active = props.verified === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setFilter({ verified: tab.key })}
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
                        placeholder="Search name, city or email…"
                        className="grow"
                        onInput={(e) => setFilter({ search: e.currentTarget.value })}
                    />
                </label>
            </div>

            <div className="mt-5 overflow-x-auto rounded-2xl border border-base-content/10">
                <table className="table">
                    <thead>
                        <tr className="text-xs text-base-content/50">
                            <th className="font-medium">Tutor</th>
                            <th className="font-medium">Subjects</th>
                            <th className="font-medium">Rate</th>
                            <th className="font-medium">Rating</th>
                            <th className="font-medium">Slots</th>
                            <th className="font-medium">Status</th>
                            <th className="text-right font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.tutors.length === 0 && (
                            <tr>
                                <td colSpan={7} className="bg-base-100">
                                    <div className="py-10 text-center">
                                        <GraduationCap className="mx-auto size-8 text-base-content/40" />
                                        <p className="mt-3 text-sm text-base-content/50">
                                            No tutors match your search.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {props.tutors.map((tutor) => {
                            const amount = displayAmount(tutor.rate, tutor.currency, auth, true);
                            return (
                                <tr key={tutor.id} className="hover:bg-base-content/[0.03]">
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-xs font-bold text-white">
                                                {getInitials(tutor.name)}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-base-content">
                                                    {tutor.name}
                                                </p>
                                                <p className="truncate text-xs text-base-content/50">
                                                    {tutor.email ?? tutor.city ?? '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex max-w-52 flex-wrap gap-1">
                                            {tutor.subjects.length === 0 && (
                                                <span className="text-xs text-base-content/40">
                                                    None
                                                </span>
                                            )}
                                            {tutor.subjects.slice(0, 3).map((subject) => (
                                                <span
                                                    key={subject}
                                                    className="badge badge-sm badge-ghost badge-outline"
                                                >
                                                    {subject}
                                                </span>
                                            ))}
                                            {tutor.subjects.length > 3 && (
                                                <span className="text-xs text-base-content/40">
                                                    +{tutor.subjects.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="text-sm text-base-content/80">
                                        {amount.text}
                                        {amount.note && (
                                            <span className="ml-1 text-xs text-base-content/40">
                                                ({amount.note})
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <span className="inline-flex items-center gap-1 text-sm text-base-content/80">
                                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                                            {tutor.rating.toFixed(1)}
                                        </span>
                                    </td>
                                    <td className="text-sm text-base-content/60">{tutor.slots}</td>
                                    <td>
                                        <div className="flex flex-wrap gap-1">
                                            <span
                                                className={`badge badge-sm ${
                                                    tutor.verified ? 'badge-success' : 'badge-warning'
                                                }`}
                                            >
                                                {tutor.verified ? 'Verified' : 'Unverified'}
                                            </span>
                                            {!tutor.active && (
                                                <span className="badge badge-sm badge-neutral">
                                                    Deactivated
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        <button
                                            onClick={() => toggleVerify(tutor)}
                                            className={`btn btn-xs rounded-full ${
                                                tutor.verified
                                                    ? 'btn-outline border-warning/50 text-warning hover:bg-warning/10'
                                                    : 'btn-primary'
                                            }`}
                                        >
                                            {tutor.verified ? 'Unverify' : 'Verify'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Pagination
                meta={props.pagination}
                route="/admin/tutors"
                params={params}
                onPerPageChange={(v) => setFilter({ per_page: v })}
            />
        </AdminLayout>
    );
}
