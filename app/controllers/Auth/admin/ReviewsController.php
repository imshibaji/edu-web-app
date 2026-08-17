<?php

namespace App\Controllers\Auth\admin;

use App\Controllers\Auth\Controller;
use App\Models\TutorProfile;
use App\Models\TutorProfileReview;
use App\Models\UserActivity;

class ReviewsController extends Controller
{
    public function reviews()
    {
        if (!($user = $this->requireAdmin())) return;

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
        if (!($user = $this->requireAdmin())) return;

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
            'reviewed_by' => $user->id,
            'reviewed_at' => date('Y-m-d H:i:s'),
        ]);

        UserActivity::log($user->id, UserActivity::TYPE_PROFILE_APPROVED, "Approved profile changes for {$profile->full_name}");

        return response()
            ->withFlash('success', "Changes for {$profile->full_name} published.")
            ->redirect('/admin/reviews', 303);
    }

    public function reject()
    {
        if (!($user = $this->requireAdmin())) return;

        $review = TutorProfileReview::query()->find(request()->get('review'));

        if (!$review || $review->status !== TutorProfileReview::STATUS_PENDING) {
            return response()
                ->withFlash('errors', ['review' => 'Review not found or already handled.'])
                ->redirect('/admin/reviews', 303);
        }

        $review->update([
            'status' => TutorProfileReview::STATUS_REJECTED,
            'reviewed_by' => $user->id,
            'reviewed_at' => date('Y-m-d H:i:s'),
        ]);

        $tutorName = $review->tutor?->tutorProfile?->full_name ?? 'a tutor';

        UserActivity::log($user->id, UserActivity::TYPE_PROFILE_REJECTED, "Rejected profile changes for {$tutorName}");

        return response()
            ->withFlash('success', 'Review rejected. The public profile is unchanged.')
            ->redirect('/admin/reviews', 303);
    }
}
