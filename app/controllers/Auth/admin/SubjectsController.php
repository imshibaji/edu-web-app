<?php

namespace App\Controllers\Auth\admin;

use App\Controllers\Auth\Controller;
use App\Models\Subject;
use App\Models\TutorSubject;
use App\Models\UserActivity;

class SubjectsController extends Controller
{
    public function index()
    {
        if (!($user = $this->requireAdmin())) return;

        $subjects = Subject::query()
            ->with('proposer.tutorProfile')
            ->withCount('tutors')
            ->orderByRaw("FIELD(status, 'PENDING', 'ACTIVE', 'REJECTED')")
            ->orderBy('name')
            ->get()
            ->map(fn ($subject) => [
                'id' => $subject->id,
                'name' => $subject->name,
                'description' => $subject->description,
                'slug' => $subject->slug,
                'status' => $subject->status,
                'proposed_by' => $subject->proposed_by,
                'proposer_name' => $subject->proposer?->tutorProfile?->full_name
                    ?? $subject->proposer?->email,
                'tutor_count' => (int) $subject->tutors_count,
            ])
            ->values()
            ->all();

        response()->inertia('admin/subjects', [
            'subjects' => $subjects,
            'errors' => flash()->display('errors') ?? [],
        ]);
    }

    public function create()
    {
        if (!($user = $this->requireAdmin())) return;

        $name = trim((string) request()->get('name', ''));
        $description = trim((string) request()->get('description', ''));
        $slug = trim((string) request()->get('slug', ''));

        if ($name === '') {
            return response()
                ->withFlash('errors', ['name' => 'Subject name is required.'])
                ->redirect('/admin/subjects', 303);
        }

        if (Subject::query()->whereRaw('LOWER(name) = ?', [strtolower($name)])->exists()) {
            return response()
                ->withFlash('errors', ['name' => 'A subject with that name already exists.'])
                ->redirect('/admin/subjects', 303);
        }

        if ($slug === '' || preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug) !== 1) {
            return response()
                ->withFlash('errors', ['slug' => 'Slug must be lowercase letters, numbers and hyphens (e.g. coding-programming).'])
                ->redirect('/admin/subjects', 303);
        }

        if (Subject::query()->where('slug', $slug)->exists()) {
            return response()
                ->withFlash('errors', ['slug' => 'A subject with that slug already exists.'])
                ->redirect('/admin/subjects', 303);
        }

        $subject = Subject::create([
            'name' => $name,
            'description' => $description !== '' ? $description : null,
            'slug' => $slug,
            'status' => Subject::STATUS_ACTIVE,
        ]);

        UserActivity::log($user->id, UserActivity::TYPE_SUBJECT_ADDED, "Created subject {$subject->name}");

        return response()
            ->withFlash('success', "Subject \"{$subject->name}\" created.")
            ->redirect('/admin/subjects', 303);
    }

    public function update()
    {
        if (!($user = $this->requireAdmin())) return;

        $subject = Subject::query()->find(request()->get('subject'));
        $name = trim((string) request()->get('name', ''));
        $description = trim((string) request()->get('description', ''));
        $slug = trim((string) request()->get('slug', ''));

        if (!$subject) {
            return response()
                ->withFlash('error', 'Subject not found.')
                ->redirect('/admin/subjects', 303);
        }

        if ($name === '') {
            return response()
                ->withFlash('errors', ['name' => 'Subject name is required.'])
                ->redirect('/admin/subjects', 303);
        }

        if (Subject::query()
            ->where('id', '!=', $subject->id)
            ->whereRaw('LOWER(name) = ?', [strtolower($name)])
            ->exists()) {
            return response()
                ->withFlash('errors', ['name' => 'A subject with that name already exists.'])
                ->redirect('/admin/subjects', 303);
        }

        if ($slug === '' || preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug) !== 1) {
            return response()
                ->withFlash('errors', ['slug' => 'Slug must be lowercase letters, numbers and hyphens (e.g. coding-programming).'])
                ->redirect('/admin/subjects', 303);
        }

        if (Subject::query()
            ->where('id', '!=', $subject->id)
            ->where('slug', $slug)
            ->exists()) {
            return response()
                ->withFlash('errors', ['slug' => 'A subject with that slug already exists.'])
                ->redirect('/admin/subjects', 303);
        }

        $subject->update([
            'name' => $name,
            'description' => $description !== '' ? $description : null,
            'slug' => $slug,
        ]);

        UserActivity::log($user->id, UserActivity::TYPE_SUBJECT_UPDATED, "Updated subject {$subject->name}");

        return response()
            ->withFlash('success', "Subject updated to \"{$subject->name}\".")
            ->redirect('/admin/subjects', 303);
    }

    /**
     * Approve a tutor-proposed subject so it becomes publicly visible.
     */
    public function approve()
    {
        if (!($user = $this->requireAdmin())) return;

        $subject = Subject::query()->find(request()->get('subject'));

        if (!$subject) {
            return response()
                ->withFlash('error', 'Subject not found.')
                ->redirect('/admin/subjects', 303);
        }

        if ($subject->status !== Subject::STATUS_PENDING) {
            return response()
                ->withFlash('error', 'Only pending subjects can be approved.')
                ->redirect('/admin/subjects', 303);
        }

        $subject->update([
            'status' => Subject::STATUS_ACTIVE,
            'proposed_by' => null,
        ]);

        UserActivity::log($user->id, UserActivity::TYPE_SUBJECT_UPDATED, "Approved subject {$subject->name}");

        return response()
            ->withFlash('success', "Subject \"{$subject->name}\" approved and published.")
            ->redirect('/admin/subjects', 303);
    }

    /**
     * Reject a tutor-proposed subject and unlink it from tutors.
     */
    public function reject()
    {
        if (!($user = $this->requireAdmin())) return;

        $subject = Subject::query()->find(request()->get('subject'));

        if (!$subject) {
            return response()
                ->withFlash('error', 'Subject not found.')
                ->redirect('/admin/subjects', 303);
        }

        if ($subject->status !== Subject::STATUS_PENDING) {
            return response()
                ->withFlash('error', 'Only pending subjects can be rejected.')
                ->redirect('/admin/subjects', 303);
        }

        $name = $subject->name;

        TutorSubject::query()->where('subject_id', $subject->id)->delete();
        $subject->delete();

        UserActivity::log($user->id, UserActivity::TYPE_SUBJECT_REMOVED, "Rejected subject {$name}");

        return response()
            ->withFlash('success', "Subject \"{$name}\" rejected and removed.")
            ->redirect('/admin/subjects', 303);
    }

    public function delete()
    {
        if (!($user = $this->requireAdmin())) return;

        $subject = Subject::query()->find(request()->get('subject'));

        if (!$subject) {
            return response()
                ->withFlash('error', 'Subject not found.')
                ->redirect('/admin/subjects', 303);
        }

        $name = $subject->name;

        TutorSubject::query()->where('subject_id', $subject->id)->delete();
        $subject->delete();

        UserActivity::log($user->id, UserActivity::TYPE_SUBJECT_REMOVED, "Deleted subject {$name}");

        return response()
            ->withFlash('success', "Subject \"{$name}\" deleted.")
            ->redirect('/admin/subjects', 303);
    }
}