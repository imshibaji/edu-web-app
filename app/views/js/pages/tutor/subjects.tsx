import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Trash2, Pencil, X, Check, BookOpen } from 'lucide-react';

import Navbar from '@/components/larnr/navbar';
import Footer from '@/components/larnr/footer';
import FlashToast from '@/components/larnr/flash-toast';
import { getInitials } from '@/utils/index';
import { displayAmount } from '@/utils/currency';
import type { TutorSubjectsProps, TutorSubject, CatalogSubject, AuthProps } from '@/types';

function AddSubjectForm({ catalog, currency, errors }: { catalog: CatalogSubject[]; currency: string; errors: Record<string, string> }) {
    const { data, setData, post, processing, reset } = useForm({
        subjectId: '',
        rate: '',
    });

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/tutor/subjects', {
            onSuccess: () => reset(),
            preserveScroll: true,
        });
    };

    return (
        <div className="card card-border border-base-content/10 bg-base-content/[0.04]">
            <div className="card-body gap-4">
                <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                        <Plus className="size-5" />
                    </span>
                    <div>
                        <h2 className="font-display font-semibold text-base-content">Add a subject</h2>
                        <p className="text-xs text-base-content/50">
                            Pick a subject and set its hourly charge.
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-3">
                    <div className="fieldset">
                        <legend className="fieldset-legend">Subject</legend>
                        <select
                            name="subjectId"
                            className="select appearance-none w-full rounded-xl border-base-content/10 bg-base-content/5"
                            value={data.subjectId}
                            onChange={(e) => setData('subjectId', e.target.value)}
                        >
                            <option value="">Choose a subject…</option>
                            {catalog.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                        {errors?.subjectId && (
                            <span className="text-xs text-error">{errors.subjectId}</span>
                        )}
                    </div>

                    <div className="fieldset">
                        <legend className="fieldset-legend">Charge per hour</legend>
                        <label className="input w-full rounded-xl border-base-content/10 bg-base-content/5">
                            <span className="text-base-content/50">
                                {currency === 'INR' ? '₹' : `${currency} `}
                            </span>
                            <input
                                type="number"
                                name="rate"
                                min="0"
                                step="0.01"
                                placeholder="e.g. 30"
                                value={data.rate}
                                onChange={(e) => setData('rate', e.target.value)}
                            />
                        </label>
                        {errors?.rate && <span className="text-xs text-error">{errors.rate}</span>}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-sm w-full rounded-full"
                        disabled={processing || catalog.length === 0}
                    >
                        {processing ? 'Adding…' : 'Add subject'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function SubjectRow({ subject, currency, auth, onRemove }: { subject: TutorSubject; currency: string; auth: AuthProps; onRemove: (id: string) => void }) {
    const [editing, setEditing] = useState(false);
    const { data, setData, post, processing } = useForm({
        subjectId: subject.id,
        rate: subject.rate_cents / 100,
    });

    const save = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/tutor/subjects/update', {
            preserveScroll: true,
            onSuccess: () => setEditing(false),
        });
    };

    const display = displayAmount(subject.rate_cents, currency, auth);

    return (
        <div className="card card-border border-base-content/10 bg-base-content/[0.04]">
            <div className="card-body flex-row items-center justify-between gap-3 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                        <BookOpen className="size-4" />
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-base-content">
                            {subject.name}
                        </p>
                        {editing ? (
                            <form onSubmit={save} className="mt-1 flex items-center gap-2">
                                <label className="input input-sm w-32 rounded-xl border-base-content/10 bg-base-content/5">
                                    <span className="text-base-content/50">
                                        {currency === 'INR' ? '₹' : `${currency} `}
                                    </span>
                                    <input
                                        type="number"
                                        name="rate"
                                        min="0"
                                        step="0.01"
                                        value={data.rate}
                                        onChange={(e) => setData('rate', e.target.value)}
                                        autoFocus
                                    />
                                </label>
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-xs btn-circle"
                                    disabled={processing}
                                    aria-label="Save charge"
                                >
                                    <Check className="size-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditing(false)}
                                    className="btn btn-ghost btn-xs btn-circle text-base-content/50"
                                    aria-label="Cancel edit"
                                >
                                    <X className="size-4" />
                                </button>
                            </form>
                        ) : (
                            <p className="text-xs text-base-content/50">
                                {subject.rate_cents > 0 ? (
                                    <>
                                        {display.text} per hour
                                        {display.note && (
                                            <span className="ml-1 text-base-content/40">
                                                ({display.note})
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    'Rate on request'
                                )}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {!editing && (
                        <button
                            onClick={() => setEditing(true)}
                            className="btn btn-ghost btn-sm btn-circle text-base-content/50 hover:text-primary"
                            aria-label="Edit charge"
                        >
                            <Pencil className="size-4" />
                        </button>
                    )}
                    <button
                        onClick={() => onRemove(subject.id)}
                        className="btn btn-ghost btn-sm btn-circle text-base-content/50 hover:text-error"
                        aria-label={`Remove ${subject.name}`}
                    >
                        <Trash2 className="size-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function TutorSubjects(props: TutorSubjectsProps) {
    const removeSubject = (id: string) => {
        router.post('/tutor/subjects/remove', { subjectId: id }, { preserveScroll: true });
    };

    return (
        <div className="min-h-screen bg-base-100 text-base-content">
            <Head title="Subjects & Charges · Larnr" />

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
                                    Subjects & Charges
                                </h1>
                                <p className="text-sm text-base-content/60">
                                    Set which subjects you teach and what you charge for each.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-xs font-bold text-white">
                                    {getInitials(props.profile.name)}
                                </span>
                                <span className="text-sm font-medium text-base-content/80">
                                    {props.profile.name}
                                </span>
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-5">
                            <div className="lg:col-span-2">
                                <AddSubjectForm catalog={props.catalog} currency={props.profile.currency} errors={props.errors} />
                            </div>

                            <div className="lg:col-span-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="font-display text-lg font-semibold text-base-content">
                                            Your subjects
                                        </h2>
                                        <p className="text-xs text-base-content/50">
                                            {props.subjects.length} total · shown on your public profile
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2">
                                    {props.subjects.length === 0 && (
                                        <div className="rounded-xl border border-dashed border-base-content/10 p-10 text-center">
                                            <BookOpen className="mx-auto size-8 text-base-content/40" />
                                            <p className="mt-2 text-sm text-base-content/50">
                                                No subjects yet. Add your first one to appear on your
                                                public profile.
                                            </p>
                                        </div>
                                    )}
                                    {props.subjects.map((s) => (
                                        <SubjectRow
                                            key={s.id}
                                            subject={s}
                                            currency={props.profile.currency}
                                            auth={props.auth}
                                            onRemove={removeSubject}
                                        />
                                    ))}
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