import { useState } from 'react';
import { useForm, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    BadgeCheck,
    MapPin,
    Clock,
    Video,
    Building2,
    Star,
    CalendarClock,
    MessageSquare,
    Heart,
    Share2,
    TrendingUp,
} from 'lucide-react';

import PublicLayout from '@/components/larnr/public-layout';
import Avatar from '@/components/larnr/avatar';
import WeeklySchedule from '@/components/larnr/weekly-schedule';
import { displayAmount } from '@/utils/currency';
import type {
    AuthProps,
    AvailableSlot,
    PublicReview,
    RelatedTutor,
    Tutor,
} from '@/types';

interface Props {
    auth: AuthProps;
    tutor: Tutor;
    slots: AvailableSlot[];
    reviews: PublicReview[];
    reviewCount: number;
    lessonCount: number;
    activeStudents: number;
    recentBookings: number;
    related: RelatedTutor[];
}

const FORMAT_LABELS = {
    ONLINE: 'Online',
    IN_PERSON: 'In-person',
    BOTH: 'Online & In-person',
} as const;

const LEVEL_LABELS = {
    ENTRY: 'Entry',
    MID: 'Mid',
    SENIOR: 'Senior',
} as const;

function parseSlotDate(value: string): Date {
    if (!value) return new Date(NaN);
    const trimmed = value.trim();
    if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
        return new Date(trimmed);
    }
    return new Date(trimmed.replace(' ', 'T') + 'Z');
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
}

function isTomorrow(date: Date): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
}

function StarRow({ rating, size = 'size-4' }: { rating: number; size?: string }) {
    return (
        <span className="flex text-amber-400">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    className={`${size} ${
                        rating >= i
                            ? 'fill-amber-400 text-amber-400'
                            : rating >= i - 0.5
                            ? 'fill-amber-400/50 text-amber-400'
                            : 'text-base-content/40'
                    }`}
                />
            ))}
        </span>
    );
}

export default function TutorProfile(props: Props) {
    const { auth, tutor, slots, reviews, reviewCount, lessonCount, activeStudents, recentBookings, related } = props;
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const [selectedRate, setSelectedRate] = useState<number | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        tutor_id: tutor.id,
        subject_id: '',
        slot_id: '',
        notes: '',
    });

    const rate = displayAmount(tutor.rate, tutor.currency, auth);
    const formatLabel = FORMAT_LABELS[tutor.format] ?? tutor.format;
    const levelLabel = LEVEL_LABELS[tutor.level as keyof typeof LEVEL_LABELS] ?? tutor.level;

    const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const subjectId = e.target.value;
        setData('subject_id', subjectId);
        setData('slot_id', '');
        setSelectedSlotId(null);
        if (!subjectId) {
            setSelectedRate(null);
            return;
        }
        const match = tutor.subjects.find((s) => s.id === subjectId);
        setSelectedRate(match ? match.rate_cents : null);
    };

    const handleSelectSlot = (slotId: string) => {
        setData('slot_id', slotId);
        setSelectedSlotId(slotId);
    };

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/enquiry', {
            onSuccess: () => {
                reset();
                setSelectedSlotId(null);
            },
            preserveScroll: true,
        });
    };

    const rateLabel = selectedRate !== null
        ? displayAmount(selectedRate, tutor.currency, auth)
        : null;

    // Next available slots (first 3 upcoming)
    const nextSlots = slots
        .filter((s) => !s.booked && parseSlotDate(s.start) > new Date())
        .slice(0, 3)
        .map((s) => ({
            id: s.id,
            time: formatTime(parseSlotDate(s.start)),
            day: parseSlotDate(s.start).toLocaleDateString(undefined, { weekday: 'short' }),
            isTomorrow: isTomorrow(parseSlotDate(s.start)),
        }));

    // 5→1 star distribution from published reviews
    const distribution = [5, 4, 3, 2, 1].map((stars) => ({
        stars,
        count: reviews.filter((r) => r.rating === stars).length,
    }));

    const message = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!auth?.user) {
            router.visit('/auth/login');
            return;
        }
        if (auth.user.role === 'TUTOR') {
            router.get(`/messages?with=${tutor.id}`);
            return;
        }
        try {
            const res = await fetch('/messages/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tutor_id: tutor.id }),
            });
            const data = await res.json();
            if (data.conversation_id) router.get(`/messages/${data.conversation_id}`);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <PublicLayout auth={auth} title={tutor.name}>
            <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 py-6 text-sm text-base-content/60">
                    <Link href="/tutors" className="inline-flex items-center gap-1.5 hover:text-base-content">
                        <ArrowLeft className="size-4" /> Find Tutors
                    </Link>
                    <span className="text-base-content/30">›</span>
                    <span className="truncate text-base-content">{tutor.name}</span>
                </div>

                {/* Hero */}
                <div className="card card-border border-base-content/10 bg-base-content/4 overflow-hidden">
                    <div className="relative h-28 bg-gradient-to-r from-primary/25 via-secondary/15 to-primary/10" />
                    <div className="card-body gap-6">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                            <Avatar
                                src={tutor.avatar}
                                name={tutor.name}
                                className="size-24 ring-4 ring-base-100"
                                textClass="text-3xl"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="font-display text-3xl font-extrabold tracking-tight text-base-content">
                                        {tutor.name}
                                    </h1>
                                    {tutor.verified && (
                                        <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                                            <BadgeCheck className="size-4" /> Verified
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1.5 text-sm text-base-content/60">
                                    {formatLabel} tutor · From {tutor.city || 'India'}
                                </p>
                                {tutor.headline && (
                                    <p className="mt-3 font-display text-lg font-semibold text-base-content/90">
                                        {tutor.headline}
                                    </p>
                                )}

                                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-base-content/70">
                                    <span className="flex items-center gap-1.5">
                                        <StarRow rating={tutor.rating} />
                                        <span className="font-semibold text-base-content">{tutor.rating.toFixed(1)}</span>
                                        {reviewCount > 0 && (
                                            <span>({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
                                        )}
                                    </span>
                                    {tutor.city && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="size-3.5" /> {tutor.city}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        {tutor.format === 'ONLINE' ? (
                                            <Video className="size-3.5" />
                                        ) : (
                                            <Building2 className="size-3.5" />
                                        )}
                                        {formatLabel}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="size-3.5" />
                                        {tutor.slotsAvailable > 0
                                            ? `${tutor.slotsAvailable} slot${tutor.slotsAvailable > 1 ? 's' : ''} available`
                                            : 'No slots yet'}
                                    </span>
                                </div>

                                {tutor.subjects.length > 0 && (
                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        {tutor.subjects.map((s) => (
                                            <span
                                                key={s.id}
                                                className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                                            >
                                                {s.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid gap-8 lg:grid-cols-3">
                    {/* ── Main column ─────────────────────────────── */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* About */}
                        <section className="card card-border border-base-content/10 bg-base-content/4">
                            <div className="card-body gap-4">
                                <h2 className="font-display text-xl font-bold text-base-content">About me</h2>
                                <p className="whitespace-pre-line text-sm leading-relaxed text-base-content/70">
                                    {tutor.bio || 'No bio yet — this tutor is just getting started on Larnr.'}
                                </p>

                                {tutor.subjects.length > 0 && (
                                    <div className="mt-2">
                                        <h3 className="font-display text-sm font-semibold text-base-content/80">Teaches</h3>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {tutor.subjects.map((s) => {
                                                const subj = displayAmount(s.rate_cents, tutor.currency, auth);
                                                return (
                                                    <span
                                                        key={s.id}
                                                        className="rounded-full border border-base-content/10 bg-base-content/5 px-3 py-1 text-xs text-base-content/80"
                                                    >
                                                        {s.name}
                                                        {s.rate_cents > 0 && (
                                                            <span className="ml-1 font-medium text-primary">{subj.text}/hr</span>
                                                        )}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-2xl border border-base-content/10 bg-base-content/5 p-4 text-center">
                                        <p className="font-display text-2xl font-extrabold text-primary">{levelLabel}</p>
                                        <p className="mt-1 text-xs text-base-content/60">Experience level</p>
                                    </div>
                                    <div className="rounded-2xl border border-base-content/10 bg-base-content/5 p-4 text-center">
                                        <p className="font-display text-2xl font-extrabold text-primary">
                                            {lessonCount.toLocaleString()}
                                        </p>
                                        <p className="mt-1 text-xs text-base-content/60">Lessons taught</p>
                                    </div>
                                    <div className="rounded-2xl border border-base-content/10 bg-base-content/5 p-4 text-center">
                                        <p className="font-display text-2xl font-extrabold text-primary">
                                            {tutor.slotsAvailable > 0 ? 'Open' : 'Busy'}
                                        </p>
                                        <p className="mt-1 text-xs text-base-content/60">Availability</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Schedule - Weekly view */}
                        <WeeklySchedule
                            slots={slots}
                            selectedSlotId={selectedSlotId}
                            onSelectSlot={handleSelectSlot}
                        />
                        <section className="card card-border border-base-content/10 bg-base-content/4">
                            <div className="card-body gap-5">
                                <h2 className="font-display text-xl font-bold text-base-content">Lesson rating</h2>
                                <div className="flex flex-wrap items-center gap-8">
                                    <div className="text-center">
                                        <p className="font-display text-5xl font-extrabold text-base-content">
                                            {tutor.rating.toFixed(1)}
                                        </p>
                                        <div className="mt-2 flex justify-center">
                                            <StarRow rating={tutor.rating} size="size-5" />
                                        </div>
                                        <p className="mt-2 text-xs text-base-content/60">
                                            Based on {reviewCount > 0 ? `${reviewCount} anonymous student review${reviewCount !== 1 ? 's' : ''}` : 'no reviews yet'}
                                        </p>
                                    </div>

                                    {reviewCount > 0 && (
                                        <div className="min-w-0 flex-1 space-y-2">
                                            {distribution.map((d) => (
                                                <div key={d.stars} className="flex items-center gap-3">
                                                    <span className="w-8 shrink-0 text-xs font-medium text-base-content/70">
                                                        {d.stars}★
                                                    </span>
                                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-base-content/10">
                                                        <div
                                                            className="h-full rounded-full bg-amber-400"
                                                            style={{
                                                                width: `${reviewCount > 0 ? (d.count / reviewCount) * 100 : 0}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="w-8 shrink-0 text-right text-xs text-base-content/50">
                                                        {d.count}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Reviews */}
                        {reviews.length > 0 && (
                            <section className="card card-border border-base-content/10 bg-base-content/4">
                                <div className="card-body gap-4">
                                    <h2 className="font-display text-xl font-bold text-base-content">What my students say</h2>
                                    <div className="space-y-4">
                                        {reviews.map((r) => (
                                            <div key={r.id} className="flex gap-3 rounded-2xl border border-base-content/10 bg-base-content/5 p-4">
                                                <Avatar
                                                    src={null}
                                                    name={r.reviewer.name || 'S'}
                                                    className="size-10"
                                                    textClass="text-sm"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <p className="text-sm font-semibold text-base-content">{r.reviewer.name}</p>
                                                        {r.created_at && (
                                                            <p className="text-xs text-base-content/50">
                                                                {new Date(r.created_at.replace(' ', 'T') + 'Z').toLocaleDateString(undefined, {
                                                                    month: 'long',
                                                                    year: 'numeric',
                                                                })}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="mt-1">
                                                        <StarRow rating={r.rating} />
                                                    </div>
                                                    {r.comment && (
                                                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-base-content/70">
                                                            {r.comment}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Related tutors */}
                        {related.length > 0 && (
                            <section>
                                <h2 className="font-display text-xl font-bold text-base-content">You might also like</h2>
                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                    {related.map((t) => {
                                        const r = displayAmount(t.rate, t.currency, auth);
                                        return (
                                            <Link
                                                key={t.id}
                                                href={`/t/${t.username ?? t.id}`}
                                                className="card card-border border-base-content/10 bg-base-content/4 transition-colors hover:border-primary/40"
                                            >
                                                <div className="card-body gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar src={t.avatar} name={t.name} className="size-11" textClass="text-sm" />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="flex items-center gap-1 truncate text-sm font-semibold text-base-content">
                                                                {t.name}
                                                                {t.verified && <BadgeCheck className="size-4 shrink-0 text-primary" />}
                                                            </p>
                                                            <p className="truncate text-xs text-base-content/60">{t.headline}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="flex items-center gap-1 text-xs text-base-content/70">
                                                            <StarRow rating={t.rating} />
                                                            {t.rating.toFixed(1)}
                                                        </span>
                                                        <span className="text-xs font-semibold text-primary">
                                                            {t.rate > 0 ? `${r.text}/hr` : 'Rate on request'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* ── Sticky booking sidebar ──────────────────── */}
                    <div>
                        <div className="space-y-4 lg:sticky lg:top-24">
                            {/* Price + Stats card */}
                            <div className="card card-border border-base-content/10 bg-base-100 shadow-xl">
                                <div className="card-body gap-3">
                                    <div className="flex items-end gap-2">
                                        {tutor.rate > 0 ? (
                                            <p className="font-display text-3xl font-extrabold text-primary">{rate.text}</p>
                                        ) : (
                                            <p className="font-display text-2xl font-extrabold text-base-content">Rate on request</p>
                                        )}
                                        <p className="mb-1 text-sm text-base-content/60">50-min lesson</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-base-content/70">
                                        <span className="flex items-center gap-1">
                                            <StarRow rating={tutor.rating} />
                                            <span className="font-semibold text-base-content">{tutor.rating.toFixed(1)}</span>
                                            {reviewCount > 0 && <span>({reviewCount})</span>}
                                        </span>
                                        <span className="text-base-content/30">·</span>
                                        <span>{lessonCount.toLocaleString()} lessons</span>
                                        <span className="text-base-content/30">·</span>
                                        <span>{activeStudents} active students</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className="btn btn-primary w-full rounded-full px-6 gap-2"
                                    >
                                        <CalendarClock className="size-4" /> Choose a trial time
                                    </button>
                                    <div className="flex items-center justify-center gap-3">
                                        <button onClick={message} className="btn btn-ghost btn-sm btn-square rounded-full" title="Message">
                                            <MessageSquare className="size-5 text-base-content/60" />
                                        </button>
                                        <button className="btn btn-ghost btn-sm btn-square rounded-full" title="Save to favorites">
                                            <Heart className="size-5 text-base-content/60" />
                                        </button>
                                        <button className="btn btn-ghost btn-sm btn-square rounded-full" title="Share profile">
                                            <Share2 className="size-5 text-base-content/60" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Not a match? */}
                            <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-sm text-green-800">
                                <p>Not a match? You still have 2 free tutor trials.</p>
                            </div>

                            {/* Popular badge */}
                            {recentBookings > 0 && (
                                <div className="flex items-center gap-2 rounded-2xl border border-base-content/10 bg-base-content/4 p-4">
                                    <TrendingUp className="size-4 shrink-0 text-primary" />
                                    <div>
                                        <p className="text-sm font-semibold text-base-content">Popular</p>
                                        <p className="text-xs text-base-content/60">
                                            {recentBookings} lesson bookings in the last week.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Next available lessons */}
                            {nextSlots.length > 0 && (
                                <div className="card card-border border-base-content/10 bg-base-content/4">
                                    <div className="card-body gap-3">
                                        <p className="text-sm font-medium text-base-content">
                                            Next available lessons: {nextSlots[0].isTomorrow ? 'Tomorrow' : nextSlots[0].day}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {nextSlots.map((slot) => (
                                                <button
                                                    key={slot.id}
                                                    type="button"
                                                    onClick={() => handleSelectSlot(slot.id)}
                                                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                                        selectedSlotId === slot.id
                                                            ? 'border-primary bg-primary text-white'
                                                            : 'border-primary/20 bg-primary/5 text-primary hover:bg-primary/10'
                                                    }`}
                                                >
                                                    {slot.time}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Booking form */}
                            <div id="booking-form" className="card card-border border-primary/30 bg-primary/5">
                                <div className="card-body gap-4">
                                    <div className="flex items-center gap-2 text-primary">
                                        <CalendarClock className="size-4" />
                                        <span className="text-xs font-semibold uppercase tracking-wider">Book a trial lesson</span>
                                    </div>

                                    <form onSubmit={submit} className="space-y-4">
                                        <div className="fieldset">
                                            <legend className="fieldset-legend">Subject</legend>
                                            <select
                                                className="select appearance-none w-full bg-base-content/5"
                                                value={data.subject_id}
                                                onChange={handleSubjectChange}
                                            >
                                                <option value="">Select a subject</option>
                                                {tutor.subjects.map((s) => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                            {rateLabel && (
                                                <p className="mt-1 text-xs text-base-content/50">
                                                    Rate: {rateLabel.text}/hr {rateLabel.note && `(${rateLabel.note})`}
                                                </p>
                                            )}
                                            {errors.subject_id && <span className="text-xs text-error">{errors.subject_id}</span>}
                                        </div>

                                        <div className="fieldset">
                                            <legend className="fieldset-legend">Available Time Slot</legend>
                                            {slots.length === 0 ? (
                                                <p className="py-3 text-sm text-base-content/50">
                                                    No available time slots. The tutor hasn't set their availability yet.
                                                </p>
                                            ) : (
                                                <p className="text-xs text-base-content/60">
                                                    {selectedSlotId
                                                        ? 'Slot selected above. Click "Send Request" to book.'
                                                        : 'Select a slot from the schedule above.'}
                                                </p>
                                            )}
                                            {errors.slot_id && <span className="text-xs text-error">{errors.slot_id}</span>}
                                        </div>

                                        <div className="fieldset">
                                            <legend className="fieldset-legend">Notes</legend>
                                            <textarea
                                                className="textarea w-full bg-base-content/5"
                                                rows={3}
                                                placeholder="Tell the tutor about your goals, level, and what you'd like to cover..."
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                            />
                                            {errors.notes && <span className="text-xs text-error">{errors.notes}</span>}
                                        </div>

                                        <button
                                            type="submit"
                                            className="btn btn-primary w-full rounded-full px-6"
                                            disabled={processing || slots.length === 0 || !data.slot_id}
                                        >
                                            {processing ? 'Sending...' : 'Send Request'}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            <div className="card card-border border-base-content/10 bg-base-content/4">
                                <div className="card-body gap-3">
                                    <p className="text-sm font-medium text-base-content">Questions before booking?</p>
                                    <button
                                        onClick={message}
                                        className="btn btn-outline btn-sm w-full rounded-full gap-2"
                                    >
                                        <MessageSquare className="size-4" /> Message {tutor.name.split(' ')[0]}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}