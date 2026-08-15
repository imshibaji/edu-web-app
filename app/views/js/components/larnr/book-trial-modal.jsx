import { useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { X, Sparkles, CalendarClock } from "lucide-react";

export default function BookTrialModal({ tutor, subjects, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        tutor_id: tutor?.id ?? "",
        subject_id: "",
        scheduled_at: "",
        notes: "",
    });

    useEffect(() => {
        if (tutor) {
            reset("subject_id", "scheduled_at", "notes");
            setData("tutor_id", tutor.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tutor?.id]);

    const submit = (e) => {
        e.preventDefault();
        post("/enquiry", {
            onSuccess: () => {
                onClose();
                reset();
            },
            preserveScroll: true,
        });
    };

    if (!tutor) return null;

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
                        <legend className="fieldset-legend">Subject (optional)</legend>
                        <select
                            className="select appearance-none w-full bg-base-content/5"
                            value={data.subject_id}
                            onChange={(e) => setData("subject_id", e.target.value)}
                        >
                            <option value="">Any subject</option>
                            {subjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="fieldset">
                        <legend className="fieldset-legend">Preferred time (optional)</legend>
                        <label className="input flex items-center gap-2 bg-base-content/5">
                            <CalendarClock className="size-4 text-base-content/50" />
                            <input
                                type="datetime-local"
                                className="grow"
                                value={data.scheduled_at}
                                onChange={(e) => setData("scheduled_at", e.target.value)}
                            />
                        </label>
                    </div>

                    <div className="fieldset">
                        <legend className="fieldset-legend">Notes for {tutor.name}</legend>
                        <textarea
                            className="textarea w-full bg-base-content/5"
                            rows={3}
                            placeholder="Tell the tutor about your goals, level, and what you'd like to cover..."
                            value={data.notes}
                            onChange={(e) => setData("notes", e.target.value)}
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
                            disabled={processing}
                        >
                            {processing ? "Sending..." : "Send Request"}
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
