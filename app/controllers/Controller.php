<?php

namespace App\Controllers;

use App\Models\AvailabilitySlot;
use App\Models\Currency;
use App\Models\Notification;
use App\Models\Subject;
use App\Models\TutorProfile;
use App\Models\User;

/**
 * This is the base controller for your Leaf MVC Project.
 * You can initialize packages or define methods here to use
 * them across all your other controllers which extend this one.
 */
class Controller extends \Leaf\Controller
{
    /**
     * Resolve the authenticated user as a full Eloquent model.
     *
     * auth()->user() returns a Leaf\Auth\User wrapper whose __call()
     * never throws and always returns a truthy object, so role checks
     * (isTutor/isAdmin) must run against the real model instead.
     */
    protected function authUser(): ?User
    {
        $auth = auth()->user();

        if (!$auth || !$auth->id()) {
            return null;
        }

        return User::query()->find($auth->id());
    }

    /**
     * Build the shared public tutor-listing payload (filters, tutors,
     * breakdowns and stats) used by the home and /tutors pages.
     */
    protected function tutorListingData($request)
    {
        $keyword = trim((string) $request->get('keyword', ''));
        $city = (string) $request->get('city', '');
        $format = (string) $request->get('format', '');
        $level = (string) $request->get('experience', '');
        $perPage = (int) $request->get('perPage', 5);

        if (!in_array($perPage, [5, 10, 15], true)) {
            $perPage = 5;
        }

        $query = TutorProfile::query()
            ->with(['subjects' => fn ($q) => $q->active(), 'user'])
            ->orderByDesc('rating')
            ->orderBy('user_id');

        if ($keyword !== '') {
            $query->where(function ($q) use ($keyword) {
                $q->where('full_name', 'like', "%{$keyword}%")
                    ->orWhere('headline', 'like', "%{$keyword}%")
                    ->orWhere('bio', 'like', "%{$keyword}%")
                    ->orWhere('city', 'like', "%{$keyword}%")
                    ->orWhereHas('subjects', fn ($s) => $s->where('name', 'like', "%{$keyword}%"));
            });
        }

        if ($city !== '') {
            $query->where('city', $city);
        }

        if (in_array($format, ['ONLINE', 'IN_PERSON', 'BOTH'], true)) {
            $query->where('format', $format);
        }

        if (in_array($level, ['ENTRY', 'MID', 'SENIOR'], true)) {
            $query->where('experience_level', $level);
        }

        $total = (clone $query)->count();
        $tutors = $query->limit($perPage)->get();

        $availableByTutor = AvailabilitySlot::query()
            ->where('is_booked', false)
            ->where('start_time', '>', date('Y-m-d H:i:s'))
            ->get()
            ->groupBy('tutor_id')
            ->map->count();

        $allCities = TutorProfile::query()
            ->select('city')
            ->distinct()
            ->orderBy('city')
            ->pluck('city')
            ->reject(fn ($c) => $c === null || $c === '')
            ->values()
            ->all();

        $cityBreakdown = \Illuminate\Database\Capsule\Manager::table('tutor_profiles')
            ->select('city')
            ->selectRaw('COUNT(*) as count')
            ->whereNotNull('city')
            ->groupBy('city')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($row) => [
                'city' => $row->city,
                'count' => (int) $row->count,
            ])
            ->values()
            ->all();

        $specialtyBreakdown = Subject::query()
            ->active()
            ->withCount('tutors')
            ->orderByDesc('tutors_count')
            ->get()
            ->map(fn ($subject) => [
                'name' => $subject->name,
                'count' => (int) $subject->tutors_count,
            ])
            ->values()
            ->all();

        $verifiedCount = TutorProfile::query()->where('is_verified', true)->count();
        $activeNow = count($availableByTutor);
        $avgRate = (int) round(
            TutorProfile::query()
                ->get()
                ->avg(
                    fn ($t) => Currency::convert((int) $t->hourly_rate, $t->currency, Currency::getBaseCurrency())
                ) ?? 0
        );

        return [
            'filters' => [
                'keyword' => $keyword,
                'city' => $city,
                'format' => $format,
                'experience' => $level,
                'perPage' => $perPage,
            ],
            'tutors' => $tutors->map(fn ($t) => [
                'id' => $t->user_id,
                'name' => $t->full_name,
                'avatar' => $t->avatar_url,
                'headline' => $t->headline,
                'bio' => $t->bio,
                'city' => $t->city,
                'format' => $t->format,
                'level' => $t->experience_level,
                'rating' => (float) $t->rating,
                'verified' => (bool) $t->is_verified,
                'rate' => (int) $t->hourly_rate,
                'currency' => $t->currency,
                'subjects' => $t->subjects
                    ->map(fn ($subject) => [
                        'name' => $subject->name,
                        'slug' => $subject->slug,
                        'rate_cents' => (int) $subject->pivot->rate_cents,
                    ])
                    ->values()
                    ->all(),
'slotsAvailable' => $availableByTutor[$t->user_id] ?? 0,
            'username' => $t->user?->username,
        ])->values()->all(),
        'total' => $total,
        'cities' => $allCities,
            'cityBreakdown' => $cityBreakdown,
            'specialties' => $specialtyBreakdown,
            'subjects' => Subject::query()
                ->active()
                ->orderBy('name')
                ->get()
                ->map(fn ($subject) => [
                    'id' => $subject->id,
                    'name' => $subject->name,
                    'description' => $subject->description,
                    'slug' => $subject->slug,
                ])
                ->values()
                ->all(),
            'stats' => [
                'totalTutors' => (int) TutorProfile::query()->count(),
                'verifiedCount' => $verifiedCount,
                'activeNow' => $activeNow,
                'avgRate' => $avgRate,
                'citiesCount' => count($allCities),
            ],
        ];
    }

    /**
     * Create a notification for a user.
     */
    protected function notify(
        string $userId,
        string $type,
        string $title,
        string $message,
        ?array $data = null
    ): void {
        Notification::createForUser($userId, $type, $title, $message, $data);
    }
}
