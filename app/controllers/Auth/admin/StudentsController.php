<?php

namespace App\Controllers\Auth\admin;

use App\Controllers\Auth\Controller;
use App\Models\User;

class StudentsController extends Controller
{
    public function index()
    {
        if (!($user = $this->requireAdmin())) return;

        $search = trim((string) (request()->get('search') ?? ''));

        $query = User::query()
            ->where('role', User::ROLE_STUDENT)
            ->with(['studentProfile'])
            ->withCount('bookingsAsStudent');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                    ->orWhereHas('studentProfile', fn ($p) => $p->where('full_name', 'like', "%{$search}%")->orWhere('phone_number', 'like', "%{$search}%"));
            });
        }

        $result = $this->paginate($query->orderByDesc('created_at'), 5);

        $students = collect($result['items'])
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->studentProfile?->full_name,
                'email' => $u->email,
                'phone' => $u->studentProfile?->phone_number,
                'bookings' => (int) $u->bookings_as_student_count,
                'active' => (bool) $u->is_active,
                'created_at' => $u->created_at,
            ])
            ->values()
            ->all();

        response()->inertia('admin/students', [
            'students' => $students,
            'search' => $search,
            'pagination' => $result['pagination'],
            'counts' => [
                'total' => User::query()->where('role', User::ROLE_STUDENT)->count(),
                'active' => User::query()->where('role', User::ROLE_STUDENT)->where('is_active', true)->count(),
            ],
        ]);
    }
}
