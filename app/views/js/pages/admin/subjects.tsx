import { router } from '@inertiajs/react';
import { useState } from 'react';
import { BookOpen, Pencil, Plus, Trash2, X, Check, Loader2 } from 'lucide-react';

import AdminLayout from '@/components/larnr/admin-layout';
import { useAuth } from '@/utils/index';
import type { AdminSubjectsProps } from '@/types';

export default function AdminSubjects(props: AdminSubjectsProps) {
    const auth = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [slug, setSlug] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draftName, setDraftName] = useState('');
    const [draftDescription, setDraftDescription] = useState('');
    const [draftSlug, setDraftSlug] = useState('');

    const addSubject = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() === '') return;
        router.post(
            '/admin/subjects/create',
            { name, description, slug },
            { preserveScroll: true },
        );
        setName('');
        setDescription('');
        setSlug('');
    };

    const startEdit = (subject: AdminSubjectsProps['subjects'][number]) => {
        setEditingId(subject.id);
        setDraftName(subject.name);
        setDraftDescription(subject.description ?? '');
        setDraftSlug(subject.slug ?? '');
    };

    const saveEdit = (id: string) => {
        router.post(
            '/admin/subjects/update',
            {
                subject: id,
                name: draftName,
                description: draftDescription,
                slug: draftSlug,
            },
            { preserveScroll: true },
        );
        setEditingId(null);
    };

    const approveSubject = (subject: AdminSubjectsProps['subjects'][number]) => {
        router.post('/admin/subjects/approve', { subject: subject.id }, { preserveScroll: true });
    };

    const rejectSubject = (subject: AdminSubjectsProps['subjects'][number]) => {
        if (window.confirm(`Reject "${subject.name}"? It will be removed and unlinked from tutors.`)) {
            router.post('/admin/subjects/reject', { subject: subject.id }, { preserveScroll: true });
        }
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

    const pendingCount = props.subjects.filter((s) => s.status === 'PENDING').length;

    return (
        <AdminLayout
            auth={auth}
            section="subjects"
            title="Subjects"
            heading="Subjects"
            description="Add, review or manage the subjects tutors teach on the platform."
        >
            <form onSubmit={addSubject} className="card card-border border-base-content/10 bg-base-content/[0.04]">
                <div className="card-body gap-3">
                    <div className="flex items-end gap-3">
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
                        <label className="form-control w-64">
                            <span className="mb-1 text-xs font-medium text-base-content/60">
                                Slug (URL)
                            </span>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="e.g. music-theory"
                                className={`input input-bordered rounded-xl ${props.errors.slug ? 'input-error' : ''}`}
                            />
                            {props.errors.slug && (
                                <span className="mt-1 text-xs text-error">{props.errors.slug}</span>
                            )}
                        </label>
                        <button
                            type="submit"
                            className="btn btn-primary rounded-xl"
                            disabled={name.trim() === '' || slug.trim() === ''}
                        >
                            <Plus className="size-4" /> Add subject
                        </button>
                    </div>
                    <label className="form-control w-full">
                        <span className="mb-1 text-xs font-medium text-base-content/60">
                            Description (for SEO)
                        </span>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Short description shown on the subject's public page."
                            rows={2}
                            className="textarea textarea-bordered rounded-xl resize-none"
                        />
                    </label>
                </div>
            </form>

            {pendingCount > 0 && (
                <div className="mt-5 rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm text-base-content/70">
                    <span className="font-semibold text-warning">{pendingCount} pending subject{pendingCount > 1 ? 's' : ''}</span>{' '}
                    proposed by tutors. Approve or reject them below.
                </div>
            )}

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
                    const isPending = subject.status === 'PENDING';
                    return (
                        <div
                            key={subject.id}
                            className={`card card-border bg-base-content/[0.04] ${
                                isPending ? 'border-warning/40' : 'border-base-content/10'
                            }`}
                        >
                            <div className="card-body gap-3 py-3">
                                <div className="flex items-center gap-3">
                                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                                        <BookOpen className="size-4" />
                                    </span>

                                    {editing ? (
                                        <div className="min-w-0 flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={draftName}
                                                    onChange={(e) => setDraftName(e.target.value)}
                                                    autoFocus
                                                    className="input input-bordered input-sm w-full max-w-xs rounded-xl"
                                                />
                                                <input
                                                    type="text"
                                                    value={draftSlug}
                                                    onChange={(e) => setDraftSlug(e.target.value)}
                                                    placeholder="slug"
                                                    className="input input-bordered input-sm w-44 rounded-xl font-mono text-xs"
                                                />
                                                <button
                                                    onClick={() => saveEdit(subject.id)}
                                                    disabled={draftName.trim() === '' || draftSlug.trim() === ''}
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
                                            <textarea
                                                value={draftDescription}
                                                onChange={(e) => setDraftDescription(e.target.value)}
                                                rows={2}
                                                placeholder="Description (for SEO)"
                                                className="textarea textarea-bordered textarea-sm w-full rounded-xl resize-none"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="truncate text-sm font-medium text-base-content">
                                                        {subject.name}
                                                    </p>
                                                    {isPending && (
                                                        <span className="badge badge-sm badge-warning gap-1">
                                                            <Loader2 className="size-3 animate-spin" /> Pending
                                                        </span>
                                                    )}
                                                    {subject.status === 'ACTIVE' && (
                                                        <span className="badge badge-sm badge-success badge-outline">Active</span>
                                                    )}
                                                </div>
                                                {subject.slug && (
                                                    <p className="mt-0.5 font-mono text-xs text-base-content/50">
                                                        /subject/{subject.slug}
                                                    </p>
                                                )}
                                                {subject.description && (
                                                    <p className="mt-1 line-clamp-2 text-xs text-base-content/60">
                                                        {subject.description}
                                                    </p>
                                                )}
                                                {subject.proposer_name && (
                                                    <p className="mt-0.5 text-xs text-base-content/40">
                                                        Proposed by {subject.proposer_name}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="badge badge-sm badge-ghost badge-outline">
                                                {subject.tutor_count} tutor
                                                {subject.tutor_count === 1 ? '' : 's'}
                                            </span>
                                            <div className="flex shrink-0 items-center gap-1">
                                                {isPending && (
                                                    <>
                                                        <button
                                                            onClick={() => approveSubject(subject)}
                                                            className="btn btn-success btn-sm rounded-full"
                                                            title="Approve and publish"
                                                        >
                                                            <Check className="size-4" /> Approve
                                                        </button>
                                                        <button
                                                            onClick={() => rejectSubject(subject)}
                                                            className="btn btn-outline btn-error btn-sm rounded-full"
                                                            title="Reject and remove"
                                                        >
                                                            <X className="size-4" /> Reject
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => startEdit(subject)}
                                                    className="btn btn-ghost btn-sm rounded-full text-base-content/60"
                                                    title="Edit"
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
                        </div>
                    );
                })}
            </div>
        </AdminLayout>
    );
}