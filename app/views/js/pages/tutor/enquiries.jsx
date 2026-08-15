import { Head } from "@inertiajs/react";
import { useState } from "react";
import { Inbox, CalendarCheck, FileText } from "lucide-react";

import Navbar from "@/components/larnr/navbar.jsx";
import Footer from "@/components/larnr/footer.jsx";
import TutorNav from "@/components/larnr/tutor-nav.jsx";
import FlashToast from "@/components/larnr/flash-toast.jsx";
import { getInitials } from "@/utils/index.jsx";
import { STATUS_BADGE, statusLabel, formatDateTime } from "@/utils/tutor.jsx";
import { displayAmount } from "@/utils/currency.jsx";

const FILTERS = [
    { key: "ALL", label: "All" },
    { key: "PENDING_PAYMENT", label: "Pending" },
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "COMPLETED", label: "Completed" },
    { key: "CANCELLED", label: "Cancelled" },
];

export default function TutorEnquiries({ profile, enquiries, auth }) {
    const [filter, setFilter] = useState("ALL");

    const visible =
        filter === "ALL"
            ? enquiries
            : enquiries.filter((e) => e.status === filter);

    return (
        <div className="min-h-screen bg-base-100 text-base-content">
            <Head title="Enquiries · Larnr" />

            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
            </div>

            <div className="relative z-10">
                <Navbar auth={auth} />
                <FlashToast />

                <div className="space-y-6 py-6">
                    <TutorNav />

                    <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h1 className="font-display text-2xl font-bold text-base-content">
                                    Lesson Enquiries
                                </h1>
                                <p className="text-sm text-base-content/60">
                                    Students interested in a trial lesson with you.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-xs font-bold text-white">
                                    {getInitials(profile.name)}
                                </span>
                                <span className="text-sm font-medium text-base-content/80">{profile.name}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {FILTERS.map((f) => {
                                const count =
                                    f.key === "ALL"
                                        ? enquiries.length
                                        : enquiries.filter((e) => e.status === f.key).length;
                                const active = filter === f.key;
                                return (
                                    <button
                                        key={f.key}
                                        onClick={() => setFilter(f.key)}
                                        className={`btn btn-sm rounded-full ${
                                            active
                                                ? "btn-primary"
                                                : "border-base-content/10 bg-base-content/[0.04] text-base-content/60 hover:bg-base-content/5 hover:text-base-content"
                                        }`}
                                    >
                                        {f.label}
                                        <span
                                            className={`badge badge-sm ${
                                                active ? "badge-neutral" : "badge-outline"
                                            }`}
                                        >
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="card card-border border-base-content/10 bg-base-content/[0.04]">
                            <div className="card-body p-0">
                                <div className="overflow-x-auto">
                                    <table className="table">
                                        <thead>
                                            <tr className="border-base-content/10 text-xs uppercase tracking-wider text-base-content/50">
                                                <th>Student</th>
                                                <th>Subject</th>
                                                <th>Scheduled</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                                <th>Requested</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {visible.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="py-14 text-center"
                                                    >
                                                        <Inbox className="mx-auto size-8 text-base-content/40" />
                                                        <p className="mt-2 text-sm text-base-content/50">
                                                            {filter === "ALL"
                                                                ? "No enquiries yet."
                                                                : `No ${statusLabel(filter).toLowerCase()} enquiries.`}
                                                        </p>
                                                    </td>
                                                </tr>
                                            )}
                                            {visible.map((e) => {
                                                const amount = displayAmount(e.amount, e.currency, auth);
                                                return (
                                                    <tr key={e.id} className="border-base-content/10 align-top">
                                                    <td>
                                                        <div className="text-sm font-medium text-base-content">
                                                            {e.student}
                                                        </div>
                                                        {e.notes && (
                                                            <div className="mt-0.5 flex items-start gap-1 text-xs text-base-content/50">
                                                                <FileText className="mt-0.5 size-3 shrink-0" />
                                                                "{e.notes}"
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="text-sm text-base-content/80">
                                                        {e.subject ?? "Any"}
                                                    </td>
                                                    <td className="text-sm text-base-content/80">
                                                        <span className="flex items-center gap-1.5">
                                                            <CalendarCheck className="size-3.5 text-primary" />
                                                            {formatDateTime(e.scheduled_at)}
                                                        </span>
                                                    </td>
                                                    <td className="text-sm text-base-content/80">
                                                        {e.amount > 0 ? (
                                                            <>
                                                                {amount.text}
                                                                {amount.note && (
                                                                    <span className="ml-1 text-base-content/40">
                                                                        ({amount.note})
                                                                    </span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            "TBD"
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`badge badge-sm ${
                                                                STATUS_BADGE[e.status] ?? "badge-neutral"
                                                            }`}
                                                        >
                                                            {statusLabel(e.status)}
                                                        </span>
                                                    </td>
                                                    <td className="text-xs text-base-content/50">
                                                        {formatDateTime(e.created_at)}
                                                    </td>
                                                </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
}
