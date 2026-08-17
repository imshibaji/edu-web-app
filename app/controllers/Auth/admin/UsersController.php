<?php

namespace App\Controllers\Auth\admin;

use App\Controllers\Auth\Controller;
use App\Models\User;
use App\Models\UserActivity;

class UsersController extends Controller
{
    public function index()
    {
        if (!($user = $this->requireAdmin())) return;

        $role = (string) (request()->get('role') ?? 'all');
        $search = trim((string) (request()->get('search') ?? ''));

        $query = User::query()
            ->with(['tutorProfile', 'studentProfile'])
            ->orderByDesc('created_at');

        if (in_array(strtoupper($role), [User::ROLE_STUDENT, User::ROLE_TUTOR, User::ROLE_ADMIN], true)) {
            $query->where('role', strtoupper($role));
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                    ->orWhereHas('tutorProfile', fn ($p) => $p->where('full_name', 'like', "%{$search}%"))
                    ->orWhereHas('studentProfile', fn ($p) => $p->where('full_name', 'like', "%{$search}%"));
            });
        }

        $result = $this->paginate($query, 5);

        $users = collect($result['items'])
            ->map(fn ($u) => [
                'id' => $u->id,
                'email' => $u->email,
                'role' => $u->role,
                'name' => $u->tutorProfile?->full_name ?? $u->studentProfile?->full_name,
                'is_active' => (bool) $u->is_active,
                'created_at' => $u->created_at,
            ])
            ->values()
            ->all();

        response()->inertia('admin/users', [
            'users' => $users,
            'role' => $role,
            'search' => $search,
            'pagination' => $result['pagination'],
            'counts' => [
                'all' => User::query()->count(),
                'STUDENT' => User::query()->where('role', User::ROLE_STUDENT)->count(),
                'TUTOR' => User::query()->where('role', User::ROLE_TUTOR)->count(),
                'ADMIN' => User::query()->where('role', User::ROLE_ADMIN)->count(),
            ],
        ]);
    }

    public function toggle()
    {
        if (!($user = $this->requireAdmin())) return;

        $target = User::query()->find(request()->get('user'));

        if (!$target) {
            return response()
                ->withFlash('error', 'User not found.')
                ->redirect('/admin/users', 303);
        }

        if ($target->id === $user->id) {
            return response()
                ->withFlash('error', 'You cannot deactivate your own account.')
                ->redirect('/admin/users', 303);
        }

        $target->update(['is_active' => !(bool) $target->is_active]);

        UserActivity::log($user->id, UserActivity::TYPE_ACCOUNT_UPDATED, sprintf(
            '%s %s account for %s',
            $target->is_active ? 'Activated' : 'Deactivated',
            strtolower($target->role),
            $target->email
        ));

        return response()
            ->withFlash('success', sprintf('%s is now %s.', $target->email, $target->is_active ? 'active' : 'deactivated'))
            ->redirect('/admin/users', 303);
    }
}
