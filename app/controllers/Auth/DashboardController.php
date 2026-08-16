<?php

namespace App\Controllers\Auth;

use App\Models\Booking;
use App\Models\User;
use App\Models\UserActivity;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        if (!$user) {
            return response()->redirect('/auth/login', 303);
        }

        $user = User::query()->with('tutorProfile', 'studentProfile')->find($user->id());

        if (!$user) {
            return response()->redirect('/auth/login', 303);
        }

        if ($user->isTutor()) {
            return response()->redirect('/tutor', 303);
        }

        if ($user->isAdmin()) {
            return $this->adminDashboard($user);
        }

        return $this->studentDashboard($user);
    }

    public function studentDashboard(User $user)
    {
        $bookings = Booking::query()
            ->where('student_id', $user->id)
            ->with(['tutor.tutorProfile', 'subject'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($booking) => [
                'id' => $booking->id,
                'tutor' => $booking->tutor?->tutorProfile?->full_name ?? 'Unknown tutor',
                'subject' => $booking->subject?->name,
                'scheduled_at' => $booking->scheduled_at,
                'amount' => $booking->amount,
                'currency' => $booking->currency,
                'status' => $booking->status,
                'notes' => $booking->notes,
                'created_at' => $booking->created_at,
            ])
            ->values()
            ->all();

        $profile = $user->studentProfile;

        response()->inertia('dashboard', [
            'role' => User::ROLE_STUDENT,
            'profile' => [
                'name' => $profile?->full_name ?? 'Student',
                'phone' => $profile?->phone_number,
            ],
            'bookings' => $bookings,
        ]);
    }

    public function adminDashboard(User $user)
    {
        $todayStart = gmdate('Y-m-d 00:00:00');

        $recentActivities = UserActivity::query()
            ->with(['user.tutorProfile', 'user.studentProfile'])
            ->orderByDesc('created_at')
            ->limit(3)
            ->get()
            ->map(fn ($activity) => UserActivity::present($activity))
            ->values()
            ->all();

        response()->inertia('dashboard', [
            'role' => User::ROLE_ADMIN,
            'stats' => [
                'tutors' => (int) User::query()->where('role', User::ROLE_TUTOR)->count(),
                'students' => (int) User::query()->where('role', User::ROLE_STUDENT)->count(),
                'bookings' => (int) Booking::query()->count(),
                'pending' => (int) Booking::query()->where('status', Booking::STATUS_PENDING_PAYMENT)->count(),
                'activityToday' => (int) UserActivity::query()->where('created_at', '>=', $todayStart)->count(),
            ],
            'activities' => $recentActivities,
        ]);
    }
}
