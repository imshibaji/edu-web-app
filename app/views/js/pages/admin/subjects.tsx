import { router } from '@inertiajs/react';
import { useState } from 'react';
import { BookOpen, Pencil, Plus, Trash2, X, Check } from 'lucide-react';

import AdminLayout from '@/components/larnr/admin-layout';
import { useAuth } from '@/utils/index';
import type { AdminSubjectsProps } from '@/types';

export default function AdminSubjects(props: AdminSubjectsProps) {
    const auth = useAuth();
    const [name, setName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draftName, setDraftName] = useState('');

    const addSubject = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() === '') return;
        router.post('/admin/subjects/create', { name }, { preserveScroll: true });
        setName('');
    };

    const startEdit = (id: string, current: string) => {
        setEditingId(id);
        setDraftName(current);
    };

    const saveEdit = (id: string) => {
        router.post(
            '/admin/subjects/update',
            { subject: id, name: draftName },
            { preserveScroll: true },
        );
        setEditingId(null);
    };

    const deleteSubject = (subject: AdminSubjectsProps['subjects'][number]) => {
        const message =
            subject.tutor_count > 0
                ? `Delete "${subject.name}"? ${subject.tutor_count} tutor${subject.tutor_count === 1 ? '' : 's'} teach this subject and will no longer list it.`
                : `Delete "${subject.name}"?`;
        if (window.confirm(message)) {
            router.post('/admin/subjects/delete', { subject: subject.id }, { preserveScroll: true });
        }
    };

    return (
        <AdminLayout
            auth={auth}
            section="subjects"
            title="Subjects"
            heading="Subjects"
            description="Add, rename or remove the subjects tutors can teach on the platform."
        >
            <form onSubmit={addSubject} className="card card-border border-base-content/10 bg-base-content/[0.04]">
                <div className="card-body flex-row items-end gap-3">
                    <label className="form-control w-full">
                        <span className="mb-1 text-xs font-medium text-base-content/60">
                            New subject
                        </span>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Music Theory"
                            className={`input input-bordered rounded-xl ${props.errors.name ? 'input-error' : ''}`}
                        />
                        {props.errors.name && (
                            <span className="mt-1 text-xs text-error">{props.errors.name}</span>
                        )}
                    </label>
                    <button
                        type="submit"
                        className="btn btn-primary rounded-xl"
                        disabled={name.trim() === ''}
                    >
                        <Plus className="size-4" /> Add subject
                    </button>
                </div>
            </form>

            <div className="mt-5 space-y-2">
                {props.subjects.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-base-content/10 p-12 text-center">
                        <BookOpen className="mx-auto size-8 text-base-content/40" />
                        <p className="mt-3 text-sm text-base-content/50">
                            No subjects yet. Add your first one above.
                        </p>
                    </div>
                )}

                {props.subjects.map((subject) => {
                    const editing = editingId === subject.id;
                    return (
                        <div
                            key={subject.id}
                            className="card card-border border-base-content/10 bg-base-content/[0.04]"
                        >
                            <div className="card-body flex-row items-center gap-3 py-3">
                                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                                    <BookOpen className="size-4" />
                                </span>

                                {editing ? (
                                    <div className="flex min-w-0 flex-1 items-center gap-2">
                                        <input
                                            type="text"
                                            value={draftName}
                                            onChange={(e) => setDraftName(e.target.value)}
                                            autoFocus
                                            className="input input-bordered input-sm w-full max-w-xs rounded-xl"
                                        />
                                        <button
                                            onClick={() => saveEdit(subject.id)}
                                            disabled={draftName.trim() === ''}
                                            className="btn btn-primary btn-sm rounded-full"
                                        >
                                            <Check className="size-4" /> Save
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="btn btn-ghost btn-sm rounded-full"
                                        >
                                            <X className="size-4" /> Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-base-content">
                                                {subject.name}
                                            </p>
                                        </div>
                                        <span className="badge badge-sm badge-ghost badge-outline">
                                            {subject.tutor_count} tutor
                                            {subject.tutor_count === 1 ? '' : 's'}
                                        </span>
                                        <div className="flex shrink-0 items-center gap-1">
                                            <button
                                                onClick={() => startEdit(subject.id, subject.name)}
                                                className="btn btn-ghost btn-sm rounded-full text-base-content/60"
                                                title="Rename"
                                            >
                                                <Pencil className="size-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteSubject(subject)}
                                                className="btn btn-ghost btn-sm rounded-full text-error"
                                                title="Delete"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </AdminLayout>
    );
}
