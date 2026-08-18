import { Head } from '@inertiajs/react';
import { Calendar, Filter, DollarSign, Send, Clock, CheckCircle2, XCircle, Banknote, History } from 'lucide-react';

import AdminLayout from '@/components/larnr/admin-layout';
import Pagination from '@/components/larnr/pagination';
import { displayAmount } from '@/utils/currency';
import { formatDateTime } from '@/utils/tutor';
import { useAdminQuery } from '@/hooks/use-admin-query';
import type { AdminPayoutHistoryProps, AuthProps } from '@/types';

const STATUS_TABS = [
    { key: 'all', label: 'All' },
    { key: 'paid', label: 'Paid' },
    { key: 'failed', label: 'Failed' },
    { key: 'cancelled', label: 'Cancelled' },
] as const;

const PERIOD_TABS = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'quarter', label: 'This Quarter' },
    { key: 'year', label: 'This Year' },
    { key: 'all', label: 'All Time' },
] as const;

function shortId(id: string): string {
    return id.slice(0, 8);
}

const STATUS_BADGE = {
    paid: 'badge-success',
    failed: 'badge-error',
    cancelled: 'badge-neutral',
    pending: 'badge-warning',
    scheduled: 'badge-info',
} as const;

export default function AdminPayoutHistory(props: AdminPayoutHistoryProps) {
    const auth = props.auth;
    const { params, setFilter } = useAdminQuery('/admin/payouts/history', {
        status: props.status,
        period: props.period,
    });

    return (
        <AdminLayout
            auth={auth}
            section="payments"
            title="Payout History"
            heading="Payout History"
            description="View historical payout records and their statuses."
        >
            <div className="flex flex-wrap items-center gap-2 mb-6">
                <div className="flex flex-wrap gap-2">
                    {STATUS_TABS.map((tab) => {
                        const active = props.status === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setFilter({ status: tab.key })}
                                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                                    active
                                        ? 'bg-primary/15 text-primary'
                                        : 'bg-base-content/5 text-base-content/60 hover:bg-base-content/10 hover:text-base-content'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
                <div className="flex flex-wrap gap-2 ml-auto">
                    {PERIOD_TABS.map((tab) => {
                        const active = props.period === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setFilter({ period: tab.key })}
                                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                                    active
                                        ? 'bg-primary/15 text-primary'
                                        : 'bg-base-content/5 text-base-content/60 hover:bg-base-content/10 hover:text-base-content'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-base-content/10">
                <table className="table">
                    <thead>
                        <tr className="text-xs text-base-content/50">
                            <th className="font-medium">Payout ID</th>
                            <th className="font-medium">Booking</th>
                            <th className="font-medium">Student</th>
                            <th className="font-medium">Tutor</th>
                            <th className="font-medium">Subject</th>
                            <th className="font-medium">Gross</th>
                            <th className="font-medium">Platform Fee</th>
                            <th className="font-medium">Processing Fee</th>
                            <th className="font-medium">Net</th>
                            <th className="font-medium">Status</th>
                            <th className="font-medium">Scheduled</th>
                            <th className="font-medium">Paid</th>
                            <th className="font-medium">Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.payouts.length === 0 && (
                            <tr>
                                <td colSpan={13} className="bg-base-100">
                                    <div className="py-10 text-center">
                                        <History className="mx-auto size-8 text-base-content/40" />
                                        <p className="mt-3 text-sm text-base-content/50">
                                            No payout records match the selected filters.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {props.payouts.map((payout) => {
                            const gross = displayAmount(payout.gross_amount, payout.currency, auth);
                            const platformFee = displayAmount(payout.platform_fee, payout.currency, auth);
                            const processingFee = displayAmount(payout.processing_fee, payout.currency, auth);
                            const net = displayAmount(payout.net_amount, payout.currency, auth);

                            return (
                                <tr key={payout.id} className="hover:bg-base-content/[0.03]">
                                    <td>
                                        <p className="text-sm font-medium text-base-content/80">
                                            #{shortId(payout.id)}
                                        </p>
                                    </td>
                                    <td>
                                        <p className="text-sm font-medium text-base-content/80">
                                            #{shortId(payout.booking_id)}
                                        </p>
                                    </td>
                                    <td className="text-sm text-base-content/70">{payout.student}</td>
                                    <td className="text-sm text-base-content/70">{payout.tutor}</td>
                                    <td className="text-sm text-base-content/60">{payout.subject ?? '—'}</td>
                                    <td className="text-right text-sm font-medium text-base-content">{gross.text}</td>
                                    <td className="text-right text-sm text-base-content/60">{platformFee.text}</td>
                                    <td className="text-right text-sm text-base-content/60">{processingFee.text}</td>
                                    <td className="text-right text-sm font-bold text-success">{net.text}</td>
                                    <td>
                                        <span className={`badge badge-sm ${STATUS_BADGE[payout.status as keyof typeof STATUS_BADGE] ?? 'badge-neutral'}`}>
                                            {payout.status}
                                        </span>
                                    </td>
                                    <td className="text-sm text-base-content/60">{payout.scheduled_at ? formatDateTime(payout.scheduled_at) : '—'}</td>
                                    <td className="text-sm text-base-content/60">{payout.paid_at ? formatDateTime(payout.paid_at) : '—'}</td>
                                    <td className="text-xs text-base-content/50">{formatDateTime(payout.created_at)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Pagination
                meta={props.pagination}
                route="/admin/payouts/history"
                params={params}
                onPerPageChange={(v) => setFilter({ per_page: v })}
            />
        </AdminLayout>
    );
}