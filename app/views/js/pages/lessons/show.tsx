import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, PhoneCall, CheckCircle2, XCircle, Clock, GraduationCap, Video, Star, MessageSquare } from 'lucide-react';
import { useState } from 'react';

import Navbar from '@/components/larnr/navbar';
import Footer from '@/components/larnr/footer';
import FlashToast from '@/components/larnr/flash-toast';
import { STATUS_BADGE, statusLabel, formatDateTime } from '@/utils/tutor';
import { displayAmount } from '@/utils/currency';
import type { AuthProps, Lesson } from '@/types';

interface Props {
    auth: AuthProps;
    lesson: Lesson;
}

export default function LessonsShow(props: Props) {
    const { auth, lesson } = props;
    const [busy, setBusy] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!lesson) {
        return (
            <div className="min-h-screen bg-base-100 text-base-content">
                <Head title="Lesson Not Found" />
                <Navbar auth={auth} />
                <div className="mx-auto max-w-2xl px-4 py-24 text-center">
                    <h1 className="font-display text-2xl font-bold">Lesson not found</h1>
                    <Link href="/lessons" className="btn btn-primary btn-sm mt-4 rounded-full">
                        Back to Lessons
                    </Link>
                </div>
            </div>
        );
    }

    const counterpart = lesson.amTutor ? lesson.student.name : lesson.tutor.name;

    const complete = () => {
        if (!confirm(`Mark this lesson with ${counterpart} as completed?`)) return;
        setBusy(true);
        router.post(`/lessons/${lesson.id}/complete`, {}, {
            onFinish: () => setBusy(false),
            onError: (err) => console.error(err),
        });
    };

    const cancel = () => {
        const reason = prompt('Reason for cancelling this lesson:');
        if (reason === null) return;
        if (!reason.trim()) {
            alert('A cancellation reason is required.');
            return;
        }
        setBusy(true);
        router.post(`/lessons/${lesson.id}/cancel`, { reason }, {
            onFinish: () => setBusy(false),
            onError: (err) => console.error(err),
        });
    };

    const submitReview = () => {
        if (submitting) return;
        setSubmitting(true);
        router.post(`/lessons/${lesson.id}/review`, { rating, comment }, {
            preserveScroll: true,
            onSuccess: () => {
                setComment('');
                router.reload({ only: ['lesson'] });
            },
            onError: (err) => console.error(err),
            onFinish: () => setSubmitting(false),
        });
    };

    const openMessages = async () => {
        const counterpartId = lesson.amTutor ? lesson.student.id : lesson.tutor.id;
        if (lesson.amTutor) {
            router.get(`/messages?with=${counterpartId}`);
            return;
        }
        try {
            const res = await fetch('/messages/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '' },
                body: JSON.stringify({ tutor_id: counterpartId }),
            });
            const data = await res.json();
            if (data.conversation_id) router.get(`/messages/${data.conversation_id}`);
        } catch (err) {
            console.error(err);
        }
    };

    const completionPill = (label: string, done: boolean) => (
        <span
            className={`badge badge-sm ${done ? 'badge-success' : 'badge-outline border-base-content/20 text-base-content/50'}`}
        >
            {done ? '✓' : '…'} {label}
        </span>
    );

    return (
        <div className="min-h-screen bg-base-100 text-base-content">
            <Head title={lesson.subject ? `${lesson.subject} Lesson` : 'Lesson'} />

            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
            </div>

            <div className="relative z-10">
                <Navbar auth={auth} />
                <FlashToast />

                <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                    <Link href="/lessons" className="btn btn-ghost btn-sm rounded-full gap-2">
                        <ArrowLeft className="size-4" /> Back to Lessons
                    </Link>

                    <div className="card card-border border-base-content/10">
                        <div className="card-body gap-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white">
                                        <GraduationCap className="size-6" />
                                    </span>
                                    <div>
                                        <h1 className="font-display text-xl font-bold text-base-content">
                                            {lesson.subject ?? 'Trial lesson'} with {counterpart}
                                        </h1>
                                        <span
                                            className={`badge badge-sm mt-1 ${STATUS_BADGE[lesson.status as keyof typeof STATUS_BADGE] ?? 'badge-neutral'}`}
                                        >
                                            {statusLabel(lesson.status)}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-lg font-semibold text-base-content">
                                    {displayAmount(lesson.amount, lesson.currency, auth).text}
                                </span>
                            </div>

                            <div className="grid gap-3 rounded-2xl bg-base-content/4 p-4 text-sm sm:grid-cols-2">
                                <div className="flex items-center gap-2 text-base-content/80">
                                    <Clock className="size-4 text-base-content/50" />
                                    Scheduled: {formatDateTime(lesson.scheduled_at)}
                                </div>
                                <div className="flex items-center gap-2 text-base-content/80">
                                    <Clock className="size-4 text-base-content/50" />
                                    Duration: {lesson.duration_minutes} minutes
                                </div>
                                <div className="flex items-center gap-2 text-base-content/80">
                                    Tutor: {lesson.tutor.name}
                                </div>
                                <div className="flex items-center gap-2 text-base-content/80">
                                    Student: {lesson.student.name}
                                </div>
                            </div>

                            {lesson.status === 'CONFIRMED' && (
                                <div className="flex flex-wrap items-center gap-2">
                                    {completionPill('Tutor marked complete', lesson.completedByTutor)}
                                    {completionPill('Student marked complete', lesson.completedByStudent)}
                                </div>
                            )}

                            {lesson.cancel_reason && (
                                <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
                                    Cancelled by {lesson.cancelled_by?.toLowerCase()} on{' '}
                                    {formatDateTime(lesson.cancelled_at)} — {lesson.cancel_reason}
                                </p>
                            )}

                            {lesson.completed_at && (
                                <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
                                    Lesson completed on {formatDateTime(lesson.completed_at)}
                                </p>
                            )}

                            {lesson.status === 'CONFIRMED' && lesson.meeting_url && (
                                <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-4">
                                    <div className="flex items-center gap-2">
                                        <Video className="size-5 text-secondary" />
                                        <h2 className="font-display font-semibold text-base-content">
                                            Your meeting room
                                        </h2>
                                    </div>
                                    <p className="mt-1 text-xs text-base-content/60">
                                        Join your live video lesson. The room opens at the scheduled time.
                                    </p>
                                    <a
                                        href={lesson.meeting_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        id="join"
                                        className="btn btn-secondary btn-sm mt-3 rounded-full"
                                    >
                                        <PhoneCall className="size-4" /> Join Meeting
                                    </a>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 border-t border-base-content/10 pt-4">
                                <button
                                    onClick={openMessages}
                                    className="btn btn-outline btn-sm rounded-full gap-2"
                                >
                                    <MessageSquare className="size-4" /> Message {counterpart}
                                </button>
                                {lesson.canComplete && (
                                    <button
                                        onClick={complete}
                                        disabled={busy}
                                        className="btn btn-success btn-sm rounded-full"
                                    >
                                        <CheckCircle2 className="size-4" /> Mark Complete
                                    </button>
                                )}
                                {lesson.canCancel && (
                                    <button
                                        onClick={cancel}
                                        disabled={busy}
                                        className="btn btn-outline btn-error btn-sm rounded-full"
                                    >
                                        <XCircle className="size-4" /> Cancel Lesson
                                    </button>
                                )}
                            </div>

                            {lesson.canReview && (
                                <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
                                    <div className="flex items-center gap-2">
                                        <Star className="size-5 text-primary" />
                                        <h2 className="font-display font-semibold text-base-content">
                                            Review this lesson
                                        </h2>
                                    </div>
                                    <p className="mt-1 text-xs text-base-content/60">
                                        How was your lesson with {counterpart}?
                                    </p>
                                    <div className="mt-3 flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((value) => (
                                            <button
                                                key={value}
                                                onClick={() => setRating(value)}
                                                aria-label={`${value} star${value > 1 ? 's' : ''}`}
                                                className="p-0.5"
                                            >
                                                <Star
                                                    className={`size-6 ${
                                                        value <= rating
                                                            ? 'fill-warning text-warning'
                                                            : 'text-base-content/30'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Share a few words about the lesson (optional)"
                                        className="textarea textarea-bordered mt-3 w-full rounded-2xl text-sm"
                                        rows={3}
                                        maxLength={1000}
                                    />
                                    <button
                                        onClick={submitReview}
                                        disabled={submitting}
                                        className="btn btn-primary btn-sm mt-3 rounded-full gap-2"
                                    >
                                        <Star className="size-4" /> Submit Review
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
}