<?php

namespace App\Controllers\Auth\admin;

use App\Controllers\Auth\Controller;
use App\Models\User;
use App\Models\UserActivity;

class ActivitiesController extends Controller
{
    public function index()
    {
        if (!($user = $this->requireAdmin())) return;

        $role = (string) (request()->get('role') ?? 'all');
        $search = trim((string) (request()->get('search') ?? ''));

        $query = UserActivity::query()
            ->with(['user.tutorProfile', 'user.studentProfile'])
            ->orderByDesc('created_at');

        if (in_array($role, ['tutor', 'student', 'admin'], true)) {
            $query->whereHas('user', fn ($q) => $q->where('role', strtoupper($role)));
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($u) use ($search) {
                        $u->where('email', 'like', "%{$search}%")
                            ->orWhereHas('tutorProfile', fn ($p) => $p->where('full_name', 'like', "%{$search}%"))
                            ->orWhereHas('studentProfile', fn ($p) => $p->where('full_name', 'like', "%{$search}%"));
                    });
            });
        }

        $result = $this->paginate($query, 5);

        $activities = collect($result['items'])
            ->map(fn ($activity) => UserActivity::present($activity))
            ->values()
            ->all();

        response()->inertia('admin/activities', [
            'activities' => $activities,
            'role' => $role,
            'search' => $search,
            'pagination' => $result['pagination'],
            'counts' => [
                'all' => UserActivity::query()->count(),
                'tutor' => $this->activityCount(User::ROLE_TUTOR),
                'student' => $this->activityCount(User::ROLE_STUDENT),
                'admin' => $this->activityCount(User::ROLE_ADMIN),
            ],
        ]);
    }
}
