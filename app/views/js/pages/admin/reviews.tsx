import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Check, X, Inbox, UserRound } from 'lucide-react';

import AdminLayout from '@/components/larnr/admin-layout';
import Avatar from '@/components/larnr/avatar';
import { useAuth } from '@/utils/index';
import { FORMAT_LABELS, LEVEL_LABELS, formatDateTime } from '@/utils/tutor';
import { displayAmount } from '@/utils/currency';
import type { AdminReviewsProps, Review, AuthProps } from '@/types';

const FIELD_LABELS = {
    full_name: 'Full name',
    headline: 'Headline',
    bio: 'Bio',
    city: 'City',
    format: 'Format',
    experience_level: 'Experience level',
    hourly_rate: 'Hourly rate',
    currency: 'Currency',
} as const;

const STATUS_BADGE = {
    PENDING: 'badge-warning',
    APPROVED: 'badge-success',
    REJECTED: 'badge-neutral',
} as const;

function displayValue(field: string, value: string | number | null | undefined, currency: string | undefined, auth: AuthProps) {
    if (value === null || value === undefined || value === '') return '—';
    if (field === 'format') return FORMAT_LABELS[value as keyof typeof FORMAT_LABELS] ?? value;
    if (field === 'experience_level') return LEVEL_LABELS[value as keyof typeof LEVEL_LABELS] ?? value;
    if (field === 'hourly_rate') {
        const amount = displayAmount(Number(value), currency ?? 'USD', auth);
        return (
            <>
                {amount.text}
                {amount.note && <span className="ml-1 text-base-content/40">({amount.note})</span>}
            </>
        );
    }
    return value;
}

function avatarChanged(review: Review): boolean {
    const live = review.live?.avatar_url as string | undefined;
    const proposed = review.proposed.avatar_url as string | undefined;
    return Boolean(proposed && proposed !== live);
}

function ReviewCard({ review, auth }: { review: Review; auth: AuthProps }) {
    const isPending = review.status === 'PENDING';

    const approve = () => {
        router.post('/admin/reviews/approve', { review: review.id }, { preserveScroll: true });
    };

    const reject = () => {
        if (window.confirm('Reject this review? The public profile stays unchanged.')) {
            router.post('/admin/reviews/reject', { review: review.id }, { preserveScroll: true });
        }
    };

    const changes = Object.keys(FIELD_LABELS).filter(
        (field) =>
            (review.proposed[field] ?? '') !== (review.live?.[field] ?? ''),
    );

    return (
        <div className="card card-border border-base-content/10 bg-base-content/[0.04]">
            <div className="card-body gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-xl bg-base-content/5 text-base-content/70">
                            <UserRound className="size-5" />
                        </span>
                        <div>
                            <p className="font-display text-base font-semibold text-base-content">
                                {review.tutorName}
                            </p>
                            <p className="text-xs text-base-content/50">
                                Submitted {formatDateTime(review.created_at)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`badge badge-sm ${STATUS_BADGE[review.status] ?? 'badge-neutral'}`}>
                            {review.status.toLowerCase()}
                        </span>
                    </div>
                </div>

                {changes.length === 0 && !avatarChanged(review) ? (
                    <p className="text-sm text-base-content/50">
                        No differences between the current public profile and the proposed update.
                    </p>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-base-content/10">
                        <table className="table w-full text-sm">
                            <thead>
                                <tr className="text-xs text-base-content/50">
                                    <th className="w-1/3 bg-base-content/[0.04] font-medium">Field</th>
                                    <th className="bg-base-content/[0.04] font-medium">
                                        Current (public)
                                    </th>
                                    <th className="bg-base-content/[0.04] font-medium">Proposed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {changes.map((field) => (
                                    <tr key={field}>
                                        <td className="font-medium text-base-content/80">
                                            {FIELD_LABELS[field as keyof typeof FIELD_LABELS]}
                                        </td>
                                        <td className="text-base-content/60">
                                            {displayValue(
                                                field,
                                                review.live?.[field] as string | number | null,
                                                review.live?.currency as string,
                                                auth,
                                            )}
                                        </td>
                                        <td className="text-primary">
                                            {displayValue(
                                                field,
                                                review.proposed[field] as string | number | null,
                                                review.proposed.currency as string,
                                                auth,
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {avatarChanged(review) && (
                                    <tr>
                                        <td className="font-medium text-base-content/80">Photo</td>
                                        <td className="text-base-content/60">
                                            <Avatar
                                                src={review.live?.avatar_url as string}
                                                name={review.live?.full_name as string}
                                                className="size-10"
                                                textClass="text-sm"
                                            />
                                        </td>
                                        <td className="text-primary">
                                            <Avatar
                                                src={review.proposed.avatar_url as string}
                                                name={review.tutorName}
                                                className="size-10"
                                                textClass="text-sm"
                                            />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {review.status !== 'PENDING' && (
                    <p className="text-xs text-base-content/50">
                        {review.reviewer ? `Reviewed by ${review.reviewer}` : 'Reviewed'} ·{' '}
                        {formatDateTime(review.reviewed_at)}
                    </p>
                )}

                {isPending && (
                    <div className="card-actions justify-end gap-2">
                        <button
                            onClick={reject}
                            className="btn btn-outline btn-sm rounded-full border-error/40 text-error hover:bg-error/10"
                        >
                            <X className="size-4" /> Reject
                        </button>
                        <button
                            onClick={approve}
                            className="btn btn-primary btn-sm rounded-full"
                        >
                            <Check className="size-4" /> Accept & publish
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminReviews(props: AdminReviewsProps) {
    const auth = useAuth();
    const [filter, setFilter] = useState('PENDING');

    const counts = {
        PENDING: props.reviews.filter((r) => r.status === 'PENDING').length,
        APPROVED: props.reviews.filter((r) => r.status === 'APPROVED').length,
        REJECTED: props.reviews.filter((r) => r.status === 'REJECTED').length,
        ALL: props.reviews.length,
    };

    const visible = filter === 'ALL' ? props.reviews : props.reviews.filter((r) => r.status === filter);
    const tabs = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'];

    return (
        <AdminLayout
            auth={auth}
            section="reviews"
            title="Profile reviews"
            heading="Tutor profile reviews"
            description="Review and approve tutor profile changes before they go public."
        >
            <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                            filter === tab
                                ? 'bg-primary/15 text-primary'
                                : 'bg-base-content/5 text-base-content/60 hover:bg-base-content/10 hover:text-base-content'
                        }`}
                    >
                        {tab === 'ALL'
                            ? `All (${counts.ALL})`
                            : `${tab.charAt(0) + tab.slice(1).toLowerCase()} (${counts[tab as keyof typeof counts]})`}
                    </button>
                ))}
            </div>

            <div className="mt-5 space-y-4">
                {visible.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-base-content/10 p-12 text-center">
                        <Inbox className="mx-auto size-8 text-base-content/40" />
                        <p className="mt-3 text-sm text-base-content/50">
                            {filter === 'PENDING'
                                ? 'No pending reviews. You\'re all caught up.'
                                : 'No reviews in this category yet.'}
                        </p>
                    </div>
                )}
                {visible.map((review) => (
                    <ReviewCard key={review.id} review={review} auth={auth} />
                ))}
            </div>
        </AdminLayout>
    );
}