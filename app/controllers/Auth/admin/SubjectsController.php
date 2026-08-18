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
            ->withCount('tutors')
            ->orderBy('name')
            ->get()
            ->map(fn ($subject) => [
                'id' => $subject->id,
                'name' => $subject->name,
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

        $subject = Subject::create(['name' => $name]);

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

        $subject->update(['name' => $name]);

        UserActivity::log($user->id, UserActivity::TYPE_SUBJECT_UPDATED, "Renamed subject to {$subject->name}");

        return response()
            ->withFlash('success', "Subject renamed to \"{$subject->name}\".")
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
