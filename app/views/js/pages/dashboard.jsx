import { Head, Link } from "@inertiajs/react";
import {
    CalendarCheck,
    CalendarPlus,
    GraduationCap,
    ArrowRight,
    Users,
    UserRound,
    TrendingUp,
    Activity,
} from "lucide-react";

import Navbar from "@/components/larnr/navbar.jsx";
import Footer from "@/components/larnr/footer.jsx";
import FlashToast from "@/components/larnr/flash-toast.jsx";
import { getInitials } from "@/utils/index.jsx";
import { STATUS_BADGE, statusLabel, formatDateTime } from "@/utils/tutor.jsx";
import { displayAmount } from "@/utils/currency.jsx";

function StatCard({ icon: Icon, label, value, accent }) {
    return (
        <div className="card card-border border-base-content/10 bg-base-content/[0.04]">
            <div className="card-body flex-row items-center gap-4 py-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-base-content/5 text-base-content/80">
                    <Icon className="size-5" />
                </span>
                <div>
                    <p className={`font-display text-2xl font-bold ${accent ?? "text-base-content"}`}>
                        {value}
                    </p>
                    <p className="text-xs text-base-content/50">{label}</p>
                </div>
            </div>
        </div>
    );
}

function StudentView({ profile, bookings, auth }) {
    return (
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
            <div className="card card-border relative overflow-hidden border-base-content/10 bg-gradient-to-r from-primary/15 via-secondary/10 to-transparent">
                <div className="card-body sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-lg font-bold text-white shadow-lg shadow-primary/20">
                            {getInitials(profile.name)}
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-display text-2xl font-bold text-base-content">
                                    {profile.name}
                                </h1>
                                <span className="badge badge-outline badge-sm border-primary/40 text-primary">
                                    Student
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-base-content/60">
                                {profile.phone ? `Phone: ${profile.phone}` : "Welcome to Larnr"}
                            </p>
                        </div>
                    </div>
                    <Link href="/#educators" className="btn btn-primary btn-sm rounded-full">
                        Find a Tutor <ArrowRight className="size-4" />
                    </Link>
                </div>
            </div>

            <div>
                <h2 className="font-display text-lg font-semibold text-base-content">My Bookings</h2>
                <p className="text-xs text-base-content/50">Your trial lesson requests.</p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {bookings.length === 0 && (
                        <div className="card card-border col-span-full border-base-content/10 bg-base-content/[0.04]">
                            <div className="card-body items-center py-14 text-center">
                                <GraduationCap className="size-10 text-base-content/40" />
                                <h3 className="font-display mt-3 font-semibold text-base-content">
                                    No bookings yet
                                </h3>
                                <p className="max-w-sm text-sm text-base-content/60">
                                    Browse premium educators and book your first trial lesson.
                                </p>
                                <Link
                                    href="/#educators"
                                    className="btn btn-primary btn-sm mt-3 rounded-full"
                                >
                                    Browse Educators
                                </Link>
                            </div>
                        </div>
                    )}
                    {bookings.map((b) => {
                        const amount = displayAmount(b.amount, b.currency, auth);
                        return (
                            <div key={b.id} className="card card-border border-base-content/10 bg-base-content/[0.04]">
                                <div className="card-body">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="font-display font-semibold text-base-content">
                                                    {b.tutor}
                                                </h3>
                                                {b.subject && (
                                                    <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs text-primary">
                                                        {b.subject}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-xs text-base-content/50">
                                                Requested {formatDateTime(b.created_at)}
                                            </p>
                                        </div>
                                        <span
                                            className={`badge badge-sm ${
                                                STATUS_BADGE[b.status] ?? "badge-neutral"
                                            }`}
                                        >
                                            {statusLabel(b.status)}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex items-center gap-4 text-sm text-base-content/60">
                                        <span className="flex items-center gap-1.5">
                                            <CalendarCheck className="size-4 text-primary" />
                                            {formatDateTime(b.scheduled_at)}
                                        </span>
                                        <span className="font-medium text-primary">
                                            {b.amount > 0 ? (
                                                <>
                                                    {amount.text}/hr
                                                    {amount.note && (
                                                        <span className="ml-1 font-normal text-base-content/40">
                                                            ({amount.note})
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                "Rate TBD"
                                            )}
                                        </span>
                                    </div>

                                    {b.notes && (
                                        <p className="mt-2 rounded-lg bg-base-content/5 p-3 text-xs text-base-content/60">
                                            "{b.notes}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function AdminView({ stats, activities }) {
    const items = [
        { icon: Users, label: "Tutors", value: stats.tutors, accent: "text-primary" },
        { icon: UserRound, label: "Students", value: stats.students, accent: "text-success" },
        { icon: CalendarCheck, label: "Total bookings", value: stats.bookings, accent: "text-info" },
        { icon: TrendingUp, label: "Pending payments", value: stats.pending, accent: "text-warning" },
        { icon: Activity, label: "Activities today", value: stats.activityToday, accent: "text-secondary" },
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
            <div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    Admin
                </span>
                <h1 className="font-display mt-2 text-2xl font-bold text-base-content">Dashboard</h1>
                <p className="text-sm text-base-content/60">Platform overview and live activity.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                {items.map((s) => (
                    <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} accent={s.accent} />
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
                <div className="card card-border border-base-content/10 bg-base-content/[0.04] lg:col-span-3">
                    <div className="card-body gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-display text-lg font-semibold text-base-content">
                                    Recent activity
                                </h2>
                                <p className="text-xs text-base-content/50">
                                    Latest actions by tutors and students.
                                </p>
                            </div>
                            <Link
                                href="/admin/activities"
                                className="btn btn-ghost btn-xs rounded-full text-primary"
                            >
                                View all <ArrowRight className="size-3.5" />
                            </Link>
                        </div>

                        <div className="space-y-2">
                            {activities.length === 0 && (
                                <p className="rounded-xl border border-dashed border-base-content/10 p-6 text-center text-sm text-base-content/50">
                                    No activity recorded yet.
                                </p>
                            )}
                            {activities.map((a) => (
                                <div
                                    key={a.id}
                                    className="flex items-center gap-3 rounded-xl bg-base-content/5 px-3 py-2.5"
                                >
                                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-[10px] font-bold text-white">
                                        {getInitials(a.actor.name)}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm text-base-content/80">
                                            {a.description}
                                        </p>
                                        <p className="text-xs text-base-content/50">
                                            {a.actor.name} · {formatDateTime(a.created_at)}
                                        </p>
                                    </div>
                                    <span className="badge badge-sm badge-neutral shrink-0">
                                        {a.actor.role.toLowerCase()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card card-border border-base-content/10 bg-base-content/[0.04] lg:col-span-2">
                    <div className="card-body items-center justify-center gap-3 py-14 text-center">
                        <Users className="size-10 text-base-content/40" />
                        <h3 className="font-display text-lg font-semibold text-base-content">
                            Manage the platform
                        </h3>
                        <p className="max-w-md text-sm text-base-content/60">
                            Tutor approvals, booking management, and platform analytics will live
                            here as Larnr grows.
                        </p>
                        <Link
                            href="/admin/reviews"
                            className="btn btn-primary btn-sm mt-3 rounded-full"
                        >
                            Review tutor profiles
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Dashboard(props) {
    const { role, auth } = props;

    return (
        <div className="min-h-screen bg-base-100 text-base-content">
            <Head title="Dashboard" />

            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
            </div>

            <div className="relative z-10">
                <Navbar auth={auth} />
                <FlashToast />

                {role === "ADMIN" && <AdminView {...props} />}
                {role === "STUDENT" && <StudentView {...props} />}

                <Footer />
            </div>
        </div>
    );
}
