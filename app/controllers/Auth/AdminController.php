<?php

namespace App\Controllers\Auth;

use App\Models\TutorProfile;
use App\Models\TutorProfileReview;
use App\Models\User;
use App\Models\UserActivity;

class AdminController extends Controller
{
    public function reviews()
    {
        $user = $this->authUser();

        if (!$user || !$user->isAdmin()) {
            return response()->redirect('/dashboard', 303);
        }

        $reviews = TutorProfileReview::query()
            ->with('tutor.tutorProfile')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($review) => [
                'id' => $review->id,
                'tutorName' => $review->tutor?->tutorProfile?->full_name ?? $review->tutor?->email ?? 'Unknown tutor',
                'status' => $review->status,
                'created_at' => $review->created_at,
                'reviewed_at' => $review->reviewed_at,
                'reviewer' => $review->reviewer?->email,
                'live' => $this->liveProps($review->tutor?->tutorProfile),
                'proposed' => $this->reviewProps($review),
            ])
            ->values()
            ->all();

        response()->inertia('admin/reviews', [
            'reviews' => $reviews,
            'errors' => flash()->display('errors') ?? [],
        ]);
    }

    public function approve()
    {
        $user = $this->authUser();

        if (!$user || !$user->isAdmin()) {
            return response()->redirect('/dashboard', 303);
        }

        $review = TutorProfileReview::query()->find(request()->get('review'));

        if (!$review || $review->status !== TutorProfileReview::STATUS_PENDING) {
            return response()
                ->withFlash('errors', ['review' => 'Review not found or already handled.'])
                ->redirect('/admin/reviews', 303);
        }

        $profile = TutorProfile::query()->find($review->tutor_id);

        if (!$profile) {
            return response()
                ->withFlash('errors', ['review' => 'Tutor profile not found.'])
                ->redirect('/admin/reviews', 303);
        }

        $oldAvatar = $profile->avatar_url;

        $profile->update([
            'full_name' => $review->full_name,
            'headline' => $review->headline,
            'bio' => $review->bio,
            'city' => $review->city,
            'format' => $review->format,
            'experience_level' => $review->experience_level,
            'hourly_rate' => $review->hourly_rate,
            'currency' => $review->currency,
            'avatar_url' => $review->avatar_url ?? $oldAvatar,
        ]);

        if ($review->avatar_url && $oldAvatar && $oldAvatar !== $review->avatar_url) {
            $this->deleteAvatarFile($oldAvatar);
        }

        $review->update([
            'status' => TutorProfileReview::STATUS_APPROVED,
            'reviewed_by' => $user->id(),
            'reviewed_at' => date('Y-m-d H:i:s'),
        ]);

        UserActivity::log($user->id(), UserActivity::TYPE_PROFILE_APPROVED, "Approved profile changes for {$profile->full_name}");

        return response()
            ->withFlash('success', "Changes for {$profile->full_name} published.")
            ->redirect('/admin/reviews', 303);
    }

    public function reject()
    {
        $user = $this->authUser();

        if (!$user || !$user->isAdmin()) {
            return response()->redirect('/dashboard', 303);
        }

        $review = TutorProfileReview::query()->find(request()->get('review'));

        if (!$review || $review->status !== TutorProfileReview::STATUS_PENDING) {
            return response()
                ->withFlash('errors', ['review' => 'Review not found or already handled.'])
                ->redirect('/admin/reviews', 303);
        }

        $review->update([
            'status' => TutorProfileReview::STATUS_REJECTED,
            'reviewed_by' => $user->id(),
            'reviewed_at' => date('Y-m-d H:i:s'),
        ]);

        $tutorName = $review->tutor?->tutorProfile?->full_name ?? 'a tutor';

        UserActivity::log($user->id(), UserActivity::TYPE_PROFILE_REJECTED, "Rejected profile changes for {$tutorName}");

        return response()
            ->withFlash('success', 'Review rejected. The public profile is unchanged.')
            ->redirect('/admin/reviews', 303);
    }

    public function activities()
    {
        $user = $this->authUser();

        if (!$user || !$user->isAdmin()) {
            return response()->redirect('/dashboard', 303);
        }

        $role = (string) request()->get('role', 'all');

        $query = UserActivity::query()
            ->with(['user.tutorProfile', 'user.studentProfile'])
            ->orderByDesc('created_at');

        if (in_array($role, ['tutor', 'student', 'admin'], true)) {
            $query->whereHas('user', fn ($q) => $q->where('role', strtoupper($role)));
        }

        $activities = $query->limit(100)
            ->get()
            ->map(fn ($activity) => UserActivity::present($activity))
            ->values()
            ->all();

        response()->inertia('admin/activities', [
            'activities' => $activities,
            'role' => $role,
            'counts' => [
                'all' => UserActivity::query()->count(),
                'tutor' => $this->activityCount(User::ROLE_TUTOR),
                'student' => $this->activityCount(User::ROLE_STUDENT),
                'admin' => $this->activityCount(User::ROLE_ADMIN),
            ],
        ]);
    }

    protected function activityCount(string $role): int
    {
        return UserActivity::query()
            ->whereHas('user', fn ($q) => $q->where('role', $role))
            ->count();
    }

    protected function liveProps($profile)
    {
        if (!$profile) {
            return null;
        }

        return [
            'full_name' => $profile->full_name,
            'headline' => $profile->headline,
            'bio' => $profile->bio,
            'city' => $profile->city,
            'format' => $profile->format,
            'experience_level' => $profile->experience_level,
            'hourly_rate' => (int) $profile->hourly_rate,
            'currency' => $profile->currency,
            'avatar_url' => $profile->avatar_url,
        ];
    }

    protected function reviewProps($review)
    {
        return [
            'full_name' => $review->full_name,
            'headline' => $review->headline,
            'bio' => $review->bio,
            'city' => $review->city,
            'format' => $review->format,
            'experience_level' => $review->experience_level,
            'hourly_rate' => (int) $review->hourly_rate,
            'currency' => $review->currency,
            'avatar_url' => $review->avatar_url,
        ];
    }

    protected function deleteAvatarFile($path)
    {
        if (!is_string($path) || !str_starts_with($path, 'uploads/avatars/')) {
            return;
        }

        $dir = ($_SERVER['DOCUMENT_ROOT'] ?? (getcwd() . '/public')) . '/uploads/avatars';
        $full = $dir . '/' . basename($path);

        if (is_file($full)) {
            @unlink($full);
        }
    }
}
