import { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { X, Sparkles, CalendarClock } from 'lucide-react';

import { displayAmount } from '@/utils/currency';
import type { Tutor as TutorType, AvailableSlot, AuthProps } from '@/types';

interface FormData {
    tutor_id: string;
    subject_id: string;
    slot_id: string;
    notes: string;
}

interface Props {
    tutor: TutorType | null;
    auth: AuthProps;
    onClose: () => void;
}

function formatSlotDisplay(slot: AvailableSlot): string {
    const start = new Date(slot.start + 'Z');
    const end = new Date(slot.end + 'Z');
    const opts: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
    };
    const startStr = start.toLocaleString(undefined, opts);
    const endStr = end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
    return `${startStr} – ${endStr}`;
}

export default function BookTrialModal({ tutor, auth, onClose }: Props) {
    const [slots, setSlots] = useState<AvailableSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedRate, setSelectedRate] = useState<number | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm<FormData>({
        tutor_id: tutor?.id ?? '',
        subject_id: '',
        slot_id: '',
        notes: '',
    });

    useEffect(() => {
        if (tutor) {
            reset('subject_id', 'slot_id', 'notes');
            setData('tutor_id', tutor.id);
            setSelectedRate(null);
            setSlots([]);

            setLoadingSlots(true);
            fetch(`/api/tutor/${tutor.id}/available-slots`)
                .then((res) => res.json())
                .then((json) => setSlots(json.slots ?? []))
                .catch(() => setSlots([]))
                .finally(() => setLoadingSlots(false));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tutor?.id]);

    const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const subjectId = e.target.value;
        setData('subject_id', subjectId);

        if (!subjectId || !tutor) {
            setSelectedRate(null);
            return;
        }

        const match = tutor.subjects.find((s) => s.id === subjectId);
        setSelectedRate(match ? match.rate_cents : null);
    };

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/enquiry', {
            onSuccess: () => {
                onClose();
                reset();
            },
            preserveScroll: true,
        });
    };

    if (!tutor) return null;

    const rateLabel = selectedRate !== null
        ? displayAmount(selectedRate, tutor.currency, auth)
        : null;

    return (
        <dialog id="book-trial-modal" className="modal modal-open" onClose={onClose}>
            <div className="modal-box max-w-lg rounded-2xl border border-base-content/10 bg-base-200 text-base-content">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-primary">
                            <Sparkles className="size-4" />
                            <span className="text-xs font-semibold uppercase tracking-wider">
                                Book a Trial Lesson
                            </span>
                        </div>
                        <h3 className="font-display mt-2 text-xl font-bold text-base-content">
                            {tutor.name}
                        </h3>
                        <p className="mt-1 text-sm text-base-content/60">{tutor.headline}</p>
                    </div>
                    <button onClick={onClose} className="btn btn-circle btn-ghost btn-sm">
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={submit} className="mt-6 space-y-4">
                    <div className="fieldset">
                        <legend className="fieldset-legend">Subject</legend>
                        <select
                            className="select appearance-none w-full bg-base-content/5"
                            value={data.subject_id}
                            onChange={handleSubjectChange}
                        >
                            <option value="">Select a subject</option>
                            {tutor.subjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                        {rateLabel && (
                            <p className="mt-1 text-xs text-base-content/50">
                                Rate: {rateLabel.text}/hr {rateLabel.note && `(${rateLabel.note})`}
                            </p>
                        )}
                        {errors.subject_id && (
                            <span className="text-xs text-error">{errors.subject_id}</span>
                        )}
                    </div>

                    <div className="fieldset">
                        <legend className="fieldset-legend">Available Time Slot</legend>
                        {loadingSlots ? (
                            <div className="flex items-center gap-2 py-3 text-sm text-base-content/50">
                                <span className="loading loading-spinner loading-sm"></span>
                                Loading available slots...
                            </div>
                        ) : slots.length === 0 ? (
                            <p className="py-3 text-sm text-base-content/50">
                                No available time slots. The tutor hasn't set their availability yet.
                            </p>
                        ) : (
                            <label className="flex items-center gap-2 bg-base-content/5">
                                <CalendarClock className="size-4 ml-2 text-base-content/50 shrink-0" />
                                <select
                                    className="select appearance-none w-full bg-transparent"
                                    value={data.slot_id}
                                    onChange={(e) => setData('slot_id', e.target.value)}
                                >
                                    <option value="">Select a time slot</option>
                                    {slots.map((slot) => (
                                        <option key={slot.id} value={slot.id}>
                                            {formatSlotDisplay(slot)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}
                        {errors.slot_id && (
                            <span className="text-xs text-error">{errors.slot_id}</span>
                        )}
                    </div>

                    <div className="fieldset">
                        <legend className="fieldset-legend">Notes for {tutor.name}</legend>
                        <textarea
                            className="textarea w-full bg-base-content/5"
                            rows={3}
                            placeholder="Tell the tutor about your goals, level, and what you'd like to cover..."
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                        />
                        {errors.notes && (
                            <span className="text-xs text-error">{errors.notes}</span>
                        )}
                    </div>

                    <div className="modal-action">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-ghost rounded-full"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary rounded-full px-6"
                            disabled={processing || slots.length === 0}
                        >
                            {processing ? 'Sending...' : 'Send Request'}
                        </button>
                    </div>
                </form>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </dialog>
    );
}
