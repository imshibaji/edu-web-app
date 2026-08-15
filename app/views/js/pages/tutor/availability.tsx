import { Head, router, useForm } from '@inertiajs/react';
import { CalendarPlus, Trash2, CalendarClock, Clock } from 'lucide-react';

import Navbar from '@/components/larnr/navbar';
import Footer from '@/components/larnr/footer';
import FlashToast from '@/components/larnr/flash-toast';
import { getInitials } from '@/utils/index';
import { formatDateTime } from '@/utils/tutor';
import type { TutorAvailabilityProps, AuthProps } from '@/types';

function AddSlotForm({ form, onSubmit }: { form: ReturnType<typeof useForm<{ start: string; end: string }>>; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void }) {
    return (
        <div className="card card-border border-base-content/10 bg-base-content/[0.04]">
            <div className="card-body gap-4">
                <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                        <CalendarPlus className="size-5" />
                    </span>
                    <div>
                        <h2 className="font-display font-semibold text-base-content">Add a slot</h2>
                        <p className="text-xs text-base-content/50">
                            Open time blocks students can book for trials.
                        </p>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="space-y-3">
                    <div className="fieldset">
                        <legend className="fieldset-legend">Start</legend>
                        <input
                            type="datetime-local"
                            className="input w-full rounded-xl border-base-content/10 bg-base-content/5 text-sm"
                            value={form.data.start}
                            onChange={(e) => form.setData('start', e.target.value)}
                        />
                    </div>
                    <div className="fieldset">
                        <legend className="fieldset-legend">End</legend>
                        <input
                            type="datetime-local"
                            className="input w-full rounded-xl border-base-content/10 bg-base-content/5 text-sm"
                            value={form.data.end}
                            onChange={(e) => form.setData('end', e.target.value)}
                        />
                    </div>
                    {form.errors.start && <p className="text-xs text-error">{form.errors.start}</p>}
                    <button
                        type="submit"
                        className="btn btn-primary btn-sm w-full rounded-full"
                        disabled={form.processing}
                    >
                        {form.processing ? 'Adding...' : 'Add slot'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function SlotList({ slots, onDelete }: { slots: TutorAvailabilityProps['slots']; onDelete: (id: string) => void }) {
    const upcoming = slots.filter((s) => !s.booked && new Date(s.start) > new Date()).length;

    return (
        <div>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-display text-lg font-semibold text-base-content">Availability Slots</h2>
                    <p className="text-xs text-base-content/50">
                        {slots.length} total · {upcoming} open and upcoming
                    </p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-base-content/50">
                    <Clock className="size-3.5" /> Local time
                </span>
            </div>

            <div className="mt-4 space-y-2">
                {slots.length === 0 && (
                    <div className="rounded-xl border border-dashed border-base-content/10 p-10 text-center">
                        <CalendarClock className="mx-auto size-8 text-base-content/40" />
                        <p className="mt-2 text-sm text-base-content/50">
                            No availability slots yet. Add your first one.
                        </p>
                    </div>
                )}

                {slots.map((s) => {
                    const isOpen = !s.booked && new Date(s.start) > new Date();
                    return (
                        <div
                            key={s.id}
                            className={`card card-border border-base-content/10 bg-base-content/[0.04] ${
                                !isOpen ? 'opacity-60' : ''
                            }`}
                        >
                            <div className="card-body flex-row items-center justify-between gap-3 py-3.5">
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`status ${
                                            s.booked ? 'status-error' : 'status-success'
                                        }`}
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-base-content">
                                            {formatDateTime(s.start)}
                                        </p>
                                        <p className="text-xs text-base-content/50">
                                            to {formatDateTime(s.end)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {s.booked && (
                                        <span className="badge badge-warning badge-sm">Booked</span>
                                    )}
                                    {!isOpen && !s.booked && (
                                        <span className="badge badge-neutral badge-sm">Past</span>
                                    )}
                                    {isOpen && (
                                        <button
                                            onClick={() => onDelete(s.id)}
                                            className="btn btn-ghost btn-sm btn-circle text-base-content/50 hover:text-error"
                                            aria-label="Delete slot"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function TutorAvailability(props: TutorAvailabilityProps) {
    const form = useForm({ start: '', end: '' });

    const submitSlot = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        form.post('/tutor/slots', {
            onSuccess: () => form.reset(),
            preserveScroll: true,
        });
    };

    const deleteSlot = (id: string) => {
        router.post('/tutor/slots/delete', { slot: id }, { preserveScroll: true });
    };

    return (
        <div className="min-h-screen bg-base-100 text-base-content">
            <Head title="Availability · Larnr" />

            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
            </div>

            <div className="relative z-10">
                <Navbar auth={props.auth} />
                <FlashToast />

                <div className="space-y-6 py-6">
                    <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h1 className="font-display text-2xl font-bold text-base-content">
                                    Availability
                                </h1>
                                <p className="text-sm text-base-content/60">
                                    Manage the slots students can book for trial lessons.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-xs font-bold text-white">
                                    {getInitials(props.profile.name)}
                                </span>
                                <span className="text-sm font-medium text-base-content/80">{props.profile.name}</span>
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-5">
                            <div className="lg:col-span-2">
                                <AddSlotForm form={form} onSubmit={submitSlot} />
                            </div>
                            <div className="lg:col-span-3">
                                <SlotList slots={props.slots} onDelete={deleteSlot} />
                            </div>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
}