<?php

namespace App\Controllers\Auth\admin;

use App\Controllers\Auth\Controller;
use App\Models\AvailabilitySlot;
use App\Models\TutorProfile;
use App\Models\UserActivity;

class TutorsController extends Controller
{
    public function index()
    {
        if (!($user = $this->requireAdmin())) return;

        $search = trim((string) (request()->get('search') ?? ''));
        $verified = (string) (request()->get('verified') ?? 'all');

        $query = TutorProfile::query()
            ->with(['subjects', 'user'])
            ->orderByDesc('created_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('headline', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('email', 'like', "%{$search}%"));
            });
        }

        if (in_array($verified, ['true', 'false'], true)) {
            $query->where('is_verified', $verified === 'true');
        }

        $slotCounts = AvailabilitySlot::query()
            ->where('is_booked', false)
            ->where('start_time', '>', date('Y-m-d H:i:s'))
            ->get()
            ->groupBy('tutor_id')
            ->map->count();

        $result = $this->paginate($query, 5);

        $tutors = collect($result['items'])
            ->map(fn ($t) => [
                'id' => $t->user_id,
                'name' => $t->full_name,
                'email' => $t->user?->email,
                'headline' => $t->headline,
                'city' => $t->city,
                'rate' => (int) $t->hourly_rate,
                'currency' => $t->currency,
                'rating' => (float) $t->rating,
                'verified' => (bool) $t->is_verified,
                'active' => (bool) $t->user?->is_active,
                'subjects' => $t->subjects->map(fn ($s) => $s->name)->values()->all(),
                'slots' => $slotCounts[$t->user_id] ?? 0,
                'created_at' => $t->created_at,
            ])
            ->values()
            ->all();

        response()->inertia('admin/tutors', [
            'tutors' => $tutors,
            'search' => $search,
            'verified' => $verified,
            'pagination' => $result['pagination'],
            'counts' => [
                'all' => TutorProfile::query()->count(),
                'true' => TutorProfile::query()->where('is_verified', true)->count(),
                'false' => TutorProfile::query()->where('is_verified', false)->count(),
            ],
        ]);
    }

    public function verify()
    {
        if (!($user = $this->requireAdmin())) return;

        $profile = TutorProfile::query()->find(request()->get('tutor'));

        if (!$profile) {
            return response()
                ->withFlash('error', 'Tutor not found.')
                ->redirect('/admin/tutors', 303);
        }

        $profile->update(['is_verified' => !(bool) $profile->is_verified]);

        UserActivity::log($user->id, UserActivity::TYPE_PROFILE_APPROVED, sprintf(
            '%s tutor %s',
            $profile->is_verified ? 'Verified' : 'Unverified',
            $profile->full_name
        ));

        return response()
            ->withFlash('success', sprintf('%s is now %s.', $profile->full_name, $profile->is_verified ? 'verified' : 'unverified'))
            ->redirect('/admin/tutors', 303);
    }
}
