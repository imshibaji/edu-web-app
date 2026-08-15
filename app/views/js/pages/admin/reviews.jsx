import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import { Check, X, Clock, Inbox, UserRound } from "lucide-react";

import Navbar from "@/components/larnr/navbar.jsx";
import Footer from "@/components/larnr/footer.jsx";
import FlashToast from "@/components/larnr/flash-toast.jsx";
import Avatar from "@/components/larnr/avatar.jsx";
import { FORMAT_LABELS, LEVEL_LABELS, formatDateTime } from "@/utils/tutor.jsx";
import { displayAmount } from "@/utils/currency.jsx";

const FIELD_LABELS = {
    full_name: "Full name",
    headline: "Headline",
    bio: "Bio",
    city: "City",
    format: "Format",
    experience_level: "Experience level",
    hourly_rate: "Hourly rate",
    currency: "Currency",
};

const STATUS_BADGE = {
    PENDING: "badge-warning",
    APPROVED: "badge-success",
    REJECTED: "badge-neutral",
};

function displayValue(field, value, currency, auth) {
    if (value === null || value === undefined || value === "") return "—";
    if (field === "format") return FORMAT_LABELS[value] ?? value;
    if (field === "experience_level") return LEVEL_LABELS[value] ?? value;
    if (field === "hourly_rate") {
        const amount = displayAmount(value, currency ?? "USD", auth);
        return (
            <>
                {amount.text}
                {amount.note && <span className="ml-1 text-base-content/40">({amount.note})</span>}
            </>
        );
    }
    return value;
}

function avatarChanged(review) {
    const live = review.live?.avatar_url;
    const proposed = review.proposed.avatar_url;
    return proposed && proposed !== live;
}

function ReviewCard({ review, auth }) {
    const isPending = review.status === "PENDING";

    const approve = () => {
        router.post("/admin/reviews/approve", { review: review.id }, { preserveScroll: true });
    };

    const reject = () => {
        if (window.confirm("Reject this review? The public profile stays unchanged.")) {
            router.post("/admin/reviews/reject", { review: review.id }, { preserveScroll: true });
        }
    };

    const changes = Object.keys(FIELD_LABELS).filter(
        (field) =>
            (review.proposed[field] ?? "") !== (review.live?.[field] ?? ""),
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
                        <span className={`badge badge-sm ${STATUS_BADGE[review.status] ?? "badge-neutral"}`}>
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
                                            {FIELD_LABELS[field]}
                                        </td>
                                        <td className="text-base-content/60">
                                            {displayValue(
                                                field,
                                                review.live?.[field],
                                                review.live?.currency,
                                                auth,
                                            )}
                                        </td>
                                        <td className="text-primary">
                                            {displayValue(
                                                field,
                                                review.proposed[field],
                                                review.proposed.currency,
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
                                                src={review.live?.avatar_url}
                                                name={review.live?.full_name}
                                                className="size-10"
                                                textClass="text-sm"
                                            />
                                        </td>
                                        <td className="text-primary">
                                            <Avatar
                                                src={review.proposed.avatar_url}
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

                {review.status !== "PENDING" && (
                    <p className="text-xs text-base-content/50">
                        {review.reviewer ? `Reviewed by ${review.reviewer}` : "Reviewed"} ·{" "}
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

export default function AdminReviews({ reviews, errors }) {
    const { auth } = usePage().props;
    const [filter, setFilter] = useState("PENDING");

    const counts = {
        PENDING: reviews.filter((r) => r.status === "PENDING").length,
        APPROVED: reviews.filter((r) => r.status === "APPROVED").length,
        REJECTED: reviews.filter((r) => r.status === "REJECTED").length,
        ALL: reviews.length,
    };

    const visible = filter === "ALL" ? reviews : reviews.filter((r) => r.status === filter);
    const tabs = ["PENDING", "APPROVED", "REJECTED", "ALL"];

    return (
        <div className="min-h-screen bg-base-100 text-base-content">
            <Head title="Profile reviews" />

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
                        Tutor profile reviews
                    </h1>
                    <p className="text-sm text-base-content/60">
                        Review and approve tutor profile changes before they go public.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                                    filter === tab
                                        ? "bg-primary/15 text-primary"
                                        : "bg-base-content/5 text-base-content/60 hover:bg-base-content/10 hover:text-base-content"
                                }`}
                            >
                                {tab === "ALL"
                                    ? `All (${counts.ALL})`
                                    : `${tab.charAt(0) + tab.slice(1).toLowerCase()} (${counts[tab]})`}
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 space-y-4">
                        {visible.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-base-content/10 p-12 text-center">
                                <Inbox className="mx-auto size-8 text-base-content/40" />
                                <p className="mt-3 text-sm text-base-content/50">
                                    {filter === "PENDING"
                                        ? "No pending reviews. You're all caught up."
                                        : "No reviews in this category yet."}
                                </p>
                            </div>
                        )}
                        {visible.map((review) => (
                            <ReviewCard key={review.id} review={review} auth={auth} />
                        ))}
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
}
