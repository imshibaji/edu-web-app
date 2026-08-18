import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Calendar, Filter, DollarSign, Send, Clock, AlertTriangle, CheckCircle2, XCircle, Banknote } from 'lucide-react';

import AdminLayout from '@/components/larnr/admin-layout';
import FlashToast from '@/components/larnr/flash-toast';
import { displayAmount } from '@/utils/currency';
import { formatDateTime } from '@/utils/tutor';
import { useAdminQuery } from '@/hooks/use-admin-query';
import type { AdminPayoutsProps, AuthProps } from '@/types';

const STATUS_TABS = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Not Ready' },
    { key: 'ready', label: 'Ready to Pay' },
] as const;

const PERIOD_TABS = [
    { key: 'all', label: 'All Time' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'quarter', label: 'This Quarter' },
] as const;

function shortId(id: string): string {
    return id.slice(0, 8);
}

export default function AdminPayouts(props: AdminPayoutsProps) {
    const auth = props.auth;
    const { params, setFilter } = useAdminQuery('/admin/payouts', {
        status: props.status,
        period: props.period,
        tutor_id: props.tutor_id,
    });

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const totalGross = displayAmount(props.summary.total_gross, 'USD', auth);
    const totalPlatformFees = displayAmount(props.summary.total_platform_fees, 'USD', auth);
    const totalProcessingFees = displayAmount(props.summary.total_processing_fees, 'USD', auth);
    const totalNet = displayAmount(props.summary.total_net, 'USD', auth);

    const stats = [
        { label: 'Total Gross', value: totalGross.text, icon: DollarSign, color: 'text-primary' },
        { label: 'Platform Fees', value: totalPlatformFees.text, icon: Banknote, color: 'text-info' },
        { label: 'Processing Fees', value: totalProcessingFees.text, icon: Clock, color: 'text-warning' },
        { label: 'Tutor Receives', value: totalNet.text, icon: Send, color: 'text-success' },
    ];

    const handleSelectAll = () => {
        if (selectedIds.length === props.payouts.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(props.payouts.map(p => p.booking_id));
        }
    };

    const handleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const readyCount = props.payouts.filter(p => p.payout_ready).length;
    const notReadyCount = props.payouts.filter(p => !p.payout_ready).length;

    return (
        <AdminLayout
            auth={auth}
            section="payments"
            title="Tutor Payouts"
            heading="Tutor Payouts"
            description="Manage pending tutor payouts. Funds are held by the platform and released on schedule."
        >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="card card-border border-base-content/10 bg-base-content/[0.04]">
                        <div className="card-body gap-1 p-5">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">
                                    {stat.label}
                                </p>
                                <stat.icon className={`size-4 ${stat.color}`} />
                            </div>
                            <p className="font-display text-xl font-bold text-base-content">
                                {stat.value}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="flex flex-wrap gap-2">
                    {STATUS_TABS.map((tab) => {
                        const active = props.status === tab.key;
                        const count = tab.key === 'all' ? props.payouts.length :
                            tab.key === 'ready' ? readyCount : notReadyCount;
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
                                <span className={`badge badge-sm ml-1.5 ${active ? 'badge-neutral' : 'badge-outline'}`}>
                                    {count}
                                </span>
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

            {selectedIds.length > 0 && (
                <div className="mb-4 p-4 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="size-5 text-primary" />
                        <span className="font-medium text-base-content">
                            {selectedIds.length} payout(s) selected
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (confirm(`Release ${selectedIds.length} payout(s) now?`)) {
                                    const form = new FormData();
                                    selectedIds.forEach(id => form.append('booking_ids[]', id));
                                    fetch('/admin/payouts/release', {
                                        method: 'POST',
                                        body: form,
                                        headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' }
                                    }).then(() => window.location.reload());
                                }
                            }}
                            className="btn btn-success btn-sm rounded-full"
                        >
                            <Send className="size-4 mr-1" />
                            Release Now
                        </button>
                        <button
                            onClick={() => {
                                const date = prompt('Schedule date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
                                if (date) {
                                    const form = new FormData();
                                    form.append('scheduled_at', date);
                                    selectedIds.forEach(id => form.append('booking_ids[]', id));
                                    fetch('/admin/payouts/schedule', {
                                        method: 'POST',
                                        body: form,
                                        headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' }
                                    }).then(() => window.location.reload());
                                }
                            }}
                            className="btn btn-outline btn-sm rounded-full"
                        >
                            <Calendar className="size-4 mr-1" />
                            Schedule
                        </button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto rounded-2xl border border-base-content/10">
                <table className="table">
                    <thead>
                        <tr className="text-xs text-base-content/50">
                            <th className="w-10">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === props.payouts.length && props.payouts.length > 0}
                                    onChange={handleSelectAll}
                                    className="checkbox checkbox-primary"
                                />
                            </th>
                            <th className="font-medium">Booking</th>
                            <th className="font-medium">Student</th>
                            <th className="font-medium">Tutor</th>
                            <th className="font-medium">Subject</th>
                            <th className="font-medium">Completed</th>
                            <th className="font-medium">Gross</th>
                            <th className="font-medium">Fees</th>
                            <th className="font-medium">Net</th>
                            <th className="font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.payouts.length === 0 && (
                            <tr>
                                <td colSpan={10} className="bg-base-100">
                                    <div className="py-10 text-center">
                                        <Banknote className="mx-auto size-8 text-base-content/40" />
                                        <p className="mt-3 text-sm text-base-content/50">
                                            No pending payouts match the selected filters.
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
                                <tr key={payout.booking_id} className="hover:bg-base-content/[0.03]">
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(payout.booking_id)}
                                            onChange={() => handleSelect(payout.booking_id)}
                                            className="checkbox checkbox-primary"
                                            disabled={!payout.payout_ready}
                                        />
                                    </td>
                                    <td>
                                        <p className="text-sm font-medium text-base-content/80">
                                            #{shortId(payout.booking_id)}
                                        </p>
                                    </td>
                                    <td className="text-sm text-base-content/70">{payout.student}</td>
                                    <td className="text-sm text-base-content/70">
                                        {payout.tutor}
                                        {!payout.payout_ready && (
                                            <AlertTriangle className="size-3 ml-1 text-warning inline" title="Tutor Stripe account not connected" />
                                        )}
                                    </td>
                                    <td className="text-sm text-base-content/60">{payout.subject ?? '—'}</td>
                                    <td className="text-sm text-base-content/60">{formatDateTime(payout.completed_at)}</td>
                                    <td className="text-right text-sm font-medium text-base-content">{gross.text}</td>
                                    <td className="text-right text-sm text-base-content/60">
                                        <div>PF: {platformFee.text}</div>
                                        <div>Proc: {processingFee.text}</div>
                                    </td>
                                    <td className="text-right text-sm font-bold text-success">{net.text}</td>
                                    <td>
                                        <span className={`badge badge-sm ${
                                            payout.payout_ready
                                                ? 'badge-success'
                                                : 'badge-warning'
                                        }`}>
                                            {payout.payout_ready ? 'Ready' : 'Waiting'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            </AdminLayout>
    );
}