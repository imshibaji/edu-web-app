import { Search, UserRound } from 'lucide-react';

import AdminLayout from '@/components/larnr/admin-layout';
import Pagination from '@/components/larnr/pagination';
import { getInitials, useAuth } from '@/utils/index';
import { formatDateTime } from '@/utils/tutor';
import { useAdminQuery } from '@/hooks/use-admin-query';
import type { AdminStudentsProps } from '@/types';

export default function AdminStudents(props: AdminStudentsProps) {
    const auth = useAuth();
    const { params, setFilter } = useAdminQuery('/admin/students', { search: props.search });

    return (
        <AdminLayout
            auth={auth}
            section="students"
            title="Students"
            heading="Students"
            description="Browse student accounts and their lesson activity on the platform."
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-primary/15 px-4 py-1.5 text-sm font-medium text-primary">
                        {props.counts.active} active
                    </span>
                    <span className="rounded-full bg-base-content/5 px-4 py-1.5 text-sm font-medium text-base-content/60">
                        {props.counts.total} total
                    </span>
                </div>

                <label className="input input-bordered flex w-full items-center gap-2 rounded-full sm:w-72">
                    <Search className="size-4 text-base-content/40" />
                    <input
                        type="search"
                        defaultValue={props.search}
                        placeholder="Search name, email or phone…"
                        className="grow"
                        onInput={(e) => setFilter({ search: e.currentTarget.value })}
                    />
                </label>
            </div>

            <div className="mt-5 overflow-x-auto rounded-2xl border border-base-content/10">
                <table className="table">
                    <thead>
                        <tr className="text-xs text-base-content/50">
                            <th className="font-medium">Student</th>
                            <th className="font-medium">Phone</th>
                            <th className="font-medium">Bookings</th>
                            <th className="font-medium">Status</th>
                            <th className="font-medium">Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.students.length === 0 && (
                            <tr>
                                <td colSpan={5} className="bg-base-100">
                                    <div className="py-10 text-center">
                                        <UserRound className="mx-auto size-8 text-base-content/40" />
                                        <p className="mt-3 text-sm text-base-content/50">
                                            No students match your search.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {props.students.map((student) => (
                            <tr key={student.id} className="hover:bg-base-content/[0.03]">
                                <td>
                                    <div className="flex items-center gap-3">
                                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-xs font-bold text-white">
                                            {getInitials(student.name ?? student.email)}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-base-content">
                                                {student.name ?? '—'}
                                            </p>
                                            <p className="truncate text-xs text-base-content/50">
                                                {student.email}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="text-sm text-base-content/60">
                                    {student.phone ?? '—'}
                                </td>
                                <td>
                                    <span className="badge badge-sm badge-ghost badge-outline">
                                        {student.bookings} lesson{student.bookings === 1 ? '' : 's'}
                                    </span>
                                </td>
                                <td>
                                    <span
                                        className={`badge badge-sm ${
                                            student.active ? 'badge-success' : 'badge-neutral'
                                        }`}
                                    >
                                        {student.active ? 'Active' : 'Deactivated'}
                                    </span>
                                </td>
                                <td className="text-sm text-base-content/60">
                                    {formatDateTime(student.created_at)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination
                meta={props.pagination}
                route="/admin/students"
                params={params}
                onPerPageChange={(v) => setFilter({ per_page: v })}
            />
        </AdminLayout>
    );
}
