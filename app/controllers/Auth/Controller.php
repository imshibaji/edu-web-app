<?php

namespace App\Controllers\Auth;

/**
 * This is a base controller for the auth namespace
 */
use App\Models\UserActivity;

class Controller extends \App\Controllers\Controller
{
    protected function requireAdmin()
    {
        $user = $this->authUser();

        if (!$user || !$user->isAdmin()) {
            response()->redirect('/dashboard', 303);
        }

        return $user;
    }

    protected function paginate($query, int $defaultPerPage = 5): array
    {
        $page = max(1, (int) (request()->get('page') ?? 1));
        $perPage = max(1, min(100, (int) (request()->get('per_page') ?? $defaultPerPage)));
        $total = (int) (clone $query)->count();
        $lastPage = max(1, (int) ceil($total / $perPage));
        $page = min($page, $lastPage);

        $items = $query->forPage($page, $perPage)->get();

        return [
            'items' => $items,
            'pagination' => [
                'total' => $total,
                'per_page' => $perPage,
                'current_page' => $page,
                'last_page' => $lastPage,
                'from' => $total === 0 ? 0 : (($page - 1) * $perPage) + 1,
                'to' => min($total, $page * $perPage),
            ],
        ];
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
