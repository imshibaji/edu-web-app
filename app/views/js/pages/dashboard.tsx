import { Head, Link, router } from '@inertiajs/react';
import { CalendarCheck, GraduationCap, ArrowRight, CreditCard } from 'lucide-react';

import Navbar from '@/components/larnr/navbar';
import Footer from '@/components/larnr/footer';
import FlashToast from '@/components/larnr/flash-toast';
import { getInitials } from '@/utils/index';
import { STATUS_BADGE, statusLabel, formatDateTime } from '@/utils/tutor';
import { displayAmount } from '@/utils/currency';
import type { DashboardProps, AuthProps, Booking, Profile } from '@/types';

export default function Dashboard(props: DashboardProps) {
    const { auth, bookings, profile } = props;

    return (
        <div className="min-h-screen bg-base-100 text-base-content">
            <Head title="Dashboard" />

            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
            </div>

            <div className="relative z-10">
                <Navbar auth={auth} />
                <FlashToast />

                <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
                    <div className="card card-border relative overflow-hidden border-base-content/10 bg-gradient-to-r from-primary/15 via-secondary/10 to-transparent">
                        <div className="card-body sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-lg font-bold text-white shadow-lg shadow-primary/20">
                                    {getInitials(profile?.name ?? 'Student')}
                                </span>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="font-display text-2xl font-bold text-base-content">
                                            {profile?.name ?? 'Student'}
                                        </h1>
                                        <span className="badge badge-outline badge-sm border-primary/40 text-primary">
                                            Student
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-base-content/60">
                                        {profile?.phone ? `Phone: ${profile.phone}` : 'Welcome to Larnr'}
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
                            {bookings?.length === 0 && (
                                <div className="card card-border col-span-full border-base-content/10 bg-base-content/4">
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
                            {bookings?.map((b: Booking) => {
                                const amount = displayAmount(b.amount, b.currency, auth);
                                return (
                                    <div key={b.id} className="card card-border border-base-content/10 bg-base-content/4">
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
                                                        STATUS_BADGE[b.status as keyof typeof STATUS_BADGE] ?? 'badge-neutral'
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
                                                        'Rate TBD'
                                                    )}
                                                </span>
                                            </div>

                                            {b.notes && (
                                                <p className="mt-2 rounded-lg bg-base-content/5 p-3 text-xs text-base-content/60">
                                                    &ldquo;{b.notes}&rdquo;
                                                </p>
                                            )}

                                            {b.status === 'PENDING_PAYMENT' && (
                                                <div className="mt-4">
                                                    <button
                                                        onClick={() => router.visit(`/payment/checkout/${b.id}`)}
                                                        className="btn btn-primary w-full rounded-full px-4 py-2 gap-2"
                                                    >
                                                        <CreditCard className="size-4" />
                                                        Pay Now ({amount.text})
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
}
