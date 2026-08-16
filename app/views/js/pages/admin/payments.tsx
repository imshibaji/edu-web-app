import { BadgeDollarSign, CheckCircle2, Clock, Wallet } from 'lucide-react';

import AdminLayout from '@/components/larnr/admin-layout';
import Pagination from '@/components/larnr/pagination';
import { useAuth } from '@/utils/index';
import { formatDateTime } from '@/utils/tutor';
import { displayAmount } from '@/utils/currency';
import { useAdminQuery } from '@/hooks/use-admin-query';
import type { AdminPaymentsProps } from '@/types';

const TYPE_BADGE = {
    LESSON_PAYMENT: 'badge-primary',
    ESCROW_RELEASE: 'badge-info',
    REFUND: 'badge-warning',
    PLATFORM_FEE: 'badge-neutral',
} as const;

const TYPE_LABEL = {
    LESSON_PAYMENT: 'Lesson payment',
    ESCROW_RELEASE: 'Escrow release',
    REFUND: 'Refund',
    PLATFORM_FEE: 'Platform fee',
} as const;

const STATUS_BADGE = {
    PENDING: 'badge-warning',
    SUCCESS: 'badge-success',
    FAILED: 'badge-error',
} as const;

const STATUS_TABS = [
    { key: 'all', label: 'All' },
    { key: 'SUCCESS', label: 'Successful' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'FAILED', label: 'Failed' },
] as const;

const TYPE_TABS = [
    { key: 'all', label: 'All types' },
    { key: 'LESSON_PAYMENT', label: 'Lessons' },
    { key: 'ESCROW_RELEASE', label: 'Escrow' },
    { key: 'REFUND', label: 'Refunds' },
    { key: 'PLATFORM_FEE', label: 'Fees' },
] as const;

function shortId(id: string): string {
    return id.slice(0, 8);
}

export default function AdminPayments(props: AdminPaymentsProps) {
    const auth = useAuth();
    const { params, setFilter } = useAdminQuery('/admin/payments', {
        status: props.status,
        type: props.type,
    });

    const total = displayAmount(props.summary.total_amount, props.summary.base_currency, auth);
    const fees = displayAmount(props.summary.platform_fees, props.summary.base_currency, auth);

    const stats = [
        {
            label: 'Total processed',
            value: total.text,
            note: total.note ? `≈ ${total.native}` : null,
            icon: Wallet,
        },
        {
            label: 'Platform fees',
            value: fees.text,
            note: fees.note ? `≈ ${fees.native}` : null,
            icon: BadgeDollarSign,
        },
        {
            label: 'Successful',
            value: String(props.summary.success_count),
            icon: CheckCircle2,
        },
        {
            label: 'Pending',
            value: String(props.summary.pending_count),
            icon: Clock,
        },
    ];

    return (
        <AdminLayout
            auth={auth}
            section="payments"
            title="Payments"
            heading="Payments"
            description="Track lesson payments, escrow releases, refunds and platform fees."
        >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="card card-border border-base-content/10 bg-base-content/[0.04]"
                    >
                        <div className="card-body gap-1 p-5">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">
                                    {stat.label}
                                </p>
                                <stat.icon className="size-4 text-base-content/40" />
                            </div>
                            <p className="font-display text-xl font-bold text-base-content">
                                {stat.value}
                            </p>
                            {stat.note && (
                                <p className="text-xs text-base-content/40">{stat.note}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
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
                <div className="flex flex-wrap gap-2">
                    {TYPE_TABS.map((tab) => {
                        const active = props.type === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setFilter((p) => ({ ...p, type: tab.key }))}
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

            <div className="mt-5 overflow-x-auto rounded-2xl border border-base-content/10">
                <table className="table">
                    <thead>
                        <tr className="text-xs text-base-content/50">
                            <th className="font-medium">Transaction</th>
                            <th className="font-medium">Type</th>
                            <th className="font-medium">Status</th>
                            <th className="font-medium">Student</th>
                            <th className="font-medium">Tutor</th>
                            <th className="font-medium">Subject</th>
                            <th className="text-right font-medium">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.transactions.length === 0 && (
                            <tr>
                                <td colSpan={7} className="bg-base-100">
                                    <div className="py-10 text-center">
                                        <Wallet className="mx-auto size-8 text-base-content/40" />
                                        <p className="mt-3 text-sm text-base-content/50">
                                            No transactions match the selected filters.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {props.transactions.map((tx) => {
                            const amount = displayAmount(tx.amount, tx.currency, auth);
                            return (
                                <tr key={tx.id} className="hover:bg-base-content/[0.03]">
                                    <td>
                                        <p className="text-sm font-medium text-base-content/80">
                                            #{shortId(tx.id)}
                                        </p>
                                        <p className="text-xs text-base-content/40">
                                            {formatDateTime(tx.created_at)}
                                        </p>
                                    </td>
                                    <td>
                                        <span
                                            className={`badge badge-sm ${
                                                TYPE_BADGE[tx.type as keyof typeof TYPE_BADGE] ?? 'badge-neutral'
                                            }`}
                                        >
                                            {TYPE_LABEL[tx.type as keyof typeof TYPE_LABEL] ?? tx.type}
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            className={`badge badge-sm ${
                                                STATUS_BADGE[tx.status as keyof typeof STATUS_BADGE] ?? 'badge-neutral'
                                            }`}
                                        >
                                            {tx.status.toLowerCase()}
                                        </span>
                                    </td>
                                    <td className="text-sm text-base-content/70">{tx.student}</td>
                                    <td className="text-sm text-base-content/70">{tx.tutor}</td>
                                    <td className="text-sm text-base-content/60">
                                        {tx.subject ?? '—'}
                                    </td>
                                    <td className="text-right">
                                        <p className="text-sm font-medium text-base-content">
                                            {amount.text}
                                        </p>
                                        {tx.platform_fee > 0 && (
                                            <p className="text-xs text-base-content/40">
                                                fee {displayAmount(tx.platform_fee, tx.currency, auth).text}
                                            </p>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Pagination
                meta={props.pagination}
                route="/admin/payments"
                params={params}
                onPerPageChange={(v) => setFilter({ per_page: v })}
            />
        </AdminLayout>
    );
}
