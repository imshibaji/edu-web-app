import { Head, Link, router } from '@inertiajs/react';
import { GraduationCap, CalendarCheck, PhoneCall, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { useState } from 'react';

import Navbar from '@/components/larnr/navbar';
import Footer from '@/components/larnr/footer';
import FlashToast from '@/components/larnr/flash-toast';
import { STATUS_BADGE, statusLabel, formatDateTime } from '@/utils/tutor';
import { displayAmount } from '@/utils/currency';
import type { AuthProps, Lesson } from '@/types';

interface Props {
    auth: AuthProps;
    lessons: Lesson[];
}

export default function LessonsIndex(props: Props) {
    const { auth, lessons } = props;
    const [busy, setBusy] = useState<string | null>(null);

    const complete = (lesson: Lesson) => {
        if (lesson.status !== 'CONFIRMED') return;
        if (!confirm(`Mark the lesson with ${lesson.amTutor ? lesson.student.name : lesson.tutor.name} as completed?`)) return;
        setBusy(lesson.id);
        router.post(`/lessons/${lesson.id}/complete`, {}, {
            onFinish: () => setBusy(null),
            onError: (err) => console.error(err),
        });
    };

    const cancel = (lesson: Lesson) => {
        if (lesson.status !== 'CONFIRMED' && lesson.status !== 'PENDING_PAYMENT') return;
        const reason = prompt('Reason for cancelling this lesson:');
        if (reason === null) return;
        if (!reason.trim()) {
            alert('A cancellation reason is required.');
            return;
        }
        setBusy(lesson.id);
        router.post(`/lessons/${lesson.id}/cancel`, { reason }, {
            onFinish: () => setBusy(null),
            onError: (err) => console.error(err),
        });
    };

    return (
        <div className="min-h-screen bg-base-100 text-base-content">
            <Head title="My Lessons" />

            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
            </div>

            <div className="relative z-10">
                <Navbar auth={auth} />
                <FlashToast />

                <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-base-content">My Lessons</h1>
                        <p className="text-xs text-base-content/50">
                            Join upcoming lessons, track completion, and manage cancellations.
                        </p>
                    </div>

                    {lessons?.length === 0 && (
                        <div className="card card-border border-base-content/10 bg-base-content/4">
                            <div className="card-body items-center py-16 text-center">
                                <GraduationCap className="size-10 text-base-content/40" />
                                <h3 className="font-display mt-3 font-semibold text-base-content">
                                    No lessons yet
                                </h3>
                                <p className="max-w-sm text-sm text-base-content/60">
                                    Your confirmed trial lessons will appear here.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4">
                        {lessons?.map((lesson: Lesson) => {
                            const counterpart = lesson.amTutor ? lesson.student.name : lesson.tutor.name;
                            return (
                                <div key={lesson.id} className="card card-border border-base-content/10">
                                    <div className="card-body gap-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white">
                                                    <CalendarCheck className="size-5" />
                                                </span>
                                                <div>
                                                    <p className="font-display font-semibold text-base-content">
                                                        {lesson.subject ?? 'Trial lesson'} with {counterpart}
                                                    </p>
                                                    <p className="text-xs text-base-content/50">
                                                        {formatDateTime(lesson.scheduled_at)} ·{' '}
                                                        {lesson.duration_minutes} min
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`badge badge-sm ${STATUS_BADGE[lesson.status as keyof typeof STATUS_BADGE] ?? 'badge-neutral'}`}
                                                >
                                                    {statusLabel(lesson.status)}
                                                </span>
                                                <span className="text-sm font-semibold text-base-content/80">
                                                    {displayAmount(lesson.amount, lesson.currency, auth).text}
                                                </span>
                                            </div>
                                        </div>

                                        {lesson.cancel_reason && (
                                            <p className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
                                                Cancelled: {lesson.cancel_reason}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap gap-2 border-t border-base-content/10 pt-3">
                                            <Link href={`/lessons/${lesson.id}`} className="btn btn-primary btn-sm rounded-full">
                                                View Details <ExternalLink className="size-3.5" />
                                            </Link>
                                            {lesson.canJoin && (
                                                <Link href={`/lessons/${lesson.id}#join`} className="btn btn-secondary btn-sm rounded-full">
                                                    <PhoneCall className="size-3.5" /> Join Meeting
                                                </Link>
                                            )}
                                            {lesson.canComplete && (
                                                <button
                                                    onClick={() => complete(lesson)}
                                                    disabled={busy === lesson.id}
                                                    className="btn btn-success btn-sm rounded-full"
                                                >
                                                    <CheckCircle2 className="size-3.5" /> Mark Complete
                                                </button>
                                            )}
                                            {lesson.canCancel && (
                                                <button
                                                    onClick={() => cancel(lesson)}
                                                    disabled={busy === lesson.id}
                                                    className="btn btn-outline btn-error btn-sm rounded-full"
                                                >
                                                    <XCircle className="size-3.5" /> Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
}